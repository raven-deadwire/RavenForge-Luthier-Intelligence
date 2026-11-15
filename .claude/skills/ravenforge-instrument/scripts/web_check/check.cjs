// Validate a GLB and load it in a headless browser with three.js.
//   npm install            (once, in this directory; Playwright with Chromium must also be available)
//   node check.cjs MODEL.glb OUT_DIR
// Writes OUT_DIR/web_check.json and OUT_DIR/web_<view>.png for four views. If the file carries finish
// variants (KHR_materials_variants) it also switches through each one, in three.js and again in
// Google's <model-viewer>, and writes web_variant_*.png, web_variants_sheet.png and web_mv_*.png.
// Look at the screenshots: a file can validate cleanly and still look wrong.
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
  // --- finish variants
  const names = report.browser.variants || [];
  if (names.length) {
    const slug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const shots = [], pixels = {};
    const base = await page.goto(`http://127.0.0.1:${srv.address().port}/viewer.html?view=three`).then(async () => {
      await page.waitForFunction('window.result !== undefined', null, {timeout: 120000});
      return {res: await page.evaluate('window.result'), png: await page.screenshot()};
    });
    let sameAsDefault = null;
    for (const [i, n] of names.entries()) {
      await page.goto(`http://127.0.0.1:${srv.address().port}/viewer.html?view=three&variant=${encodeURIComponent(n)}`);
      await page.waitForFunction('window.result !== undefined', null, {timeout: 120000});
      const res = await page.evaluate('window.result');
      const file = path.join(outDir, `web_variant_${String(i + 1).padStart(2, '0')}_${slug(n)}.png`);
      await page.screenshot({path: file});
      shots.push({name: n, file}); pixels[n] = res.bodyPixel;
      // Compare the sampled colour, not the PNG bytes: software rendering is not bit-stable between loads.
      if (n === base.res.defaultFinish) sameAsDefault = res.bodyPixel.join(',') === base.res.bodyPixel.join(',');
      if (i === 0) report.variant_meshes_swapped = res.swapped;
    }
    report.variants = {names, default: base.res.defaultFinish, default_body_pixel: base.res.bodyPixel,
      body_pixel_by_variant: pixels,
      distinct_body_colours: new Set(Object.values(pixels).map(p => p.join(','))).size,
      default_body_colour_equals_its_named_variant: sameAsDefault};
    // contact sheet
    const cols = 4, w = 500, h = 300, rows = Math.ceil(shots.length / cols);
    const cells = shots.map(s => `<figure><img src="data:image/png;base64,${fs.readFileSync(s.file).toString('base64')}"><figcaption>${s.name}</figcaption></figure>`).join('');
    await page.setViewportSize({width: cols * w, height: rows * (h + 34)});
    await page.setContent(`<style>body{margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},${w}px)}figure{margin:0;overflow:hidden;height:${h + 34}px}img{width:${w * 1.9}px;margin:-${h * 0.42}px 0 -${h * 0.5}px -${w * 0.45}px;display:block}figcaption{font:16px sans-serif;color:#ddd;padding:6px 10px;position:relative;background:#111}</style>${cells}`);
    await page.screenshot({path: path.join(outDir, 'web_variants_sheet.png')});
    await page.setViewportSize({width: 1500, height: 900});
    // second implementation: <model-viewer>
    try {
      const mv = {};
      for (const n of [names[0], names[Math.min(2, names.length - 1)], names[names.length - 1]]) {
        await page.goto(`http://127.0.0.1:${srv.address().port}/model_viewer.html?variant=${encodeURIComponent(n)}`);
        await page.waitForFunction('window.result !== undefined', null, {timeout: 180000});
        const res = await page.evaluate('window.result');
        mv.availableVariants = res.availableVariants; mv.loaded = res.loaded;
        (mv.selected = mv.selected || []).push({asked: n, got: res.variantName});
        await page.screenshot({path: path.join(outDir, `web_mv_${slug(n)}.png`)});
      }
      mv.lists_same_variants = JSON.stringify(mv.availableVariants) === JSON.stringify(names);
      report.model_viewer = mv;
    } catch (e) { report.model_viewer = {loaded: false, error: String(e).slice(0, 300)}; }
  }
  report.browser_console_errors = errors;
  await browser.close(); srv.close();
  fs.writeFileSync(path.join(outDir, 'web_check.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.validator.errors || errors.length || !report.browser.loaded ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
