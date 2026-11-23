import test from 'node:test';
import assert from 'node:assert/strict';
import worker, {handleChat} from '../src/index.js';
import {fakeClient,route,answer,config} from './helpers.js';
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
  const client=fakeClient([route('quote',{configurations:[config('EDDA')]}),answer('ok')]);
  const result=await handleChat({messages:[{role:'user',content:'hi'},{role:'assistant',content:'a'.repeat(3000)},{role:'user',content:'next'}]},env,client);
  assert.equal(result.reply,'ok');
  assert.equal(client.requests.length,2);
  const messages=Array.from({length:9},(_,i)=>({role:i%2?'assistant':'user',content:'x'.repeat(i%2?6000:2000)}));
  await assert.rejects(handleChat({messages},env,client),e=>e.status===413);
  assert.equal(client.requests.length,2);
});
test('each request makes at most two model calls within the output budget',async()=>{
  const client=fakeClient([{...route('model_comparison',{configurations:[config('EDDA'),config('ASKR')]}),usage:{output_tokens:999999}},answer('ok')]);
  await handleChat({messages:[{role:'user',content:'compare'}]},env,client);
  const [routing,answering]=client.requests;
  assert.equal(routing.max_tokens,2048);
  assert.equal(answering.max_tokens,4096); // 8192 minus at most 2048 for routing
  assert.ok(routing.signal);
  assert.equal(routing.signal,answering.signal);
});
test('truncated or oversized answers without a quote fail without further calls',async()=>{
  for(const response of [{stop_reason:'max_tokens',content:[]},{stop_reason:'end_turn',content:[{type:'text',text:'x'.repeat(6001)}]}]){
    const client=fakeClient([route('option_explanation'),response]);
    await assert.rejects(handleChat({messages:[{role:'user',content:'explain'}]},env,client),e=>e.status===502);
    assert.equal(client.requests.length,2);
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
