/* Filters and translated image labels for the static My Works portfolio. */
(() => {
  'use strict';
  const copy = {
    en: {
      filters: 'Filter work by material type',
      count: (projects, photos) => photos ? `${projects} projects · ${photos} repair photos` : `${projects} projects`,
      photos: photos => `${photos} repair photos`,
      open: title => `Enlarge: ${title}`,
      workshop: 'RavenForge workshop — four-room 3D design study',
      askr: 'ASKR R8 — body and bevel modeling study',
      furniture: 'Furniture coursework — Type 4 and Type 6 assembly, interior and exploded views',
      archive: number => `Instrument repair archive — photo ${number}`
    },
    de: {
      filters: 'Arbeiten nach Materialtyp filtern',
      count: (projects, photos) => photos ? `${projects} Projekte · ${photos} Reparaturfotos` : `${projects} Projekte`,
      photos: photos => `${photos} Reparaturfotos`,
      open: title => `Vergrößern: ${title}`,
      workshop: 'RavenForge-Werkstatt — 3D-Entwurf mit vier Räumen',
      askr: 'ASKR R8 — Modellstudie zu Korpus und Abschrägung',
      furniture: 'Möbelübung — Typ 4 und Typ 6, Gesamt-, Innen- und Explosionsansichten',
      archive: number => `Instrumentenreparaturen — Foto ${number}`
    },
    ko: {
      filters: '작업 자료 분류',
      count: (projects, photos) => photos ? `프로젝트 ${projects}개 · 리페어 사진 ${photos}장` : `프로젝트 ${projects}개`,
      photos: photos => `리페어 사진 ${photos}장`,
      open: title => `${title} 크게 보기`,
      workshop: 'RavenForge 공방 — 네 개 공간의 3D 설계 모델',
      askr: 'ASKR R8 — 바디와 베벨 모델링 검토',
      furniture: '가구 실습 — TYPE 4·TYPE 6 조립·내부·분해도',
      archive: number => `악기 리페어 기록 — 사진 ${number}`
    }
  };

  function init() {
    const root = document.getElementById('about-content-works');
    const toolbar = root?.querySelector('.rf-works-toolbar');
    if (!root || !toolbar) return;
    const cards = [...root.querySelectorAll('[data-works-categories]')];
    const grid = root.querySelector('.rf-works-grid');
    const archive = root.querySelector('[data-works-archive]');
    const filters = [...toolbar.querySelectorAll('[data-works-filter]')];
    const count = root.querySelector('[data-works-count]');
    const archivePhotos = [...archive.querySelectorAll('img')];
    const labels = () => copy[document.documentElement.lang] || copy.en;
    let selected = 'all';

    function render() {
      const t = labels();
      toolbar.setAttribute('aria-label', t.filters);
      let projects = 0;
      cards.forEach(card => {
        const visible = selected === 'all' || card.dataset.worksCategories.split(' ').includes(selected);
        card.hidden = !visible;
        if (visible) projects += 1;
      });
      grid.hidden = projects === 0;
      archive.hidden = selected !== 'all' && selected !== 'repair';
      filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.worksFilter === selected)));
      const photos = archive.hidden ? 0 : archivePhotos.length;
      count.textContent = projects ? t.count(projects, photos) : t.photos(photos);

      root.querySelectorAll('[data-works-image]').forEach(button => {
        const title = t[button.dataset.worksLabel];
        button.setAttribute('aria-label', t.open(title));
        button.querySelector('img').alt = title;
      });
      archivePhotos.forEach((image, index) => {
        image.alt = t.archive(index + 1);
        image.parentElement.setAttribute('aria-label', image.alt);
      });
      const popupImage = document.getElementById('popup-img');
      const matchingButton = [...root.querySelectorAll('[data-works-image]')]
        .find(button => button.dataset.worksImage === popupImage?.getAttribute('src'));
      if (matchingButton) popupImage.alt = t[matchingButton.dataset.worksLabel];
    }

    filters.forEach(button => button.addEventListener('click', () => {
      selected = button.dataset.worksFilter;
      render();
    }));
    root.querySelectorAll('[data-works-image]').forEach(button => button.addEventListener('click', () => {
      if (typeof window.openImagePopup !== 'function') return;
      window.openImagePopup(button.dataset.worksImage, labels()[button.dataset.worksLabel]);
    }));
    archive.addEventListener('click', event => {
      const tile = event.target.closest('[onclick^="openImagePopup"]');
      if (!tile) return;
      const image = document.getElementById('popup-img');
      if (image) image.alt = tile.querySelector('img')?.alt || '';
    });

    // A shareable link still uses the existing About page and its Works tab.
    // No new top-level navigation or hash route is introduced.
    if (new URLSearchParams(location.search).get('about') === 'works' && location.hash === '#about') {
      document.getElementById('btn-about-works')?.click();
    }
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    render();
    toolbar.hidden = false;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
