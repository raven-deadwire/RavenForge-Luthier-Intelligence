/* Quest owns its content; the site's language controller calls render(). */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.RavenForgeQuest = api; api.mount(); }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const LANGS = ['ko', 'en', 'de'];
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const language = value => LANGS.includes(value) ? value : 'en';
  const text = (value, lang) => value && value[lang] !== undefined ? value[lang] : '';
  const link = id => '?quest=' + encodeURIComponent(id) + '#quest';

  // Native vector illustrations: schematic relationships, never measured data.
  // All meaningful labels remain HTML text and follow the active site language.
  const VISUAL = {
    ko: { nav: '여섯 갈래의 탐구', core: '하나의 악기', explore: '과제를 선택해 살펴보기', atlasNote: '서로 연결된 설계 질문 · 순서나 성능 등급이 아닙니다',
      titles: ['넥 구조', '재료 선택', '인체공학', '전자계', '서사와 형태', '제작·검수'],
      tags: [['단면·기하', '보강·조정', '조인트'], ['목재 상태', '결·방향', '조달 이력'], ['자세', '리치', '밸런스'], ['픽업 부하', '신호 경로', '기준 상태'], ['EMBLA', 'ASKR', 'EDDA'], ['도면·부품', '제작·조립', '검수·수리']],
      drawings: '설계 질문을 도해로 읽기', drawingNote: '도해는 구조와 관계를 설명하는 개념도입니다. 실측 치수·응답 곡선·완성품의 설계도가 아닙니다.',
      mapTitle: '연구에서 과제로, 과제에서 악기로', mapIntro: '과제를 선택하면 연결된 연구 문서와 적용 모델이 함께 바뀝니다.',
      source: '연결된 연구', task: '설계 과제', models: '적용 모델', mapNote: '연결선은 공개 기록의 관계를 나타내며 성능 검증이나 제작 완료를 의미하지 않습니다.',
      open: '과제 상세 보기', proto: '프로토타입 설계', concept: '컨셉', loop: '관찰과 판단을 다음 리비전의 요구조건으로', update: '연구 문서와 적용 모델 연결을 표시했습니다.', revision: '페이지 내부에 과제별 SVG 도해, 클릭형 연구·모델 연결 맵과 반복 설계 흐름을 추가했습니다. 도해와 화면 문구는 한·영·독 언어 전환에 대응합니다.' },
    en: { nav: 'Six lines of inquiry', core: 'One instrument', explore: 'Choose a quest to explore', atlasNote: 'Connected questions, not a sequence or performance grade',
      titles: ['Neck structure', 'Materials', 'Ergonomics', 'Electronics', 'Narrative & form', 'Build & inspect'],
      tags: [['Section & geometry', 'Reinforce & adjust', 'Neck joint'], ['Blank condition', 'Grain direction', 'Sourcing record'], ['Posture', 'Reach', 'Balance'], ['Pickup loading', 'Signal path', 'Reference state'], ['EMBLA', 'ASKR', 'EDDA'], ['Drawings & parts', 'Build & assemble', 'Inspect & service']],
      drawings: 'Read the design questions visually', drawingNote: 'Schematic illustrations of structures and relationships—not measured dimensions, response curves or production drawings.',
      mapTitle: 'Research → questions → instruments', mapIntro: 'Select a quest to reveal its connected research and model applications.',
      source: 'Connected research', task: 'Design question', models: 'Model applications', mapNote: 'Lines show relationships in public records, not verified performance or completed builds.',
      open: 'Open this quest', proto: 'Prototype design', concept: 'Concept', loop: 'Feed observations and decisions into the next revision', update: 'Connected research and model applications updated.', revision: 'Added native SVG quest illustrations, an interactive research/model connection map and an iterative design flow inside this page. Visual labels support Korean, English and German.' },
    de: { nav: 'Sechs Forschungsrichtungen', core: 'Ein Instrument', explore: 'Aufgabe auswählen', atlasNote: 'Verbundene Fragen, keine Reihenfolge oder Leistungsbewertung',
      titles: ['Halsstruktur', 'Materialwahl', 'Ergonomie', 'Elektronik', 'Erzählung & Form', 'Bauen & prüfen'],
      tags: [['Querschnitt', 'Verstärken & einstellen', 'Halsverbindung'], ['Rohlingzustand', 'Faserrichtung', 'Herkunft'], ['Haltung', 'Reichweite', 'Balance'], ['Pickup-Last', 'Signalweg', 'Referenzzustand'], ['EMBLA', 'ASKR', 'EDDA'], ['Plan & Bauteile', 'Bau & Montage', 'Prüfung & Wartung']],
      drawings: 'Entwurfsfragen visuell lesen', drawingNote: 'Schematische Darstellungen von Strukturen und Beziehungen – keine Messwerte, Übertragungskurven oder Fertigungszeichnungen.',
      mapTitle: 'Von Forschung zu Fragen zu Instrumenten', mapIntro: 'Eine Aufgabe auswählen, um verknüpfte Forschung und Modellbezüge zu sehen.',
      source: 'Verknüpfte Forschung', task: 'Entwurfsfrage', models: 'Modellbezüge', mapNote: 'Linien zeigen Beziehungen öffentlicher Unterlagen, keine bestätigte Leistung oder abgeschlossene Fertigung.',
      open: 'Aufgabe öffnen', proto: 'Prototypenentwurf', concept: 'Konzept', loop: 'Beobachtungen und Entscheidungen in die nächste Revision übernehmen', update: 'Forschungs- und Modellbezüge aktualisiert.', revision: 'Native SVG-Darstellungen, eine interaktive Forschungs-/Modellkarte und eine iterative Entwurfsfolge wurden direkt in die Seite integriert. Die Beschriftungen unterstützen Koreanisch, Englisch und Deutsch.' }
  };
  const QUEST_IDS = ['neck', 'materials', 'ergonomics', 'electronics', 'narrative', 'workflow'];
  const line = (d, cls = '') => `<path d="${d}" class="${cls}"/>`;
  const circle = (x, y, r, cls = '') => `<circle cx="${x}" cy="${y}" r="${r}" class="${cls}"/>`;
  const callout = (x, y, n) => `<g class="qv-callout">${circle(x, y, 12)}<text x="${x}" y="${y + 4}" text-anchor="middle">${n}</text></g>`;
  const blueGrid = Array.from({ length: 15 }, (_, i) => line(`M${i * 40 + 20} 12V188`, 'qv-grid')).join('') + [30,70,110,150,190].map(y => line(`M12 ${y}H588`, 'qv-grid')).join('');
  const arrow = (x, y) => line(`M${x-6} ${y-5}l6 5-6 5`, 'qv-accent');

  // Front-view contours traced from this site's published prototype artwork.
  // Coordinates reference 1000 x 1000 display copies of the source images.
  // These are concept-art outlines, not CAD geometry or measured ergonomics.
  const REFERENCE_BODIES = {
    EMBLA: {
      source: 'assets/optimized/embla-prototype.webp',
      d: 'M451 542C420 553 391 507 377 447C374 434 365 444 356 453C337 478 348 530 364 575C383 620 364 663 339 700C306 746 300 788 326 827C358 875 399 886 473 889C539 894 597 891 632 871C664 854 674 831 666 802C659 776 637 749 620 717C597 678 598 649 615 606C629 573 623 553 613 554C599 552 583 596 555 604C545 608 537 604 531 599L531 610L450 610Z',
      centre: [490,665], height: 450
    },
    ASKR: {
      source: 'assets/optimized/askr-prototype.webp',
      d: 'M472 613C450 614 437 599 428 571C416 539 425 512 426 489C415 504 400 531 398 550C393 579 413 620 421 653C433 691 413 727 397 756C382 779 381 797 387 817C398 857 416 877 449 888C491 903 536 899 570 886C607 872 625 849 622 821C621 798 602 773 589 748C569 713 576 684 592 654C598 642 604 632 612 624C593 625 582 634 568 641C550 651 536 646 526 634L526 674L471 672Z',
      centre: [502,694], height: 410
    },
    EDDA: {
      source: 'assets/optimized/edda-prototype.webp',
      d: 'M471 623C465 639 446 635 436 622C421 602 417 573 415 550C414 536 413 524 407 525C387 530 379 549 380 574C378 612 393 650 400 682C414 729 394 766 372 808C352 845 346 868 352 895C358 935 386 961 428 971C466 981 526 979 564 970C609 960 638 932 640 894C642 864 626 832 612 800C597 766 588 750 597 718C604 697 617 680 617 660C616 646 608 636 600 634C591 630 594 651 584 670C574 692 554 699 539 692C532 690 529 688 527 680L527 700L472 700Z',
      centre: [495,750], height: 460
    }
  };
  function referenceBody(model) {
    const r = REFERENCE_BODIES[model];
    return `<g data-reference-model="${model}" data-source-artwork="${r.source}" class="qv-reference-shape"><path d="${r.d}"/></g>`;
  }
  function emblaInstrument() {
    // Keep the source's front-view orientation, continuous neck and 3+2 head.
    const strings = [0,1,2,3,4].map(i => `<path d="M${485+i*9} 113L${429+i*23} 823" class="qv-reference-string"/>`).join('');
    return referenceBody('EMBLA') +
      '<path d="M482 111L524 113L532 603L450 601Z" class="qv-reference-neck"/>' +
      '<path d="M482 111L469 101L463 88L475 61L479 40L497 34L524 42L531 51L533 84L542 99L524 113Z" class="qv-reference-neck"/>' +
      '<path d="M479 62L461 61M472 79L452 81M469 98L450 98M531 66L545 66M538 99L554 101" class="qv-reference-hardware"/>' +
      '<path d="M461 61l-9-8-6 15 12 1ZM452 81l-10-1-3 12 12-4ZM450 98l-11 0-3 10 13-2ZM545 66l10-7 4 11-12 4ZM554 101l13-8 3 16-15-2Z" class="qv-reference-neck"/>' +
      '<path d="M426 678H544V714H423ZM424 725H546V761H421ZM425 790H543V838H420Z" class="qv-reference-hardware"/>' + strings;
  }
  const REFERENCE_COPY = {
    ko: { ergonomics: 'EMBLA 공개 원화 기준 · 자세·리치·지지점 관계도', narrative: '공개 원화의 바디 윤곽 · 표시 높이 통일, 실측 비율 비교 아님' },
    en: { ergonomics: 'Based on published EMBLA art · posture, reach & support', narrative: 'Bodies from published art · equal display height, not measured relative size' },
    de: { ergonomics: 'Nach veröffentlichter EMBLA-Grafik · Haltung, Reichweite & Auflage', narrative: 'Korpusformen aus Entwurfsgrafiken · gleiche Anzeigehöhe, kein Größenvergleich' }
  };

  const DRAWINGS = {
    neck: line('M35 131L455 64 548 86 128 157Z','qv-fill') + line('M35 131v15l93 26 420-72V86M128 157v15M48 137l80 21 408-69','qv-muted') +
      [0,1,2,3,4].map(i => line(`M${60+i*13} ${132+i*3}L${478+i*12} ${69+i*3}`,'qv-fine')).join('') +
      line('M94 103L443 48 494 61 145 120Z','qv-glow') + line('M151 108L448 62','qv-accent') + circle(452,61,5,'qv-accent') +
      line('M156 65L393 27 407 32 171 70Z','qv-fill') + line('M171 70v6l236-39v-5M156 65v6l15 5','qv-muted') +
      line('M403 27l53 37M160 77l-15 44M102 106l26 51','qv-dash') +
      line('M503 99l41 8v57l-41-9Z','qv-fill') + [116,145].map(y=>circle(516,y,3,'qv-accent')+circle(535,y+5,3,'qv-accent')).join('') +
      line('M48 165l54 15M48 160v12M102 174v12M166 181l282-48','qv-muted') + callout(76,101,1)+callout(286,48,2)+callout(565,136,3),
    materials: line('M50 101l161-48 88 29-162 49Z','qv-fill') + line('M50 101v52l87 31 162-51V82M137 131v53','qv-accent') +
      [0,1,2,3].map(i=>line(`M${62+i*13} ${106+i*4}l160-47M61 ${117+i*9}l62 22M150 ${140+i*10}l136-43`,'qv-muted')).join('') +
      line('M48 67l133-41 87 27M45 62v12M181 21v12','qv-fine') +
      circle(374,106,62,'qv-muted') + [49,36,23,10].map(r=>`<ellipse cx="374" cy="106" rx="${r}" ry="${r*.78}" transform="rotate(-20 374 106)" class="qv-fine"/>`).join('') + line('M326 143l95-73','qv-accent') + arrow(421,70)+
      line('M477 53h55l25 25v96h-80ZM532 53v25h25M492 98h47M492 118h35M492 138h43','qv-muted') +
      line('M294 119h15M439 107h23','qv-dash') + callout(81,43,1)+callout(391,34,2)+callout(520,35,3),
    ergonomics: circle(195,30,18,'qv-muted') +
      line('M180 50Q154 53 142 80L124 120M211 50Q235 54 247 82L251 120M164 65L159 178M234 67L240 178','qv-muted') +
      line('M116 183H265M201 67V175','qv-fine') +
      line('M158 61L159 127M224 62L302 51','qv-dash') +
      '<g transform="translate(225 112) rotate(75) scale(.34) translate(-490 -710)" data-instrument-orientation="source-front">' + emblaInstrument() + '</g>' +
      line('M145 90Q125 119 190 133M241 85Q312 136 366 85','qv-muted') +
      line('M340 88Q396 65 447 54','qv-dash') + arrow(447,54) +
      circle(302,51,4,'qv-accent') + circle(159,127,4,'qv-accent') +
      line('M103 55L158 64M503 55L434 65M101 155L152 132','qv-fine') +
      callout(89,52,1)+callout(518,53,2)+callout(87,158,3),
    electronics: `<rect x="31" y="64" width="75" height="76" rx="11" class="qv-fill"/>` + [0,1,2,3].map(i=>circle(51,78+i*16,3,'qv-muted')+circle(85,78+i*16,3,'qv-muted')).join('') +
      line('M107 102h60','qv-accent')+arrow(167,102)+
      `<rect x="173" y="74" width="74" height="57" rx="4" class="qv-fill"/>` + line('M182 102h12l5-11 10 22 10-22 10 22 5-11h5','qv-accent')+
      line('M247 102h63','qv-accent')+arrow(310,102)+
      `<rect x="317" y="61" width="103" height="83" rx="7" class="qv-fill"/>`+ [340,370,398].map((x,i)=>line(`M${x} 78v50`,'qv-muted')+`<rect x="${x-5}" y="${85+i*10}" width="10" height="7" class="qv-glow"/>`).join('')+
      line('M420 102h82','qv-accent')+arrow(502,102)+circle(532,102,19,'qv-fill')+circle(532,102,8,'qv-accent')+
      line('M129 102V36h341v66M144 102v64h325v-64','qv-dash')+circle(129,102,3)+circle(469,102,3)+
      callout(212,154,1)+callout(282,44,2)+callout(370,167,3),
    narrative: [REFERENCE_BODIES.EMBLA, REFERENCE_BODIES.ASKR, REFERENCE_BODIES.EDDA].map((r,i) => {
      const x = 112+i*188, scale = 164/r.height, model = ['EMBLA','ASKR','EDDA'][i];
      return line(`M${x} 15V188`,'qv-grid') +
        `<g transform="translate(${x} 105) scale(${scale}) translate(${-r.centre[0]} ${-r.centre[1]})">${referenceBody(model)}</g>` +
        callout(x-73,29,i+1);
    }).join(''),
    workflow: `<rect x="28" y="52" width="140" height="107" rx="4" class="qv-fill"/>`+line('M46 67v76h101M63 135l-4-39 32-17 35 24-10 29ZM52 88h83M88 67v78','qv-muted')+
      line('M179 105h49','qv-accent')+arrow(228,105)+
      line('M265 48h79v17h-79ZM277 65v52l-15 14v17h64v-17l-13-14V65M253 156h91M262 117l-14-36M337 117l16-36','qv-muted')+`<rect x="278" y="131" width="32" height="12" class="qv-glow"/>`+
      line('M359 105h46','qv-accent')+arrow(405,105)+
      `<rect x="422" y="52" width="141" height="107" rx="4" class="qv-fill"/>`+ [80,105,130].map(y=>line(`M438 ${y}l5 5 9-11M466 ${y}h76`,'qv-accent')).join('')+
      callout(99,31,1)+callout(298,28,2)+callout(493,31,3)
  };
  function illustration(q, lang) {
    const index = QUEST_IDS.indexOf(q.id), c = VISUAL[lang];
    const referenceNote = REFERENCE_COPY[lang][q.id];
    return `<span class="rf-q-visual"${referenceNote ? ' data-geometry-version="20260927-reference-1"' : ''}><svg viewBox="0 0 600 200" aria-hidden="true" focusable="false" class="rf-q-drawing" xmlns="http://www.w3.org/2000/svg">${blueGrid}${DRAWINGS[q.id] || ''}</svg><span class="rf-q-visual-legend">${c.tags[index].map((tag,i)=>`<span><b>${i+1}</b>${esc(tag)}</span>`).join('')}</span>${referenceNote ? `<span class="rf-q-reference-note">${esc(referenceNote)}</span>` : ''}</span>`;
  }
  function atlas(data, lang) {
    const c = VISUAL[lang];
    return `<nav class="rf-q-atlas" aria-label="${esc(c.explore)}"><h3>${esc(c.nav)}</h3><div class="rf-q-orbit"><svg viewBox="0 0 600 240" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M100 48L300 120 500 48M300 48V192M100 192L300 120 500 192"/><circle cx="300" cy="120" r="23"/></svg>${data.quests.map((q,i)=>`<a href="${link(q.id)}" data-quest-target="${esc(q.id)}" data-focus-key="atlas-${esc(q.id)}" class="rf-q-orbit-node"><span>${esc(q.code)}</span><strong>${esc(c.titles[i])}</strong></a>`).join('')}<span class="rf-q-orbit-core"><span>FORM · MATERIAL · SOUND</span><strong>${esc(c.core)}</strong></span></div><p>${esc(c.atlasNote)}</p></nav>`;
  }
  function mapBody(data, lang, id) {
    const q = data.quests.find(q=>q.id===id) || data.quests[0], c = VISUAL[lang];
    return `<div class="rf-q-map-sources"><h4>${esc(c.source)} <span>${q.references.length}</span></h4><ul>${q.references.map((ref,i)=>{
      const source = data.sources[ref.id][lang];
      return `<li><a href="${esc(source.link)}" title="${esc(source.title)}" data-map-source="${esc(ref.id)}"><span>${/^[A-Z]+\d+$/.test(ref.id)?esc(ref.id):String(i+1).padStart(2,'0')}</span><strong>${esc(source.title.split(' — ')[0])}</strong><span aria-hidden="true">↗</span></a></li>`;
    }).join('')}</ul></div><div class="rf-q-map-pivot"><span class="rf-q-map-direction" aria-hidden="true">→</span><div><p>${esc(c.task)}</p><span class="rf-q-map-code">${esc(q.code)}</span><h4>${esc(c.titles[QUEST_IDS.indexOf(q.id)])}</h4><p>${esc(q.copy[lang].stage)}</p><a href="${link(q.id)}" data-quest-target="${esc(q.id)}">${esc(c.open)} ↗</a></div><span class="rf-q-map-direction" aria-hidden="true">→</span></div><div class="rf-q-map-models"><h4>${esc(c.models)} <span>${q.models.length}</span></h4><ul>${q.models.map(model=>`<li><a href="#${['SKADI','GRAMR'].includes(model)?'concept':'Prototype'}" data-quest-model="${esc(model)}"><strong>${esc(model)}</strong><span>${esc(['SKADI','GRAMR'].includes(model)?c.concept:c.proto)}</span><span aria-hidden="true">↗</span></a></li>`).join('')}</ul></div>`;
  }
  function relationships(data, lang, selectedId) {
    const c = VISUAL[lang], id = data.quests.some(q=>q.id===selectedId) ? selectedId : 'electronics';
    return `<section class="rf-q-relations" aria-labelledby="rf-q-map-title"><header><p class="rf-q-eyebrow">RESEARCH / QUEST / INSTRUMENT</p><h3 id="rf-q-map-title">${esc(c.mapTitle)}</h3><p>${esc(c.mapIntro)}</p></header><div class="rf-q-map-select" role="group" aria-label="${esc(c.explore)}">${data.quests.map((q,i)=>`<button type="button" data-quest-map="${esc(q.id)}" data-focus-key="map-${esc(q.id)}" aria-pressed="${q.id===id}" aria-controls="rf-q-map-body"><span>${esc(q.code)}</span>${esc(c.titles[i])}</button>`).join('')}</div><div class="rf-q-map-body" id="rf-q-map-body">${mapBody(data,lang,id)}</div><p class="rf-q-map-note">${esc(c.mapNote)}</p></section>`;
  }
  function method(steps, lang) {
    return `<div class="rf-q-loop"><ol class="rf-q-process">${steps.map((s,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(s)}</strong><span class="rf-q-step-arrow" aria-hidden="true">→</span></li>`).join('')}</ol><div class="rf-q-loop-back"><span aria-hidden="true">↖</span><p>${esc(VISUAL[lang].loop)}</p></div></div>`;
  }

  function markup(data, requestedLang, selectedId) {
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
        const concept = ['SKADI', 'GRAMR'].includes(model);
        return `<a href="#${concept ? 'concept' : 'Prototype'}" data-quest-model="${esc(model)}">${esc(model)}${concept ? ` <small>· ${esc(u('concept'))}</small>` : ''}</a>`;
      }).join('');
      return `<details class="rf-q-card" id="quest-${esc(q.id)}" data-quest-id="${esc(q.id)}">
        <summary id="quest-summary-${esc(q.id)}" aria-controls="quest-body-${esc(q.id)}" data-focus-key="summary-${esc(q.id)}">
          <span class="rf-q-card-top"><span class="rf-q-code">${esc(q.code)}</span><span class="rf-q-stage">${esc(u('stage'))} · ${esc(c.stage)}</span></span>
          <h3>${esc(c.title)}</h3><p class="rf-q-question">${esc(c.question)}</p>
          ${illustration(q,lang)}
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
    return `<div class="rf-q-shell" data-quest-version="${esc(data.version)}" lang="${lang}">
      <header class="rf-q-hero"><div><p class="rf-q-eyebrow">${esc(u('eyebrow'))}</p><p class="rf-q-section-name">Quest &amp; Aspiration</p><h2 id="quest-title">${esc(u('title'))}</h2><p class="rf-q-intro">${esc(u('intro'))}</p></div>${atlas(data,lang)}</header>
      <aside class="rf-q-boundary"><strong>${esc(u('boundary'))}</strong><p>${esc(u('boundaryText'))}</p><p>${esc(u('sourceNote'))}</p></aside>
      <div class="rf-q-visual-intro"><h3>${esc(VISUAL[lang].drawings)}</h3><p>${esc(VISUAL[lang].drawingNote)}</p></div>
      <div class="rf-q-grid">${cards}</div>
      ${relationships(data,lang,selectedId)}
      <section class="rf-q-method"><p class="rf-q-eyebrow">RAVENFORGE / WORKING METHOD</p><h3>${esc(u('methodTitle'))}</h3><p>${esc(u('methodIntro'))}</p>${method(u('steps'),lang)}<p class="rf-q-record">${esc(u('record'))}</p></section>
      <section class="rf-q-aspiration"><h3>${esc(u('aspiration'))}</h3><p>${esc(u('aspirationText'))}</p></section>
      <aside class="rf-q-revision"><p><strong>${esc(u('revision'))}</strong> · <time datetime="${esc(data.updated)}">${esc(data.updated)}</time> · v${esc(data.version)}</p><p>${esc(u('revisionText'))}</p><p class="rf-q-visual-revision">2026-09-27 · Visual layer v1.1 — ${esc(VISUAL[lang].revision)}</p></aside>
      <p class="rf-q-sr" role="status" aria-live="polite" data-quest-status></p>
    </div>`;
  }

  // Each document starts collapsed. Keep state in memory only so translation
  // preserves an explicit choice without restoring it on a visit or reload.
  let data, section, lastLang, mounted = false, openIds = new Set(), mapId = 'electronics';
  function remember() {
    if (!section) return;
    openIds = new Set([...section.querySelectorAll('details[open][data-quest-id]')].map(el => el.dataset.questId));
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
    section.innerHTML = markup(data, lang, mapId);
    section.querySelectorAll('details[data-quest-id]').forEach(card => {
      card.open = openIds.has(card.dataset.questId);
      card.addEventListener('toggle', remember);
    });
    lastLang = lang;
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
    const choice = event.target.closest('button[data-quest-map]');
    if (choice && section.contains(choice) && data.quests.some(q=>q.id===choice.dataset.questMap)) {
      mapId = choice.dataset.questMap;
      section.querySelectorAll('[data-quest-map]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.questMap === mapId)));
      section.querySelector('#rf-q-map-body').innerHTML = mapBody(data,lastLang,mapId);
      section.querySelector('[data-quest-status]').textContent = VISUAL[lastLang].titles[QUEST_IDS.indexOf(mapId)] + ': ' + VISUAL[lastLang].update;
      return;
    }
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
      const concept = ['SKADI', 'GRAMR'].includes(model);
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
    const initialQuest = new URL(location.href).searchParams.get('quest');
    if (data.quests.some(q=>q.id===initialQuest)) mapId = initialQuest;
    mounted = true;
    section.addEventListener('click', onClick);
    new MutationObserver(() => render(document.documentElement.lang)).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    window.addEventListener('popstate', () => route(true));
    window.addEventListener('hashchange', () => route(true));
    // Query parameters may select the research map, but never expand cards on load.
    const start = () => render(document.documentElement.lang);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
  }
  return { markup, render, mount };
});