/* Home/About structure and profile/release media. Preserves the existing RavenForge visual system. */
(() => {
  'use strict';

  const homeLabels = { en: 'Home', de: 'Start', ko: '홈' };
  const releaseMedia = [
    ['https://image.bugsm.co.kr/album/images/1000/208067/20806769.jpg', 'From Destiny They Called album cover'],
    ['https://image.bugsm.co.kr/album/images/1000/205923/20592334.jpg', 'Revenant Raven album cover'],
    ['https://image.bugsm.co.kr/album/images/1000/205975/20597516.jpg', 'A Warrior Betrayed Us album cover']
  ];

  const language = () => homeLabels[document.documentElement.lang] ? document.documentElement.lang : 'en';

  function installHomeAboutStructure() {
    const about = document.getElementById('about');
    const aboutNav = document.querySelector('a.nav-link[href="#about"]');
    if (!about || !aboutNav) return;

    let home = document.getElementById('home');
    let homeNav = document.querySelector('a.nav-link[href="#home"]');

    if (!homeNav) {
      homeNav = document.createElement('a');
      homeNav.href = '#home';
      homeNav.className = aboutNav.className.replace(/\bactive-nav\b/g, '').replace(/\s+/g, ' ').trim();
      homeNav.dataset.rfHomeNav = 'true';
      aboutNav.before(homeNav);
    }

    const updateHomeLabel = () => { homeNav.textContent = homeLabels[language()]; };
    updateHomeLabel();
    new MutationObserver(updateHomeLabel).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    if (!home) {
      home = document.createElement('section');
      home.id = 'home';
      home.className = 'page-section mb-16 pt-4';
      about.before(home);
    }

    const hero = about.querySelector('.rf-hero');
    if (hero && hero.parentElement !== home) home.append(hero);

    const intro = document.getElementById('about-content-intro');
    if (intro && !home.contains(intro)) {
      intro.classList.remove('about-content', 'hidden');
      intro.removeAttribute('hidden');
      const card = document.createElement('div');
      card.className = 'bg-white p-6 rounded-lg shadow-md mt-6';
      card.dataset.rfHomeIntro = 'true';
      card.append(intro);
      home.append(card);
    }

    document.getElementById('btn-about-intro')?.remove();

    const validTabs = ['brand', 'bio', 'mentors', 'works'];
    const savedTab = sessionStorage.getItem('activeAboutTab');
    const activeTab = validTabs.includes(savedTab) ? savedTab : 'brand';
    sessionStorage.setItem('activeAboutTab', activeTab);

    about.querySelectorAll('.about-tab-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.target === activeTab);
    });
    about.querySelectorAll('.about-content').forEach(content => {
      content.classList.toggle('hidden', content.id !== `about-content-${activeTab}`);
    });

    if (!window.location.hash) {
      history.replaceState(null, '', '#home');
      about.classList.remove('active');
      home.classList.add('active');
      aboutNav.classList.remove('active-nav');
      aboutNav.removeAttribute('aria-current');
      homeNav.classList.add('active-nav');
      homeNav.setAttribute('aria-current', 'page');
    }
  }

  function installMediaStyles() {
    if (document.getElementById('rf-profile-media-style')) return;
    const style = document.createElement('style');
    style.id = 'rf-profile-media-style';
    style.textContent = `
      #about-content-bio .rf-release-card { min-height:0 !important; padding:.8rem !important; }
      #about-content-bio .rf-release-cover { display:block; width:100%; aspect-ratio:1 / 1; object-fit:cover; margin:0 0 .9rem; border:1px solid rgb(255 255 255 / .14); background:#101b20; }
      #about-content-bio .rf-release-card h4 { margin:.2rem 0 .55rem !important; }
      #about-content-bio .rf-release-label { margin-bottom:.2rem; }
      .rf-project-stage { display:none !important; }

      /* Home > Project Conception: fill the full card width without stretching the square artwork. */
      #home #ravenforge-identity .grid.md\\:grid-cols-3 > .bg-stone-50 > .mb-4 {
        margin:-1rem -1rem 1rem !important;
        width:calc(100% + 2rem);
        aspect-ratio:1 / 1;
        overflow:hidden;
        border-radius:.375rem .375rem 0 0;
        background:#111827;
      }
      #home #ravenforge-identity .grid.md\\:grid-cols-3 > .bg-stone-50 > .mb-4 > img {
        display:block;
        width:100% !important;
        height:100% !important;
        max-width:none !important;
        object-fit:cover !important;
        object-position:center;
        border-radius:0 !important;
      }
    `;
    document.head.append(style);
  }

  function decorateLocalMedia() {
    const profile = document.querySelector('#personal-intro img');
    if (profile) {
      profile.src = 'assets/profile/raven-profile.webp';
      profile.alt = 'Raven Cho performing live';
      profile.removeAttribute('onerror');
      profile.loading = 'eager';
      profile.decoding = 'async';
    }

    document.querySelectorAll('#about-content-bio .rf-release-grid .rf-release-card').forEach((card, index) => {
      const item = releaseMedia[index];
      if (!item) return;
      let image = card.querySelector(':scope > .rf-release-cover');
      if (!image) {
        image = document.createElement('img');
        image.className = 'rf-release-cover';
        image.loading = 'lazy';
        image.decoding = 'async';
        card.prepend(image);
      }
      image.src = item[0];
      image.alt = item[1];
    });

    document.querySelectorAll('[data-rf-project-stage], .rf-project-stage').forEach(node => node.remove());
  }

  installHomeAboutStructure();
  installMediaStyles();

  if (document.body) {
    new MutationObserver(decorateLocalMedia).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', decorateLocalMedia, { once: true });
  else decorateLocalMedia();
})();

