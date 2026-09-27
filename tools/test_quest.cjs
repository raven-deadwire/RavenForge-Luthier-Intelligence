/* Regression tests: local assets only; no third-party network or real DSP. */
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
  const d = new JSDOM(renderer.markup(data, lang)).window.document;
  assert.equal(d.querySelectorAll('details').length, 6);
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
    const summary = card.querySelector('summary');
    assert.ok(d.getElementById(summary.getAttribute('aria-controls')));
  }
}
assert.equal(staticDOM.window.document.querySelectorAll('#quest details').length, 6, 'static fallback');
assert.ok(!html.includes('function applyAccordionState()'), 'legacy index-based persistence removed');
assert.ok(!html.includes('translations.ko.proposalsData = ['), 'obsolete final copy removed');
staticDOM.window.close();
class LocalResources extends ResourceLoader {
  fetch(url) {
    if (!url.startsWith(ORIGIN)) return null;
    const relative = decodeURIComponent(new URL(url).pathname.replace('/RavenForge-Luthier-Intelligence/', ''));
    const file = path.resolve(ROOT, relative);
    if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
    return Promise.resolve(fs.readFileSync(file));
  }
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
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
      w.fetch = async value => {
        const u = new URL(String(value), ORIGIN);
        if (!u.href.startsWith(ORIGIN)) return new Response('', { status: 404 });
        const file = path.resolve(ROOT, decodeURIComponent(u.pathname.replace('/RavenForge-Luthier-Intelligence/', '')));
        return file.startsWith(ROOT + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile() ? new Response(fs.readFileSync(file)) : new Response('', { status: 404 });
      };
      if (brokenStorage) w.sessionStorage.setItem('rf.quest.open.v1', 'invalid json');
    }
  });
  await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
  await delay(500);
  const w = dom.window, d = w.document;
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
  d.querySelector('#lang-kr-btn').click(); await delay(30);
  assert.ok(d.querySelector('#quest-neck').open, 'open state survives translation');
  d.querySelector('#quest-neck [data-quest-target="neck"]').click();
  assert.equal(new URL(w.location.href).searchParams.get('quest'), 'neck');
  d.querySelector('#quest-neck [data-quest-model="EDDA"]').click();
  assert.ok(d.querySelector('#Prototype.active'));
  assert.ok(d.querySelector('#btn-spec-edda.active'));
  w.history.back(); await delay(70);
  assert.ok(d.querySelector('#quest.active'));
  assert.ok(d.querySelector('#quest-neck').open);
  d.querySelector('#quest-neck [data-quest-builder="Marleaux Basses"]').click();
  assert.ok(d.querySelector('#analysis.active'));
  assert.ok(d.querySelector('#modal-title').textContent.includes('Marleaux'));
  d.querySelector('#modal-close').click(); await delay(350);
  for (const id of ['about', 'concept', 'chimera', 'research', 'configurator', 'quest']) {
    d.querySelector('header .nav-link[href="#' + id + '"]').click();
    assert.ok(d.querySelector('#' + id + '.active'), id + ' remains navigable');
  }
  assert.deepEqual(errors, [], 'No script errors during the tested interaction flow');
  closing = true;
  dom.window.close();
  await delay(20);
  return { runtimeErrors: errors, teardownWarnings };
}
(async () => {
  const first = await integration(ORIGIN + '#quest');
  const second = await integration(ORIGIN + '?quest=electronics#quest', true);
  console.log(JSON.stringify({ pass: true, languages: 3, quests: 6, uniqueSources: Object.keys(data.sources).length, staticFallback: true, idempotent: true, state: true, deepLinks: true, history: true, modelNavigation: true, builderModal: true, otherNavigation: true, corruptStorage: true, runtimeErrors: [...first.runtimeErrors, ...second.runtimeErrors], teardownWarnings: [...new Set([...first.teardownWarnings, ...second.teardownWarnings])], scope: 'Full local site scripts in JSDOM; Chart/canvas are stubs and external network is disabled. Layout is checked separately in Chromium.' }, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
