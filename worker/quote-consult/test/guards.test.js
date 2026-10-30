import test from 'node:test';
import assert from 'node:assert/strict';
import worker, {handleChat} from '../src/index.js';
const origin='https://raven-deadwire.github.io';
const env={ALLOWED_ORIGINS:origin,ANTHROPIC_API_KEY:'test-placeholder',RATE_LIMITER:{limit:async()=>({success:true})}};
const req=(body,headers={})=>new Request('https://worker.test/chat',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
test('HTTP boundaries reject invalid requests before spending API tokens',async()=>{
  const cases=[
    [req({}, {Origin:'https://attacker.invalid'}),env,403],
    [req({}),{...env,RATE_LIMITER:undefined},503],
    [req({}),{...env,ANTHROPIC_API_KEY:undefined},503],
    [req({}, {'Content-Type':'text/plain'}),env,415],
    [req({}),{...env,RATE_LIMITER:{limit:async()=>({success:false})}},429],
    [req('x'.repeat(131073)),env,413],
    [req('{'),env,400],
    [req({messages:[{role:'user',content:'x'.repeat(2001)}]}),env,413],
    [req({messages:[{role:'user',content:'hello'}],configuration:{model:'FAKE'}}),env,400],
    [req({messages:[{role:'user',content:'hello'}],configuration:{model:'EMBLA',selections:[]}},{'Content-Length':'999999'}),env,413]
  ];
  for(const [request,settings,status] of cases){
    const response=await worker.fetch(request,settings);assert.equal(response.status,status);
    assert.equal(response.headers.get('Cache-Control'),'no-store');
    assert.ok(!JSON.stringify(await response.json()).includes('test-placeholder'));
    if(status===429)assert.equal(response.headers.get('Retry-After'),'60');
  }
  const preflight=await worker.fetch(new Request('https://worker.test/chat',{method:'OPTIONS',headers:{Origin:origin}}),env);
  assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),origin);
});
test('long legitimate assistant replies remain usable for a follow-up',async()=>{
  let calls=0;
  const client={beta:{messages:{create:async()=>{calls++;return {stop_reason:'end_turn',content:[{type:'text',text:'ok'}],usage:{output_tokens:1}};}}}};
  await handleChat({messages:[{role:'user',content:'hi'},{role:'assistant',content:'a'.repeat(3000)},{role:'user',content:'next'}]},env,client);
  assert.equal(calls,1);
  const messages=Array.from({length:9},(_,i)=>({role:i%2?'assistant':'user',content:'x'.repeat(i%2?6000:2000)}));
  await assert.rejects(handleChat({messages},env,client),e=>e.status===413);
  assert.equal(calls,1);
});
test('output budget, tool count and truncated replies stop without further API calls',async()=>{
  for(const response of [
    {stop_reason:'max_tokens',content:[]},
    {stop_reason:'end_turn',content:[{type:'text',text:'x'.repeat(6001)}]},
    {stop_reason:'tool_use',content:Array.from({length:9},(_,i)=>({type:'tool_use',id:`t${i}`,name:'price_configuration',input:{model:'EDDA'}}))}
  ]){
    let calls=0;
    const client={beta:{messages:{create:async(params,options)=>{calls++;assert.equal(params.max_tokens,4096);assert.ok(options.signal);return response;}}}};
    await assert.rejects(handleChat({messages:[{role:'user',content:'price'}]},env,client),e=>e.status===502);
    assert.equal(calls,1);
  }
});

test('cumulative output budget stops repeated tool rounds at 8192 tokens',async()=>{
  let calls=0;
  const signals=[];
  const client={beta:{messages:{create:async(params,options)=>{
    calls++; signals.push(options.signal);
    assert.equal(params.max_tokens,4096);
    return {stop_reason:'tool_use',usage:{output_tokens:4096},content:[{type:'tool_use',id:`budget-${calls}`,name:'price_configuration',input:{model:'EDDA'}}]};
  }}}};
  await assert.rejects(handleChat({messages:[{role:'user',content:'Compare again'}]},env,client),e=>e.status===502);
  assert.equal(calls,2);
  assert.equal(signals[0],signals[1]); // One deadline for the entire consultation.
});

test('tool loops stop after four API calls or eight cumulative tool calls',async()=>{
  for(const batch of [1,5]){
    let calls=0;
    const client={beta:{messages:{create:async()=>{
      calls++;
      return {stop_reason:'tool_use',usage:{output_tokens:1},content:Array.from({length:batch},(_,i)=>({type:'tool_use',id:`loop-${calls}-${i}`,name:'price_configuration',input:{model:'EDDA'}}))};
    }}}};
    await assert.rejects(handleChat({messages:[{role:'user',content:'Keep comparing'}]},env,client),e=>e.status===502);
    assert.equal(calls,batch===1?4:2);
  }
});

test('HTTP provider failures are bounded, sanitized, and never retried',async()=>{
  const originalFetch=globalThis.fetch;
  try {
    for(const status of [400,429,500]){
      let calls=0;
      globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({type:'error',error:{type:status===429?'rate_limit_error':'api_error',message:'private provider detail'}}),{status,headers:{'Content-Type':'application/json'}});};
      const response=await worker.fetch(req({messages:[{role:'user',content:'Check price'}]}),env);
      assert.equal(response.status,status===429?429:502);
      assert.equal(calls,1);
      assert.doesNotMatch(await response.text(),/private|test-placeholder/);
    }
  } finally {globalThis.fetch=originalFetch;}
});