/* Equal-time model cards. No automatic movement while reading or off screen. */
(() => {
  'use strict';
  const copy = {
    en: { label: 'Prototype models', picker: 'Choose a model', previous: 'Previous model', next: 'Next model', pause: 'Pause', play: 'Play', pauseLabel: 'Pause automatic rotation', playLabel: 'Start automatic rotation', carousel: 'carousel', slide: 'slide' },
    de: { label: 'Prototypen', picker: 'Modell auswählen', previous: 'Vorheriges Modell', next: 'Nächstes Modell', pause: 'Pause', play: 'Abspielen', pauseLabel: 'Automatischen Wechsel pausieren', playLabel: 'Automatischen Wechsel starten', carousel: 'Karussell', slide: 'Folie' },
    ko: { label: '프로토타입 모델 소개', picker: '모델 선택', previous: '이전 모델', next: '다음 모델', pause: '일시정지', play: '자동 넘김', pauseLabel: '자동 넘김 일시정지', playLabel: '자동 넘김 시작', carousel: '카드 슬라이드', slide: '카드' }
  };
  function init() {
    const root = document.getElementById('model-carousel');
    if (!root) return;
    const page = document.getElementById('home') || document.getElementById('about');
    const slides = [...root.querySelectorAll('.rf-model-slide')];
    const picker = root.querySelector('.rf-carousel-picker');
    const buttons = [...picker.querySelectorAll('button')];
    const previous = root.querySelector('[data-carousel-action="previous"]');
    const next = root.querySelector('[data-carousel-action="next"]');
    const rotation = root.querySelector('[data-carousel-action="rotation"]');
    const position = root.querySelector('.rf-carousel-position');
    const viewport = root.querySelector('.rf-carousel-slides');
    if (slides.length < 2 || slides.length !== buttons.length) return;
    const interval = Number(root.dataset.interval) || 6000;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let index = 0;
    let paused = motion.matches;
    let hovered = false;
    let onScreen = true;
    let timer = null;

    const language = () => copy[document.documentElement.lang] || copy.en;
    const canRotate = () => !paused && !hovered && onScreen && !document.hidden && page.classList.contains('active');

    function render() {
      const t = language();
      root.setAttribute('aria-label', t.label);
      root.setAttribute('aria-roledescription', t.carousel);
      root.dataset.model = slides[index].dataset.model;
      picker.setAttribute('aria-label', t.picker);
      previous.setAttribute('aria-label', t.previous);
      next.setAttribute('aria-label', t.next);
      rotation.textContent = paused ? t.play : t.pause;
      rotation.setAttribute('aria-label', paused ? t.playLabel : t.pauseLabel);
      viewport.setAttribute('aria-live', canRotate() ? 'off' : 'polite');
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.inert = !active;
        slide.setAttribute('aria-roledescription', t.slide);
        slide.setAttribute('aria-label', `${i + 1} / ${slides.length}: ${slide.dataset.model.toUpperCase()}`);
        buttons[i].setAttribute('aria-pressed', String(active));
      });
      position.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    }
    function schedule() {
      window.clearTimeout(timer);
      timer = null;
      render();
      if (canRotate()) {
        timer = window.setTimeout(() => {
          index = (index + 1) % slides.length;
          schedule();
        }, interval);
      }
    }
    function select(target) {
      index = (target + slides.length) % slides.length;
      paused = true;
      schedule();
    }
    buttons.forEach((button, i) => button.addEventListener('click', () => select(i)));
    previous.addEventListener('click', () => select(index - 1));
    next.addEventListener('click', () => select(index + 1));
    rotation.addEventListener('click', () => { paused = !paused; schedule(); });
    root.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        select(index + (event.key === 'ArrowLeft' ? -1 : 1));
      }
    });
    root.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') { hovered = true; schedule(); }
    });
    root.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse') { hovered = false; schedule(); }
    });
    root.addEventListener('focusin', event => {
      if (event.target !== rotation) { paused = true; schedule(); }
    });
    document.addEventListener('visibilitychange', schedule);
    motion.addEventListener('change', event => {
      if (event.matches) paused = true;
      schedule();
    });
    new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    new MutationObserver(schedule).observe(page, { attributes: true, attributeFilter: ['class'] });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        onScreen = entries[0].isIntersecting;
        schedule();
      }, { threshold: 0 }).observe(root);
    }
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* Keep current content modules separate from the legacy index.html. */
(() => {
  const modules = [
    ['rf-profile-enhancements', 'assets/profile-enhancements.js?v=20260912-profile'],
    ['rf-site-context', 'assets/site-context.js?v=20260912-context']
  ];
  modules.forEach(([id, src]) => {
    if (document.querySelector(`script[data-${id}]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.setAttribute(`data-${id}`, 'true');
    document.head.append(script);
  });
})();