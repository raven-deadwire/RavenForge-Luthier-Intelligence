/*
 * Concept Lab uses the #concept-lab-data JSON array in index.html.
 * Add one record for each owned artwork, for example:
 * {
 *   "id": "study-001", "image": "concepts/study-001.jpg",
 *   "kind": "sketch", "date": "2026-09-09",
 *   "title": { "ko": "작품 제목", "en": "Artwork title", "de": "Werktitel" },
 *   "description": { "ko": "짧은 설명", "en": "Short caption", "de": "Kurzer Text" },
 *   "alt": { "ko": "이미지 설명", "en": "Image description", "de": "Bildbeschreibung" }
 * }
 * kind: sketch | concept | study. Date, description, and alt are optional.
 * Optional specifications: [{ label: { en: "Scale" }, value: "36 inches" }].
 * Image URLs may be repository-relative or HTTPS. Text is never evaluated as HTML.
 */
(() => {
  'use strict';
  const copy = {
    en: { count: n => `${n} ${n === 1 ? 'entry' : 'entries'}`, sketch: 'Sketch', concept: 'Concept art', study: 'Form study', open: 'View artwork', close: 'Close', imageError: 'This image could not be loaded.', dataError: 'The concept archive could not be loaded.', specifications: 'Provisional specifications', item: 'Item', specification: 'Concept specification' },
    de: { count: n => `${n} ${n === 1 ? 'Eintrag' : 'Einträge'}`, sketch: 'Skizze', concept: 'Konzeptkunst', study: 'Formstudie', open: 'Bild ansehen', close: 'Schließen', imageError: 'Dieses Bild konnte nicht geladen werden.', dataError: 'Das Konzeptarchiv konnte nicht geladen werden.', specifications: 'Vorläufige Spezifikationen', item: 'Merkmal', specification: 'Konzeptspezifikation' },
    ko: { count: n => `${n}개의 기록`, sketch: '스케치', concept: '컨셉 아트', study: '형태 연구', open: '이미지 크게 보기', close: '닫기', imageError: '이미지를 불러오지 못했습니다.', dataError: '컨셉 목록을 불러오지 못했습니다.', specifications: '잠정 사양', item: '항목', specification: '구상 사양' }
  };
  const text = (value, lang) => typeof value === 'string' ? value : value?.[lang] || value?.en || value?.ko || value?.de || '';
  const imageUrl = value => {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value, document.baseURI);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  };
  function init() {
    const gallery = document.getElementById('concept-gallery');
    const empty = document.getElementById('concept-empty');
    const count = document.getElementById('concept-count');
    const source = document.getElementById('concept-lab-data');
    if (!gallery || !empty || !count || !source) return;
    let entries = [];
    let invalid = false;
    let selected = null;
    let trigger = null;
    let oldOverflow = '';
    try {
      entries = JSON.parse(source.textContent);
      if (!Array.isArray(entries) || entries.some(entry => !entry || !imageUrl(entry.image) || !text(entry.title, 'en'))) throw new Error('Invalid concept record');
    } catch { invalid = true; entries = []; }
    const lang = () => copy[document.documentElement.lang] ? document.documentElement.lang : 'en';

    const dialog = document.createElement('dialog');
    dialog.className = 'rf-concept-dialog';
    dialog.setAttribute('aria-labelledby', 'concept-dialog-title');
    const header = document.createElement('div');
    header.className = 'rf-concept-dialog-header';
    const title = document.createElement('h3');
    title.id = 'concept-dialog-title';
    const close = document.createElement('button');
    close.type = 'button';
    close.addEventListener('click', () => dialog.close());
    header.append(title, close);
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    const imageError = document.createElement('p');
    imageError.className = 'rf-concept-image-error';
    imageError.hidden = true;
    imageError.setAttribute('role', 'status');
    img.addEventListener('error', () => { img.hidden = true; imageError.hidden = false; });
    const caption = document.createElement('figcaption');
    figure.append(img, imageError, caption);
    dialog.append(header, figure);
    document.body.append(dialog);
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
      document.body.style.overflow = oldOverflow;
      selected = null;
      if (trigger?.isConnected) trigger.focus();
    });
    window.addEventListener('popstate', () => { if (dialog.open) dialog.close(); });
    window.addEventListener('hashchange', () => { if (dialog.open) dialog.close(); });
    function renderDialog() {
      if (!selected) return;
      title.textContent = text(selected.title, lang());
      caption.textContent = text(selected.description, lang());
      caption.hidden = !caption.textContent;
      img.alt = text(selected.alt, lang()) || text(selected.title, lang());
      close.textContent = copy[lang()].close;
      imageError.textContent = copy[lang()].imageError;
    }
    function open(entry, button) {
      selected = entry;
      trigger = button;
      img.hidden = false;
      imageError.hidden = true;
      img.src = imageUrl(entry.image);
      renderDialog();
      oldOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    }
    function render() {
      const current = lang();
      const t = copy[current];
      count.textContent = invalid ? t.dataError : t.count(entries.length);
      empty.hidden = invalid || entries.length > 0;
      gallery.replaceChildren();
      entries.forEach(entry => {
        const article = document.createElement('article');
        article.className = 'rf-concept-card';
        const button = document.createElement('button');
        button.className = 'rf-concept-image-button';
        button.type = 'button';
        button.setAttribute('aria-label', `${t.open}: ${text(entry.title, current)}`);
        button.addEventListener('click', () => open(entry, button));
        const image = document.createElement('img');
        image.alt = text(entry.alt, current) || text(entry.title, current);
        image.loading = 'lazy';
        image.decoding = 'async';
        image.addEventListener('error', () => {
          image.hidden = true;
          const error = document.createElement('p');
          error.className = 'rf-concept-image-error';
          error.textContent = t.imageError;
          button.append(error);
        }, { once: true });
        image.src = imageUrl(entry.image);
        button.append(image);
        const meta = document.createElement('div');
        meta.className = 'rf-concept-card-meta';
        const kind = document.createElement('span');
        kind.textContent = ['sketch', 'concept', 'study'].includes(entry.kind) ? t[entry.kind] : t.concept;
        meta.append(kind);
        if (typeof entry.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
          const parsed = new Date(`${entry.date}T00:00:00Z`);
          if (!Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === entry.date) {
            const date = document.createElement('time');
            date.dateTime = entry.date;
            date.textContent = new Intl.DateTimeFormat(current, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(parsed);
            meta.append(date);
          }
        }
        const heading = document.createElement('h3');
        heading.textContent = text(entry.title, current);
        const content = document.createElement('div');
        content.className = 'rf-concept-card-copy';
        content.append(meta, heading);
        const description = text(entry.description, current);
        if (description) {
          const paragraph = document.createElement('p');
          paragraph.className = 'rf-concept-card-description';
          paragraph.textContent = description;
          content.append(paragraph);
        }
        article.append(button, content);
        if (Array.isArray(entry.specifications) && entry.specifications.length) {
          const specifications = document.createElement('div');
          specifications.className = 'rf-concept-specifications';
          const table = document.createElement('table');
          const tableCaption = document.createElement('caption');
          tableCaption.textContent = `${text(entry.title, current)} · ${t.specifications}`;
          const thead = document.createElement('thead');
          const headerRow = document.createElement('tr');
          [t.item, t.specification].forEach(label => {
            const cell = document.createElement('th');
            cell.scope = 'col';
            cell.textContent = label;
            headerRow.append(cell);
          });
          thead.append(headerRow);
          const tbody = document.createElement('tbody');
          entry.specifications.forEach(spec => {
            const label = text(spec?.label, current);
            const value = text(spec?.value, current);
            if (!label || !value) return;
            const row = document.createElement('tr');
            const name = document.createElement('th');
            name.scope = 'row';
            name.textContent = label;
            const detail = document.createElement('td');
            detail.textContent = value;
            row.append(name, detail);
            tbody.append(row);
          });
          table.append(tableCaption, thead, tbody);
          specifications.append(table);
          article.append(specifications);
        }
        gallery.append(article);
      });
      renderDialog();
    }
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
