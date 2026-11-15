// Validate a GLB and load it in a headless browser with three.js.
//   npm install            (once, in this directory; Playwright with Chromium must also be available)
//   node check.cjs MODEL.glb OUT_DIR
// Writes OUT_DIR/web_check.json and OUT_DIR/web_<view>.png for four views. Look at the screenshots:
// a file can validate cleanly and still look wrong.
const fs = require('fs'), path = require('path'), http = require('http');
const validator = require('gltf-validator');
const { chromium } = require('playwright');
const [glb, outDir] = process.argv.slice(2).map(p => path.resolve(p));
if (!glb || !outDir) { console.error('usage: node check.cjs MODEL.glb OUT_DIR'); process.exit(2); }
fs.mkdirSync(outDir, {recursive: true});
const types = {'.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary'};

(async () => {
  const v = await validator.validateBytes(new Uint8Array(fs.readFileSync(glb)), {maxIssues: 500});
  const codes = {};
  for (const m of v.issues.messages) { const k = ['error', 'warning', 'info', 'hint'][m.severity] + ' ' + m.code; codes[k] = (codes[k] || 0) + 1; }
  const report = {file: path.basename(glb), bytes: fs.statSync(glb).size,
    validator: {version: v.validatorVersion, errors: v.issues.numErrors, warnings: v.issues.numWarnings,
      infos: v.issues.numInfos, hints: v.issues.numHints, codes,
      drawCalls: v.info.drawCallCount, triangles: v.info.totalTriangleCount, vertices: v.info.totalVertexCount,
      extensionsUsed: v.info.extensionsUsed || []}};

  const srv = http.createServer((q, s) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    const f = u === '/model.glb' ? glb : path.join(__dirname, u);
    fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); } else { s.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'}); s.end(d); } });
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const page = await browser.newPage({viewport: {width: 1500, height: 900}, deviceScaleFactor: 1});
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  for (const view of ['three', 'top', 'back', 'body']) {
    await page.goto(`http://127.0.0.1:${srv.address().port}/viewer.html?view=${view}`);
    await page.waitForFunction('window.result !== undefined', null, {timeout: 120000});
    if (view === 'three') report.browser = await page.evaluate('window.result');
    await page.screenshot({path: path.join(outDir, `web_${view}.png`)});
  }
  report.browser_console_errors = errors;
  await browser.close(); srv.close();
  fs.writeFileSync(path.join(outDir, 'web_check.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.validator.errors || errors.length || !report.browser.loaded ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
