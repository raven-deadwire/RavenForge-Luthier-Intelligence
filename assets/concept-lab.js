/* Concept Lab: continuous reading layout. */
(() => {
  'use strict';

  const supplementalEntries = [];

  const ui = {
    en: { count:n=>`${n} ${n===1?'entry':'entries'}`, sketch:'Sketch', concept:'Concept art', study:'Form study', specs:'Provisional specifications', error:'The concept archive could not be loaded.' },
    de: { count:n=>`${n} ${n===1?'Eintrag':'Einträge'}`, sketch:'Skizze', concept:'Konzeptkunst', study:'Formstudie', specs:'Vorläufige Spezifikationen', error:'Das Konzeptarchiv konnte nicht geladen werden.' },
    ko: { count:n=>`${n}개의 기록`, sketch:'스케치', concept:'컨셉 아트', study:'형태 연구', specs:'잠정 사양', error:'컨셉 목록을 불러오지 못했습니다.' }
  };

  const text = (value, language) => typeof value === 'string' ? value : value?.[language] || value?.en || value?.ko || value?.de || '';
  const language = () => ui[document.documentElement.lang] ? document.documentElement.lang : 'en';
  const imageUrl = value => {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value, document.baseURI);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  };

  function installContinuousLayout() {
    if (document.getElementById('rf-concept-continuous-style')) return;
    const style = document.createElement('style');
    style.id = 'rf-concept-continuous-style';
    style.textContent = `
      .rf-site #concept .rf-concept-gallery { display:block !important; grid-template-columns:none !important; padding-top:1.75rem !important; }
      .rf-site #concept .rf-concept-scroll-entry { display:block; width:100%; margin:0; padding:0 0 clamp(4rem,8vw,7rem); border:0; background:transparent; }
      .rf-site #concept .rf-concept-scroll-entry + .rf-concept-scroll-entry { padding-top:clamp(3.5rem,7vw,6rem); border-top:1px solid var(--rf-line); }
      .rf-site #concept .rf-concept-scroll-heading { width:100%; margin:0 0 1.4rem; }
      .rf-site #concept .rf-concept-scroll-meta { display:flex; flex-wrap:wrap; gap:.5rem 1.25rem; color:var(--rf-muted); font-size:.8125rem; letter-spacing:.08em; text-transform:uppercase; }
      .rf-site #concept .rf-concept-scroll-heading h3 { margin:.55rem 0 0; font-size:clamp(2rem,4vw,3.5rem); line-height:1.12; letter-spacing:-.035em; }
      .rf-site #concept .rf-concept-scroll-figure { width:100%; margin:0 0 2rem; border:1px solid var(--rf-line); background:#111a20; overflow:hidden; }
      .rf-site #concept .rf-concept-scroll-figure img { display:block; width:100%; height:auto; max-height:none; object-fit:contain; }
      .rf-site #concept .rf-concept-scroll-description { width:100%; max-width:none; margin:0; color:var(--rf-muted); white-space:pre-line; overflow-wrap:anywhere; font-size:1rem; line-height:1.8; }
      .rf-site #concept .rf-concept-scroll-specs { width:100%; margin-top:2.25rem; overflow-x:auto; }
      .rf-site #concept .rf-concept-scroll-specs h4 { margin:0 0 .8rem; font-size:.8125rem; letter-spacing:.12em; text-transform:uppercase; color:var(--rf-muted); }
      .rf-site #concept .rf-concept-scroll-specs table { width:100%; table-layout:fixed; border-collapse:collapse; font-size:.9375rem; }
      .rf-site #concept .rf-concept-scroll-specs th,.rf-site #concept .rf-concept-scroll-specs td { padding:.78rem .7rem; border-bottom:1px solid var(--rf-line); vertical-align:top; text-align:left; overflow-wrap:anywhere; }
      .rf-site #concept .rf-concept-scroll-specs th { width:30%; font-weight:600; color:var(--rf-ink); }
      .rf-site #concept .rf-concept-scroll-specs td { color:var(--rf-muted); }
      @media (max-width:720px) {
        .rf-site #concept .rf-concept-scroll-entry { padding-bottom:3.5rem; }
        .rf-site #concept .rf-concept-scroll-entry + .rf-concept-scroll-entry { padding-top:3rem; }
        .rf-site #concept .rf-concept-scroll-specs table { table-layout:auto; font-size:.9rem; }
        .rf-site #concept .rf-concept-scroll-specs th { width:38%; }
        .rf-site #concept .rf-concept-scroll-specs th,.rf-site #concept .rf-concept-scroll-specs td { padding:.65rem .45rem; }
      }
    `;
    document.head.append(style);
  }

  function init() {
    const gallery = document.getElementById('concept-gallery');
    const empty = document.getElementById('concept-empty');
    const count = document.getElementById('concept-count');
    const source = document.getElementById('concept-lab-data');
    if (!gallery || !empty || !count || !source) return;

    installContinuousLayout();

    let baseEntries = [];
    try {
      const parsed = JSON.parse(source.textContent);
      if (!Array.isArray(parsed)) throw new Error('Invalid concept data');
      baseEntries = parsed;
    } catch {
      count.textContent = ui[language()].error;
      empty.hidden = true;
      gallery.replaceChildren();
      return;
    }

    const seen = new Set();
    const entries = [...baseEntries, ...supplementalEntries]
      .filter(entry => {
        if (!entry || !imageUrl(entry.image) || !text(entry.title, 'en')) return false;
        const key = entry.id || `${entry.image}|${text(entry.title, 'en')}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a,b) => (b.date || '').localeCompare(a.date || ''));

    function render() {
      const current = language();
      const t = ui[current];
      count.textContent = t.count(entries.length);
      empty.hidden = entries.length > 0;
      gallery.replaceChildren();

      entries.forEach(entry => {
        const article = document.createElement('article');
        article.className = 'rf-concept-scroll-entry';

        const heading = document.createElement('header');
        heading.className = 'rf-concept-scroll-heading';
        const meta = document.createElement('div');
        meta.className = 'rf-concept-scroll-meta';
        const kind = document.createElement('span');
        kind.textContent = ['sketch','concept','study'].includes(entry.kind) ? t[entry.kind] : t.concept;
        meta.append(kind);
        if (typeof entry.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
          const time = document.createElement('time');
          time.dateTime = entry.date;
          const parsed = new Date(`${entry.date}T00:00:00Z`);
          time.textContent = Number.isNaN(parsed.valueOf()) ? entry.date : new Intl.DateTimeFormat(current,{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}).format(parsed);
          meta.append(time);
        }
        const title = document.createElement('h3');
        title.textContent = text(entry.title, current);
        heading.append(meta,title);

        const figure = document.createElement('figure');
        figure.className = 'rf-concept-scroll-figure';
        const image = document.createElement('img');
        image.src = imageUrl(entry.image);
        image.alt = text(entry.alt,current) || text(entry.title,current);
        image.loading = 'lazy';
        image.decoding = 'async';
        figure.append(image);
        article.append(heading,figure);

        const description = text(entry.description,current);
        if (description) {
          const paragraph = document.createElement('p');
          paragraph.className = 'rf-concept-scroll-description';
          paragraph.textContent = description;
          article.append(paragraph);
        }

        if (Array.isArray(entry.specifications) && entry.specifications.length) {
          const specs = document.createElement('section');
          specs.className = 'rf-concept-scroll-specs';
          const specsTitle = document.createElement('h4');
          specsTitle.textContent = t.specs;
          const table = document.createElement('table');
          const tbody = document.createElement('tbody');
          entry.specifications.forEach(spec => {
            const label = text(spec?.label,current);
            const value = text(spec?.value,current);
            if (!label || !value) return;
            const row = document.createElement('tr');
            const name = document.createElement('th');
            name.scope = 'row';
            name.textContent = label;
            const detail = document.createElement('td');
            detail.textContent = value;
            row.append(name,detail);
            tbody.append(row);
          });
          table.append(tbody);
          specs.append(specsTitle,table);
          article.append(specs);
        }
        gallery.append(article);
      });
    }

    new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
