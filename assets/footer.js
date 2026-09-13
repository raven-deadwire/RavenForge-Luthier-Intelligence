(() => {
  'use strict';
  const root = document.documentElement;
  const copy = {
    en: { contact: 'Contact', updated: 'Last Updated' },
    de: { contact: 'Kontakt', updated: 'Zuletzt aktualisiert' },
    ko: { contact: '연락', updated: '마지막 업데이트' }
  };
  function render() {
    const lang = copy[root.lang] ? root.lang : 'en';
    document.querySelectorAll('[data-footer-key]').forEach(node => {
      const key = node.dataset.footerKey;
      if (copy[lang][key]) node.textContent = copy[lang][key];
    });
  }
  render();
  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ['lang'] });
})();
