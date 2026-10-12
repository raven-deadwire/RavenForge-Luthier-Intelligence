#!/usr/bin/env node
'use strict';
// Actual BN02 publication QA. No synthetic articles, request mocks or site writes.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const {createHash} = require('node:crypto');
const {createRequire} = require('node:module');
const {execFileSync} = require('node:child_process');
const runtimeRequire = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '__bn02_qa__.cjs')) : require;
const {chromium} = runtimeRequire('playwright');
const root = path.resolve(__dirname, '..');
const prefix = '/RavenForge-Luthier-Intelligence/';
const publicURL = 'https://raven-deadwire.github.io' + prefix;
const live = process.argv.includes('--public');
const langs = ['ko', 'en', 'de'];
const viewports = [{name:'desktop',width:1440,height:1080},{name:'tablet',width:768,height:1024},
  {name:'mobile',width:390,height:844},{name:'narrow',width:320,height:740}];
const categories = {ko:{all:'전체보기',log:'작업 노트'},en:{all:'All',log:'Bench Notes'},de:{all:'Alle',log:'Werkstattnotizen'}};
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const report = {schemaVersion:1,target:live?'public':'candidate',started:new Date().toISOString(),
  viewports,cases:[],http:[],errors:[],diagnostics:[],archiveUnchanged:false};
let output, browser, server, before;

async function inventory() {
  const result = {};
  async function walk(dir) {
    for (const entry of await fs.readdir(dir,{withFileTypes:true})) {
      const file = path.join(dir,entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile()) result[path.relative(root,file)] = digest(await fs.readFile(file));
    }
  }
  await walk(path.join(root,'research'));
  return result;
}

async function serveCandidate() {
  server = http.createServer(async(req,res)=>{
    try {
      let relative = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      assert(relative.startsWith(prefix));
      relative = relative.slice(prefix.length) || 'index.html';
      const file = path.resolve(root,relative);
      assert(file.startsWith(root+path.sep));
      const bytes = await fs.readFile(file);
      const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript',
        '.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
      res.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream'}).end(bytes);
    } catch {res.writeHead(404).end('Not found');}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return `http://127.0.0.1:${server.address().port}${prefix}`;
}

async function compareFile(request,base,file) {
  const bytes = await fs.readFile(path.join(root,file));
  const response = await request.get(new URL(file,base).href,{timeout:15000});
  const actual = await response.body();
  const detail = {file,status:response.status(),expectedSHA256:digest(bytes),receivedSHA256:digest(actual),bytes:actual.length};
  assert.equal(response.status(),200,`${file}: HTTP ${response.status()}`);
  assert.equal(detail.receivedSHA256,detail.expectedSHA256,`Public bytes differ: ${file}`);
  return detail;
}

async function waitForPublication(request,base) {
  // Wait only for BN02 files changed by this push; unrelated homepage builds
  // must not prolong or satisfy the BN02 publication readiness decision.
  let changed;
  try {
    const ref = process.env.BN02_COMPARE_BASE || 'HEAD^';
    changed = execFileSync('git',['diff','--name-only','--diff-filter=ACMRT',ref,'HEAD','--','research/BN02'],{cwd:root,encoding:'utf8'})
      .trim().split('\n').filter(Boolean);
  } catch { changed = langs.map(lang=>`research/BN02/${lang}.html`).concat('research/BN02/article.css'); }
  report.readiness = {files:changed,timeoutSeconds:240,attempts:0};
  if (!changed.length) {report.readiness.result='NO_BN02_CONTENT_CHANGES';return;}
  const deadline = Date.now()+240000;
  let lastError;
  while (Date.now()<deadline) {
    report.readiness.attempts++;
    try {
      const results = await Promise.allSettled(changed.map(file=>compareFile(request,base,file)));
      const failed = results.filter(result=>result.status==='rejected');
      assert.equal(failed.length,0,failed.map(result=>result.reason.message).join('; '));
      report.readiness.result='PASS';report.readiness.finished=new Date().toISOString();return;
    } catch(e) {lastError=e.message;console.log('Waiting for BN02 Pages bytes: '+lastError);}
    const remaining=deadline-Date.now();
    if(remaining>0) await new Promise(resolve=>setTimeout(resolve,Math.min(10000,remaining)));
  }
  report.readiness.result='FAIL';
  throw new Error('BN02 Pages readiness timeout: '+lastError);
}

async function runCase(name,context,fn) {
  const item={name,checks:[],errors:[]};report.cases.push(item);
  const page=await context.newPage();
  // Third-party homepage CDN/profile requests are diagnostic only. Required
  // article assets, bytes and functioning archive controls are checked below.
  page.on('pageerror',e=>{if(report.diagnostics.length<60)report.diagnostics.push({case:name,type:'pageerror',message:e.message});});
  page.on('requestfailed',r=>{if(report.diagnostics.length<60)report.diagnostics.push({case:name,type:'requestfailed',url:r.url(),message:r.failure()?.errorText});});
  const check=async(label,action)=>{
    try {item.checks.push({name:label,result:'PASS',detail:await action()});}
    catch(e){item.checks.push({name:label,result:'FAIL',error:e.message});item.errors.push(label+': '+e.message);}
  };
  try {await fn(page,check,item);} catch(e){item.errors.push(e.message);}
  finally {item.result=item.errors.length?'FAIL':'PASS';console.log(`${item.result}: ${name}`);await page.close();}
}

async function decodeImages(page) {
  for(const img of await page.locator('article img').all()){
    await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());
  }
}

async function capture(page,name,selector) {
  const target=page.locator(selector).first();
  await target.scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(output,name+'.png'),animations:'disabled'});
}

