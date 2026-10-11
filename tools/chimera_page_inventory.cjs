/* Render only the product copy and manual in a DOM; never load external resources.
 * This is a content/link contract, not a visual browser test. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const inventory = [];
for (const lang of ['en', 'ko', 'de']) {
  const home = new JSDOM(read('index.html'), {url: 'https://example.test/', runScripts: 'outside-only'});
  home.window.document.documentElement.lang = lang;
  home.window.eval(read('assets/chimera.js'));
  const product = home.window.document.querySelector('#chimera');
  if (!product) throw new Error('Missing Chimera product section');
  for (const node of product.querySelectorAll('[data-chimera-key], [data-chimera-alt]')) {
    const value = node.hasAttribute('data-chimera-alt') ? node.alt : node.textContent;
    if (!value || value === 'undefined') throw new Error(`${lang}: missing translation: ${node.outerHTML}`);
  }
  const manual = new JSDOM(read('manual/chimera.html'), {url: 'https://example.test/manual/chimera.html', runScripts: 'outside-only'});
  manual.window.localStorage.setItem('chimeraManualLang', lang);
  for (const script of manual.window.document.querySelectorAll('script:not([src])')) manual.window.eval(script.textContent);
  for (const [file, scope] of [['index.html', product], ['manual/chimera.html', manual.window.document]]) {
    const links = [...scope.querySelectorAll('[href], img[src]')].map(node => ({
      url: node.getAttribute(node.tagName === 'IMG' ? 'src' : 'href'),
      image: node.tagName === 'IMG', alt: node.tagName === 'IMG' ? node.alt : undefined
    }));
    inventory.push({file, lang, links, text: scope.textContent,
      presets: file.startsWith('manual') ? scope.querySelectorAll('#presetTable tbody tr').length : undefined,
      stats: file === 'index.html' ? [...scope.querySelectorAll('.rf-chimera-stats dd')].map(n => Number(n.textContent)) : undefined,
      models: file.startsWith('manual') ? Object.fromEntries(['preModels', 'ampModels', 'postModels'].map(id => [id, scope.querySelectorAll(`#${id} .model-card`).length])) : undefined});
  }
  home.window.close(); manual.window.close();
}
process.stdout.write(JSON.stringify(inventory));
