/* Concept Lab: continuous reading layout. */
(() => {
  'use strict';

  const supplementalEntries = [
    {
      id: 'gram-superstrat-24f',
      image: 'assets/concepts/gram-superstrat-24f.png',
      kind: 'concept',
      date: '2026-09-11',
      title: { ko: 'GRAM — Heritage, Reforged.', en: 'GRAM — Heritage, Reforged.', de: 'GRAM — Heritage, Reforged.' },
      description: {
        ko: 'GRAM은 기존 Superstrat의 언어를 그대로 반복하지 않고, RavenForge의 구조적 관점으로 다시 벼린 24프렛 기타 컨셉입니다. 25.5인치 스케일과 24프렛이라는 익숙한 기준 위에 2피스 스웜프 애쉬 바디, 5피스 라미네이트 넥, 플레이트 없는 2-2-1 배열의 5볼트 딥 테넌 조인트를 결합했습니다.\n\n바디는 2피스 스웜프 애쉬의 결을 감추지 않는 grain-filled Inferno Red 마감으로 계획하고, AAA급 인디안 로즈우드 지판에는 전면 인레이를 두지 않습니다. 넥은 Northern Hard Maple 외측 윙, Wenge 스트라이프, Purpleheart 코어의 5피스 구조이며 후면 역시 투명 레드로 마감해 라미네이트를 드러냅니다.\n\n전자계는 Lundgren M6 오픈코일 험버커 2개, 1 Volume / 1 Tone / 5-way blade를 기본으로 하며 CTS 500 kΩ D-curve 포트와 Zuta Core 적용을 계획하고 있습니다. 공개 이미지는 컨셉 시각화이며, 제작 전 CAD 검증과 하드웨어 실측에 따라 세부 사양은 조정될 수 있습니다.',
        en: 'GRAM is a 24-fret guitar concept that reforges the familiar Superstrat language through RavenForge’s structural approach rather than simply repeating it. A conventional 25.5-inch scale and 24-fret layout are paired with a two-piece swamp-ash body, a five-piece laminated neck, and a plate-less 2-2-1 five-bolt deep-tenon joint.\n\nThe body is planned in grain-filled Inferno Red that keeps the two-piece swamp-ash grain visible. The AAA-grade Indian rosewood fingerboard carries no face inlays. The neck combines Northern Hard Maple outer wings, Wenge stripes, and a Purpleheart core, with a transparent red rear finish that leaves the lamination visually legible.\n\nElectronics center on two open-coil Lundgren M6 humbuckers with 1 Volume / 1 Tone / 5-way blade control, CTS 500 kΩ D-curve pots, and planned Zuta Core integration. The published image is a concept visualization; final details remain subject to CAD validation and measured hardware clearances before construction.',
        de: 'GRAM ist ein 24-bündiges Gitarrenkonzept, das die vertraute Sprache der Superstrat nicht bloß wiederholt, sondern aus der konstruktiven Perspektive von RavenForge neu schmiedet. Eine klassische 25,5-Zoll-Mensur mit 24 Bünden wird mit einem zweiteiligen Swamp-Ash-Korpus, einem fünfteiligen Hals und einer plattenlosen 2-2-1-Fünfschraubenverbindung mit tiefem Zapfen kombiniert.\n\nDer Korpus ist in einem porenfüllenden Inferno-Red-Finish geplant, das die Maserung der zweiteiligen Swamp Ash sichtbar lässt. Das Griffbrett aus AAA Indian Rosewood bleibt ohne Einlagen auf der Vorderseite. Der Hals besteht aus äußeren Northern-Hard-Maple-Flügeln, Wenge-Streifen und einem Purpleheart-Kern; eine transparente rote Rückseitenlackierung lässt die Laminierung sichtbar.\n\nDie Elektronik basiert auf zwei offenen Lundgren-M6-Humbuckern mit 1 Volume / 1 Tone / 5-Wege-Klingenschalter, CTS-500-kΩ-Potis mit D-Kennlinie und geplanter Zuta-Core-Integration. Die veröffentlichte Darstellung ist eine Konzeptvisualisierung; Details können sich nach CAD-Prüfung und realer Hardwarevermessung vor dem Bau noch ändern.'
      },
      alt: {
        ko: 'Inferno Red 그레인필 2피스 스웜프 애쉬 바디, 골드 하드웨어, 블랙 픽가드와 Lundgren M6 두 개를 적용한 RavenForge GRAM Superstrat 24F 컨셉 보드',
        en: 'RavenForge GRAM Superstrat 24F concept board with grain-filled Inferno Red two-piece swamp ash, gold hardware, black pickguard, and two Lundgren M6 pickups',
        de: 'Konzepttafel der RavenForge GRAM Superstrat 24F mit zweiteiliger Swamp Ash in porengefülltem Inferno Red, goldener Hardware, schwarzem Pickguard und zwei Lundgren-M6-Tonabnehmern'
      },
      specifications: [
        { label: {ko:'모델',en:'Model',de:'Modell'}, value: 'RavenForge GRAM — Superstrat 24F' },
        { label: {ko:'스케일',en:'Scale length',de:'Mensur'}, value: '25.5″ / 648 mm' },
        { label: {ko:'프렛',en:'Frets',de:'Bünde'}, value: {ko:'24 / Extra Jumbo / 18% 니켈실버',en:'24 / Extra Jumbo / 18% Nickel-Silver',de:'24 / Extra Jumbo / 18 % Neusilber'} },
        { label: {ko:'바디',en:'Body',de:'Korpus'}, value: {ko:'2피스 Solid Swamp Ash / Center-jointed',en:'2-piece solid Swamp Ash / center-jointed',de:'Zweiteilige massive Swamp Ash / mittig verleimt'} },
        { label: {ko:'바디 두께',en:'Body thickness',de:'Korpusstärke'}, value: '45.0 mm' },
        { label: {ko:'바디 컨투어',en:'Body contours',de:'Korpuskonturen'}, value: 'Forearm bevel / rear tummy cut / sculpted heel trim-cut' },
        { label: {ko:'마감',en:'Finish',de:'Finish'}, value: 'Transparent Inferno Red / grain-filled / high gloss' },
        { label: {ko:'넥',en:'Neck',de:'Hals'}, value: '5-piece Northern Hard Maple / Wenge / Purpleheart / Wenge / Northern Hard Maple' },
        { label: {ko:'넥 마감',en:'Neck finish',de:'Halsfinish'}, value: {ko:'Transparent Inferno Red / 라미네이트 노출',en:'Transparent Inferno Red / lamination visible',de:'Transparent Inferno Red / Laminierung sichtbar'} },
        { label: {ko:'넥 조인트',en:'Neck joint',de:'Halsverbindung'}, value: {ko:'Extended bolt-on deep tenon / 5볼트 2-2-1 / 플레이트 없음 / 인서트 체결',en:'Extended bolt-on deep tenon / 5-bolt 2-2-1 / no neck plate / threaded inserts',de:'Verlängerter Bolt-on Deep Tenon / 5 Schrauben 2-2-1 / ohne Halsplatte / Gewindeeinsätze'} },
        { label: {ko:'지판',en:'Fingerboard',de:'Griffbrett'}, value: {ko:'AAA Indian Rosewood / 16″ / 전면 인레이 없음',en:'AAA Indian Rosewood / 16″ / no face inlays',de:'AAA Indian Rosewood / 16″ / ohne Front-Inlays'} },
        { label: {ko:'너트',en:'Nut',de:'Sattel'}, value: '43.0 mm Buffalo Bone' },
        { label: {ko:'픽업',en:'Pickups',de:'Tonabnehmer'}, value: 'Lundgren M6 Neck + Bridge / black open-coil' },
        { label: {ko:'컨트롤',en:'Controls',de:'Bedienung'}, value: '1 Volume / 1 Tone / 5-way blade' },
        { label: {ko:'포트',en:'Pots',de:'Potis'}, value: 'CTS 500 kΩ D-curve' },
        { label: {ko:'톤 캐패시터',en:'Tone capacitor',de:'Ton-Kondensator'}, value: '0.022 µF' },
        { label: {ko:'전자계',en:'Planned electronics',de:'Geplante Elektronik'}, value: 'Zuta Core' },
        { label: {ko:'브리지',en:'Bridge',de:'Brücke'}, value: 'Gotoh 510T-FE1 Gold / right-hand / 42 mm block' },
        { label: {ko:'튜너',en:'Tuners',de:'Mechaniken'}, value: 'Gotoh SG381-07-MGT Gold / 6-in-line / staggered' },
        { label: {ko:'픽가드',en:'Pickguard',de:'Pickguard'}, value: '3-ply Black B/W/B / approx. 2.3 mm' },
        { label: {ko:'아웃풋 잭',en:'Output jack',de:'Ausgangsbuchse'}, value: 'Recessed Strat-type top jack / Gold' },
        { label: {ko:'스트랩 하드웨어',en:'Strap hardware',de:'Gurthardware'}, value: 'Schaller S-Lock / Gold' }
      ]
    }
  ];

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