async function articleCase(context,base,lang,viewport,entry,expectedImages) {
  const name=`article-${lang}-${viewport.name}`;
  await runCase(name,context,async(page,check)=>{
    const url=new URL(entry[lang].link,base).href;
    await page.goto(url,{waitUntil:'load'});
    await check('localized article and all images decoded',async()=>{
      assert.equal(await page.locator('html').getAttribute('lang'),lang);
      assert.equal(await page.locator('h1').innerText(),entry[lang].title);
      assert.equal(await page.locator('.languages [aria-current="page"]').getAttribute('hreflang'),lang);
      assert.equal(await page.locator('article img').count(),expectedImages.length);
      await decodeImages(page);
      return {language:lang,images:expectedImages.length};
    });
    await check('proportional images and matching original links',async()=>{
      const result=await page.locator('article img').evaluateAll(nodes=>nodes.map(el=>{
        const r=el.getBoundingClientRect();return {src:el.getAttribute('src'),href:el.closest('a')?.getAttribute('href'),
          alt:el.alt,natural:[el.naturalWidth,el.naturalHeight],width:r.width,height:r.height,left:r.left,right:r.right};
      }));
      assert.deepEqual(result.map(x=>x.src),expectedImages);
      for(const m of result){
        assert(m.natural[0]>0 && m.natural[1]>0 && m.alt,'Image missing or undecoded: '+m.src);
        assert.equal(m.src,m.href,'Original-image link differs: '+m.src);
        assert(m.width>0 && m.left>=-1 && m.right<=viewport.width+1,'Image clipped: '+m.src);
        assert(Math.abs(m.width/m.height-m.natural[0]/m.natural[1])<0.002,'Image distorted: '+m.src);
      }
      return result;
    });
    await check('no page overflow and complete readable table access',async()=>{
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),'Document horizontal overflow');
      const navigation=await page.locator('.page-navigation > a,.languages a').evaluateAll(nodes=>nodes.map(el=>{
        const r=el.getBoundingClientRect();return {text:el.textContent,left:r.left,right:r.right,viewport:document.documentElement.clientWidth};
      }));
      for(const link of navigation)assert(link.left>=-1&&link.right<=link.viewport+1,'Navigation clipped: '+JSON.stringify(link));
      const measurements=[];
      for(const wrapper of await page.locator('article > .table-scroll').all()){
        const m=await wrapper.evaluate(el=>{
          const r=el.getBoundingClientRect(),cells=[...el.querySelectorAll('th,td')];
          el.scrollLeft=el.scrollWidth;
          const end=el.querySelector('tr:last-child > :last-child').getBoundingClientRect();
          const result={width:el.clientWidth,scrollWidth:el.scrollWidth,scrollLeft:el.scrollLeft,overflow:getComputedStyle(el).overflowX,
            lastCellAccessible:end.right<=r.right+1,clippedCells:cells.filter(c=>c.scrollWidth>c.clientWidth+1||c.scrollHeight>c.clientHeight+1).length};
          el.scrollLeft=0;return result;
        });
        assert.equal(m.clippedCells,0,'Table cell text clipped');assert(m.lastCellAccessible,'Last table column inaccessible');
        if(m.scrollWidth>m.width+1)assert.equal(m.overflow,'auto','Wide table cannot scroll');
        measurements.push(m);
      }
      return measurements;
    });
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:path.join(output,name+'-title.png'),animations:'disabled'});
    await capture(page,name+'-table','.comparison');
    if(viewport.width<660){
      const wide=page.locator('.table-scroll').filter({has:page.locator('table.comparison')}).first();
      await wide.evaluate(el=>{el.scrollLeft=el.scrollWidth;});
      await page.screenshot({path:path.join(output,name+'-table-end.png'),animations:'disabled'});
      await wide.evaluate(el=>{el.scrollLeft=0;});
    }
    if(['desktop','mobile'].includes(viewport.name)){
      for(const [index,label] of [[3,'nam'],[4,'cabinet'],[5,'latency']]){
        await page.locator('article img').nth(index).scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(output,name+'-'+label+'.png'),animations:'disabled'});
      }
    }
    await check('TOC destinations visible after real clicks',async()=>{
      await page.locator('.toc summary').click();
      const links=await page.locator('.toc a').all();
      for(const link of links){
        const href=await link.getAttribute('href');await link.click();
        assert.equal(new URL(page.url()).hash,href);
        assert(await page.locator(href).evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=-1&&r.top<innerHeight;}),'TOC target out of viewport: '+href);
      }
      await page.locator('.toc summary').click();return {links:links.length};
    });
    await check('original images open and decode in a new tab',async()=>{
      const links=await page.locator('.figure-link').all(),opened=[];
      for(const link of viewport.name==='desktop'?links:links.slice(0,1)){
        const href=await link.getAttribute('href');
        const pending=page.waitForEvent('popup');await link.click();const popup=await pending;
        try {await popup.waitForLoadState('load');assert.equal(popup.url(),new URL(href,url).href);
          await popup.locator('img').evaluate(img=>img.decode());
          assert(await popup.locator('img').evaluate(img=>img.naturalWidth>0&&img.naturalHeight>0));opened.push(popup.url());
        } finally {await popup.close();}
      }
      return opened;
    });
    await check('reciprocal language switching',async()=>{
      for(const target of [langs[(langs.indexOf(lang)+1)%langs.length],lang]){
        await page.locator(`.languages a[hreflang="${target}"]`).click();
        await page.waitForURL(new URL(entry[target].link,base).href);
        assert.equal(await page.locator('html').getAttribute('lang'),target);
        assert.equal(await page.locator('.languages [aria-current="page"]').getAttribute('hreflang'),target);
        assert.equal(await page.locator('h1').innerText(),entry[target].title);
      }
    });
  });
}

