/* Current RavenForge project context: concise, evidence-aware copy layered over legacy translations. */
(() => {
  'use strict';

  const copy = {
    en: {
      pageTitle: 'RavenForge Luthier Intelligence — Instrument Design, Research & Prototypes',
      headerSubtitle: 'Independent instrument-design, research and prototype portfolio',
      heroDescription: 'Norse narratives, material research, and the development of instruments.',
      visionTitle: 'Purpose & Current Direction',
      visionContent: `<p class="mb-4">RavenForge Luthier Intelligence is a working portfolio for instrument design, material and electronics research, CAD development and prototype planning. It documents decisions, open questions and evidence rather than presenting unbuilt concepts as finished products.</p><p class="mb-4">The immediate objective is to turn research into buildable prototypes, then evaluate them through fabrication, setup, playing and measurement. Existing high-end luthiers are studied as references, but their conventions are not treated as a checklist or proof in themselves.</p><p>The long-term brand vision remains important, but the present work is deliberately narrower: define requirements, develop the geometry and systems, build, measure, learn and revise.</p>`,
      education: 'B.A. in Philosophy, Yonsei University'
    },
    de: {
      pageTitle: 'RavenForge Luthier Intelligence — Instrumentendesign, Forschung & Prototypen',
      headerSubtitle: 'Unabhängiges Portfolio für Instrumentendesign, Forschung und Prototypenentwicklung',
      heroDescription: 'Nordische Erzählungen, Materialforschung und die Entwicklung von Instrumenten.',
      visionTitle: 'Zweck & aktuelle Ausrichtung',
      visionContent: `<p class="mb-4">RavenForge Luthier Intelligence ist ein Arbeitsportfolio für Instrumentendesign, Material- und Elektronikforschung, CAD-Entwicklung und Prototypenplanung. Es dokumentiert Entscheidungen, offene Fragen und Belege, statt unfertige Konzepte als fertige Produkte darzustellen.</p><p class="mb-4">Das unmittelbare Ziel ist, Forschung in baubare Prototypen zu überführen und diese anschließend durch Fertigung, Setup, Spieltests und Messungen zu bewerten. High-End-Luthiers dienen als Referenzen, ihre Konventionen werden jedoch weder als Checkliste noch als Beweis an sich behandelt.</p><p>Die langfristige Markenvision bleibt bestehen; die aktuelle Arbeit ist bewusst konkreter: Anforderungen definieren, Geometrie und Systeme entwickeln, bauen, messen, lernen und überarbeiten.</p>`,
      education: 'B.A. Philosophie, Yonsei University'
    },
    ko: {
      pageTitle: 'RavenForge Luthier Intelligence — 악기 설계·연구·프로토타입',
      headerSubtitle: '악기 설계, 연구와 프로토타입 개발을 기록하는 독립 포트폴리오',
      heroDescription: '북유럽의 서사, 재료 연구, 그리고 악기를 개발해 가는 과정.',
      visionTitle: '목적과 현재 방향',
      visionContent: `<p class="mb-4">RavenForge Luthier Intelligence는 악기 설계, 재료·전자계 연구, CAD 개발과 프로토타입 기획을 기록하는 작업 포트폴리오입니다. 아직 제작되지 않은 개념을 완성품처럼 제시하기보다 설계 판단, 열린 질문과 근거를 남기는 것을 우선합니다.</p><p class="mb-4">현재의 목표는 연구를 실제 제작 가능한 프로토타입으로 전환하고, 제작·셋업·연주·측정을 통해 평가하는 것입니다. 기존 하이엔드 루씨어들의 사례는 중요한 참고 자료로 연구하지만, 그 관행 자체를 체크리스트나 증거로 받아들이지는 않습니다.</p><p>장기적인 브랜드 비전은 유지하되 지금의 작업은 더 구체적으로 정의합니다. 요구조건을 세우고, 기하 구조와 시스템을 개발하고, 제작하고, 측정하고, 배운 뒤 다시 수정하는 과정입니다.</p>`,
      education: '연세대학교 문과대학 철학과 학사'
    }
  };

  const language = () => copy[document.documentElement.lang] ? document.documentElement.lang : 'en';

  function setHtml(selector, value) {
    const node = document.querySelector(selector);
    if (node) node.innerHTML = value;
  }

  function render() {
    const t = copy[language()];
    document.title = t.pageTitle;
    setHtml('[data-lang-key="headerSubtitle"]', t.headerSubtitle);
    setHtml('[data-lang-key="designHeroDescription"]', t.heroDescription);
    setHtml('#about-content-intro [data-lang-key="visionTitle"]', t.visionTitle);
    setHtml('#about-content-intro [data-lang-key="visionContent"]', t.visionContent);
    setHtml('#about-content-bio [data-lang-key="bioEducationValue"]', t.education);
  }

  function init() {
    render();
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();