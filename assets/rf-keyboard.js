/* Keyboard access for elements the homepage makes clickable with plain click handlers:
   Analysis and Research cards and the About > Works photo tiles. They are rendered
   (and re-rendered on every language switch) by several scripts, so this watches
   the DOM and upgrades them in place instead of touching each renderer.
   - Tab reaches them; Enter or Space opens them, like a button.
   - Escape closes the luthier/research dialog and the image popup.
   - Opening a dialog moves focus to its close button; closing it returns focus. */
(() => {
  'use strict';

  const CARDS = '#luthier-grid > div, #research-grid > div, [onclick^="openImagePopup"]:not(button)';
  const DIALOGS = ['luthier-modal', 'image-popup'];

  function label(el) {
    const heading = el.querySelector('h3, h4');
    if (heading) return heading.textContent.trim();
    const img = el.querySelector('img[alt]');
    return img ? img.alt.trim() : '';
  }

  const doc = document;

  function upgrade() {
    if (!doc.defaultView) return; // page is being torn down
    doc.querySelectorAll(CARDS).forEach(el => {
      if (el.dataset.rfKeyboard === 'on') return;
      el.dataset.rfKeyboard = 'on';
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      const name = label(el);
      if (name) el.setAttribute('aria-label', name);
    });
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    Promise.resolve().then(() => { queued = false; upgrade(); });
  };
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  upgrade();

  const isOpen = id => {
    const el = document.getElementById(id);
    return !!el && !el.classList.contains('hidden');
  };

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (isOpen('image-popup') && typeof window.closeImagePopup === 'function') { window.closeImagePopup(); return; }
      if (isOpen('luthier-modal')) document.getElementById('modal-close')?.click();
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target;
    if (!(card instanceof Element) || card.dataset.rfKeyboard !== 'on') return;
    event.preventDefault();
    card.click();
  });

  // Move focus into an opened dialog and back to what opened it when it closes.
  DIALOGS.forEach(id => {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    let opener = null;
    let open = isOpen(id);
    new MutationObserver(() => {
      const now = isOpen(id);
      if (now === open) return;
      open = now;
      if (now) {
        opener = document.activeElement;
        dialog.querySelector('#modal-close, #popup-close')?.focus({ preventScroll: true });
      } else if (opener && document.contains(opener)) {
        opener.focus({ preventScroll: true });
        opener = null;
      }
    }).observe(dialog, { attributes: true, attributeFilter: ['class'] });
  });
})();