async function archiveCase(context,base,lang,viewport,articles) {
  await runCase(`archive-${lang}-${viewport.name}`,context,async(page,check)=>{
    const cards=page.locator('#research-grid > div');
    const expected=articles.map(a=>a[lang].title);
    const logTitles=articles.filter(a=>a.category==='log').map(a=>a[lang].title);
    const bn02=articles.find(a=>a.id==='BN02');
    const open=async entry=>{
      await cards.filter({has:page.getByRole('heading',{name:entry[lang].title,exact:true})}).click();
      await page.locator('#luthier-modal').waitFor({state:'visible'});
      const iframe=page.locator('#modal-body iframe');
      assert.equal(await iframe.getAttribute('src'),entry[lang].link);
      const frame=await (await iframe.elementHandle()).contentFrame();
      await frame.waitForLoadState('load');
      assert.equal(new URL(frame.url()).pathname,new URL(entry[lang].link,base).pathname);
      assert.equal(await frame.locator('html').getAttribute('lang'),lang);
      assert((await frame.locator('body').innerText()).length>100);
      return frame;
    };
    await page.goto(base+'index.html#research',{waitUntil:'load'});
    const code=lang==='ko'?'kr':lang;
    await page.locator(`#lang-${code}-btn:visible,#lang-${code}-btn-float:visible`).first().click();
    await page.waitForFunction(l=>document.documentElement.lang===l,lang);
    await page.waitForFunction(n=>document.querySelectorAll('#research-grid > div').length===n,articles.length);
    await check('all indexed entries and BN02 position match metadata',async()=>{
      assert(bn02);
      assert(articles.some(a=>a.id==='BN01'));
      assert.deepEqual(await cards.locator('h3').allTextContents(),expected);
      return {entries:articles.length,first:articles[0].id,bn02Position:articles.indexOf(bn02)+1,bn01:true};
    });
    await capture(page,`archive-${lang}-${viewport.name}`,'#research-grid > div');
    await check('Bench Notes filter and BN02 modal language navigation',async()=>{
      await page.locator('#research-filters').getByRole('button',{name:categories[lang].log,exact:true}).click();
      assert.deepEqual(await cards.locator('h3').allTextContents(),logTitles);
      const frame=await open(bn02);
      const other=langs[(langs.indexOf(lang)+1)%langs.length];
      await frame.locator(`.languages a[hreflang="${other}"]`).click();
      await frame.waitForURL(new URL(bn02[other].link,base).href);
      assert.equal(await frame.locator('html').getAttribute('lang'),other);
      assert.equal(await frame.locator('.languages [aria-current="page"]').getAttribute('hreflang'),other);
      await frame.locator('.page-navigation > a').click();
      // The old link loads a nested homepage and fails this exact assertion.
      await page.waitForFunction(()=>document.querySelector('#luthier-modal')?.classList.contains('hidden'));
      assert.equal(new URL(page.url()).hash,'#research');
      assert.equal(await page.locator('#modal-body iframe:visible').count(),0,'Archive return stayed inside the visible article iframe');
      assert(await page.locator('#research').isVisible());
      await page.waitForFunction(counts=>counts.includes(document.querySelectorAll('#research-grid > div').length),[articles.length,logTitles.length]);
      const returnedTitles=await cards.locator('h3').allTextContents();
      const listingMode=JSON.stringify(returnedTitles)===JSON.stringify(expected)?'all':
        JSON.stringify(returnedTitles)===JSON.stringify(logTitles)?'log':null;
      assert(listingMode,'Returned archive differs from both complete and Bench Notes lists');
      return {modalLanguage:other,returnedToTopLevel:true,listingMode};
    });
    await check('BN01 and another existing article remain reachable',async()=>{
      // Refresh to recover independently if the preceding navigation failed.
      await page.goto(base+'index.html#research',{waitUntil:'load'});
      await page.locator('#research-filters').getByRole('button',{name:categories[lang].all,exact:true}).click();
      await page.waitForFunction(n=>document.querySelectorAll('#research-grid > div').length===n,articles.length);
      for(const entry of [articles.find(a=>a.id==='BN01'),articles.find(a=>a.id!=='BN02'&&a.id!=='BN01')]){
        await open(entry);
        const newTab=page.locator('#modal-body a[target="_blank"]');
        assert.equal(await newTab.getAttribute('href'),entry[lang].link);
        await page.locator('#modal-close').click();
        await page.locator('#luthier-modal').waitFor({state:'hidden'});
      }
    });
  });
}

