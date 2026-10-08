#!/usr/bin/env node
'use strict';
// Actual Chromium QA of temporary synthetic DOCX output. No private sources,
// published-page writes, mocked requests, fonts or browser-renderer substitutes.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const {createRequire} = require('node:module');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const runtimeRequire = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '__qa__.cjs')) : require;
const {chromium} = runtimeRequire('playwright');
const root = path.resolve(__dirname, '..');
const prefix = '/RavenForge-Luthier-Intelligence';
const args = process.argv.slice(2);
const option = key => args.includes(key) ? args[args.indexOf(key) + 1] : undefined;
const sha = data => createHash('sha256').update(data).digest('hex');

async function archiveInventory() {
  const records = {};
  async function walk(dir) {
    for (const file of await fs.readdir(dir, {withFileTypes: true})) {
      const name = path.join(dir, file.name);
      if (file.isDirectory()) await walk(name);
      else if (file.isFile()) records[path.relative(root, name)] = sha(await fs.readFile(name));
    }
  }
  await walk(path.join(root, 'research'));
  return records;
}

async function main() {
  const output = path.resolve(process.env.RESEARCH_QA_DIR || await fs.mkdtemp(path.join(os.tmpdir(), 'ravenforge-docx-qa-')));
  assert(!output.startsWith(root + path.sep), 'Evidence must stay outside the checkout');
  await fs.mkdir(output, {recursive:true});
  const fixture = option('--fixture') || path.join(output, 'fixture');
  const before = await archiveInventory();
  if (!option('--fixture')) execFileSync(process.env.RESEARCH_PYTHON || process.env.CODEX_PRIMARY_RUNTIME_PYTHON || 'python', [path.join(__dirname, 'research_browser_fixture.py'), fixture], {stdio:'inherit'});
  const expected = JSON.parse(await fs.readFile(path.join(fixture, 'expected.json'), 'utf8'));
  const article = path.join(fixture, 'article');
  const report = {schemaVersion:1, browser:null, testType:'actual Chromium; synthetic converted DOCX', started:new Date().toISOString(), viewports:[{name:'desktop',width:1440,height:1080},{name:'mobile',width:390,height:844}], cases:[], errors:[], output, fixture, archiveFiles:Object.keys(before).length, ignoreHTTPSErrors:false, sourceHashes:{}};
  for (const file of ['tools/research_docx.py','tools/research_browser_fixture.py','tools/test_research_browser.cjs','research/B03/b03.css']) report.sourceHashes[file] = sha(await fs.readFile(path.join(root,file)));
  for (const file of ['ko.html','en.html','de.html','article.css']) report.sourceHashes['generated/'+file] = sha(await fs.readFile(path.join(article,file)));
  let browser, server;
  try {
    server = http.createServer(async (req,res) => {
      try {
        const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        assert(urlPath.startsWith(prefix + '/'));
        const relative = urlPath.slice(prefix.length + 1);
        const virtual = `research/${expected.article}/`;
        const base = relative.startsWith(virtual) ? article : root;
        const file = path.resolve(base, relative.startsWith(virtual) ? relative.slice(virtual.length) : relative);
        assert(file.startsWith(base + path.sep));
        const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.png':'image/png','.js':'text/javascript'};
        const data = await fs.readFile(file);
        res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream'}).end(data);
      } catch { res.writeHead(404).end('Not found'); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const baseURL = `http://127.0.0.1:${server.address().port}${prefix}`;
    const articleURL = `${baseURL}/research/${expected.article}`;
    browser = await chromium.launch({headless:true, executablePath:process.env.RESEARCH_BROWSER_PATH || process.env.CONFIGURATOR_BROWSER_PATH || undefined});
    report.browser = browser.version();
    for (const viewport of report.viewports) for (const lang of ['ko','en','de']) {
      const key = `${lang}-${viewport.name}`;
      const dir = path.join(output,key);
      await fs.mkdir(dir,{recursive:true});
      const item = {key, lang, viewport, checks:[], errors:[], platformFonts:[], links:[]};
      report.cases.push(item);
      const context = await browser.newContext({viewport:{width:viewport.width,height:viewport.height}, reducedMotion:'reduce'});
      const page = await context.newPage();
      page.on('pageerror', e => item.errors.push('pageerror: '+e.message));
      page.on('console', m => {if(m.type()==='error') item.errors.push('console: '+m.text());});
      page.on('requestfailed', r => item.errors.push('requestfailed: '+r.url()));
      page.on('response', r => {if(r.status()>=400) item.errors.push(`HTTP ${r.status()} ${r.url()}`);});
      const check = async (name, action) => {
        try { const detail = await action(); item.checks.push({name,result:'PASS', ...(detail === undefined ? {} : {detail})}); }
        catch(e) { item.checks.push({name,result:'FAIL',error:e.message}); item.errors.push(name+': '+e.message); }
      };
      try {
        await page.goto(`${articleURL}/${lang}.html`,{waitUntil:'load'});
        await page.evaluate(() => document.fonts.ready);
        await check('language, title, body and formatting',async()=>{
          assert.equal(await page.locator('html').getAttribute('lang'),lang);
          assert.equal(await page.title(),expected.text[lang].title+' · RavenForge');
          assert.equal(await page.locator('h1').count(),1);
          assert.equal(await page.locator('h1').innerText(),'A99999 — '+expected.text[lang].title);
          assert((await page.locator('article').innerText()).includes(expected.text[lang].body));
          for(const selector of ['strong','em','sub','sup']) assert.equal(await page.locator('article '+selector).count(),1);
          assert.equal(await page.locator('article table').count(),expected.tables);
          assert.equal(await page.locator('article img').count(),expected.images);
          const actualTables=await page.locator('article table').evaluateAll(tables=>tables.map(table=>[...table.rows].map(row=>[...row.cells].map(cell=>cell.textContent))));
          const expectedTables=[2,3,5,8,10,2,3,5,2].map((columns,index)=>Array.from({length:3},(_,row)=>Array.from({length:columns},(_,col)=>`${index+1}.${row}.${col} ${expected.text[lang].cell}`+(row===2&&col===columns-1?` END-COLUMN-${index+1}`:''))));
          assert.deepEqual(actualTables,expectedTables,'table text/order changed');
        });
        await check('real font used for Korean glyphs',async()=>{
          if(lang!=='ko') return 'not applicable';
          const cdp = await context.newCDPSession(page);
          await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
          const {root:doc} = await cdp.send('DOM.getDocument');
          for(const selector of ['h1','article > p','article td p','article .reference']){
            const {nodeId} = await cdp.send('DOM.querySelector',{nodeId:doc.nodeId,selector});
            const {fonts} = await cdp.send('CSS.getPlatformFontsForNode',{nodeId});
            item.platformFonts.push({selector,fonts});
            assert(fonts.some(f=>/Noto Sans (CJK KR|KR)|Malgun|Apple SD Gothic/i.test(f.familyName) && f.glyphCount>0),`${selector}: no rendered Korean-capable font`);
          }
          await cdp.detach();
          return item.platformFonts;
        });
        await check('responsive geometry and complete table access',async()=>{
          assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1),'document has horizontal overflow');
          const metrics=[];
          for(const table of await page.locator('article > .table-scroll').all()){
            const m=await table.evaluate(el=>{
              const rect=el.getBoundingClientRect();
              const cells=[...el.querySelectorAll('td,th')];
              const clipped=cells.filter(c=>c.scrollWidth>c.clientWidth+1 || c.scrollHeight>c.clientHeight+1).length;
              el.scrollLeft=el.scrollWidth;
              const end=el.querySelector('tr:last-child td:last-child').getBoundingClientRect();
              const result={width:el.clientWidth,scrollWidth:el.scrollWidth,scrollLeft:el.scrollLeft,clippedCells:clipped,lastCellAccessible:end.right<=rect.right+1,overflow:getComputedStyle(el).overflowX,minimumCellWidth:Math.min(...cells.map(c=>c.getBoundingClientRect().width))};
              el.scrollLeft=0;return result;
            });
            assert.equal(m.clippedCells,0,'clipped table cell');
            assert(m.lastCellAccessible,'last table column inaccessible');
            assert(m.minimumCellWidth>=159,'table columns collapse below readable 10rem width');
            if(m.scrollWidth>m.width+1) assert.equal(m.overflow,'auto');
            metrics.push(m);
          }
          const clipped=await page.locator('article > h1, article > h2, article > h3, article > p').evaluateAll(nodes=>nodes.filter(el=>el.scrollWidth>el.clientWidth+1 || el.getBoundingClientRect().right>innerWidth+1).map(el=>el.textContent));
          assert.deepEqual(clipped,[],'clipped heading/body/reference');
          return metrics;
        });
        await check('keyboard can scroll a wide table',async()=>{
          const wide=page.locator('article > .table-scroll').nth(4);
          await wide.focus();
          await page.keyboard.press('ArrowRight');
          await page.waitForFunction(()=>document.querySelectorAll('article > .table-scroll')[4].scrollLeft>0);
          await wide.evaluate(el=>{el.scrollLeft=0;});
        });
        await check('all six images decoded, proportional and unclipped',async()=>{
          const metrics=[];
          for(const img of await page.locator('article img').all()){
            await img.scrollIntoViewIfNeeded();
            await img.evaluate(el=>el.decode());
            const m=await img.evaluate(el=>{const r=el.getBoundingClientRect();return {src:el.getAttribute('src'),alt:el.alt,naturalWidth:el.naturalWidth,naturalHeight:el.naturalHeight,width:r.width,height:r.height,left:r.left,right:r.right,parentWidth:el.parentElement.clientWidth};});
            assert(m.naturalWidth>0 && m.naturalHeight>0 && m.alt);
            assert(m.width<=m.parentWidth+1 && m.right<=viewport.width+1 && m.left>=0,'clipped image');
            assert(Math.abs(m.width/m.height-m.naturalWidth/m.naturalHeight)<0.02,'distorted aspect ratio');
            const content=await (await context.request.get(`${articleURL}/${m.src}`)).body();
            const conversion=JSON.parse(await fs.readFile(path.join(article,'validation-report.json'),'utf8'));
            assert.equal(sha(content),conversion.languages[lang].figures[metrics.length].sha256);
            metrics.push(m);
          }
          return metrics;
        });
        await check('bibliography and internal bookmark navigation',async()=>{
          assert((await page.locator('.reference').allTextContents()).some(s=>s.includes(expected.text[lang].refs)));
          for(const [target,text] of [['references',expected.text[lang].jump],['body',expected.text[lang].back]]){
            await page.getByRole('link',{name:text,exact:true}).click();
            assert.equal(new URL(page.url()).hash,'#'+target);
            assert(await page.locator('#'+target).evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0 && r.top<innerHeight;}),'bookmark did not scroll into view');
          }
          await page.locator('.toc summary').click();
          for(const link of await page.locator('.toc a').all()){
            const href=await link.getAttribute('href');
            await link.click();
            assert.equal(new URL(page.url()).hash,href);
            assert(await page.locator(href).evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0 && r.top<innerHeight;}),'TOC target out of viewport');
          }
          await page.locator('.toc summary').click();
        });
        await check('local link responses and fragment targets',async()=>{
          const links=await page.locator('[href],img[src]').evaluateAll(nodes=>nodes.map(el=>el.getAttribute('href')||el.getAttribute('src')));
          for(const value of [...new Set(links)]){
            // Canonical new article points to production, but is deliberately
            // unpublished. Resolve its path to this real local HTTP server.
            const url=new URL(value,`${articleURL}/${lang}.html`);
            if(url.origin==='https://raven-deadwire.github.io') url.host=new URL(baseURL).host,url.protocol='http:';
            assert.equal(url.origin,new URL(baseURL).origin,'unexpected external fixture URL');
            const response=await context.request.get(url.href);
            assert.equal(response.status(),200,value);
            if(url.hash) assert((await response.text()).includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),`missing fragment ${value}`);
            item.links.push({href:value,status:response.status()});
          }
        });
        await check('reciprocal language switching by real clicks',async()=>{
          for(const target of ['ko','en','de',lang]){
            await page.locator(`.languages a[hreflang="${target}"]`).click();
            await page.waitForLoadState('load');
            assert.equal(await page.locator('html').getAttribute('lang'),target);
            assert.equal(await page.locator('.languages [aria-current="page"]').getAttribute('hreflang'),target);
            assert((await page.locator('h1').innerText()).includes(expected.text[target].title));
          }
        });
        // Decode lazy images after navigation before preserving actual pixels.
        for(const img of await page.locator('article img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());}
        await page.evaluate(()=>scrollTo(0,0));
        await page.screenshot({path:path.join(dir,'full.png'),fullPage:true});
        for(const [name,selector] of [['title','h1'],['table','.table-scroll'],['wide-table','.table-scroll:nth-of-type(5)'],['figure','article img'],['references','.reference']]) {
          await page.locator(selector).first().scrollIntoViewIfNeeded();
          await page.screenshot({path:path.join(dir,name+'.png')});
        }
        const wide=page.locator('article > .table-scroll').nth(4);
        await wide.scrollIntoViewIfNeeded();
        await wide.evaluate(el=>{el.scrollLeft=el.scrollWidth;});
        await page.screenshot({path:path.join(dir,'wide-table-end.png')});
        await check('existing B03 link navigates without replacing its content',async()=>{
          await page.getByRole('link',{name:'Published B03',exact:true}).click();
          await page.waitForLoadState('load');
          assert.equal(new URL(page.url()).pathname,`${prefix}/research/B03/${lang}.html`);
        });
      } catch(e) {item.errors.push(e.stack);}
      finally {item.result=item.errors.length?'FAIL':'PASS';await context.close();console.log(`${item.result}: ${key} (${item.checks.length} checks)`);}
    }
    assert.deepEqual(await archiveInventory(),before,'Published research files changed');
    report.archiveUnchanged=true;
    report.result=report.cases.every(c=>c.result==='PASS')?'PASS':'FAIL';
  } catch(e) {report.errors.push(e.stack);report.result='FAIL';}
  finally {
    await browser?.close();
    if(server) await new Promise(resolve=>server.close(resolve));
    report.finished=new Date().toISOString();
    await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
    console.log(`Report: ${output}/report.json`);
  }
  if(report.result!=='PASS') process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
