#!/usr/bin/env node
'use strict';
// Browser UI regression only: Claude is mocked. Live language/price checks are
// recorded separately, and must pass before enabling the public launcher.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const output=process.env.CHAT_QA_DIR||'/tmp/ravenforge-chat-qa';
const url=process.env.CHAT_QA_URL||'http://127.0.0.1:8000/configurator.html';
const copy={en:{open:'Ask about your quote',close:'Close',send:'Send',restart:'New conversation',placeholder:'Type your question…'},ko:{open:'견적 상담',close:'닫기',send:'보내기',restart:'새 대화',placeholder:'궁금한 점을 입력하세요…'},de:{open:'Fragen zum Angebot',close:'Schließen',send:'Senden',restart:'Neues Gespräch',placeholder:'Deine Frage…'}};
async function main(){
 await fs.mkdir(output,{recursive:true});
 const {priceConfiguration}=await import('../worker/quote-consult/src/pricing.js');
 const browser=await chromium.launch({executablePath:process.env.CONFIGURATOR_BROWSER_PATH||undefined});
 const report={checks:[],errors:[],mocked:true};
 try{
  for(const width of [1440,375]) for(const language of ['en','ko','de']) for(const model of ['EDDA','EMBLA','ASKR','GRAMR']){
   const key=`${width}-${language}-${model}`;
   const page=await browser.newPage({viewport:{width,height:900},acceptDownloads:true});
   page.setDefaultTimeout(20000);
   page.on('pageerror',e=>report.errors.push({key,message:e.message}));
   let requests=[],failNext=false,longReply=false;
   const answer=`${language==='ko'?'검증된 견적입니다.':language==='de'?'Geprüftes Angebot.':'Validated quote.'}`;
   await page.route('**/chat',async route=>{
    const payload=route.request().postDataJSON();requests.push(payload);
    if(failNext){failNext=false;await route.fulfill({status:429,contentType:'application/json',body:'{"error":"rate limited"}'});return;}
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({reply:longReply?answer+' '.repeat(2100):answer,quote:priceConfiguration(payload.configuration)})});
   });
   await page.goto(url+`?lang=${language}`);
   await page.locator(`[data-model="${model}"]`).click();
   await page.locator('[data-step="2"]').click();
   const fretboard=model==='GRAMR'?'guitar_indian_rosewood':'ebony';
   await page.locator(`input[name="fretboard"][value="${fretboard}"]`).check();
   await page.locator('#instrument-preview svg').first().waitFor({state:'visible'});
   const launcher=width<1024?page.locator('.rf-mobile-review button'):page.locator('.rf-chat-launcher');
   await launcher.click();
   const panel=page.locator('.rf-chat-panel');await panel.waitFor();
   const input=page.getByPlaceholder(copy[language].placeholder,{exact:true});
   await input.fill('Please check my current quote.');await panel.getByRole('button',{name:copy[language].send,exact:true}).click();
   await panel.getByText(answer,{exact:true}).waitFor();
   assert.equal(requests[0].configuration.model,model);
   assert.equal(requests[0].configuration.selections.fretboard,fretboard);
   assert.equal(requests[0].language,language);
   const expected=priceConfiguration(requests[0].configuration);
   assert.equal(expected.total,{EDDA:2150,EMBLA:2600,ASKR:3250,GRAMR:2000}[model]);
   assert.equal(await page.locator('#quote-actions-area button').count(),1);
   const bounds=await panel.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width+1);
   const form=await page.locator('.rf-chat-form').evaluate(el=>({w:el.clientWidth,scroll:el.scrollWidth}));assert.ok(form.scroll<=form.w+1,`${key}: form overflow`);
   await page.screenshot({path:path.join(output,key+'.png')});
   await panel.getByRole('button',{name:copy[language].close,exact:true}).click();await launcher.click();
   assert.equal(await panel.getByText(answer,{exact:true}).count(),1);
   await input.fill('Follow-up');await input.press('Enter');
   await page.waitForFunction(()=>!document.querySelector('.rf-chat-pending'));
   assert.equal(requests[1].messages.length,3);
   failNext=true;await input.fill('Retry me');await input.press('Enter');
   await panel.getByRole('alert').waitFor();assert.equal(await input.inputValue(),'Retry me');
   assert.equal(await panel.locator('.rf-chat-user').count(),2);
   await input.press('Enter');await page.waitForFunction(()=>!document.querySelector('.rf-chat-pending'));
   assert.equal(await panel.getByRole('alert').count(),0);
   await panel.getByRole('button',{name:copy[language].restart,exact:true}).click();assert.equal(await panel.locator('.rf-chat-user').count(),0);
   longReply=true;await input.fill('Long reply');await input.press('Enter');await page.waitForFunction(()=>!document.querySelector('.rf-chat-pending'));
   longReply=false;await input.fill('After long reply');await input.press('Enter');await page.waitForFunction(()=>!document.querySelector('.rf-chat-pending'));
   assert.ok(requests.at(-1).messages[1].content.length>2000);
   await panel.getByRole('button',{name:copy[language].close,exact:true}).click();
   if(width===1440&&language==='en'){
    await page.locator('[data-step="5"]').click();
    const downloadPromise=page.waitForEvent('download',{timeout:60000});
    await page.locator('#quote-actions-area button').click();
    const download=await downloadPromise;const target=path.join(output,`${model}-after-chat.pdf`);await download.saveAs(target);
    assert.equal(await download.failure(),null);assert.ok((await fs.stat(target)).size>10000);
   }
   report.checks.push({key,total:expected.total,fretboard,requests:requests.length});
   await page.close();
  }
  assert.deepEqual(report.errors,[]);
  const page=await browser.newPage();await page.goto(url.replace('configurator.html','configurator-preview.html'));
  await page.locator('[data-model="EDDA"]').waitFor();assert.equal(await page.locator('.rf-chat-launcher').count(),0);await page.close();
  console.log(`PASS: ${report.checks.length} chat UI combinations; state, 3 languages, mobile bounds, follow-ups, long answers, close/reopen, rate-limit retry, restart, 4 PDF downloads and preview isolation.`);
 }finally{await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
