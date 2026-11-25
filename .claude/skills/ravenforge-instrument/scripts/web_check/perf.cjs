// Time a GLB under emulated device profiles: CPU slowdown, network limits, phone viewport.
//   node perf.cjs OUT_DIR MODEL.glb [MODEL2.glb ...]
// This is an emulation in headless Chromium with a SOFTWARE renderer. Download, parse and first-frame
// times under CPU and network limits are useful for comparing files. Frame times say nothing reliable
// about a phone's GPU: only a run on real devices can. Writes OUT_DIR/perf.json.
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const [outDir, ...glbs] = process.argv.slice(2).map(p => path.resolve(p));
if (!outDir || !glbs.length) { console.error('usage: node perf.cjs OUT_DIR MODEL.glb [...]'); process.exit(2); }
fs.mkdirSync(outDir, {recursive: true});
const profiles = {
  desktop:   {viewport: {width: 1500, height: 900}, dpr: 1, cpu: 1, net: null},
  mid_phone: {viewport: {width: 390, height: 844}, dpr: 3, cpu: 4, net: {down_mbps: 9, up_mbps: 9, latency_ms: 60}},
  low_phone: {viewport: {width: 360, height: 800}, dpr: 2, cpu: 6, net: {down_mbps: 1.6, up_mbps: 0.75, latency_ms: 150}},
};
const types = {'.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary'};
(async () => {
  let current = glbs[0];
  const srv = http.createServer((q, s) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    const f = u === '/model.glb' ? current : path.join(__dirname, u);
    fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); } else { s.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Content-Length': d.length}); s.end(d); } });
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info']});
  const report = {note: 'Emulated in headless Chromium with a software renderer. Not a measurement on real devices.', profiles, results: {}};
  for (const glb of glbs) {
    current = glb; const name = path.basename(glb); report.results[name] = {bytes: fs.statSync(glb).size};
    for (const [pn, p] of Object.entries(profiles)) {
      const ctx = await browser.newContext({viewport: p.viewport, deviceScaleFactor: p.dpr});
      const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
      // load an empty page first so the limits are in place before anything of ours is fetched
      await page.goto('about:blank');
      await cdp.send('Emulation.setCPUThrottlingRate', {rate: p.cpu});
      if (p.net) { await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', {offline: false, latency: p.net.latency_ms,
        downloadThroughput: p.net.down_mbps * 1e6 / 8, uploadThroughput: p.net.up_mbps * 1e6 / 8}); }
      await page.goto(`http://127.0.0.1:${srv.address().port}/perf.html`);
      await page.waitForFunction('window.result !== undefined', null, {timeout: 600000});
      const res = await page.evaluate('window.result');
      for (const k of Object.keys(res)) if (typeof res[k] === 'number' && k.endsWith('_ms')) res[k] = Math.round(res[k] * 10) / 10;
      report.results[name][pn] = res;
      console.log(name, pn, JSON.stringify({download: res.download_ms, parse: res.parse_ms, first: res.first_frame_ms, ready: res.ready_ms, draw: res.software_draw_ms_median, sw: res.switch_ms, texMB: res.texture_gpu_bytes_estimate && Math.round(res.texture_gpu_bytes_estimate / 1e5) / 10, heapMB: res.js_heap_bytes && Math.round(res.js_heap_bytes / 1e5) / 10, calls: res.info && res.info.calls}));
      await ctx.close();
    }
  }
  await browser.close(); srv.close();
  fs.writeFileSync(path.join(outDir, 'perf.json'), JSON.stringify(report, null, 2) + '\n');
})().catch(e => { console.error(e); process.exit(1); });