async function main() {
  output=path.resolve(process.env.BN02_QA_DIR||await fs.mkdtemp(path.join(os.tmpdir(),'ravenforge-bn02-qa-')));
  assert(!output.startsWith(root+path.sep)&&output!==root,'Evidence must stay outside checkout');
  await fs.mkdir(output,{recursive:true});report.output=output;
  before=await inventory();report.archiveFiles=Object.keys(before).length;
  report.archiveSHA256=digest(JSON.stringify(before));
  report.sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  const articles=JSON.parse(await fs.readFile(path.join(root,'research/research-index.json'),'utf8')).articles;
  const entry=articles.find(a=>a.id==='BN02');assert(entry,'BN02 missing from index');
  assert.equal(new Set(articles.map(a=>a.id)).size,articles.length,'Duplicate archive IDs');
  // The homepage shell is regenerated in a later build commit. Its 12 archive
  // browser cases remain required; pin strict byte comparison to research
  // content so footer-only build whitespace cannot fail publication QA.
  const imagePaths={},files=['research/research-index.json','research/BN02/article.css'];
  for(const lang of langs){
    const file=entry[lang].link,html=await fs.readFile(path.join(root,file),'utf8');
    imagePaths[lang]=[...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(m=>m[1]);
    files.push(file,...imagePaths[lang].map(src=>path.posix.join('research/BN02',src)));
  }
  const base=live?publicURL:await serveCandidate();report.baseURL=base;
  browser=await chromium.launch({headless:true,executablePath:process.env.RESEARCH_BROWSER_PATH||undefined});
  report.browser=browser.version();
  const network=await browser.newContext();
  try {
    if(live)await waitForPublication(network.request,base);
    for(let i=0;i<files.length;i+=4){
      const batch=await Promise.allSettled(files.slice(i,i+4).map(file=>compareFile(network.request,base,file)));
      batch.forEach((result,j)=>{
        if(result.status==='fulfilled')report.http.push({...result.value,result:'PASS'});
        else {report.http.push({file:files[i+j],result:'FAIL',error:result.reason.message});report.errors.push(result.reason.message);}
      });
    }
  } finally {await network.close();}
  for(const viewport of viewports)for(const lang of langs){
    const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},reducedMotion:'reduce'});
    context.setDefaultTimeout(15000);context.setDefaultNavigationTimeout(45000);
    try {await articleCase(context,base,lang,viewport,entry,imagePaths[lang]);await archiveCase(context,base,lang,viewport,articles);}
    finally {await context.close();}
  }
}

main().catch(e=>{report.errors.push(e.stack||e.message);console.error(e);}).finally(async()=>{
  if(before){
    try {assert.deepEqual(await inventory(),before,'Published research changed during QA');report.archiveUnchanged=true;}
    catch(e){report.errors.push(e.message);}
  }
  await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));
  report.finished=new Date().toISOString();
  report.result=report.archiveUnchanged&&!report.errors.length&&report.cases.length===viewports.length*langs.length*2&&report.cases.every(c=>c.result==='PASS')?'PASS':'FAIL';
  if(output){await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('Report: '+path.join(output,'report.json'));}
  if(report.result!=='PASS')process.exitCode=1;
});
