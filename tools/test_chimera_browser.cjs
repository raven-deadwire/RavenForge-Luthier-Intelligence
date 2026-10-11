#!/usr/bin/env node
'use strict';
// Chromium layout/interaction evidence; no mocked images, APIs or styles.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const {createHash} = require('node:crypto');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const output = path.resolve(process.env.CHIMERA_QA_DIR || 'validation/chimera-browser');
const publicURL = 'https://raven-deadwire.github.io/RavenForge-Luthier-Intelligence/';
const live = process.argv.includes('--public');
const widths = [1440, 1024, 820, 768, 761, 760, 640, 390, 360, 320];
const languages = {en:'EN',ko:'KR',de:'DE'};
const markers = {en:'Select image to enlarge',ko:'이미지를 눌러 확대',de:'Bild zum Vergrößern auswählen'};
const images = ['.rf-chimera-preview img','.rf-chimera-rigs-gallery img'];
const report = {schema:1,target:live?'public':'candidate',started:new Date().toISOString(),cases:[],links:[],errors:[]};
let browser, server;
async function main() {
  await fs.mkdir(output,{recursive:true});
  let base = publicURL;
  if (!live) {
    server = http.createServer(async(req,res)=>{
      try {
        let relative = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
        if (relative.endsWith('/')) relative += 'index.html';
        const file = path.resolve(root,'.'+relative);
        assert(file.startsWith(root+path.sep));
        const type = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.json':'application/json'}[path.extname(file)] || 'application/octet-stream';
        res.writeHead(200,{'Content-Type':type}).end(await fs.readFile(file));
      } catch {res.writeHead(404).end('Not found');}
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    base = `http://127.0.0.1:${server.address().port}/`;
  }
  browser = await chromium.launch({headless:true});
  report.browser = browser.version();
  const context = await browser.newContext({reducedMotion:'reduce'});
  const page = await context.newPage();
  const assetURLs={};
  page.on('pageerror',error=>report.errors.push(error.message));
  // Pages' generated deployment workflow does not emit workflow_run here.
  // Main-branch QA waits for public product bytes instead of a workflow name.
  if(live) {
    const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
    const product=html=>html.match(/<section\b[^>]*\bid="chimera"[^>]*>[\s\S]*?<\/section>/)?.[0];
    const localHTML=await fs.readFile(path.join(root,'index.html'),'utf8');
    const expected={};
    for(const file of ['assets/chimera.css','assets/chimera.js']) expected[file]=digest(await fs.readFile(path.join(root,file)));
    const deadline=Date.now()+240000;
    let ready=false,lastError;
    while(Date.now()<deadline) {
      try {
        const htmlResponse=await context.request.get(base,{timeout:20000});
        assert.equal(htmlResponse.status(),200);
        const html=await htmlResponse.text();
        assert.equal(product(html),product(localHTML),'Public product markup has not updated');
        for(const file of Object.keys(expected)) {
          const suffix=file.split('/').pop().replace('.','\\.');
          const expression=new RegExp('(?:href|src)="([^"]*'+suffix+'[^"]*)"');
          const url=html.match(expression)?.[1];assert(url,'Missing deployed '+file);
          assetURLs[file]=new URL(url,base).href;
          const response=await context.request.get(assetURLs[file],{timeout:20000});
          assert.equal(response.status(),200);assert.equal(digest(await response.body()),expected[file],'Public asset has not updated: '+file);
        }
        ready=true;break;
      } catch(e) {lastError=e.message;console.log('Waiting for Pages: '+lastError);await new Promise(resolve=>setTimeout(resolve,15000));}
    }
    assert(ready,'Pages readiness timeout: '+lastError);
    report.deploymentReady=new Date().toISOString();
  }
  // Verify which CSS/JS bytes the deployed browser actually receives.
  report.sourceHashes = {};
  for (const file of ['assets/chimera.css','assets/chimera.js']) {
    const response = await context.request.get(assetURLs[file] || new URL(file,base).href);
    assert.equal(response.status(),200,file);
    const bytes = await response.body();
    report.sourceHashes[file] = createHash('sha256').update(bytes).digest('hex');
    if(live) assert.equal(report.sourceHashes[file],createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex'),'Deployed asset differs: '+file);
  }
  await page.goto(base+'#chimera',{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('#chimera').waitFor({state:'visible'});
  for (const width of widths) for (const [lang,label] of Object.entries(languages)) {
    const item = {width,lang,checks:[],errors:[]}; report.cases.push(item);
    const check = async(name,fn)=>{
      try {item.checks.push({name,status:'PASS',detail:await fn()});}
      catch(e) {item.errors.push(name+': '+e.message);item.checks.push({name,status:'FAIL',error:e.message});}
    };
    await page.setViewportSize({width,height:960});
    await page.getByRole('button',{name:label,exact:true}).click();
    await page.waitForFunction(lang=>document.documentElement.lang===lang,lang);
    await page.evaluate(()=>document.fonts.ready);
    await check('localized descriptions and links',async()=>{
      await page.waitForFunction(marker=>document.querySelector('[data-chimera-key="rigsClassicCaption"]').textContent.includes(marker),markers[lang]);
      for(const key of ['screenAlt','rigsClassicAlt','rigsDualAlt']) assert((await page.locator(`[data-chimera-alt="${key}"]`).getAttribute('alt')).length>30);
      const captions = await page.locator('.rf-chimera-rigs-gallery figcaption').allTextContents();
      assert.equal(captions.length,2); assert(captions.every(x=>x.includes(markers[lang])));
      assert((await page.locator('.rf-chimera-preview figcaption').innerText()).includes('Matrix · Crom Cruach'));
      assert(captions.every(x=>x.includes('1.3.1') && x.includes('Linux')));
      assert((await page.locator('.rf-chimera-preview figcaption').innerText()).includes('1.3.1'));
      assert((await page.locator('[data-chimera-story]').getAttribute('href')).endsWith('/'+lang+'.html'));
      return captions;
    });
    await check('uncropped images, proportions, spacing and breakpoint',async()=>{
      for(const locator of await page.locator(images.join(',')).all()) {
        await locator.scrollIntoViewIfNeeded();
        await locator.evaluate(img=>img.decode());
      }
      const geometry = await page.locator(images.join(',')).evaluateAll(nodes=>nodes.map(e=>{
        const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();
        return {src:e.getAttribute('src'),x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,natural:[e.naturalWidth,e.naturalHeight],parent:{x:p.x,y:p.y,right:p.right,bottom:p.bottom}};
      }));
      assert.equal(geometry.length,3);
      for(const g of geometry) {
        assert.deepEqual(g.natural,[1180,780]);
        assert(Math.abs(g.width/g.height-1180/780)<0.002,'Aspect ratio: '+g.src);
        assert(g.width>0 && g.x>=0 && g.right<=width+1,'Horizontal clipping: '+JSON.stringify(g));
        assert(g.x>=g.parent.x-1 && g.right<=g.parent.right+1 && g.y>=g.parent.y-1 && g.bottom<=g.parent.bottom+1,'Parent clips '+g.src);
      }
      const [,a,b]=geometry;
      assert(Math.abs(a.width-b.width)<1,'Unequal image widths');
      if(width<=760){assert(Math.abs(a.x-b.x)<1,'Images must stack');assert(b.y>a.bottom+10,'Missing vertical gap');}
      else {assert(Math.abs(a.y-b.y)<1,'Images must share top edge');assert(b.x>a.right+10,'Missing horizontal gap');}
      return geometry;
    });
    await check('no page or product horizontal overflow',async()=>{
      const result = await page.evaluate(()=>{
        const w=document.documentElement.clientWidth;
        return {viewport:w,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('#chimera *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left<-.5||r.right>w+1);}).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.slice(0,70),rect:e.getBoundingClientRect().toJSON()}))};
      });
      assert(result.scroll<=result.viewport+1,JSON.stringify(result));assert.equal(result.overflow.length,0,JSON.stringify(result.overflow));return result;
    });
    await check('aligned product statistics',async()=>{
      const tops=await page.locator('.rf-chimera-stats dd').evaluateAll(nodes=>nodes.map(e=>e.getBoundingClientRect().top));
      assert(Math.max(...tops)-Math.min(...tops)<1,'Statistic values drift with wrapped labels: '+tops);return tops;
    });
    await check('three original-image popup links',async()=>{
      const links = await page.locator('.rf-chimera-preview a,.rf-chimera-rigs-gallery a').all();
      const opened=[];
      for(const link of links){
        const href=await link.getAttribute('href');
        const popupPromise=page.waitForEvent('popup');
        await link.click();const popup=await popupPromise;
        await popup.waitForLoadState('load');
        assert.equal(popup.url(),new URL(href,base).href);
        await popup.locator('img').evaluate(img=>img.decode());
        assert.deepEqual(await popup.locator('img').evaluate(img=>[img.naturalWidth,img.naturalHeight]),[1180,780]);
        opened.push(popup.url());await popup.close();
      }return opened;
    });
    await check('native head images and original PNG links',async()=>{
      const headImages = await page.locator('.rf-chimera-head-gallery img,#chimera-niflheimr figure img,#chimera-nastrond figure img').all();
      assert.equal(headImages.length,4);
      for(const image of headImages){
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(img=>img.decode());
        const info=await image.evaluate(img=>{
          const rect=img.getBoundingClientRect();
          return {natural:[img.naturalWidth,img.naturalHeight],width:rect.width,height:rect.height,
                  alt:img.alt,src:img.getAttribute('src'),href:img.closest('a')?.getAttribute('href')};
        });
        assert.deepEqual(info.natural,[1440,780]);
        assert(Math.abs(info.width/info.height-1440/780)<0.002,'Native head image proportions');
        assert(info.alt.includes('1.3.1') && info.alt.includes('Linux'),'Native source caption missing');
        assert.equal(info.href,info.src);
      }
      const captions=await page.locator('.rf-chimera-head-gallery figcaption').allTextContents();
      assert.equal(captions.length,2);
      assert(captions.every(text=>text.includes('1.3.1') && text.includes('Linux') && text.includes(markers[lang])));
      if(width===1440){
        for(const link of await page.locator('.rf-chimera-head-gallery a').all()){
          const popupPromise=page.waitForEvent('popup');
          await link.click();const popup=await popupPromise;
          await popup.waitForLoadState('load');await popup.locator('img').evaluate(img=>img.decode());
          assert.deepEqual(await popup.locator('img').evaluate(img=>[img.naturalWidth,img.naturalHeight]),[1440,780]);
          await popup.close();
        }
      }
      return {images:headImages.length,captions};
    });
    if([1440,820,760,390,320].includes(width)) {
      // Capture from the top so the sticky header is not painted over section crops.
      await page.evaluate(()=>window.scrollTo(0,0));
      item.screenshotRegions={};
      for(const [name,selector] of [['hero','.rf-chimera-hero'],['rigs','#chimera-rigs'],['editing','#chimera-editing'],['downloads','.rf-chimera-downloads']]) item.screenshotRegions[name]=await page.locator(selector).boundingBox();
      await page.screenshot({path:path.join(output,`${width}-${lang}-page.png`),fullPage:true,animations:'disabled'});
    }
    console.log(JSON.stringify({width,lang,errors:item.errors}));
  }
  const downloads = await page.locator('#chimera a[href*="/releases/download/"]').evaluateAll(nodes=>[...new Set(nodes.map(e=>e.href))]);
  for(const url of downloads){
    try {const r=await context.request.head(url,{timeout:60000});assert.equal(r.status(),200);report.links.push({url,status:r.status()});}
    catch(e){report.errors.push(url+': '+e.message);}
  }
  assert(report.cases.every(x=>!x.errors.length) && !report.errors.length,'Browser verification failed; see report.json');
}
main().catch(e=>{report.errors.push(e.message);console.error(e);process.exitCode=1;}).finally(async()=>{
  report.finished=new Date().toISOString();
  await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
  if(browser) await browser.close();if(server) await new Promise(resolve=>server.close(resolve));
});
