/* Render only the product copy and manual in a DOM; never load external resources.
 * This is a content/link contract, not a visual browser test. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function validateProductContent(product, lang) {
  if (!product) throw new Error(`${lang}: Missing Chimera product section`);
  const require = (condition, message) => {
    if (!condition) throw new Error(`${lang}: ${message}`);
  };
  const one = (scope, selector) => {
    const nodes = scope.querySelectorAll(selector);
    require(nodes.length === 1, `Expected one required product element: ${selector}`);
    return nodes[0];
  };
  const copy = (scope, key) => one(scope, `[data-chimera-key="${key}"]`);
  for (const node of product.querySelectorAll('[data-chimera-key], [data-chimera-alt]')) {
    const value = (node.hasAttribute('data-chimera-alt') ? node.alt : node.textContent).trim();
    require(value && value !== 'undefined', `missing translation: ${node.outerHTML}`);
  }

  // Required sections must be asserted explicitly: scanning surviving nodes
  // alone allowed the entire AMP / RIGS showcase to disappear unnoticed.
  const rigs = one(product, '#chimera-rigs');
  for (const key of ['rigsTitle', 'rigsIntro', 'rigsControlsTitle', 'rigsControls',
                     'rigsPresetsTitle', 'rigsPresets']) copy(rigs, key);
  require(rigs.querySelectorAll('.rf-chimera-modes > article').length === 3,
          'AMP / RIGS requires three mode cards');
  for (const mode of ['Classic', 'Dual', 'Matrix']) {
    const name = mode.toLowerCase();
    copy(one(rigs, '.rf-chimera-modes'), name);
    const image = one(rigs, `img[data-chimera-alt="rigs${mode}Alt"]`);
    const source = `assets/chimera/rigs-${name}-beta13.png`;
    require(image.getAttribute('src') === source, `${mode} AMP / RIGS screenshot is missing or replaced`);
    const figure = image.closest('figure');
    require(figure && rigs.contains(figure), `${mode} AMP / RIGS screenshot requires a figure`);
    copy(figure, `rigs${mode}Caption`);
    require(image.closest('a')?.getAttribute('href') === source,
            `${mode} AMP / RIGS screenshot must link to its full-size image`);
  }

  for (const [id, prefix, title, intro, channels] of [
    ['chimera-niflheimr', 'niflheimr', 'niflheimrTitle', 'niflheimrBody',
     ['Hrimfaxi', 'Garmr', 'Nidavellir', 'Ymir', 'Hel']],
    ['chimera-nastrond', 'nastrond', 'newTitle', 'newBody',
     ['Fenrir', 'Surtr', 'Nidhoggr', 'Fimbulvetr', 'Ragnarok']]
  ]) {
    const amp = one(product, `#${id}.rf-chimera-original`);
    copy(amp, title); copy(amp, intro);
    const artwork = one(amp, 'figure.rf-chimera-nastrond');
    const image = one(artwork, `img[data-chimera-alt="${prefix}Alt"][src]`);
    require(image.getAttribute('src').trim() &&
            image.closest('a')?.getAttribute('href') === image.getAttribute('src'),
            `${id} requires head artwork linked to its full-size image`);
    copy(artwork, `${prefix}Caption`);
    const channelCards = one(amp, '.rf-chimera-nastrond-channels');
    require(channelCards.querySelectorAll(':scope > article').length === 5,
            `${id} requires five channel cards`);
    for (const channel of channels) {
      const description = copy(channelCards, prefix + channel);
      require(description.closest('article')?.querySelector('h4')?.textContent.trim(),
              `${id} requires a channel name for ${channel}`);
    }
    const features = one(amp, '.rf-chimera-nastrond-features');
    require(features.querySelectorAll(':scope > article').length === 2,
            `${id} requires control and signature-rig explanations`);
    for (const feature of ['Shape', 'Rigs']) {
      const description = copy(features, prefix + feature);
      const article = description.closest('article');
      require(article && features.contains(article), `${id} requires a ${feature} article`);
      copy(article, prefix + feature + 'Title');
    }
    const manual = copy(amp, prefix + 'Manual');
    require(manual.tagName === 'A' && manual.getAttribute('href') === 'manual/chimera.html#amps',
            `${id} requires its amp manual link`);
  }
}

function collectInventory() {
  const inventory = [];
  for (const lang of ['en', 'ko', 'de']) {
    const home = new JSDOM(read('index.html'), {url: 'https://example.test/', runScripts: 'outside-only'});
    home.window.document.documentElement.lang = lang;
    home.window.eval(read('assets/chimera.js'));
    const product = home.window.document.querySelector('#chimera');
    validateProductContent(product, lang);
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
  return inventory;
}

module.exports = { validateProductContent };
if (require.main === module) process.stdout.write(JSON.stringify(collectInventory()));
