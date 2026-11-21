import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
const source = await readFile(new URL('../src/exchange-rate.js', import.meta.url), 'utf8');
let calls=0;
const mf = new Miniflare(convertV4MiniflareOptions({modules:true, cf:false, compatibilityDate:'2026-10-01',
  bindings:{KOREAEXIM_API_KEY:'synthetic-runtime-key'},
  script:source.replace(/^export /gm, '')+`\nexport default {async fetch(request,env,ctx){
    if(new URL(request.url).pathname==='/reset'){resetRateCache();return new Response('reset');}
    const p=eurKrwRate(env,{now:Date.parse('2026-11-08T03:00:00Z')});
    ctx.waitUntil(p);
    if(new URL(request.url).pathname==='/early') return new Response('early');
    return Response.json(await p);
  }};`,
  outboundService:async request=>{calls++; await new Promise(r=>setTimeout(r,300));return Response.json([{result:1,cur_unit:'EUR',deal_bas_r:'1,512.34'}]);}
}));
try {
  const results=await Promise.all(Array.from({length:20},async()=>{const r=await mf.dispatchFetch('http://worker.test/price');return {status:r.status,body:await r.json()};}));
  assert.equal(calls,1);assert.ok(results.every(r=>r.status===200&&r.body.rate===1512.34));
  console.log(JSON.stringify({test:'workerd concurrent cold lookup',callers:20,calls,status:'PASS'}));
  await mf.dispatchFetch('http://worker.test/reset');
  const before=calls;
  await mf.dispatchFetch('http://worker.test/early');
  const timeout=setTimeout(()=>{throw new Error('shared lookup did not settle');},6000);
  try {
    const response=await mf.dispatchFetch('http://worker.test/price');
    const body=await response.json();
    assert.equal(response.status,200);assert.equal(body.rate,1512.34);assert.equal(calls-before,1);
    console.log(JSON.stringify({test:'request owner returns before shared lookup with waitUntil',calls:calls-before,status:'PASS'}));
  } finally {clearTimeout(timeout);}
} finally {await mf.dispose();}
