import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { eurKrwRate, resetRateCache, krwReference } from '../src/exchange-rate.js';
import { handleChat } from '../src/index.js';
const env = { KOREAEXIM_API_KEY: 'synthetic-test-key' };
const sunday = Date.parse('2026-11-08T03:00:00Z');
const monday = Date.parse('2026-11-09T03:00:00Z');
const row = [{ result: 1, cur_unit: 'EUR', deal_bas_r: '1,512.34' }];
const response = rows => ({ok:true,status:200,json:async()=>rows});
const deferred = () => {let resolve; const promise = new Promise(r=>{resolve=r}); return {promise,resolve};};
const quiet = async fn => {const previous=console.error;console.error=()=>{};try{return await fn();}finally{console.error=previous;}};
beforeEach(()=>resetRateCache());

for (const [name,date,requestCount] of [
  ['Friday', '2026-11-06T03:00:00Z', 1],
  ['Saturday', '2026-11-07T03:00:00Z', 1],
  ['Sunday', '2026-11-08T03:00:00Z', 1],
  ['Monday before publication', '2026-11-09T01:00:00Z', 2]]) {
  test(`${name}: exact date requests`,async()=>{
    const dates=[];
    const rate=await eurKrwRate(env,{now:Date.parse(date),fetchImpl:async url=>{
      const d=new URL(url).searchParams.get('searchdate'); dates.push(d);return response(d==='20261106'?row:[]);
    }});
    assert.equal(dates.length,requestCount);
    assert.equal(rate.date,'2026-11-06');
  });
}
test('20 concurrent Sunday callers share one lookup',async()=>{
  const gate=deferred();let calls=0;
  const fetchImpl=async url=>{calls++;await gate.promise;return response(new URL(url).searchParams.get('searchdate')==='20261106'?row:[]);};
  const promises=Array.from({length:20},()=>eurKrwRate(env,{now:sunday,fetchImpl}));
  gate.resolve();const rates=await Promise.all(promises);
  assert.equal(calls,1);assert.ok(rates.every(r=>r?.rate===1512.34));
});
test('coalesced refresh cannot overwrite a successful rate with a racing failure',async()=>quiet(async()=>{
  const fail=deferred(),start=deferred();let calls=0;
  const fetchImpl=async()=>{calls++;if(calls===1){await start.promise;return response(row);}await fail.promise;throw new Error('down');};
  const a=eurKrwRate(env,{now:monday,fetchImpl});
  const b=eurKrwRate(env,{now:monday,fetchImpl});
  start.resolve();assert.equal((await a).rate,1512.34);fail.resolve();await b;
  const cached=await eurKrwRate(env,{now:monday+1,fetchImpl:()=>assert.fail('must hit cache')});
  assert.equal(cached?.rate??null,1512.34);
}));
test('first timeout ends lookup after one HTTP attempt',async()=>quiet(async()=>{
  let calls=0;const t=performance.now();
  const value=await eurKrwRate(env,{now:monday,fetchImpl:async(_url,{signal})=>{
    calls++;return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new Error('timeout')),{once:true}));
  }});
  const elapsed=performance.now()-t;
  assert.equal(value,null);assert.equal(calls,1);assert.ok(elapsed>=2400&&elapsed<4000);
  console.log(JSON.stringify({scenario:'first-timeout',variant:'candidate',calls,elapsed_ms:Math.round(elapsed)}));
}));
test('slow empty responses share one total 2500ms lookup budget',async()=>quiet(async()=>{
  let calls=0;const t=performance.now();
  const value=await eurKrwRate(env,{now:Date.parse('2026-11-11T03:00:00Z'),fetchImpl:async(_url,{signal})=>{
    calls++;await new Promise((resolve,reject)=>{
      const done=()=>{signal.removeEventListener('abort',abort);resolve();};
      const timer=setTimeout(done,400);
      const abort=()=>{clearTimeout(timer);reject(new Error('abort'));};
      signal.addEventListener('abort',abort,{once:true});
    });return response([]);
  }});
  const elapsed=performance.now()-t;assert.equal(value,null);assert.equal(calls,7);
  assert.ok(elapsed>=(2400)&&elapsed<(3500));
  console.log(JSON.stringify({scenario:'slow-empty',variant:'candidate',calls,elapsed_ms:Math.round(elapsed)}));
}));
test('deadline also aborts body consumption',async()=>quiet(async()=>{
  let calls=0;const t=performance.now();
  const value=await eurKrwRate(env,{now:monday,fetchImpl:async(_url,{signal})=>{
    calls++;return {ok:true,json:()=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new Error('body timeout')),{once:true}))};
  }});
  assert.equal(value,null);assert.equal(calls,1);assert.ok(performance.now()-t<4000);
}));
test('a published rate exactly seven days old is within the lookup window',async()=>quiet(async()=>{
  let calls=0;
  const rate=await eurKrwRate(env,{now:monday,fetchImpl:async url=>{calls++;return response(new URL(url).searchParams.get('searchdate')==='20261102'?row:[]);}});
  assert.equal(rate?.date??null,'2026-11-02');assert.equal(calls,6);
}));
test('API result 3 and 4 never walk backward or bypass failure TTL',async()=>quiet(async()=>{
  for(const code of [3,4]){resetRateCache();let calls=0;const fetchImpl=async()=>{calls++;return response([{result:code}]);};
    assert.equal(await eurKrwRate(env,{now:monday,fetchImpl}),null);
    assert.equal(await eurKrwRate(env,{now:monday+599999,fetchImpl}),null);assert.equal(calls,1);
    assert.equal(await eurKrwRate(env,{now:monday+600000,fetchImpl}),null);assert.equal(calls,2);
  }
}));
test('HTTP errors, malformed JSON, null, absent EUR and invalid rate fail closed',async()=>quiet(async()=>{
  for(const reply of [{ok:false,status:302},{ok:false,status:503},{ok:true,json:async()=>{throw new Error('invalid JSON')}},response(null),response([{result:1,cur_unit:'USD',deal_bas_r:'1400'}]),response([{result:1,cur_unit:'EUR',deal_bas_r:'0'}])]) {
    resetRateCache();let calls=0;assert.equal(await eurKrwRate(env,{now:monday,fetchImpl:async()=>{calls++;return reply;}}),null);assert.equal(calls,1);
  }
}));
test('error logging does not disclose injected URL or authkey',async()=>{
  const logs=[];const previous=console.error;console.error=(...args)=>logs.push(args.join(' '));
  try{await eurKrwRate(env,{now:monday,fetchImpl:async url=>{throw new Error(`request failed: ${url}`);}});}finally{console.error=previous;}
  assert.equal(logs.some(s=>s.includes(env.KOREAEXIM_API_KEY)),false);
});
test('expired successful cache is omitted on failure, with no unlimited stale rate',async()=>quiet(async()=>{
  await eurKrwRate(env,{now:monday,fetchImpl:async()=>response(row)});
  assert.equal(await eurKrwRate(env,{now:monday+3*3600000,fetchImpl:async()=>{throw new Error('down');}}),null);
}));
test('key rotation does not reuse previous key cache',async()=>{
  await eurKrwRate(env,{now:monday,fetchImpl:async()=>response(row)});let calls=0;
  await eurKrwRate({KOREAEXIM_API_KEY:'other-test-key'},{now:monday+1,fetchImpl:async()=>{calls++;return response(row);}});
  assert.equal(calls,1);
});
test('English and German chat requests do not fetch exchange rates',async()=>{
  for(const language of ['en','de']){
    const client={beta:{messages:{create:async()=>({stop_reason:'end_turn',content:[{type:'text',text:'hello'}]})}}};
    const result=await handleChat({language,messages:[{role:'user',content:'hello'}]},env,client,{rateOptions:{fetchImpl:()=>assert.fail('no FX'),now:monday}});
    assert.equal(result.krw_reference,undefined);
  }
});
test('EUR math and price-on-request flag remain unchanged at rounding boundary',()=>{
  assert.equal(krwReference({total:1,price_on_request:true},{rate:1500,date:'2026-11-06'}).total_krw,2000);
  assert.equal(krwReference({total:1,price_on_request:true},{rate:1499.99,date:'2026-11-06'}).total_krw,1000);
  assert.equal(krwReference({total:1,price_on_request:true},{rate:1500,date:'2026-11-06'}).price_on_request,true);
});

