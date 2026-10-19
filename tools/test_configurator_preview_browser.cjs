#!/usr/bin/env node
'use strict';
// Run in CI against the real test page. No replacement React state or fake PDF.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const output=process.env.PREVIEW_QA_DIR || '/tmp/ravenforge-preview-qa';
const url=process.env.PREVIEW_QA_URL || 'http://127.0.0.1:8000/configurator-preview.html';
async function main() {
  await fs.mkdir(output,{recursive:true});
  const browser=await chromium.launch();
  const page=await browser.newPage();
  const report={url,checks:[],errors:[],started:new Date().toISOString()};
  page.on('pageerror',e=>report.errors.push(e.message));
  const step=n=>page.locator(`[data-step="${n}"]`).click();
  const choose=(category,value)=>page.locator(`input[name="${category}"][value="${value}"]`).check();
  const layer=name=>page.locator(`[data-layer="${name}"]`);
  try {
    await page.goto(url,{waitUntil:'networkidle'});
    await page.locator('[data-preview-model="EDDA"]').waitFor();
    for(const size of [{width:1440,height:1080},{width:390,height:844}]) {
      await page.setViewportSize(size);
      for(const lang of ['ko','en','de']) {
        await page.locator(`[data-language="${lang}"]`).click();
        for(const [model,count] of [['EDDA',4],['EMBLA',5],['ASKR',5],['GRAMR',6]]) {
          await step(1);
          if(await page.locator(`[data-model="${model}"]`).getAttribute('aria-pressed')==='true') await page.locator(`[data-model="${model==='EDDA'?'EMBLA':'EDDA'}"]`).click();
          await page.locator(`[data-model="${model}"]`).click();
          assert.equal(await page.locator('#instrument-preview').getAttribute('data-preview-model'),model);
          assert.equal(await layer('strings').getAttribute('data-count'),String(count));
          const initial=await layer('body').innerHTML();
          assert.equal(await page.locator('[data-preview-svg]').getAttribute('data-renderer'),'sample-composite');
          assert.equal(await page.locator('[data-preview-svg]').getAttribute('data-layout'),size.width<1024?'landscape':'portrait');
          // Confirm original repository rasters load, then compare reference/selected modes.
          await page.evaluate(async()=>{const src=document.querySelector('[data-layer="body"] image').getAttribute('href');const image=new Image();image.src=src;await image.decode();if(image.naturalWidth<1000)throw new Error('Missing source render');});
          await page.locator('[data-preview-mode="sample"]').click();
          assert.equal(await page.locator('.rf-preview-reference img').count(),1);
          await page.locator('[data-preview-mode="selected"]').click();
          await page.locator('#instrument-preview').screenshot({path:path.join(output,`${lang}-${size.width}-${model}-default.png`)});
          await step(3);
          const beforeColour=await page.locator('.rf-preview-stage').screenshot();
          await page.locator('[data-preview-swatch="#275f89"]').click();
          const afterColour=await page.locator('.rf-preview-stage').screenshot();
          assert.ok(!beforeColour.equals(afterColour),'Colour changes actual instrument pixels');
          assert.equal(await page.locator('#finish-color').inputValue(),'transparent #275f89');
          assert.equal(await layer('finish').getAttribute('data-colour'),'#275f89');
          assert.ok((await page.locator('#quote-summary-card').innerText()).includes('transparent #275f89'));
          await choose('top_type','cap');
          await choose('top_wood_selection',model==='GRAMR'?'guitar_top_walnut':'walnut');
          assert.equal(await layer('body').getAttribute('data-option'),model==='GRAMR'?'guitar_top_walnut':'walnut');
          assert.notEqual(await layer('body').innerHTML(),initial);
          await choose('top_type',model==='GRAMR'?'guitar_top_none':'none');
          assert.ok(!(await layer('body').getAttribute('data-option')).includes('walnut'));
          await page.locator('#finish-color').fill('blue top, red back');
          assert.equal(await layer('finish').count(),0);
          assert.ok(await page.locator('.rf-preview-warning').isVisible());
          await page.locator('[data-preview-swatch="#9d282b"]').click();
          await choose('color_headstock','head_plate');
          assert.match(await layer('headstock').locator('path').first().getAttribute('fill'),/unknown/);
          await choose('color_headstock','head_match');
          await step(2);
          if(model!=='GRAMR') {
            await choose('fretboard','ebony');
            assert.equal(await layer('fretboard').getAttribute('data-option'),'ebony');
            await choose('fret_type','fretless');
            assert.equal(await layer('frets').count(),0);
            await choose('fretline','line_yes');
            assert.equal(await layer('frets').getAttribute('data-count'),'24');
            await choose('fret_type','fret_24');
          }
          await step(4);
          await choose('hardware_color','hw_gold');
          assert.equal(await layer('hardware').getAttribute('data-colour'),'#c9a75c');
          if(model==='ASKR') {
            await choose('hardware_bridge','nova_parts');
            assert.equal(await layer('bridge').getAttribute('data-colour'),'#33383d');
          }
          await step(5);
          const pickup=model==='GRAMR'?'guitar_hh_passive_custom':'others';
          await choose('pickups',pickup);
          assert.equal(await layer('pickups').getAttribute('data-option'),pickup);
          assert.equal(await layer('pickups').getAttribute('data-appearance'),'reference-retained');
          await page.locator('[data-preview-view="body"]').click();
          assert.equal(await page.locator('[data-preview-view="body"]').getAttribute('aria-pressed'),'true');
          await page.locator('#instrument-preview').screenshot({path:path.join(output,`${lang}-${size.width}-${model}-body.png`)});
          await page.locator('[data-preview-view="full"]').click();
          const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,preview:document.querySelector('#instrument-preview').getBoundingClientRect().toJSON()}));
          assert.ok(layout.scroll<=layout.width+1,'No horizontal overflow');
          assert.ok(layout.preview.width<=layout.width,'Preview fits viewport');
          await page.locator('#instrument-preview').screenshot({path:path.join(output,`${lang}-${size.width}-${model}.png`)});
          report.checks.push({model,lang,width:size.width,result:'PASS'});
        }
      }
    }
    // A model switch must clear prior finish, custom pickups and gold hardware.
    await step(1);await page.locator('[data-model="EDDA"]').click();
    assert.equal(await layer('finish').count(),0);
    assert.equal(await layer('hardware').getAttribute('data-colour'),'#b8c3cc');
    assert.equal(await layer('pickups').getAttribute('data-option'),'nova_mm');
    assert.deepEqual(report.errors,[]);
    report.result='PASS';
  } catch(error) {
    report.result='FAIL';report.failure=error.stack;
    await page.screenshot({path:path.join(output,'failure.png'),fullPage:true});
    throw error;
  } finally {
    report.finished=new Date().toISOString();
    await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report));await browser.close();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
