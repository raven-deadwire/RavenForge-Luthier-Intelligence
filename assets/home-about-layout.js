/* RavenForge Home/About restructure — preserves the existing visual system. */
(() => {
  'use strict';

  const copy = {
    en: { home:'Home', about:'About', brief:'Brief Intro & Vision', profile:'Bio & Profile', brand:'What is RavenForge?', mentors:'My Mentors', works:'My Works' },
    de: { home:'Home', about:'Über uns', brief:'Kurzprofil & Vision', profile:'Biografie & Profil', brand:'Was ist RavenForge?', mentors:'Meine Mentoren', works:'Meine Arbeiten' },
    ko: { home:'홈', about:'소개', brief:'간략한 소개 및 비전', profile:'약력과 프로필', brand:'RavenForge란?', mentors:'나의 멘토', works:'나의 작업물' }
  };

  function lang(){ return copy[document.documentElement.lang] ? document.documentElement.lang : 'en'; }

  function moveChildren(from, to){ while(from.firstChild) to.appendChild(from.firstChild); }

  function buildHome(){
    const about = document.getElementById('about');
    if (!about || document.getElementById('home')) return;

    const home = document.createElement('section');
    home.id = 'home';
    home.className = 'page-section active mb-16 pt-4';

    const hero = about.querySelector(':scope > .rf-hero');
    const intro = document.getElementById('about-content-intro');
    if (hero) home.appendChild(hero);

    if (intro) {
      const wrapper = document.createElement('div');
      wrapper.className = 'bg-white p-6 rounded-lg shadow-md mt-8';
      const title = document.createElement('h2');
      title.className = 'text-3xl font-bold mb-6 border-b pb-3';
      title.dataset.homeIntroTitle = 'true';
      wrapper.appendChild(title);
      moveChildren(intro, wrapper);
      home.appendChild(wrapper);
    }

    about.parentNode.insertBefore(home, about);
    about.classList.remove('active');

    const tabs = [...about.querySelectorAll('.about-tab-btn')];
    tabs.forEach(btn => {
      if (btn.dataset.target === 'intro') btn.remove();
    });
    const introPanel = document.getElementById('about-content-intro');
    if (introPanel) introPanel.remove();

    const brandBtn = about.querySelector('.about-tab-btn[data-target="brand"]');
    if (brandBtn) {
      about.querySelectorAll('.about-tab-btn').forEach(b => b.classList.remove('active'));
      brandBtn.classList.add('active');
    }
    about.querySelectorAll('.about-content').forEach(panel => panel.classList.add('hidden'));
    const brandPanel = document.getElementById('about-content-brand');
    if (brandPanel) brandPanel.classList.remove('hidden');
  }

  function rebuildNav(){
    const nav = document.querySelector('header nav .flex');
    if (!nav || nav.querySelector('[href="#home"]')) return;
    const aboutLink = nav.querySelector('a[href="#about"]');
    if (!aboutLink) return;
    const homeLink = aboutLink.cloneNode(true);
    homeLink.href = '#home';
    homeLink.removeAttribute('data-lang-key');
    homeLink.dataset.rfHomeNav = 'true';
    homeLink.textContent = copy[lang()].home;
    aboutLink.parentNode.insertBefore(homeLink, aboutLink);
  }

  function installNavigation(){
    const allLinks = () => [...document.querySelectorAll('.nav-link, [data-page-link]')];
    function activate(targetId, push=true){
      const page = document.getElementById(targetId);
      if (!page || !page.classList.contains('page-section')) targetId = 'home';
      document.querySelectorAll('.page-section').forEach(section => section.classList.remove('active'));
      document.querySelectorAll('.nav-link').forEach(link => { link.classList.remove('active-nav'); link.removeAttribute('aria-current'); });
      document.getElementById(targetId)?.classList.add('active');
      document.querySelectorAll(`.nav-link[href="#${CSS.escape(targetId)}"]`).forEach(link => { link.classList.add('active-nav'); link.setAttribute('aria-current','page'); });
      if (push) history.pushState(null,'',`#${targetId}`);
      window.scrollTo(0,0);
    }

    allLinks().forEach(link => {
      link.addEventListener('click', e => {
        const href = link.getAttribute('href') || '';
        if (!href.startsWith('#')) return;
        const id = href.slice(1);
        if (!document.getElementById(id)?.classList.contains('page-section')) return;
        e.preventDefault(); e.stopImmediatePropagation(); activate(id,true);
      }, true);
    });
    window.addEventListener('popstate', () => activate(location.hash.slice(1) || 'home', false), true);
    window.addEventListener('hashchange', () => activate(location.hash.slice(1) || 'home', false), true);

    const initial = location.hash.slice(1);
    if (!initial || initial === 'about') {
      history.replaceState(null,'','#home');
      activate('home',false);
    } else activate(initial,false);
  }

  function updateLabels(){
    const t = copy[lang()];
    document.querySelector('[data-rf-home-nav]')?.replaceChildren(document.createTextNode(t.home));
    const about = document.querySelector('a[href="#about"]');
    if (about) about.textContent = t.about;
    const homeTitle = document.querySelector('[data-home-intro-title]');
    if (homeTitle) homeTitle.textContent = t.brief;
    const map = {brand:t.brand,bio:t.profile,mentors:t.mentors,works:t.works};
    Object.entries(map).forEach(([target,label]) => {
      const btn = document.querySelector(`.about-tab-btn[data-target="${target}"]`);
      if (btn) btn.textContent = label;
    });
  }

  function replaceProfileImage(){
    const img = document.querySelector('#personal-intro img[alt="Raven Cho Profile"], #about img[alt="Raven Cho Profile"]');
    if (img) {
      img.src = 'assets/media/raven-profile.webp';
      img.removeAttribute('onerror');
      img.loading = 'eager';
      img.decoding = 'async';
    }
  }

  function init(){
    buildHome();
    rebuildNav();
    updateLabels();
    replaceProfileImage();
    installNavigation();
    new MutationObserver(() => { updateLabels(); replaceProfileImage(); }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();