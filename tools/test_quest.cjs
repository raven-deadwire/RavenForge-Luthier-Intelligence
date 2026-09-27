/* Regression tests: local assets only; external resources and Chart are stubbed. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://raven-deadwire.github.io/RavenForge-Luthier-Intelligence/';
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
execFileSync('python', ['tools/build_quest.py'], { cwd: ROOT });
assert.equal(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), html, 'Quest build must be idempotent');
execFileSync('node', ['--check', 'assets/quest-roadmap.js'], { cwd: ROOT });
const renderer = require('../assets/quest-roadmap.js');
const staticDOM = new JSDOM(html);
const data = JSON.parse(staticDOM.window.document.querySelector('#rf-quest-data').textContent);
for (const lang of ['ko', 'en', 'de']) {
  const dom = new JSDOM(renderer.markup(data, lang)), d = dom.window.document;
  assert.equal(d.querySelectorAll('details').length, 6);
  assert.equal(d.querySelectorAll('.rf-q-drawing').length, 6, 'native topic diagrams');
  assert.equal(d.querySelectorAll('.rf-q-atlas [data-quest-target]').length, 6, 'visual navigator');
  assert.equal(d.querySelectorAll('[data-quest-map]').length, 6, 'research-map selectors');
  assert.equal(d.querySelectorAll('.rf-q-visual-legend>span').length, 18, 'localized diagram keys');
  assert.ok(d.querySelector('.rf-q-loop-back'), 'iteration loop');
  assert.equal(d.querySelectorAll('#rf-q-map-body [data-map-source]').length, 5);
  for (const svg of d.querySelectorAll('.rf-q-drawing')) {
    assert.equal(svg.getAttribute('viewBox'), '0 0 600 200');
    assert.equal(svg.getAttribute('aria-hidden'), 'true');
    assert.equal(svg.querySelectorAll('image').length, 0, 'no raster infographic');
  }
  const ergonomic = d.querySelector('#quest-ergonomics .rf-q-drawing');
  const narrative = d.querySelector('#quest-narrative .rf-q-drawing');
  assert.equal(ergonomic.querySelectorAll('[data-reference-model="EMBLA"]').length, 1);
  assert.equal(ergonomic.querySelectorAll('.qv-reference-string').length, 5, 'continuous five-string reference');
  assert.deepEqual([...narrative.querySelectorAll('[data-reference-model]')].map(n => n.dataset.referenceModel), ['EMBLA','ASKR','EDDA']);
  assert.equal(d.querySelectorAll('.rf-q-reference-note').length, 2, 'localized source/scale notes');
  for (const n of d.querySelectorAll('[data-source-artwork]')) assert.ok(fs.existsSync(path.join(ROOT, n.dataset.sourceArtwork)));
  assert.equal(ergonomic.querySelector('[data-reference-model="EMBLA"] path').getAttribute('d'), narrative.querySelector('[data-reference-model="EMBLA"] path').getAttribute('d'), 'EMBLA is the same reference contour in both topics');
  assert.ok(!narrative.innerHTML.includes('M302 28c-34'), 'remove invented body');
  assert.ok(!ergonomic.innerHTML.includes('M207 116l92'), 'remove invented instrument');
  assert.equal(d.querySelector('.rf-q-shell').lang, lang);
  const ids = [...d.querySelectorAll('[id]')].map(n => n.id);
  assert.equal(ids.length, new Set(ids).size, 'duplicate IDs');
  for (const a of d.querySelectorAll('.rf-q-sources a')) {
    assert.ok(a.getAttribute('href').endsWith('/' + lang + '.html'));
    assert.ok(fs.existsSync(path.join(ROOT, a.getAttribute('href'))));
  }
  for (const card of d.querySelectorAll('details')) {
    assert.equal(card.querySelectorAll('.rf-q-checks li').length, 3);
    assert.equal(card.querySelectorAll('.rf-q-decision').length, 1);
    assert.ok(d.getElementById(card.querySelector('summary').getAttribute('aria-controls')));
  }
  dom.window.close();
}
assert.equal(staticDOM.window.document.querySelectorAll('#quest details').length, 6, 'static fallback');
assert.ok(staticDOM.window.document.querySelector('footer').classList.contains('rf-site-footer'), 'global footer selector');
assert.ok(!html.includes('function applyAccordionState()'));
assert.ok(!html.includes('translations.ko.proposalsData = ['));
staticDOM.window.close();
class LocalResources extends ResourceLoader {
  fetch(url) {
    if (!url.startsWith(ORIGIN)) return null;
    const file = localPath(url);
    return file ? Promise.resolve(fs.readFileSync(file)) : null;
  }
}
function localPath(url) {
  const u = new URL(String(url), ORIGIN);
  if (!u.href.startsWith(ORIGIN)) return null;
  const file = path.resolve(ROOT, decodeURIComponent(u.pathname.replace('/RavenForge-Luthier-Intelligence/', '')));
  return file.startsWith(ROOT + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(predicate, diagnostics) {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(diagnostics());
    await delay(30);
  }
}
async function integration(url, brokenStorage = false) {
  const errors = [], teardownWarnings = [];
  let closing = false;
  const console = new VirtualConsole();
  console.on('jsdomError', e => { if (e.type !== 'css parsing') (closing ? teardownWarnings : errors).push(e.detail?.stack || e.message); });
  const dom = new JSDOM(html, {
    url, runScripts: 'dangerously', resources: new LocalResources(), pretendToBeVisual: true, virtualConsole: console,
    beforeParse(w) {
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = () => {};
      w.HTMLCanvasElement.prototype.getContext = function () { return { canvas: this }; };
      w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
      class Chart {
        static instances = new Map(); static defaults = {}; static register() {}
        static getChart(canvas) { return Chart.instances.get(canvas); }
        constructor(ctx, config) { this.canvas = ctx.canvas; this.data = config.data; this.options = config.options; this.config = config; Chart.instances.set(this.canvas, this); }
        update() {} resize() {} destroy() { Chart.instances.delete(this.canvas); }
      }
      w.Chart = Chart;
      w.fetch = async value => { const file = localPath(value); return file ? new Response(fs.readFileSync(file)) : new Response('', { status: 404 }); };
      if (brokenStorage) w.sessionStorage.setItem('rf.quest.open.v1', 'invalid json');
    }
  });
  await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
  await delay(500);
  const w = dom.window, d = w.document;
  const diagnostics = () => JSON.stringify({ href: w.location.href, active: [...d.querySelectorAll('.page-section.active')].map(n => n.id), errors });
  assert.ok(d.querySelector('#quest.active'));
  assert.equal(d.querySelectorAll('#quest details').length, 6);
  const linkedQuest = new URL(url).searchParams.get('quest');
  if (linkedQuest) assert.ok(d.getElementById('quest-' + linkedQuest).open, 'initial deep link opens its card');
  for (const [lang, button] of [['ko', 'kr'], ['en', 'en'], ['de', 'de']]) {
    d.querySelector('#lang-' + button + '-btn').click();
    await delay(30);
    assert.equal(d.querySelector('#quest .rf-q-shell').lang, lang);
    d.querySelector('#quest-neck').open = true;
  }
  for (const quest of data.quests) {
    const btn = d.querySelector(`[data-quest-map="${quest.id}"]`);
    btn.click();
    assert.equal(btn.getAttribute('aria-pressed'), 'true');
    assert.equal(d.querySelectorAll('[data-quest-map][aria-pressed="true"]').length, 1);
    assert.equal(d.querySelectorAll('#rf-q-map-body [data-map-source]').length, quest.references.length);
    assert.equal(d.querySelectorAll('#rf-q-map-body [data-quest-model]').length, quest.models.length);
    for (const a of d.querySelectorAll('#rf-q-map-body [data-map-source]')) assert.ok(a.getAttribute('href').endsWith('/de.html'));
  }
  d.querySelector('[data-quest-map="narrative"]').click();
  d.querySelector('#lang-kr-btn').click(); await delay(30);
  assert.equal(d.querySelector('[data-quest-map="narrative"]').getAttribute('aria-pressed'), 'true', 'map selection follows language');
  assert.equal(d.querySelectorAll('#rf-q-map-body [data-quest-model]').length, 5);
  for (const a of d.querySelectorAll('#rf-q-map-body [data-map-source]')) assert.ok(a.getAttribute('href').endsWith('/ko.html'));
  assert.ok(d.querySelector('#quest-neck').open, 'language preserves state');
  d.querySelector('#quest-neck [data-quest-target="neck"]').click();
  assert.equal(new URL(w.location.href).searchParams.get('quest'), 'neck');
  d.querySelector('#quest-neck [data-quest-model="EDDA"]').click();
  assert.ok(d.querySelector('#Prototype.active'));
  assert.ok(d.querySelector('#btn-spec-edda.active'));
  w.history.back();
  await waitFor(() => w.location.hash === '#quest' && d.querySelector('#quest.active'), diagnostics);
  assert.ok(d.querySelector('#quest-neck').open);
  d.querySelector('#quest-neck [data-quest-builder="Marleaux Basses"]').click();
  assert.ok(d.querySelector('#analysis.active'));
  assert.ok(d.querySelector('#modal-title').textContent.includes('Marleaux'));
  d.querySelector('#modal-close').click(); await delay(350);
  for (const id of ['about', 'concept', 'chimera', 'research', 'configurator', 'quest']) {
    d.querySelector('header .nav-link[href="#' + id + '"]').click();
    assert.ok(d.querySelector('#' + id + '.active'), id + ' remains navigable');
  }
  assert.ok(d.querySelector('footer').classList.contains('rf-site-footer'));
  assert.ok(d.querySelector('#quest .rf-q-revision time'), 'revision survives global footer code');
  assert.deepEqual(errors, [], 'No script errors during the tested interaction flow');
  closing = true; dom.window.close(); await delay(20);
  return { runtimeErrors: errors, teardownWarnings };
}
(async () => {
  const first = await integration(ORIGIN + '#quest');
  const second = await integration(ORIGIN + '?quest=electronics#quest', true);
  console.log(JSON.stringify({ pass: true, nativeDiagrams: 6, visualNavigator: true, interactiveResearchMap: true, mapLanguageState: true, languages: 3, quests: 6, uniqueSources: Object.keys(data.sources).length, staticFallback: true, idempotent: true, state: true, deepLinks: true, history: true, modelNavigation: true, builderModal: true, otherNavigation: true, corruptStorage: true, runtimeErrors: [...first.runtimeErrors, ...second.runtimeErrors], teardownWarnings: [...new Set([...first.teardownWarnings, ...second.teardownWarnings])], scope: 'Full local site scripts in JSDOM; Chart/canvas are stubs and external network is disabled. Layout is checked separately in Chromium.' }, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
