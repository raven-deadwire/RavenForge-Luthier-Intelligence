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
    copy(one(rigs, '.rf-chimera-modes'), mode.toLowerCase());
  }
  const hero = one(product, '.rf-chimera-preview');
  const gallery = one(rigs, '.rf-chimera-rigs-gallery');
  require(gallery.querySelectorAll('figure').length === 2,
          'AMP / RIGS requires exactly two screenshots: Classic and Dual');
  for (const [scope, alt, caption, file, label] of [
    [hero, 'screenAlt', 'screen', 'rigs-matrix-crom-cruach-beta131.png', 'Matrix hero'],
    [gallery, 'rigsClassicAlt', 'rigsClassicCaption', 'rigs-classic-crunch-beta131.png', 'Classic'],
    [gallery, 'rigsDualAlt', 'rigsDualCaption', 'rigs-dual-wrath-beta131.png', 'Dual']
  ]) {
    const image = one(scope, `img[data-chimera-alt="${alt}"]`);
    const source = `assets/chimera/${file}`;
    require(image.getAttribute('src') === source, `${label} screenshot is missing or replaced`);
    const figure = image.closest('figure');
    require(figure && scope.contains(figure), `${label} screenshot requires a figure`);
    copy(figure, caption);
    require(image.closest('a')?.getAttribute('href') === source,
            `${label} screenshot must link to its full-size image`);
  }

  const editing = one(product, '#chimera-editing');
  for (const key of ['editTitle', 'editIntro', 'headTitle', 'headBody',
                     'knobTitle', 'knobBody', 'signalTitle', 'signalBody',
                     'eqTitle', 'eqBody']) copy(editing, key);
  require(editing.querySelectorAll('.rf-chimera-nastrond-features > article').length === 4,
          'Direct editing requires head, knob, signal-path and EQ explanations');
  const heads = one(editing, '.rf-chimera-head-gallery');
  require(heads.querySelectorAll('figure').length === 2,
          'Direct editing requires native Brit Edge and Niflheimr screenshots');
  for (const [key, file] of [['headBrit', 'head-brit-edge-beta131.png'],
                            ['headNif', 'head-niflheimr-beta131.png']]) {
    const image = one(heads, `img[data-chimera-alt="${key}Alt"]`);
    require(image.getAttribute('src') === `assets/chimera/${file}` &&
            image.closest('a')?.getAttribute('href') === image.getAttribute('src'),
            'Native head screenshot must link to its original image');
    copy(image.closest('figure'), `${key}Caption`);
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
            `${id} requires its native control image linked at full size`);
    require(image.getAttribute('src') === `assets/chimera/head-${prefix}-beta131.png`,
            `${id} requires the revised native head controls`);
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
    for (const id of ['headControlBody', 'signalNavigationBody', 'graphicalEQBody']) {
      if (!manual.window.document.getElementById(id)?.textContent.trim()) {
        throw new Error(`${lang}: Missing direct editing manual content: ${id}`);
      }
    }
    const downloadLink = manual.window.document.getElementById('productDownloadLink');
    if (downloadLink?.getAttribute('href') !== '../index.html#chimera' || !downloadLink.textContent.trim()) {
      throw new Error(`${lang}: Manual update guidance needs the product download link`);
    }
    const ampImages = [...manual.window.document.querySelectorAll('#ampModels img')];
    if (ampImages.length !== 25 || ampImages.some(image =>
        !/^https:\/\/raw\.githubusercontent\.com\/raven-deadwire\/SpectralForge-Chimera-Amp-Matrix\/[a-f0-9]{40}\/Assets\/Artwork\/HeadShells\/head-shell-\d{2}\.png$/.test(image.getAttribute('src')))) {
      throw new Error(`${lang}: All 25 active manual amps require the complete production enclosure artwork`);
    }
    for (const image of manual.window.document.querySelectorAll('.workflow-asset img')) {
      if (/\/Assets\/Artwork\/a[^/]+\.(png|jpg)$/.test(image.getAttribute('src'))) {
        throw new Error(`${lang}: A workflow still displays superseded amp artwork`);
      }
    }
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
