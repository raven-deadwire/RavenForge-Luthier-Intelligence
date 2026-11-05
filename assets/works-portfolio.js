/* Project filters and translated image labels for About > My Works / Repairs. */
(() => {
  'use strict';
  const copy = {
    en: {
      buildMaterials: "Timber for the GRAMR build alongside the specification sheet.",
      buildNeck: "Laminated neck blank on the table saw, with the contrasting center strips visible.",
      buildVise: "Neck blank held between the padded jaws of a bench vise.",
      buildRod: "Truss rod seated in the channel along the center of the neck.",
      buildJig: "Fingerboard blank secured in the fret-slotting jig.",
      buildSlots: "Fingerboard after the fret slots were cut.",
      buildClamps: "Spring clamps hold the fingerboard against the neck blank.",
      filters: 'Filter projects by type',
      count: projects => `${projects} ${projects === 1 ? 'project' : 'projects'}`,
      open: title => `Enlarge: ${title}`,
      workshop: 'RavenForge workshop — four-room 3D design study',
      askr: 'ASKR R8 — body and bevel modeling study',
      furniture: 'Furniture coursework — Type 4 and Type 6 assembly, interior and exploded views',
      repair01: 'Two basses hanging on the workshop wall',
      repair02: 'Blue bass with the control cavity open',
      repair03: 'Wiring and controls inside a body cavity',
      repair04: 'Side view of a fingerboard masked between the frets',
      repair05: 'Circuit boards and a battery inside the control cavity',
      repair06: 'Brown bass hanging among the workshop tools',
      repair07: 'A small brush against the fingerboard near the headstock',
      repair08: 'A brush on the fingerboard, seen from the body end',
      repair09: 'A hand tool at a fret on a light-coloured fingerboard',
      repair10: 'Single-cut guitar with green tape around the pickups',
      repair11: 'Two tools meeting at a fret on a dark fingerboard',
      repair12: 'A screwdriver on a bass tuning key',
      repair13: 'Brushing the fingerboard while supporting the neck with a cloth',
      repair14: 'A rotary tool at the edge of the fingerboard',
      repair15: 'A tool against the edge of a strung fingerboard'
    },
    de: {
      buildMaterials: "Das Holz für den Bau der GRAMR neben dem Datenblatt.",
      buildNeck: "Der verleimte Halsrohling auf der Tischkreissäge. In der Mitte sind die kontrastierenden Holzstreifen zu sehen.",
      buildVise: "Der Halsrohling zwischen den gepolsterten Backen des Schraubstocks.",
      buildRod: "Der Halsstab liegt in der mittig gefrästen Nut des Halsrohlings.",
      buildJig: "Der Griffbrettrohling ist in die Vorrichtung zum Sägen der Bundschlitze eingespannt.",
      buildSlots: "Das Griffbrett nach dem Sägen der Bundschlitze.",
      buildClamps: "Federzwingen pressen das Griffbrett auf den Halsrohling.",
      filters: 'Projekte nach Art der Unterlagen filtern',
      count: projects => `${projects} ${projects === 1 ? 'Projekt' : 'Projekte'}`,
      open: title => `Vergrößern: ${title}`,
      workshop: 'RavenForge-Werkstatt — 3D-Entwurf mit vier Räumen',
      askr: 'ASKR R8 — Modellstudie zu Korpus und Abschrägung',
      furniture: 'Möbelübung — Typ 4 und Typ 6, Gesamt-, Innen- und Explosionsansichten',
      repair01: 'Zwei Bässe an der Werkstattwand',
      repair02: 'Blauer Bass mit offenem Elektronikfach',
      repair03: 'Verdrahtung und Regler im Elektronikfach',
      repair04: 'Griffbrett mit Klebeband zwischen den Bünden, von der Seite',
      repair05: 'Platinen und Batterie im Elektronikfach',
      repair06: 'Brauner Bass zwischen Werkzeugen an der Wand',
      repair07: 'Kleine Bürste am Griffbrett nahe der Kopfplatte',
      repair08: 'Bürste auf dem Griffbrett, vom Korpus aus gesehen',
      repair09: 'Handwerkzeug an einem Bund auf hellem Griffbrett',
      repair10: 'Singlecut-Gitarre mit grünem Klebeband an den Tonabnehmern',
      repair11: 'Zwei Werkzeuge an einem Bund auf dunklem Griffbrett',
      repair12: 'Schraubendreher am Stimmflügel eines Basses',
      repair13: 'Bürste auf dem Griffbrett, ein Tuch stützt den Hals',
      repair14: 'Rotationswerkzeug an der Griffbrettkante',
      repair15: 'Werkzeug an der Griffbrettkante bei aufgezogenen Saiten'
    },
    ko: {
      buildMaterials: "GRAMR 제작용 목재와 사양서.",
      buildNeck: "테이블쏘 위의 적층 넥 블랭크. 중앙에 색이 다른 목재를 겹친 구조가 보인다.",
      buildVise: "작업대 바이스에 보호대를 대고 고정한 넥 블랭크.",
      buildRod: "넥 중앙에 가공한 홈에 끼운 트러스로드.",
      buildJig: "프렛 슬롯 가공 지그에 고정한 지판재.",
      buildSlots: "프렛 슬롯 가공을 마친 지판.",
      buildClamps: "스프링 클램프로 지판과 넥 블랭크를 압착한 모습.",
      filters: '프로젝트 자료 분류',
      count: projects => `프로젝트 ${projects}개`,
      open: title => `${title} 크게 보기`,
      workshop: 'RavenForge 공방 — 네 개 공간의 3D 설계 모델',
      askr: 'ASKR R8 — 바디와 베벨 모델링 검토',
      furniture: '가구 실습 — TYPE 4·TYPE 6 조립·내부·분해도',
      repair01: '공방 벽에 나란히 걸린 베이스 두 대',
      repair02: '컨트롤 캐비티가 열린 파란색 베이스',
      repair03: '바디 안쪽에 드러난 배선과 컨트롤 부품',
      repair04: '프렛 사이에 초록색 테이프를 붙인 지판의 옆모습',
      repair05: '컨트롤 캐비티 안의 회로 기판과 배터리',
      repair06: '공구 사이에 걸린 갈색 베이스',
      repair07: '헤드 쪽 지판에 작은 솔을 댄 모습',
      repair08: '바디 쪽에서 바라본 지판과 솔질하는 손',
      repair09: '밝은색 지판의 프렛에 손 공구를 댄 모습',
      repair10: '픽업 주변에 초록색 테이프를 붙인 싱글컷 기타',
      repair11: '어두운색 지판의 프렛에 공구 두 개를 댄 모습',
      repair12: '베이스 튜닝 키에 드라이버를 댄 모습',
      repair13: '천으로 넥을 받치고 솔로 지판을 닦는 모습',
      repair14: '지판 가장자리에 회전 공구를 댄 모습',
      repair15: '줄이 걸린 지판 가장자리에 공구를 댄 모습'
    }
  };

  function init() {
    const works = document.getElementById('about-content-works');
    const repairs = document.getElementById('about-content-repairs');
    if (!works && !repairs) return;
    const toolbar = works?.querySelector('.rf-works-toolbar');
    const cards = [...(works?.querySelectorAll('[data-works-categories]') || [])];
    const grid = works?.querySelector('.rf-works-grid');
    const filters = [...(toolbar?.querySelectorAll('[data-works-filter]') || [])];
    const count = works?.querySelector('[data-works-count]');
    const imageButtons = [works, repairs].flatMap(panel => [...(panel?.querySelectorAll('[data-works-image]') || [])]);
    const labels = () => copy[document.documentElement.lang.toLowerCase().split('-')[0]] || copy.en;
    let selected = 'all';

    function render() {
      const t = labels();
      toolbar?.setAttribute('aria-label', t.filters);
      let projects = 0;
      cards.forEach(card => {
        const visible = selected === 'all' || card.dataset.worksCategories.split(' ').includes(selected);
        card.hidden = !visible;
        if (visible) projects += 1;
      });
      if (grid) grid.hidden = projects === 0;
      filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.worksFilter === selected)));
      if (count) count.textContent = t.count(projects);

      imageButtons.forEach(button => {
        const title = t[button.dataset.worksLabel];
        button.setAttribute('aria-label', t.open(title));
        const image = button.querySelector('img');
        if (image) image.alt = title;
        const caption = button.querySelector('[data-works-caption]');
        if (caption) caption.textContent = title;
      });
      const popupImage = document.getElementById('popup-img');
      const matchingButton = imageButtons.find(button => button.dataset.worksImage === popupImage?.getAttribute('src'));
      if (popupImage && matchingButton) popupImage.alt = t[matchingButton.dataset.worksLabel];
    }

    filters.forEach(button => button.addEventListener('click', () => {
      selected = button.dataset.worksFilter;
      render();
    }));
    imageButtons.forEach(button => button.addEventListener('click', () => {
      if (typeof window.openImagePopup !== 'function') return;
      window.openImagePopup(button.dataset.worksImage, labels()[button.dataset.worksLabel]);
    }));

    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    render();
    if (toolbar) toolbar.hidden = false;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
