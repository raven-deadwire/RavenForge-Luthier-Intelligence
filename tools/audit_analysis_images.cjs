#!/usr/bin/env node
// Check that every hotlinked Analysis card/modal image still loads.
// Usage: node tools/audit_analysis_images.cjs [report.json]
// A shot counts as broken when neither src nor fallback returns a decodable
// image of at least 40px (hotlink blockers often answer 200 with a 1x1 GIF).
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function shots() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(read('assets/analysis-media-data.js'), ctx);
  const extra = ctx.window.RF_ANALYSIS_EXTRA_MEDIA;
  const src = read('assets/analysis-media.js');
  const start = src.indexOf('const media=') + 'const media='.length;
  const base = vm.runInNewContext('(' + src.slice(start, src.indexOf('\n};', start) + 2) + ')');
  const out = [];
  for (const [name, m] of Object.entries({ ...base, ...extra })) {
    const file = extra[name] ? 'assets/analysis-media-data.js' : 'assets/analysis-media.js';
    m.shots.forEach((s, i) => out.push({ name, index: i, label: s.label, file, src: s.src, fallback: s.fallback || null, embed: s.embed || null, source: m.source }));
  }
  return out;
}

// Width/height from the first bytes of PNG, GIF, JPEG and WebP files.
function size(b) {
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.length > 10 && b.toString('ascii', 0, 3) === 'GIF') return [b.readUInt16LE(6), b.readUInt16LE(8)];
  if (b.length > 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (kind === 'VP8L') { const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; }
    if (kind === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  }
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i + 9 < b.length;) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

async function check(url) {
  if (!/^https?:/.test(url)) return fs.existsSync(path.join(ROOT, url.split('?')[0])) ? { ok: true, status: 'local' } : { ok: false, status: 'missing local file' };
  try {
    // Browsers send these images with referrerpolicy="no-referrer".
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(25000), headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' } });
    const type = res.headers.get('content-type') || '';
    const body = Buffer.from(await res.arrayBuffer());
    const dim = size(body);
    const ok = res.ok && (type.startsWith('image/') || dim) && (!dim || dim[0] >= 40 || dim[1] >= 40) && body.length > 500;
    return { ok: !!ok, status: res.status, type, bytes: body.length, dim, finalUrl: res.url !== url ? res.url : undefined };
  } catch (e) {
    return { ok: false, status: e.name === 'TimeoutError' ? 'timeout' : String(e.cause?.code || e.message) };
  }
}

module.exports = { check, size };
if (require.main !== module) return;

(async () => {
  const list = shots();
  const results = [];
  for (let i = 0; i < list.length; i += 8) {
    results.push(...await Promise.all(list.slice(i, i + 8).map(async s => {
      const primary = await check(s.src);
      const fallback = s.fallback ? await check(s.fallback) : null;
      return { ...s, primary, fallbackResult: fallback, broken: !primary.ok && !(fallback && fallback.ok) };
    })));
  }
  const broken = results.filter(r => r.broken);
  const primaryOnly = results.filter(r => !r.broken && !r.primary.ok);
  for (const r of broken) console.log(`BROKEN  ${r.name} #${r.index + 1} ${r.label} [${r.file}] src=${JSON.stringify(r.primary)} ${r.fallback ? 'fallback=' + JSON.stringify(r.fallbackResult) : ''}\n        ${r.src}`);
  for (const r of primaryOnly) console.log(`FALLBACK ${r.name} #${r.index + 1} ${r.label}: src failed ${JSON.stringify(r.primary)}`);
  console.log(`\n${results.length} shots, ${broken.length} broken, ${primaryOnly.length} served by fallback.`);
  if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(results, null, 1));
})();