test('a cache reset discards the completion of an older pending refresh', async()=>{
  const gate=deferred();
  const pending=eurKrwRate(env,{now:monday,fetchImpl:async()=>{await gate.promise;return response(row);}});
  await Promise.resolve();resetRateCache();gate.resolve();await pending;
  let calls=0;
  await eurKrwRate(env,{now:monday+1,fetchImpl:async()=>{calls++;return response(row);}});
  assert.equal(calls,1);
});
test('old-key completion does not overwrite a new-key refresh', async()=>{
  const gate=deferred();
  const old=eurKrwRate(env,{now:monday,fetchImpl:async()=>{await gate.promise;return response(row);}});
  await Promise.resolve();
  const newEnv={KOREAEXIM_API_KEY:'rotated-test-key'};
  await eurKrwRate(newEnv,{now:monday,fetchImpl:async()=>response(row)});
  gate.resolve();await old;
  assert.equal((await eurKrwRate(newEnv,{now:monday+1,fetchImpl:()=>assert.fail('new-key cache must survive')})).rate,1512.34);
});
test('credential-bearing requests reject HTTP redirects', async()=>{
  await eurKrwRate(env,{now:monday,fetchImpl:async(_url,options)=>{
    assert.equal(options.redirect,'manual');return response(row);
  }});
});

test('a model failure retains the bounded lookup in the request context', async()=>{
  const gate=deferred(),pending=[];
  const client={beta:{messages:{create:async()=>{throw new Error('model-down');}}}};
  await assert.rejects(handleChat({language:'ko',messages:[{role:'user',content:'가격'}]},env,client,{
    ctx:{waitUntil:promise=>pending.push(promise)},
    rateOptions:{now:monday,fetchImpl:async()=>{await gate.promise;return response(row);}}
  }),/model-down/);
  assert.equal(pending.length,1);gate.resolve();assert.equal((await pending[0]).rate,1512.34);
});
