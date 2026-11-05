#!/usr/bin/env node
'use strict';
// Run: node tools/test_works_portfolio.cjs
// Optional baseline: WORKS_SOURCE_ROOT=/path/to/checkout node tools/test_works_portfolio.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const {loadTranslations} = require('./prefill_lang_keys.cjs');
const root = path.resolve(process.env.WORKS_SOURCE_ROOT || path.join(__dirname, '..'));
const out = path.resolve(process.env.WORKS_QA_DIR || '/tmp/works-qa');
const report = { source: root, cases: [], layout: [], errors: [] };
let browser, server;
const scan = () => [...document.querySelectorAll('main h1,main h2,main h3,main h4,main h5,main p,main a,main button,main li,main dt,main dd,main summary,main strong,header h1,header p,header a,header button,footer p,footer a')].filter(el => {
  const r=el.getBoundingClientRect(); return r.width && r.height && el.checkVisibility({checkVisibilityCSS:true});
}).flatMap(el => {
  const r=el.getBoundingClientRect(), s=getComputedStyle(el);
  let scrollAncestor=false; for(let parent=el.parentElement;parent;parent=parent.parentElement) if(['auto','scroll'].includes(getComputedStyle(parent).overflowX) && parent.scrollWidth>parent.clientWidth+2) {scrollAncestor=true;break;}
  const horizontal=el.scrollWidth>el.clientWidth+2 && !['auto','scroll'].includes(s.overflowX) && !el.matches('.rf-q-map-sources li, .rf-q-loop .rf-q-process li:has(> .rf-q-step-arrow)'); // Decorative connectors extend beyond their li; the links and strong text are checked separately.
  const clipped=el.scrollHeight>el.clientHeight+2 && ['hidden','clip'].includes(s.overflowY);
  return horizontal || clipped || (!scrollAncestor && (r.right>innerWidth+2 || r.left < -2)) ? [{tag:el.tagName,id:el.id,text:el.textContent.trim().slice(0,100),horizontal,clipped,left:r.left,right:r.right}] : [];
});
async function main() {
  await fs.mkdir(out,{recursive:true});
  server=http.createServer(async(req,res)=>{
    try {
      let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname); if(name.endsWith('/')) name+='index.html';
      if (name === '/__works-fixture.html') { res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><html><body></body></html>'); return; }
      const file=path.resolve(root,'.'+name); assert(file.startsWith(root+path.sep));
      const type={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.json':'application/json','.pdf':'application/pdf'}[path.extname(file)]||'application/octet-stream';
      res.writeHead(200,{'Content-Type':type}).end(await fs.readFile(file));
    } catch {res.writeHead(404).end('Not found');}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}/`;
  const translations=loadTranslations(await fs.readFile(path.join(root,'index.html'),'utf8'));
  browser=await chromium.launch({headless:true, executablePath:process.env.WORKS_CHROMIUM_PATH || undefined, args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});report.browser=browser.version();
  const context=await browser.newContext({reducedMotion:'reduce'});
  const page=await context.newPage(); page.on('pageerror',e=>report.errors.push(e.message));
  if (!process.argv.includes('--defensive-only')) {
  for(const lang of ['en','ko','de']) for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto(base+({en:'index.html',ko:'ko.html',de:'de.html'}[lang])+'?about=works#about');
    await page.locator('.rf-works-toolbar').waitFor({state:'visible'});
    assert.equal(await page.locator('html').getAttribute('lang'),lang);
    assert.equal(await page.locator('[data-works-categories]:visible').count(),4);
    assert.equal(await page.locator('#works-repairs img').count(),15);
    assert.equal(await page.locator('#about-content-works #works-repairs .rf-repair-photo').count(),15);
    assert.equal(await page.locator('#btn-about-repairs, #about-content-repairs').count(),0);
    assert.equal((await page.locator('#works-repairs').textContent()).trim(),'');
    assert.equal(await page.locator('#works-repairs details, #works-repairs [data-works-caption]').count(),0);
    // Translation coverage, including the generated static fallbacks.
    const untranslated=await page.evaluate(()=>[...document.querySelectorAll('#about-content-works [data-lang-key]')].filter(e=>e.textContent.includes('undefined')||e.textContent.includes('[object Object]')).length); assert.equal(untranslated,0);
    const strings=Object.fromEntries(Object.entries(translations[lang]).filter(([,v])=>typeof v==='string'));
    const wrongCopy=await page.locator('#about-content-works [data-lang-key],#works-repairs [data-lang-key]').evaluateAll((els,strings)=>els.filter(el=>el.textContent.trim()!==new DOMParser().parseFromString(strings[el.dataset.langKey]||'','text/html').body.textContent.trim()).map(el=>el.dataset.langKey),strings);
    assert.deepEqual(wrongCopy,[]);
    if(width===390) for(const href of new Set(await page.locator('#about-content-works a[href]').evaluateAll(els=>els.map(el=>el.href)))) {
      const response=await context.request.get(href);assert.equal(response.status(),200,href);
      if(href.endsWith('.pdf')) assert((await response.body()).subarray(0,5).equals(Buffer.from('%PDF-')));
    }
    for(const [filter,projects,photos] of [['builds',1,0],['drawings',2,0],['models',3,0],['all',4,15],['repairs',0,15]]) {
      await page.locator(`[data-works-filter="${filter}"]`).press('Enter');
      assert.equal(await page.locator('[data-works-categories]:visible').count(),projects);
      assert.equal(await page.locator('#works-repairs img:visible').count(),photos);
      assert.equal(await page.locator(`[data-works-filter="${filter}"]`).getAttribute('aria-pressed'),'true');
      report.layout.push({lang,width,view:'works/'+filter,issues:await page.evaluate(scan)});
    }
    // Repair photographs are a filter within My Works, with no visible record copy.
    assert.equal(await page.locator('#about-content-works').isVisible(),true);
    assert.equal(await page.locator('#works-repairs').isVisible(),true);
    assert.equal(new URL(page.url()).searchParams.get('about'),'works');
    assert.equal(new URL(page.url()).searchParams.get('category'),'repairs');
    report.layout.push({lang,width,view:'works/repairs',issues:await page.evaluate(scan)});
    for(const selector of ['[data-works-label="repair01"]','[data-works-label="repair15"]']) {
      const opener=page.locator(selector); await opener.press('Space');
      await page.locator('#image-popup').waitFor({state:'visible'});
      assert.equal(await page.locator('#popup-img').getAttribute('src'),await opener.getAttribute('data-works-image'));
      assert.equal(await page.locator('#popup-img').getAttribute('alt'),await opener.locator('img').getAttribute('alt'));
      await page.keyboard.press('Tab'); assert.equal(await page.evaluate(()=>document.activeElement.id),'popup-close');
      await page.keyboard.press('Shift+Tab'); assert.equal(await page.evaluate(()=>document.activeElement.id),'popup-close');
      await page.keyboard.press('Escape'); await page.locator('#image-popup').waitFor({state:'hidden'});
      assert.equal(await opener.evaluate(el=>el===document.activeElement),true);
    }
    const badAssets=await page.locator('#about-content-works img,#works-repairs img').evaluateAll(async imgs=>{
      await Promise.all(imgs.map(img=>{img.loading='eager';return img.decode().catch(()=>{});}));
      return imgs.filter(img=>!img.naturalWidth).map(img=>img.src);
    });assert.deepEqual(badAssets,[]);
    if(width===390||width===1440) {
      await page.locator('#works-repairs').evaluate(el=>el.scrollIntoView());
      await page.screenshot({path:path.join(out,`repair-${lang}-${width}.png`)});
    }
    await page.locator('[data-works-filter="all"]').click();
    const workshop=page.locator('[data-works-label="workshop"]'); await workshop.press('Enter');
    await page.locator('#image-popup').waitFor({state:'visible'});
    assert.equal(await page.locator('#popup-img').getAttribute('alt'),await workshop.locator('img').getAttribute('alt'));
    await page.keyboard.press('Escape'); await page.locator('#image-popup').waitFor({state:'hidden'});
    if(width===390||width===1440) await page.locator('#about-content-works').screenshot({path:path.join(out,`works-${lang}-${width}.png`)});
    // Exercise all top-level homepage views and About/Prototype subtabs; no forms submitted.
    for(const section of ['home','about','Prototype','concept','chimera','analysis','quest','research','configurator']) {
      await page.evaluate(id=>{location.hash=id;},section);
      await page.locator('#'+section).waitFor({state:'visible'});
      report.layout.push({lang,width,view:section,issues:await page.evaluate(scan)});
      const tabs=section==='about'?'.about-tab-btn':section==='Prototype'?'.spec-btn':null;
      if(tabs) for(const btn of await page.locator('#'+section+' '+tabs).all()) {
        await btn.click();report.layout.push({lang,width,view:section+'/'+await btn.getAttribute('id'),issues:await page.evaluate(scan)});
      }
    }
    report.cases.push({lang,width,status:'pass'}); console.log(`PASS ${lang} ${width}`);
  }
  // Published legacy links and saved tabs must still lead to the repair category.
  for (const [lang,file] of [['en','index.html'],['ko','ko.html'],['de','de.html']]) {
    for (const query of ['?about=repairs#about','?about=works&category=repairs#about']) {
      await page.goto(base + file + query);
      await page.locator('#works-repairs').waitFor({state:'visible'});
      assert.equal(await page.locator('#about-content-works').isVisible(),true);
      assert.equal(await page.locator('[data-works-filter="repairs"]').getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('[data-works-categories]:visible').count(),0);
      assert.equal(new URL(page.url()).searchParams.get('about'),'works');
      assert.equal(new URL(page.url()).searchParams.get('category'),'repairs');
    }
    await page.evaluate(() => sessionStorage.setItem('activeAboutTab','repairs'));
    await page.goto(base + file + '#about');
    await page.locator('#works-repairs').waitFor({state:'visible'});
    assert.equal(await page.locator('[data-works-filter="repairs"]').getAttribute('aria-pressed'),'true');
    report.cases.push({lang,view:'repair-link-migration',status:'pass'});
  }
  // No-JS static accessibility localization must not depend on runtime render().
  const nojs=await browser.newContext({javaScriptEnabled:false});const staticPage=await nojs.newPage();
  for(const [lang,file,marker] of [['de','de.html','Vergrößern'],['ko','ko.html','크게 보기']]) {
    await staticPage.goto(base+file);
    for(const button of await staticPage.locator('[data-works-image]').all()) assert((await button.getAttribute('aria-label')).includes(marker));
    assert.equal(await staticPage.locator('#about-content-works #works-repairs img').count(),15);
    assert.equal((await staticPage.locator('#works-repairs').textContent()).trim(),'');
    assert.equal(await staticPage.locator('#btn-about-repairs, #about-content-repairs').count(),0);
    report.cases.push({lang,view:'no-js labels',status:'pass'});
  }await nojs.close();
  }
  // Corrupt/missing optional DOM and regional tags: initialize the real script, then filter.
  const code=await fs.readFile(path.join(root,'assets/works-portfolio.js'),'utf8');
  for(const scenario of ['missing-img','missing-popup','missing-popup-empty-image','missing-archive','missing-grid','missing-count','unknown-label','empty-image','de-DE','ko-KR','EN-us']) {
    const only=process.argv.find(arg=>arg.startsWith('--scenario='))?.split('=')[1]; if(only && scenario!==only) continue;
    await page.goto(base + '__works-fixture.html');
    const regional=scenario.includes('-')&&['de-DE','ko-KR','EN-us'].includes(scenario);
    await page.setContent(`<html lang="${regional?scenario:'en'}"><body><div id="about-content-works"><div class="rf-works-toolbar" hidden><button data-works-filter="all"></button><button data-works-filter="repairs"></button></div><p data-works-count></p><div class="rf-works-grid"><article data-works-categories="models"><button data-works-image="${['empty-image','missing-popup-empty-image'].includes(scenario)?'':'x'}" data-works-label="${scenario==='unknown-label'?'unknown':'workshop'}">${scenario==='missing-img'?'':'<img>'}</button></article></div><section id="works-repairs"><img></section></div>${scenario.startsWith('missing-popup')?'':'<img id="popup-img" src="x">'}</body></html>`);
    if(['missing-archive','missing-grid','missing-count'].includes(scenario)) await page.locator({'missing-archive':'#works-repairs','missing-grid':'.rf-works-grid','missing-count':'[data-works-count]'}[scenario]).evaluate(el=>el.remove());
    const errors=[];const handler=e=>errors.push(e.message);page.on('pageerror',handler);
    await page.addScriptTag({content:code}); assert.deepEqual(errors,[],scenario);
    if(scenario==='unknown-label') assert(!(await page.locator('[data-works-image]').getAttribute('aria-label') || '').includes('undefined'));
    if(scenario==='empty-image') {
      await page.evaluate(()=>{window.openImagePopup=()=>{window.__popupCalled=true;};});
      await page.locator('[data-works-image]').click();
      assert.equal(await page.evaluate(()=>!!window.__popupCalled),false);
    }
     await page.locator('[data-works-filter="repairs"]').click();
    assert.deepEqual(errors,[],scenario);assert.equal(await page.locator('.rf-works-toolbar').isVisible(),true,scenario);
    if(regional) assert.equal(await page.locator('.rf-works-toolbar').getAttribute('aria-label'),{'de-DE':'Projekte nach Art der Unterlagen filtern','ko-KR':'프로젝트 자료 분류','EN-us':'Filter projects by type'}[scenario]);
    page.off('pageerror',handler);report.cases.push({scenario,status:'pass'});
  }
  assert.deepEqual(report.errors,[]);
  assert.deepEqual(report.layout.filter(row=>row.issues.length),[], 'Unexpected text clipping or horizontal overflow');
  await context.close();
}
main().catch(e=>{report.failure=e.stack;process.exitCode=1;}).finally(async()=>{
  await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({cases:report.cases.length,layoutViews:report.layout.length,layoutIssues:report.layout.filter(x=>x.issues.length).length,errors:report.errors,failure:report.failure,output:out},null,2));
  await browser?.close();server?.close();
});
