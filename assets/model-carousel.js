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
    const page = document.getElementById('about');
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

/* Keep the profile refresh modular without expanding the legacy index.html further. */
(() => {
  if (document.querySelector('script[data-rf-profile-enhancements]')) return;
  const script = document.createElement('script');
  script.src = 'assets/profile-enhancements.js?v=20260912-profile';
  script.defer = true;
  script.dataset.rfProfileEnhancements = 'true';
  document.head.append(script);
})();