/* Load the FORM / MATERIAL / SOUND panel crops taken directly from the approved Home reference image. */
(() => {
  'use strict';

  const sources = {
    form: 'assets/home-reference/form.b64',
    material: 'assets/home-reference/material.b64',
    sound: 'assets/home-reference/sound.b64'
  };

  let media = null;
  let applying = false;

  function applyReferenceMedia() {
    if (!media || applying) return;
    applying = true;
    try {
      Object.entries(media).forEach(([key, data]) => {
        const visual = document.querySelector(`#home [data-pillar="${key}"] .rf-home-pillar-visual`);
        if (!visual) return;
        visual.style.setProperty('background-image', `url("data:image/webp;base64,${data}")`, 'important');
        visual.style.setProperty('background-size', 'cover', 'important');
        visual.style.setProperty('background-position', 'center', 'important');
        visual.dataset.referenceCrop = 'true';
      });
    } finally {
      applying = false;
    }
  }

  async function loadReferenceMedia() {
    try {
      const entries = await Promise.all(Object.entries(sources).map(async ([key, url]) => {
        const response = await fetch(url, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`${url}: ${response.status}`);
        return [key, (await response.text()).trim()];
      }));
      media = Object.fromEntries(entries);
      applyReferenceMedia();
    } catch (error) {
      console.warn('RavenForge Home reference media could not be loaded.', error);
    }
  }

  function init() {
    loadReferenceMedia();
    new MutationObserver(() => applyReferenceMedia()).observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
