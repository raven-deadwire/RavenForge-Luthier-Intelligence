import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const root = path.resolve('research');
const langs = ['ko', 'en', 'de'];
const site = 'https://raven-deadwire.github.io/RavenForge-Luthier-Intelligence';

for (const name of fs.readdirSync(root)) {
  const dir = path.join(root, name);
  const partsDir = path.join(dir, 'article-parts');
  if (!fs.existsSync(partsDir) || !fs.statSync(partsDir).isDirectory()) continue;

  const partFiles = fs.readdirSync(partsDir).filter(x => /^part-\d+\.txt$/.test(x)).sort();
  if (!partFiles.length) continue;
  let source = partFiles.map(file => fs.readFileSync(path.join(partsDir, file), 'utf8')).join('');
  const refs = path.join(dir, 'references-fragment.html');
  if (fs.existsSync(refs)) {
    source = source.replace('</main></body></html>', `${fs.readFileSync(refs, 'utf8')}</main></body></html>`);
  }
  const metaPath = path.join(dir, 'meta.json');
  const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : null;

  for (const lang of langs) {
    const url = `${site}/research/${name}/${lang}.html`;
    const dom = new JSDOM(source, {
      runScripts: 'dangerously',
      url: `${site}/research/${name}/article.html?lang=${lang}`,
      pretendToBeVisual: true
    });
    await new Promise(resolve => setTimeout(resolve, 30));
    const doc = dom.window.document;
    doc.documentElement.lang = lang;
    doc.querySelectorAll('script').forEach(node => node.remove());

    const links = doc.querySelector('.langs');
    if (links) {
      links.innerHTML = langs.map(code => `<a href="${code}.html" hreflang="${code}"${code === lang ? ' aria-current="page"' : ''}>${code.toUpperCase()}</a>`).join(' ');
      const style = doc.createElement('style');
      style.textContent = '.langs a{display:inline-block;border:1px solid #b8c7d6;background:#fff;border-radius:6px;padding:6px 9px;margin-left:5px;color:inherit;text-decoration:none}.langs a[aria-current="page"]{background:#eef5fb;font-weight:700}';
      doc.head.append(style);
    }

    const localized = meta?.[lang] || meta?.en || {};
    const title = localized.title || doc.title;
    if (title) doc.title = `${title} · RavenForge`;
    const description = localized.excerpt || 'RavenForge research log.';
    const descriptionMeta = doc.createElement('meta');
    descriptionMeta.name = 'description';
    descriptionMeta.content = description;
    doc.head.append(descriptionMeta);
    const canonical = doc.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = url;
    doc.head.append(canonical);
    for (const code of langs) {
      const alt = doc.createElement('link');
      alt.rel = 'alternate';
      alt.hreflang = code;
      alt.href = `${site}/research/${name}/${code}.html`;
      doc.head.append(alt);
    }
    const xdefault = doc.createElement('link');
    xdefault.rel = 'alternate';
    xdefault.hreflang = 'x-default';
    xdefault.href = `${site}/research/${name}/en.html`;
    doc.head.append(xdefault);

    fs.writeFileSync(path.join(dir, `${lang}.html`), `<!doctype html>\n${doc.documentElement.outerHTML}\n`, 'utf8');
    dom.window.close();
  }

  fs.writeFileSync(path.join(dir, 'article.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name} · RavenForge Research</title><meta http-equiv="refresh" content="0;url=en.html"><link rel="canonical" href="${site}/research/${name}/en.html"></head><body><p><a href="en.html">English</a> · <a href="ko.html">한국어</a> · <a href="de.html">Deutsch</a></p></body></html>\n`, 'utf8');
  console.log(`Built static Research pages for ${name}`);
}
