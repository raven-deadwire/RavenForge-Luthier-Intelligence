#!/usr/bin/env node
// List usable images on given pages, to pick replacements for dead Analysis hotlinks.
// Usage: node tools/find_image_candidates.cjs pages.json [report.json]
//   pages.json: { "Maker #shot": ["https://page", ...], ... }
// Prints og:image / twitter:image first, then <img> sources, each checked with
// the same rules as audit_analysis_images.cjs.
const fs = require('node:fs');
const { check } = require('./audit_analysis_images.cjs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const decode = s => s.replace(/&amp;/g, '&').replace(/&#0?38;/g, '&').replace(/&quot;/g, '"');

async function imagesOn(page) {
  const res = await fetch(page, { redirect: 'follow', signal: AbortSignal.timeout(25000), headers: { 'User-Agent': UA, Accept: 'text/html,*/*' } });
  const html = await res.text();
  const abs = u => { try { return new URL(decode(u.trim()), res.url).href; } catch { return null; } };
  const meta = [...html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*>/gi)]
    .map(m => (m[0].match(/content=["']([^"']+)["']/i) || [])[1]).filter(Boolean);
  const imgs = [];
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const srcset = (tag.match(/\s(?:data-)?srcset=["']([^"']+)["']/i) || [])[1];
    const largest = srcset ? srcset.split(',').map(x => x.trim().split(/\s+/)).sort((a, b) => parseInt(b[1] || 0) - parseInt(a[1] || 0))[0][0] : null;
    const src = largest || (tag.match(/\s(?:data-(?:lazy-)?src|src)=["']([^"']+)["']/i) || [])[1];
    if (src && !src.startsWith('data:')) imgs.push(src);
  }
  const urls = [...new Set([...meta, ...imgs].map(abs).filter(u => u && /^https?:/.test(u) && !/\.svg(\?|$)|logo|icon|avatar|sprite|pixel|gravatar|emoji/i.test(u)))];
  return { status: res.status, finalUrl: res.url, meta: meta.map(abs), urls: urls.slice(0, 14) };
}

(async () => {
  const pages = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const report = {};
  for (const [key, list] of Object.entries(pages)) {
    report[key] = [];
    for (const page of list) {
      let found;
      try { found = await imagesOn(page); } catch (e) { console.log(`\n## ${key}\n   PAGE FAILED ${page}: ${e.cause?.code || e.message}`); continue; }
      console.log(`\n## ${key}\n   page ${found.status} ${page}`);
      for (const url of found.urls) {
        const r = await check(url);
        report[key].push({ page, url, og: found.meta.includes(url), ...r });
        if (r.ok) console.log(`   OK ${r.dim ? r.dim.join('x') : '?'} ${r.bytes}B ${found.meta.includes(url) ? '[og] ' : ''}${url}`);
      }
    }
  }
  if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(report, null, 1));
})();
