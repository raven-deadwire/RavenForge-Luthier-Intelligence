'use strict';
// Run through test_configurator.cjs --strap-pins. Chromium is the independent
// outline oracle; real UI selections and html2pdf downloads remain unchanged.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
module.exports = async ({page, hostPage, report, output, expectedModels, step, freshModel, quotedAmount, selectOption}) => {
  const colours = {hw_chrome:'#b8c3cc', hw_black:'#33383d', hw_gold:'#c9a75c', hw_vintage_copper:'#b77a55'};
  await page.evaluate(() => {
    window.__strapSignature = svg => {
      const doc = typeof svg === 'string' ? new DOMParser().parseFromString(svg, 'image/svg+xml') : svg;
      const pins = doc.querySelector('[data-layer="strap-pins"]');
      const root = doc.querySelector('svg');
      const fill = pins?.querySelector('rect')?.getAttribute('fill');
      const gradient = fill && doc.querySelector('[id="' + fill.slice(5,-1) + '"]');
      if(!root||!pins||!gradient)throw new Error('Missing strap-pin SVG, pin shape or metal gradient');
      const xml=new XMLSerializer();
      return {pins:xml.serializeToString(pins), stops:xml.serializeToString(gradient), orientation:root.dataset.orientation};
    };
    const render = RavenForgePreview.renderSvg;
    RavenForgePreview.renderSvg = function(...args) {
      const svg = render.apply(this,args);
      if(window.__strapExportActive) window.__strapExports.push({side:args[1], svg, signature:window.__strapSignature(svg)});
      return svg;
    };
    const from = html2pdf.Worker.prototype.from;
    html2pdf.Worker.prototype.from = function(source,...args) {
      if(window.__strapExportActive) window.__strapPdfInput = {
        text:source.textContent, pages:source.querySelectorAll('[data-pdf-page]').length,
        images:[...source.querySelectorAll('figure img')].map(img=>({src:img.src,alt:img.alt}))
      };
      return from.call(this,source,...args);
    };
  });
  report.strapGeometry = [];
  for(const {id:model} of expectedModels) for(const side of ['front','back']) {
    const cases = await page.evaluate(({model,side,colours}) => {
      const P = RavenForgePreview, host = document.createElement('div');
      host.style.cssText='position:fixed;left:0;top:0;width:420px;height:950px;background:white;z-index:2147483647';
      document.body.append(host); const rows=[],measurements=new Map();
      for(const [hardware_color,metal] of Object.entries(colours)) for(const orientation of ['right_hand','left_hand']) for(const layout of ['portrait','landscape']) {
        const state=P.scene(model,{hardware_color,orientation},'',null,null,{accessories:['leather_strap']});
        host.innerHTML=P.renderSvg(state,side,'en',layout);const svg=host.querySelector('svg');
        const layer=svg.querySelector('[data-layer="strap-pins"]'),pins=[...layer.querySelectorAll('[data-strap-pin]')];
        if(pins.length!==2||layer.dataset.colour!==metal)throw new Error('Pin count/colour '+model+'/'+side);
        for(const pin of pins) {
          const fill=pin.querySelector('rect')?.getAttribute('fill');
          if(!fill?.startsWith('url(#'))throw new Error('Missing pin shape or gradient fill');
          const id=fill.slice(5,-1);
          if(!svg.querySelector('[id="'+id+'"] stop[stop-color="'+metal+'"]'))throw new Error('Unresolved metal gradient');
        }
        const body = side==='back' ? svg.querySelector('clipPath[id$="-body"] path') || svg.querySelector('[data-layer="rear-body"] path') : svg.querySelector('[data-layer="body"] path');
        const bodyLayer=svg.querySelector('[data-layer="'+(side==='back'?'rear-body':'body')+'"]');
        // EDDA rear is a clipped source image; its body group carries the transform.
        const painted=[...bodyLayer.querySelectorAll('path')].find(p=>p.getAttribute('d')===body.getAttribute('d')) || bodyLayer;
        const bodyMatrix=painted.getScreenCTM(),pinMatrix=layer.getScreenCTM();
        for(const key of ['a','b','c','d','e','f'])if(Math.abs(bodyMatrix[key]-pinMatrix[key])>1e-5)throw new Error('Pin/body transforms differ: '+model+'/'+side+'/'+orientation+'/'+layout);
        const measure=document.createElementNS(svg.namespaceURI,'path');measure.setAttribute('d',body.getAttribute('d'));svg.append(measure);
        const bounds=measure.getBBox(),length=measure.getTotalLength(),axis=model==='GRAMR'||side==='back'&&model!=='EDDA'?'x':'y',mm=state.unitsPerMm[side];
        // Reuse expensive arc-length measurements only for identical native
        // paths and pin transforms. Colour and screen transforms are checked above.
        const key=body.getAttribute('d')+'|'+pins.map(pin=>pin.getAttribute('transform')).join('|');
        const measured=measurements.get(key)||pins.map(pin=>{
          if(!pin.transform.baseVal.numberOfItems)throw new Error('Missing pin anchor transform');
          const matrix=pin.transform.baseVal.getItem(0).matrix,anchor={x:matrix.e,y:matrix.f};
          const distance=t=>{const q=measure.getPointAtLength(t);return Math.hypot(q.x-anchor.x,q.y-anchor.y);};
          let best=0;
          for(let i=1;i<=512;i++)if(distance(i*length/512)<distance(best))best=i*length/512;
          let lo=Math.max(0,best-length/512),hi=Math.min(length,best+length/512);
          for(let i=0;i<30;i++){const a=(2*lo+hi)/3,b=(lo+2*hi)/3;if(distance(a)<distance(b))hi=b;else lo=a;}
          const distanceMm=distance((lo+hi)/2)/mm;
          const extreme=pin.dataset.strapPin==='horn'?bounds[axis]:bounds[axis]+bounds[axis==='x'?'width':'height'];
          const extremeErrorMm=Math.abs(anchor[axis]-extreme)/mm;
          // Chromium flattens curves for path-length queries. 0.1 mm is below
          // a screen pixel at this view size; it is not a machining tolerance.
          if(distanceMm>.1||extremeErrorMm>.05)throw new Error('Pin off outline '+JSON.stringify({model,side,anchor,distanceMm,extremeErrorMm}));
          return {name:pin.dataset.strapPin,...anchor,distanceMm,extremeErrorMm};
        });
        measurements.set(key,measured);
        measure.remove(); rows.push({model,side,hardware_color,orientation,layout,pins:measured});
      }
      host.remove();return rows;
    },{model,side,colours});
    report.strapGeometry.push(...cases);
  }
  assert.equal(report.strapGeometry.length,128);
  report.checks.push({name:'128 model/side/colour/handedness/layout combinations against Chromium paths',result:'PASS'});
  console.log('PASS: 128 strap-pin geometry/colour/transform combinations');
  report.strapPdfs=[];
  for(const {id:model} of expectedModels) {
    await freshModel(model);
    await page.getByRole('button',{name:'EN',exact:true}).click();
    await step(4);
    const available = await page.locator('input[name="hardware_color"]').evaluateAll(nodes=>nodes.map(n=>n.value));
    assert.ok(available.length>=3,model+' hardware colours');
    for(const [index,colour] of available.entries()) {
      await step(4); await selectOption('hardware_color',colour);
      await step(5); await page.locator('input[data-accessory="leather_strap"]').check();
      const amount=await quotedAmount();
      const signatures={};
      for(const side of ['front','back']) {
        await page.locator('button[data-preview-side="'+side+'"]').click();
        await page.locator('#instrument-preview [data-preview-svg="'+model+'"][data-side="'+side+'"] [data-layer="strap-pins"]').waitFor();
        signatures[side]=await page.evaluate(()=>window.__strapSignature(document.querySelector('.rf-preview-stage').cloneNode(true)));
        assert.ok(signatures[side].pins.includes(colours[colour]));
        if(colour==='hw_gold')await page.locator('.rf-preview-stage').screenshot({path:path.join(output,model+'-'+side+'-gold-preview.png')});
      }
      const language=['EN','KR','DE'][index%3];await page.getByRole('button',{name:language,exact:true}).click();
      await page.evaluate(()=>{window.__strapExportActive=true;window.__strapExports=[];window.__strapPdfInput=null;});
      const downloadPromise=hostPage.waitForEvent('download',{timeout:60000});
      await page.locator('#quote-actions-area button').click();const download=await downloadPromise;
      const key=model+'-'+colour;await download.saveAs(path.join(output,key+'.pdf'));assert.equal(await download.failure(),null);
      const captured=await page.evaluate(()=>{window.__strapExportActive=false;return {exports:window.__strapExports,input:window.__strapPdfInput,language:document.documentElement.lang};});
      assert.equal(captured.exports.length,2);assert.equal(captured.input.images.length,2);
      assert.ok(captured.input.text.includes('Schaller S-Lock strap pins · '+colour.replace('hw_','').replaceAll('_',' ')));
      assert.ok(captured.input.text.includes('€'+amount));
      assert.equal(captured.language,{EN:'en',KR:'ko',DE:'de'}[language]);
      assert.ok(captured.input.pages>=1&&captured.input.pages<=2);
      for(const view of captured.exports) {
        assert.deepEqual(view.signature,signatures[view.side],key+'/'+view.side+': preview and PDF pin geometry/metal/orientation');
        await fs.writeFile(path.join(output,key+'-'+view.side+'.svg'),view.svg);
      }
      for(const [i,img] of captured.input.images.entries()) {
        assert.match(img.src,/^data:image\/jpeg;base64,/);
        await fs.writeFile(path.join(output,key+'-'+['front','back'][i]+'.jpg'),Buffer.from(img.src.split(',')[1],'base64'));
      }
      await fs.writeFile(path.join(output,key+'-pdf-source.txt'),captured.input.text);
      report.strapPdfs.push({model,colour,language,amount,pages:captured.input.pages,filename:key+'.pdf'});
      report.checks.push({name:key+' real PDF and both preview signatures',result:'PASS'});console.log('PASS: '+key+' real PDF / front+back consistency');
      await page.getByRole('button',{name:'EN',exact:true}).click();
      await page.locator('input[data-accessory="leather_strap"]').uncheck();
      await page.waitForFunction(()=>!document.querySelector('.rf-preview-stage [data-layer="strap-pins"]'));
    }
  }
  assert.equal(report.strapPdfs.length,16,'All four selected hardware colours on all four models');
};
