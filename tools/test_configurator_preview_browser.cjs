#!/usr/bin/env node
'use strict';
// Run in CI against the real test page. No replacement React state or fake PDF.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {chromium}=require('playwright');
const output=process.env.PREVIEW_QA_DIR || '/tmp/ravenforge-preview-qa';
const url=process.env.PREVIEW_QA_URL || 'http://127.0.0.1:8000/configurator-preview.html';
async function main() {
  await fs.mkdir(output,{recursive:true});
  const browser=await chromium.launch();
  const page=await browser.newPage();
  const report={url,checks:[],errors:[],started:new Date().toISOString()};
  const localAssetRequests=[];
  if(url.startsWith('file:')) page.on('request',request=>{
    if(request.url().startsWith('file:')&&request.url().split('?')[0]!==url.split('?')[0]) localAssetRequests.push(request.url());
  });
  page.on('pageerror',e=>report.errors.push(e.message));
  const step=n=>page.locator(`[data-step="${n}"]`).click();
  const choose=(category,value)=>page.locator(`input[name="${category}"][value="${value}"]`).check();
  const layer=name=>page.locator(`[data-layer="${name}"]`);
  const side=name=>page.locator(`button[data-preview-side="${name}"]`).click();
  const colourPixels=()=>page.evaluate(async()=>{
    const svg=document.querySelector('[data-preview-svg]'),image=new Image();
    image.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(svg))));
    await image.decode();const canvas=document.createElement('canvas');canvas.width=480;canvas.height=700;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,480,700);
    const data=ctx.getImageData(0,0,480,700).data;let red=0,blue=0;
    for(let i=0;i<data.length;i+=4){if(data[i+3]<240)continue;const [r,g,b]=data.slice(i,i+3);if(r>35&&r>g*1.8&&r>b*1.8)red++;if(b>35&&b>r*1.4&&b>g*1.12)blue++;}
    return {red,blue};
  });

  try {
    await page.goto(url,{waitUntil:'networkidle'});
    await page.locator('[data-preview-model="EDDA"]').waitFor();
    if(url.startsWith('file:')) {
      const originals=['Edda Prototype Design.png','EMBLA Prototype Design.png','ASKR Prototype Design.png',...Array.from({length:4},(_,i)=>`assets/configurator-bindrune/c${i+1}.svg`)];
      const hashes=await page.evaluate(async names=>Object.fromEntries(await Promise.all(names.map(async name=>{
        const uri=globalThis.RavenForgePreviewMedia[name];
        if(!uri?.startsWith('data:')) throw new Error('Non-embedded image: '+name);
        const bytes=Uint8Array.from(atob(uri.split(',')[1]),c=>c.charCodeAt(0));
        const digest=await crypto.subtle.digest('SHA-256',bytes);
        return [name,[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')];
      }))),originals);
      for(const name of originals)assert.equal(hashes[name],crypto.createHash('sha256').update(await fs.readFile(path.join(__dirname,'..',name))).digest('hex'),'Embedded originals must be byte-identical');
      report.embeddedOriginals='PASS';
    }
    // The three independent columns must also fit narrower desktop screens.
    report.layout=[];
    for(const width of [1024,1280]) {
      await page.setViewportSize({width,height:900});
      for(const language of ['ko','en','de']) {
        await page.locator(`[data-language="${language}"]`).click();
        const bounds=await page.evaluate(()=>({
          panes:['.rf-preview-column','.rf-config-options','.rf-config-quote'].map(q=>document.querySelector(q).getBoundingClientRect().toJSON()),
          pageWidth:document.documentElement.scrollWidth
        }));
        assert.ok(bounds.panes[0].right<=bounds.panes[1].left && bounds.panes[1].right<=bounds.panes[2].left,'Preview / options / quote must remain separate at '+width);
        assert.ok(bounds.pageWidth<=width+1,'No horizontal overflow at '+width);
        await page.screenshot({path:path.join(output,`${language}-${width}-layout.png`)});
        report.layout.push({width,language,result:'PASS'});
      }
    }
    report.nativeTextures=await page.evaluate(async()=>{
      const results=[];
      for(const w of Object.values(RavenForgeMaterials.catalog).filter(w=>w.native)){
        const image=new Image();image.src=globalThis.RavenForgePreviewMedia?.[w.source]||w.source;await image.decode();
        if(image.naturalWidth!==w.sourceWidth||image.naturalHeight!==w.sourceHeight)throw new Error('Incorrect native texture dimensions: '+w.id);
        results.push({id:w.id,width:image.naturalWidth,height:image.naturalHeight});
      }return results;
    });
    report.materialDyes=await page.evaluate(async()=>{
      const M=globalThis.RavenForgeMaterials,results=[];
      for(const id of Object.keys(M.catalog))for(const [colour,channel] of [['#9d282b',0],['#275f89',2]]){
        const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><defs>${M.pattern('wood',id)}${M.finishFilter('dye',colour)}</defs><rect width="96" height="96" fill="url(#wood)" filter="url(#dye)"/></svg>`;
        const image=new Image();image.src='data:image/svg+xml;base64,'+btoa(svg);await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=96;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,96,96).data,mean=[0,0,0];let pixels=0;
        for(let i=0;i<data.length;i+=4)if(data[i+3]>240){pixels++;for(let c=0;c<3;c++)mean[c]+=data[i+c];}
        if(pixels<9000)throw new Error('Texture not rendered: '+id);
        if(!(mean[channel]>mean[2-channel]*1.5))throw new Error('Dye hue reversal: '+id+' '+colour+' '+mean);
        results.push({id,colour,result:'PASS'});
      }return results;
    });
    for(const size of [{width:1440,height:1080},{width:390,height:844}]) {
      await page.setViewportSize(size);
      for(const lang of ['ko','en','de']) {
        await page.locator(`[data-language="${lang}"]`).click();
        for(const [model,count] of [['EDDA',4],['EMBLA',5],['ASKR',5],['GRAMR',6]]) {
          await step(1);
          if(await page.locator(`[data-model="${model}"]`).getAttribute('aria-pressed')==='true') await page.locator(`[data-model="${model==='EDDA'?'EMBLA':'EDDA'}"]`).click();
          await page.locator(`[data-model="${model}"]`).click();
          assert.equal(await page.locator('#instrument-preview').getAttribute('data-preview-model'),model);
          assert.equal(await page.locator('#instrument-preview').getAttribute('data-preview-version'),'v15');
          assert.equal(await page.locator('#instrument-preview [data-neck-construction="bolt-on"]').textContent(),{ko:'볼트온 넥',en:'Bolt-on neck',de:'Geschraubter Hals'}[lang]);
          assert.equal(await layer('strings').getAttribute('data-count'),String(count));
          const initial=await layer('body').innerHTML();
          if(size.width>=1024){
            await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
            const panes=await page.evaluate(()=>['.rf-preview-column','.rf-config-options','.rf-config-quote'].map(q=>document.querySelector(q).getBoundingClientRect().toJSON()));
            assert.ok(panes[0].right<=panes[1].left && panes[1].right<=panes[2].left,'Preview left, options centre, quote right without overlap');
            assert.ok(panes.every(p=>Math.abs(p.top-panes[1].top)<2),'All three columns start on the same row');
          }
          await page.screenshot({path:path.join(output,`${lang}-${size.width}-${model}-workspace.png`)});
          assert.equal(await page.locator('[data-preview-view]').count(),0,'No zoom controls');
          assert.equal(await page.locator('button[data-preview-side]').count(),2);
          assert.equal(await page.locator('[data-preview-svg]').getAttribute('data-side'),'front');
          const fullViewBox=await page.locator('[data-preview-svg]').getAttribute('viewBox');
          assert.equal(await page.locator('[data-preview-svg]').getAttribute('data-renderer'),model==='EDDA'?'sample-composite':'drawing-composite');
          assert.equal(await page.locator('[data-preview-svg]').getAttribute('data-layout'),size.width<1024?'landscape':'portrait');
          // Confirm original repository rasters load, then compare reference/selected modes.
          await page.evaluate(async()=>{const src=(document.querySelector('[data-layer="body"] image')||document.querySelector('[id$="-material"] image')).getAttribute('href');const image=new Image();image.src=src;await image.decode();if(Math.max(image.naturalWidth,image.naturalHeight)<1000)throw new Error('Missing source render');});
          await page.locator('[data-preview-mode="sample"]').click();
          await page.locator('.rf-preview-reference img').waitFor();
          assert.equal(await page.locator('.rf-preview-reference img').count(),1);
          await page.locator('[data-preview-mode="selected"]').click();
          await page.locator('[data-preview-svg][data-side="front"]').waitFor();
          await page.locator('#instrument-preview').screenshot({path:path.join(output,`${lang}-${size.width}-${model}-default.png`)});
          await step(3);
          const beforeColour=await page.locator('.rf-preview-stage').screenshot();
          await page.locator('[data-preview-swatch="#275f89"]').click();
          const afterColour=await page.locator('.rf-preview-stage').screenshot();
          assert.ok(!beforeColour.equals(afterColour),'Colour changes actual instrument pixels');
          assert.equal(await page.locator('#finish-color').inputValue(),'transparent #275f89');
          assert.equal(await layer('finish').getAttribute('data-colour'),'#275f89');
          assert.ok((await page.locator('#quote-summary-card').innerText()).includes('transparent #275f89'));
          // Exercise opaque on every model and assert it does not blur RGB pixels.
          await page.locator('.rf-colour-modes button').nth(1).click();
          assert.equal(await layer('finish').getAttribute('data-opaque'),'true');
          assert.equal(await page.locator('feGaussianBlur:not([in="SourceAlpha"])').count(),0);
          await page.locator('#instrument-preview').screenshot({path:path.join(output,`${lang}-${size.width}-${model}-opaque-front.png`)});
          const quoteBeforeSide=await page.locator('#quote-summary-card').innerText();
          await side('back');
          await page.locator('[data-preview-svg][data-side="back"]').waitFor();
          assert.equal(await page.locator('#instrument-preview').getAttribute('data-preview-side'),'back');
          assert.equal(await page.locator('[data-preview-svg]').getAttribute('data-neck-joint'),'bolt-on');
          if(model!=='EDDA')assert.equal(await layer('rear-joint-seam').count(),1);
          assert.equal(await layer('pickups').count(),0,'No front pickups on the back');
          assert.equal(await layer('strings').count(),0,'No front strings on the back');
          if(model==='GRAMR'){
            assert.equal(await page.locator('[data-preview-svg]').getAttribute('data-side'),'back');
            assert.equal(await page.locator('[data-preview-svg]').getAttribute('viewBox'),fullViewBox);
            assert.equal(await layer('rear-body').getAttribute('data-opaque'),'false','Natural oil stays natural');
            assert.equal(await layer('rear-joint-schematic').getAttribute('data-coordinate-status'),'unverified');
            assert.equal(await layer('rear-bolts').getAttribute('data-count'),'5');
            assert.equal(await layer('rear-bolts').getAttribute('data-pattern'),'2-2-1');
            assert.equal(await layer('rear-bolts').getAttribute('data-placement'),'spec-schematic');
            await page.locator('[data-preview-mode="sample"]').click();
            await page.locator('.rf-preview-reference img').waitFor();
            await page.locator('.rf-preview-reference img').evaluate(image=>image.decode());
            await page.locator('[data-preview-mode="selected"]').click();
            await page.locator('[data-preview-svg][data-side="back"]').waitFor();
          }else{
            assert.equal(await page.locator('[data-preview-unavailable="back"]').count(),0);
            assert.equal(await page.locator('[data-preview-svg]').getAttribute('data-neck-joint'),'bolt-on');
            assert.equal(await layer('rear-bolts').getAttribute('data-count'),'5');
            assert.equal(await layer('rear-bolts').getAttribute('data-placement'),model==='EDDA'?'concept-only':'pdf-centres');
            assert.equal(await page.locator('[data-preview-svg]').getAttribute('data-renderer'),model==='EDDA'?'rear-concept-composite':'rear-drawing-composite');
          }
          assert.equal(await page.locator('#quote-summary-card').innerText(),quoteBeforeSide,'View switch does not change quote');
          await page.locator('#instrument-preview').screenshot({path:path.join(output,`${lang}-${size.width}-${model}-back.png`)});
          {
            await choose('color_back_side','back_stain');
            assert.equal(await layer('rear-body').getAttribute('data-colour'),'#275f89');
            assert.equal(await layer('rear-body').getAttribute('data-opaque'),'true');
            await page.locator('#instrument-preview').screenshot({path:path.join(output,`${lang}-${size.width}-${model}-opaque-back.png`)});
            await choose('color_back_side','back_oil');
          }
          await side('front');
          await page.locator('[data-preview-svg][data-side="front"]').waitFor();
          assert.equal(await page.locator('[data-preview-svg]').getAttribute('viewBox'),fullViewBox);
          await page.locator('.rf-colour-modes button').nth(0).click();
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
          assert.equal(await page.locator('[data-option="head_plate"]').count(),0);
          const matchedHead=await layer('headstock').innerHTML();
          await choose('color_headstock','head_natural');
          assert.notEqual(await layer('headstock').innerHTML(),matchedHead);
          assert.ok((await page.locator('[data-summary-category="color_headstock"]').innerText()).includes({ko:'논 매칭',en:'Non-matching',de:'Nicht angepasst'}[lang]));
          await choose('extra_finish_burst','burst_add');
          assert.equal(await page.locator('[data-effect="burst"][data-side="front"]').count(),1);
          await side('back');
          assert.equal(await page.locator('[data-effect="burst"][data-side="back"]').count(),1);
          await choose('neck_finish','neck_body');
          assert.equal(await layer('neck-finish').getAttribute('data-mode'),'body');
          assert.equal(await layer('neck-finish').getAttribute('data-colour'),'#9d282b');
          assert.equal(await layer('neck-laminates').count(),1,'Transparent matching retains species texture');
          await page.locator('.rf-colour-modes button').nth(1).click();
          assert.equal(await layer('neck-finish').getAttribute('data-opaque'),'true');
          assert.equal(await layer('neck-laminates').count(),0,'Opaque neck paint conceals laminates');
          await page.locator('.rf-colour-modes button').nth(0).click();
          await page.locator('#instrument-preview').screenshot({path:path.join(output,`${lang}-${size.width}-${model}-burst-neck.png`)});
          await choose('neck_finish','neck_natural');
          await choose('extra_finish_burst','burst_none');
          assert.equal(await page.locator('[data-effect="burst"]').count(),0);
          await side('front');
          await choose('color_headstock','head_match');
          const redFront=await colourPixels();assert.ok(redFront.red>redFront.blue*3&&redFront.red>1000,`Red front ${model}: ${JSON.stringify(redFront)}`);
          await choose('color_back_side','back_stain');await side('back');
          const redBack=await colourPixels();assert.ok(redBack.red>redBack.blue*3&&redBack.red>1000,`Red back ${model}: ${JSON.stringify(redBack)}`);
          await choose('color_back_side','back_oil');await side('front');
          await step(2);
          if(model!=='GRAMR') {
            if(await page.locator('input[name="fretboard"][value="ironwood"]').count()){
              await choose('fretboard','ironwood');
              assert.ok((await page.locator('[id$="-board-material"] image').getAttribute('href')).startsWith('data:image/webp'));
              const ironPixels=await page.locator('.rf-preview-stage').screenshot();
              await choose('fretboard','bog_oak');
              assert.ok(!ironPixels.equals(await page.locator('.rf-preview-stage').screenshot()),'Ironwood and bog oak change visible wood pixels');
            }
            await choose('fretboard','ebony');
            assert.equal(await layer('fretboard').getAttribute('data-option'),'ebony');
            await choose('fret_type','fretless');
            assert.equal(await layer('frets').count(),0);
            await choose('fretline','line_yes');
            assert.equal(await layer('frets').getAttribute('data-count'),'24');
            await choose('fret_type','fret_24');
          }
          await choose('inlay_type','inlay_oval');
          await choose('inlay_oval_mat','oval_wood');
          assert.equal(await page.locator('[data-oval-example]').count(),1);
          assert.ok(await layer('inlays').locator('[data-inlay-design="ravenforge-oval"]').count()>0);
          assert.equal(await layer('inlays').locator('[data-inlay-design]').first().getAttribute('data-material'),'oval_wood');
          await page.locator('[data-oval-example]').screenshot({path:path.join(output,`${lang}-${size.width}-${model}-oval.png`)});
          await choose('inlay_type','inlay_custom');
          await choose('inlay_custom_spec','custom_bindrune');
          assert.equal(await page.locator('[data-bindrune-examples] img').count(),4);
          await page.locator('[data-bindrune-examples]').scrollIntoViewIfNeeded();
          await page.locator('[data-bindrune-examples] img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
          await page.locator('[data-bindrune-examples]').screenshot({path:path.join(output,`${lang}-${size.width}-${model}-bindrune.png`)});
          // A visible bounding box alone misses sticky previews covering the gallery.
          for(const index of [0,3]) {
            const card=page.locator('[data-bindrune-select]').nth(index);
            await card.evaluate(element=>element.scrollIntoView({block:'center',behavior:'instant'}));
            assert.ok(await card.evaluate(element=>{
              const box=element.getBoundingClientRect();
              return element.contains(document.elementFromPoint(box.x+box.width/2,box.y+box.height/2));
            }),`Bindrune C${index+1} is not covered by the preview/header`);
            if(size.width<1024) await card.screenshot({path:path.join(output,`${lang}-${size.width}-${model}-bindrune-c${index+1}.png`)});
          }
          const quoteBeforeRune=await page.locator('#quote-summary-card').innerText();
          const runePixels=[];
          for(const example of ['c1','c2','c3','c4']){
            await page.locator(`[data-bindrune-select="${example}"]`).click();
            assert.equal(await layer('bindrune-inlay').getAttribute('data-example'),example);
            assert.equal(await page.locator(`[data-bindrune-select="${example}"]`).getAttribute('aria-pressed'),'true');
            runePixels.push(await layer('bindrune-inlay').innerHTML());
          }
          assert.equal(new Set(runePixels).size,4,'Every guide example produces different inlay paths');
          assert.equal(await page.locator('#quote-summary-card').innerText(),quoteBeforeRune,'Artwork preview does not change prices');
          await page.locator('#instrument-preview').screenshot({path:path.join(output,`${lang}-${size.width}-${model}-rune-applied.png`)});
          await choose('inlay_custom_spec','custom_others');
          assert.equal(await layer('bindrune-inlay').count(),0);

          assert.equal(await page.locator('[data-bindrune-examples]').count(),0);
          await choose('inlay_type','inlay_none');
          assert.equal(await layer('inlays').count(),0);
          await choose('fret_side','side_binding');
          assert.equal(await layer('fretboard-edge').getAttribute('data-option'),'side_binding');
          await choose('fret_side','side_no');
          assert.equal(await layer('fretboard-edge').count(),0);
          await step(4);
          const bridgeBeforeColour=await layer('bridge').innerHTML();
          await choose('hardware_color','hw_gold');
          if(model==='ASKR')assert.equal(await layer('bridge').innerHTML(),bridgeBeforeColour,'Payson bridge finish stays fixed');
          assert.equal(await layer('hardware').getAttribute('data-colour'),'#c9a75c');
          if(model==='ASKR') {
            await choose('hardware_bridge','nova_parts');
            assert.equal(await layer('bridge').getAttribute('data-colour'),'#33383d');
            const nova=await layer('bridge').innerHTML();
            await choose('hardware_color','hw_vintage_copper');
            assert.equal(await layer('bridge').innerHTML(),nova,'Nova anodized finish stays fixed');
          }
          await step(5);
          await page.locator('.rf-preview-settings').evaluate(e=>{e.open=true;});
          const guardQuote=await page.locator('#quote-summary-card').innerText();
          if(model==='EDDA'){
            assert.equal(await page.locator('[data-preview-pickguard]').count(),0,'No duplicate display-only guard state');
            await step(4);await choose('pickguard','pg_add');
            assert.equal(await layer('pickguard').count(),1);
            for(const material of ['pg_1ply','pg_3ply','pg_wood']){
              await choose('pickguard_material',material);
              assert.equal(await layer('pickguard').getAttribute('data-material'),material);
              assert.equal(await page.locator('[data-summary-category="pickguard_material"]').count(),1);
              if(material==='pg_wood')assert.equal(await page.locator('[data-category="pickguard_colour"]').count(),0);
              else for(const colour of ['pg_black','pg_white','pg_ivory','pg_red','pg_match']){
                await choose('pickguard_colour',colour);
                assert.equal(await layer('pickguard').getAttribute('data-option'),colour.replace('pg_',''));
                assert.equal(await page.locator('[data-summary-category="pickguard_colour"]').count(),1);
              }
            }
            await choose('pickguard_finish','pg_gloss');assert.equal(await layer('pickguard').getAttribute('data-finish'),'gloss');
            await choose('pickguard','pg_none');assert.equal(await layer('pickguard').count(),0);
            for(const id of ['pickguard_material','pickguard_colour','pickguard_finish'])assert.equal(await page.locator(`[data-summary-category="${id}"]`).count(),0);
            assert.equal(await page.locator('#quote-summary-card').innerText(),guardQuote,'Removing guard restores original quote');
            await choose('pickguard','pg_add');await choose('pickguard_material','pg_3ply');await choose('pickguard_colour','pg_ivory');
            await page.locator('#instrument-preview').screenshot({path:path.join(output,`${lang}-${size.width}-EDDA-pickguard.png`)});
            await choose('pickguard','pg_none');await step(5);
          }else if(model==='GRAMR'){
            for(const guard of ['black','ivory','wood','none']){
              await page.locator(`[data-preview-pickguard="${guard}"]`).click();
              assert.equal(await layer('pickguard').count(),guard==='none'?0:1);
              if(guard!=='none'){assert.equal(await layer('pickguard').getAttribute('data-option'),guard);assert.equal(await layer('pickguard').getAttribute('data-appearance'),model==='EDDA'?'sample-contour':'drawing-contour');}
            }
            assert.equal(await page.locator('#quote-summary-card').innerText(),guardQuote,'Test pickguard is excluded from quote');
            await page.locator('[data-preview-pickguard="black"]').click();
          }else{
            assert.equal(await page.locator('[data-preview-pickguard]').count(),0,'Models without source contours have no active guard choice');
            assert.equal(await layer('pickguard').count(),0,'No fabricated box behind pickups');
            assert.ok((await page.locator('[data-pickguard-unavailable]').innerText()).length>0);
          }
          let retainedKnobs=await layer('knobs').innerHTML();
          let retainedKnobCount=await layer('knobs').getAttribute('data-count');
          if(model!=='GRAMR'){
            await choose('pickups',{EDDA:'häussel_triple',EMBLA:'delano_ts',ASKR:'askr_delano_sbc5_e'}[model]);
            assert.equal(await layer('pickups').getAttribute('data-appearance'),model==='EDDA'?'reference-retained':'manufacturer-reference');
            if(model==='EDDA'){
              await page.locator('[data-pickup-pending]').waitFor();
              const previous=await layer('pickups').innerHTML();
              await choose('pickups','nova_mm');
              assert.equal(await layer('pickups').getAttribute('data-profile'),'nova-omnia-mm');
              assert.notEqual(await layer('pickups').innerHTML(),previous);
              assert.equal(await page.locator('[data-pickup-pending]').count(),0);
            }
            await step(4);assert.equal(await page.locator('[data-category="finger_ramp"]').count(),0);assert.equal(await layer('finger-ramp').count(),0);
            const beforeTuners=await layer('hardware').innerHTML();
            await choose('hardware_bridge',model==='ASKR'?'payson':'gotoh_404BO');
            await choose('hardware_machine_head','hipshot_ul_38');
            assert.notEqual(await layer('hardware').innerHTML(),beforeTuners,'Verified tuner button changes');assert.equal(await layer('hardware').getAttribute('data-profile'),'ultralite-y');
            assert.equal(await page.locator('[data-appearance="illustrative-family"]').count(),0);
            await step(5);
            if(model!=='EDDA'){
              if(model==='ASKR'){
                await choose('electronics','glockenklang');
                assert.equal(await layer('knobs').getAttribute('data-bands'),'3');
                assert.equal(await layer('knobs').getAttribute('data-count'),'5');
                await choose('electronics','darkglass');
                assert.equal(await page.locator('[data-knob-functions="high_mid"]').count(),1);
                await choose('electronics','glockenklang');
              }
              if(model==='EMBLA'){
                const unchangedBody=await layer('body').innerHTML();
                await choose('electronics','noll');
                const sixKnobPositions=await page.locator('[data-knob-index]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('transform')));
                assert.equal(await layer('knobs').getAttribute('data-bands'),'4');
                assert.equal(await layer('knobs').getAttribute('data-count'),'6');
                await choose('electronics','john_east');
                const fiveKnobPositions=await page.locator('[data-knob-index]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('transform')));
                assert.notDeepEqual(fiveKnobPositions,sixKnobPositions.slice(0,5),'Preamp change rearranges the entire control layout');
                assert.equal(await layer('body').innerHTML(),unchangedBody,'No former-knob colour patches after a preamp change');
                assert.equal(await layer('knobs').getAttribute('data-count'),'5');
                assert.equal(await page.locator('[data-stacked="true"]').count(),2);
                await choose('electronics','zuta');
              }
              retainedKnobs=await layer('knobs').innerHTML();retainedKnobCount=await layer('knobs').getAttribute('data-count');
              await choose('coil_switch','coil_2_pcts');assert.equal(await page.locator('[data-control-type="toggle"]').count(),2);
              assert.equal(await layer('knobs').innerHTML(),retainedKnobs,'Coil switches preserve the entire knob rendering');
              await choose('coil_switch','coil_none');assert.equal(await page.locator('[data-control-type="toggle"]').count(),0);
              await choose('coil_switch','coil_2_ps');
            }
          }
          await page.locator('label').filter({hasText:'Kill switch'}).getByRole('checkbox').check();
          assert.equal(await page.locator('[data-control-type="kill"]').count(),1);
          if(model==='GRAMR')assert.equal(await page.locator('[data-control-type="kill"]').getAttribute('transform'),'translate(796 210)');
          if(model==='ASKR'){
            const placement=await page.evaluate(()=>{
              const xy=n=>n.getAttribute('transform').match(/translate\(([^)]+)\)/)[1].split(/\s+/).map(Number);
              return {knobs:[...document.querySelectorAll('[data-knob-index]')].map(xy),switches:[...document.querySelectorAll('[data-control-type="toggle"],[data-control-type="kill"]')].map(xy)};
            });
            assert.ok(placement.switches.every(p=>p[1]>Math.max(...placement.knobs.map(k=>k[1]))+10),'ASKR switches below knob bank');
          }
          if(['ASKR','EMBLA'].includes(model))await page.locator('#instrument-preview').screenshot({path:path.join(output,`${lang}-${size.width}-${model}-controls.png`)});
          assert.equal(await layer('knobs').innerHTML(),retainedKnobs,'Kill switch never covers or replaces a knob');
          assert.equal(await layer('knobs').getAttribute('data-count'),retainedKnobCount);
          assert.equal(await page.locator('[data-control-type="kill"]').getAttribute('data-placement'),'preview-only-unconfirmed');
          assert.ok((await page.locator('[data-control-placement]').innerText()).length>0);
          if(model==='EDDA'||model==='GRAMR'){
            await choose('electronics',model==='GRAMR'?'guitar_passive':'passive');
            retainedKnobs=await layer('knobs').innerHTML();retainedKnobCount=await layer('knobs').getAttribute('data-count');
            await page.locator('label').filter({hasText:'Dual tone capacity'}).getByRole('checkbox').check();
            assert.equal(await page.locator('[data-functions~="dual_tone"]').count(),1);
          }
          await page.locator('#instrument-preview').screenshot({path:path.join(output,`${lang}-${size.width}-${model}-parts.png`)});
          await page.locator('label').filter({hasText:'Kill switch'}).getByRole('checkbox').uncheck();assert.equal(await page.locator('[data-control-type="kill"]').count(),0);
          assert.equal(await layer('knobs').innerHTML(),retainedKnobs,'Removing extras preserves knobs');
          await step(2);await choose('neck',model==='GRAMR'?'guitar_neck_3pc':model==='EDDA'?'3pc':'7pc');await side('back');
          assert.equal(await layer('neck-laminates').getAttribute('data-count'),model==='EDDA'||model==='GRAMR'?'3':'7');
          assert.equal(await layer('neck-laminates').getAttribute('data-appearance'),'species-textures');
          if(['EMBLA','ASKR'].includes(model)){await side('front');await step(2);await choose('neck','13pc');await side('back');const beforeQuote=await page.locator('#quote-summary-card').innerText();for(const wood of ['bloodwood','walnut']){await page.locator(`[data-preview-neck-accent="${wood}"]`).click();assert.ok((await layer('neck-laminates').getAttribute('data-materials')).includes(wood));assert.ok((await layer('neck-laminates').getAttribute('data-materials')).includes('bubinga'));}assert.equal(await page.locator('#quote-summary-card').innerText(),beforeQuote);}
          await step(3);await choose('body_construction',model==='GRAMR'?'guitar_body_1pc':'1pc_solid');assert.equal(await layer('body-pieces').getAttribute('data-count'),'1');
          await choose('body_construction',model==='GRAMR'?'guitar_body_3pc':'3pc_solid');assert.equal(await layer('body-pieces').getAttribute('data-count'),'3');
          await page.locator('#instrument-preview').screenshot({path:path.join(output,`${lang}-${size.width}-${model}-pieces.png`)});
          await side('front');await step(4);assert.equal(await layer('finger-ramp').count(),0);await step(5);
          const pickup=model==='GRAMR'?'guitar_hh_passive_custom':'others';
          await choose('pickups',pickup);
          assert.equal(await layer('pickups').getAttribute('data-option'),pickup);
          assert.equal(await layer('pickups').getAttribute('data-appearance'),model==='GRAMR'?'drawing-envelope':'reference-retained');
          assert.equal(await page.locator('button[data-preview-side="front"]').getAttribute('aria-pressed'),'true');
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
    assert.deepEqual(localAssetRequests,[],'The standalone HTML must not request sibling files');
    report.localAssetRequests=localAssetRequests;
    // Missing source assets must produce a clear load error, never a flat/broken
    // composite that could be mistaken for a real option visualization.
    const failurePage=await browser.newPage();
    await failurePage.route(/\.(png|webp)(\?.*)?$/i,route=>route.abort());
    await failurePage.goto('http://127.0.0.1:8000/configurator-preview.html',{waitUntil:'networkidle'});
    await failurePage.locator('[data-preview-image-status="error"]').waitFor();
    assert.equal(await failurePage.locator('[data-preview-svg]').count(),0);
    await failurePage.close();
    report.missingImageGuard='PASS';
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
