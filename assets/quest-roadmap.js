/* Quest owns its content; the site's language controller calls render(). */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.RavenForgeQuest = api; api.mount(); }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const LANGS = ['ko', 'en', 'de'];
  const KEY = 'rf.quest.open.v1';
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const language = value => LANGS.includes(value) ? value : 'en';
  const text = (value, lang) => value && value[lang] !== undefined ? value[lang] : '';
  const link = id => '?quest=' + encodeURIComponent(id) + '#quest';

  function markup(data, requestedLang) {
    const lang = language(requestedLang);
    const u = key => text(data.ui[key], lang);
    const sourceMap = data.sources || {};
    const cards = data.quests.map(q => {
      const c = q.copy[lang];
      const sourceHTML = q.references.map(ref => {
        const source = sourceMap[ref.id];
        const local = source && source[lang];
        return local ? `<li><a href="${esc(local.link)}"><strong>${esc(local.title)}</strong><span aria-hidden="true"> ↗</span></a><p>${esc(text(ref.role, lang))}</p></li>` : `<li>${esc(u('missing'))}</li>`;
      }).join('');
      const modelLinks = q.models.map(model => {
        const concept = ['SKADI', 'GRAM'].includes(model);
        return `<a href="#${concept ? 'concept' : 'Prototype'}" data-quest-model="${esc(model)}">${esc(model)}${concept ? ` <small>· ${esc(u('concept'))}</small>` : ''}</a>`;
      }).join('');
      return `<details class="rf-q-card" id="quest-${esc(q.id)}" data-quest-id="${esc(q.id)}">
        <summary id="quest-summary-${esc(q.id)}" aria-controls="quest-body-${esc(q.id)}" data-focus-key="summary-${esc(q.id)}">
          <span class="rf-q-card-top"><span class="rf-q-code">${esc(q.code)}</span><span class="rf-q-stage">${esc(u('stage'))} · ${esc(c.stage)}</span></span>
          <h3>${esc(c.title)}</h3><p class="rf-q-question">${esc(c.question)}</p>
          <span class="rf-q-evidence"><b>${esc(u('evidence'))}</b>${esc(c.evidence)}</span>
          <span class="rf-q-card-meta"><span>${esc(q.models.join(' / '))}</span><span>${esc(u('updated'))} <time datetime="${esc(q.updated)}">${esc(q.updated)}</time></span></span>
          <span class="rf-q-expand">${esc(u('details'))}<span class="rf-q-toggle" aria-hidden="true">+</span></span>
        </summary>
        <div class="rf-q-body" id="quest-body-${esc(q.id)}" role="region" aria-labelledby="quest-summary-${esc(q.id)}">
          <div class="rf-q-body-head"><div class="rf-q-model-links" aria-label="${esc(u('models'))}">${modelLinks}</div><a class="rf-q-permalink" href="${link(q.id)}" data-quest-target="${esc(q.id)}" data-focus-key="link-${esc(q.id)}">${esc(u('permalink'))} ↗</a></div>
          <div class="rf-q-detail-grid"><section><h4>${esc(u('problem'))}</h4><p>${esc(c.problem)}</p></section><section><h4>${esc(u('position'))}</h4><p>${esc(c.position)}</p></section></div>
          <section class="rf-q-checks"><h4>${esc(u('checks'))}</h4><ol>${c.checks.map(s => `<li>${esc(s)}</li>`).join('')}</ol></section>
          <section class="rf-q-decision"><h4>${esc(u('decision'))}</h4><p>${esc(c.decision)}</p></section>
          <section class="rf-q-sources"><h4>${esc(u('sources'))}</h4><ul>${sourceHTML}</ul></section>
          ${q.id === 'workflow' ? `<p><a class="rf-q-tool-link" href="configurator.html">${esc(u('configurator'))} ↗</a></p>` : ''}
          <div class="rf-q-references"><h4>${esc(u('references'))}</h4><div>${q.builders.map(name => `<a href="#analysis" data-quest-builder="${esc(name)}">${esc(name)}</a>`).join('')}</div><p>${esc(u('referenceNote'))}</p></div>
        </div></details>`;
    }).join('\n');
    const priorities = data.priorities.map(id => data.quests.find(q => q.id === id)).filter(Boolean).map(q => `<a href="${link(q.id)}" data-quest-target="${esc(q.id)}"><span>${esc(q.code)}</span>${esc(q.copy[lang].title)}<span aria-hidden="true">↗</span></a>`).join('');
    return `<div class="rf-q-shell" data-quest-version="${esc(data.version)}" lang="${lang}">
      <header class="rf-q-hero"><div><p class="rf-q-eyebrow">${esc(u('eyebrow'))}</p><p class="rf-q-section-name">Quest &amp; Aspiration</p><h2 id="quest-title">${esc(u('title'))}</h2><p class="rf-q-intro">${esc(u('intro'))}</p></div><nav class="rf-q-focus" aria-label="${esc(u('focus'))}"><h3>${esc(u('focus'))}</h3>${priorities}<p>${esc(u('focusNote'))}</p></nav></header>
      <aside class="rf-q-boundary"><strong>${esc(u('boundary'))}</strong><p>${esc(u('boundaryText'))}</p><p>${esc(u('sourceNote'))}</p></aside>
      <div class="rf-q-grid">${cards}</div>
      <section class="rf-q-method"><p class="rf-q-eyebrow">RAVENFORGE / WORKING METHOD</p><h3>${esc(u('methodTitle'))}</h3><p>${esc(u('methodIntro'))}</p><ol class="rf-q-process">${u('steps').map((s, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span>${esc(s)}</li>`).join('')}</ol><p class="rf-q-record">${esc(u('record'))}</p></section>
      <section class="rf-q-aspiration"><h3>${esc(u('aspiration'))}</h3><p>${esc(u('aspirationText'))}</p></section>
      <aside class="rf-q-revision"><p><strong>${esc(u('revision'))}</strong> · <time datetime="${esc(data.updated)}">${esc(data.updated)}</time> · v${esc(data.version)}</p><p>${esc(u('revisionText'))}</p></aside>
      <p class="rf-q-sr" role="status" aria-live="polite" data-quest-status></p>
    </div>`;
  }

  let data, section, lastLang, mounted = false, openIds;
  const safeRead = () => {
    try { const parsed = JSON.parse(sessionStorage.getItem(KEY) || '[]'); return new Set(Array.isArray(parsed) ? parsed.filter(id => data.quests.some(q => q.id === id)) : []); }
    catch (_) { return new Set(); }
  };
  function remember() {
    if (!section) return;
    openIds = new Set([...section.querySelectorAll('details[open][data-quest-id]')].map(el => el.dataset.questId));
    try { sessionStorage.setItem(KEY, JSON.stringify([...openIds])); } catch (_) { /* Private/blocked storage is optional. */ }
  }
  function route(shouldScroll) {
    if (!section || location.hash !== '#quest') return;
    const id = new URL(location.href).searchParams.get('quest');
    if (!data.quests.some(q => q.id === id)) return;
    const card = document.getElementById('quest-' + id);
    if (!card) return;
    card.open = true;
    remember();
    if (shouldScroll) requestAnimationFrame(() => card.scrollIntoView({ block: 'start', behavior: 'auto' }));
  }
  function render(requestedLang) {
    if (!data || !section) return;
    const lang = language(requestedLang || document.documentElement.lang);
    if (lang === lastLang) return;
    const active = document.activeElement;
    const focusKey = active && section.contains(active) ? active.getAttribute('data-focus-key') : null;
    if (lastLang) remember();
    if (!openIds) openIds = safeRead();
    section.innerHTML = markup(data, lang);
    section.querySelectorAll('details[data-quest-id]').forEach(card => {
      card.open = openIds.has(card.dataset.questId);
      card.addEventListener('toggle', remember);
    });
    lastLang = lang;
    route(false);
    if (focusKey) {
      const target = [...section.querySelectorAll('[data-focus-key]')].find(el => el.dataset.focusKey === focusKey);
      if (target) target.focus({ preventScroll: true });
    }
  }
  function goPage(id) {
    const nav = document.querySelector(`.nav-link[href="#${id}"]`);
    if (nav) nav.click(); else location.hash = id;
  }
  function onClick(event) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const target = event.target.closest('a');
    if (!target || !section.contains(target)) return;
    if (target.dataset.questTarget) {
      event.preventDefault();
      const url = new URL(location.href);
      url.searchParams.set('quest', target.dataset.questTarget); url.hash = 'quest';
      if (url.href !== location.href) history.pushState(null, '', url);
      const card = document.getElementById('quest-' + target.dataset.questTarget);
      if (card) { card.open = true; remember(); card.scrollIntoView({ block: 'start', behavior: 'auto' }); card.querySelector('summary').focus({ preventScroll: true }); }
    } else if (target.dataset.questModel) {
      event.preventDefault();
      const model = target.dataset.questModel;
      const concept = ['SKADI', 'GRAM'].includes(model);
      goPage(concept ? 'concept' : 'Prototype');
      if (!concept) document.getElementById('btn-spec-' + model.toLowerCase())?.click();
    } else if (target.dataset.questBuilder) {
      event.preventDefault();
      goPage('analysis');
      document.querySelector('#analysis-type-filter [data-k="all"]')?.click();
      document.getElementById('reset-filters')?.click();
      const heading = [...document.querySelectorAll('#luthier-grid h3')].find(h => h.textContent.trim() === target.dataset.questBuilder);
      if (heading) heading.closest('#luthier-grid > div')?.click();
      else { const status = section.querySelector('[data-quest-status]'); if (status) status.textContent = text(data.ui.analysisFallback, lastLang); }
    }
  }
  function mount() {
    if (mounted || typeof document === 'undefined') return;
    section = document.getElementById('quest');
    const payload = document.getElementById('rf-quest-data');
    if (!section || !payload) return;
    try { data = JSON.parse(payload.textContent); if (data.schemaVersion !== 1 || !Array.isArray(data.quests)) throw new Error('Unsupported Quest schema'); }
    catch (error) { console.error('Quest data could not be loaded; the static roadmap remains available.', error); return; }
    mounted = true;
    section.addEventListener('click', onClick);
    new MutationObserver(() => render(document.documentElement.lang)).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    window.addEventListener('popstate', () => route(true));
    window.addEventListener('hashchange', () => route(true));
    const start = () => { render(document.documentElement.lang); route(true); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
  }
  return { markup, render, mount };
});
