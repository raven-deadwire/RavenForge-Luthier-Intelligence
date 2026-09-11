/* RavenForge profile: current musician/luthier context and evidence-led brand copy. */
(() => {
  'use strict';

  const copy = {
    en: {
      sectionEyebrow: 'MUSICIAN / DESIGNER / LUTHIER IN TRAINING',
      sectionTitle: 'Selected releases & performance',
      sectionIntro: 'RavenForge grows out of instruments used in real recordings, rehearsals and live stages. These selected works show the musical practice behind the design research.',
      releaseLabel: 'RELEASE',
      listen: 'Listen',
      performanceLabel: 'LIVE / PERFORMANCE',
      performanceTitle: 'DEADWIRE — INTO THE LIVE Vol.18',
      performanceMeta: 'Sinchon Deep Purple · Seoul · 20 Jun 2026',
      performanceDesc: 'A recent DEADWIRE stage: bass, vocals and the high-gain band context that informs RavenForge’s practical design questions.',
      watch: 'Watch performance videos',
      profileTitle: 'Current profile',
      nameLabel: 'Artist name',
      name: "'raven / Raven Cho",
      occupationLabel: 'Current roles',
      occupation: 'Musician · Bassist & Vocalist · Composer · Instrument Designer · Luthier in Training',
      careerLabel: 'Music',
      career: "DEADWIRE — Bass & Vocal / Composition / Management<br>Former bassist: Hate Device / Purgatorium",
      trainingLabel: 'Lutherie / making',
      training: 'Berklee GT Repair — hands-on repair & setup apprenticeship<br>Moon Guitar — prototype development and lutherie training<br>Furniture Craftsman training — 2026',
      intro: `<p class="mb-4">I am Raven Cho (@raven_deadwire), a bassist, vocalist and composer whose instrument-design work begins with problems encountered in recording, rehearsal and live performance.</p><p class="mb-4">I studied philosophy at Yonsei University, and I use that background less as a credential than as a working method: define the question, separate assumptions from evidence, and connect form, material and use without treating tradition as proof by itself. DEADWIRE, my melodic-death-metal project, is the practical environment in which many RavenForge questions are tested conceptually.</p><p>I am currently developing RavenForge as an independent instrument-design and lutherie research project while continuing hands-on repair, setup and prototype training. The published models are design proposals under development, not claims of finished production performance.</p>`,
      brandMain: `<p class="mb-4 mt-4"><strong>RavenForge is currently an independent instrument-design and lutherie research project.</strong> It explores how a player’s musical narrative, physical interaction and real performance context can be translated into instrument geometry, material choices and electronics. “Form follows narrative” is used here as a design method, not as a claim that a concept has already been validated in production.</p><p class="mb-4">The project does not impose one construction recipe on every model. EDDA, EMBLA and ASKR are treated as separate platforms with different structural and electronic priorities. Material choices are evaluated through availability, stability, mass, mechanical properties, machinability and the requirements of each build; tonal claims remain hypotheses until they can be measured or evaluated on a completed prototype.</p><p class="mb-4">The shared design direction is a bass that remains articulate in a dense mix: controlled low-frequency response, useful midrange definition, practical ergonomics and serviceable construction. Those are design targets that guide CAD, component selection and future prototype validation.</p><p>Specifications published on this site represent current design intent. They may change through fabrication, measurement, setup and playing evaluation.</p>`,
      whyNorse: '<p>Askr, Embla and Edda provide a narrative framework for the model families, but the mythology does not substitute for engineering evidence. Material and structural decisions are documented separately through research logs, measured constraints and prototype development.</p>',
      whyUs: '<p>RavenForge starts from practical questions encountered by a working musician: definition in dense arrangements, reach and balance, tuning stability, control layout, maintenance and repeatable setup. The aim is to turn those questions into explicit design requirements and then test them rather than present unbuilt concepts as proven solutions.</p>',
      edge: '<p>The technical targets are structural stability appropriate to each model, controlled mass and balance, clear low-frequency behaviour, useful midrange projection and electronics chosen for the intended signal chain. Laminated necks, chambering and other construction methods are options only when they serve those requirements; their value is to be assessed through the prototype and measurement process.</p>',
      embla: 'Designed as the broadest, most responsive platform: balance, sensitivity and a wide usable range are targets to be validated through the prototype.',
      askr: 'Designed for down-tuning and high-gain use, with attack, low-note definition and stage practicality treated as measurable design targets.',
      edda: 'Designed to revisit heritage-oriented bass language through modern ergonomics and flexible electronics without treating vintage convention as a fixed answer.',
      stageLabel: 'CURRENT PROJECT STAGE',
      stageText: 'Design / research phase — published specifications are provisional until fabrication and prototype validation.'
    },
    de: {
      sectionEyebrow: 'MUSIKER / DESIGNER / LUTHIER IN AUSBILDUNG',
      sectionTitle: 'Ausgewählte Veröffentlichungen & Live-Performance',
      sectionIntro: 'RavenForge entsteht aus Instrumenten, die tatsächlich bei Aufnahmen, Proben und auf der Bühne eingesetzt werden. Diese Auswahl zeigt die musikalische Praxis hinter der Konstruktionsforschung.',
      releaseLabel: 'VERÖFFENTLICHUNG',
      listen: 'Anhören',
      performanceLabel: 'LIVE / PERFORMANCE',
      performanceTitle: 'DEADWIRE — INTO THE LIVE Vol.18',
      performanceMeta: 'Sinchon Deep Purple · Seoul · 20. Juni 2026',
      performanceDesc: 'Eine aktuelle DEADWIRE-Bühne: Bass, Gesang und der High-Gain-Bandkontext, aus dem viele praktische RavenForge-Fragen entstehen.',
      watch: 'Performance-Videos ansehen',
      profileTitle: 'Aktuelles Profil',
      nameLabel: 'Künstlername',
      name: "'raven / Raven Cho",
      occupationLabel: 'Aktuelle Rollen',
      occupation: 'Musiker · Bassist & Sänger · Komponist · Instrumentendesigner · Luthier in Ausbildung',
      careerLabel: 'Musik',
      career: 'DEADWIRE — Bass & Gesang / Komposition / Management<br>Ehemaliger Bassist: Hate Device / Purgatorium',
      trainingLabel: 'Gitarrenbau / Handwerk',
      training: 'Berklee GT Repair — praktische Reparatur- und Setup-Ausbildung<br>Moon Guitar — Prototypenentwicklung und Gitarrenbau-Ausbildung<br>Möbelschreiner-Ausbildung — 2026',
      intro: `<p class="mb-4">Ich bin Raven Cho (@raven_deadwire), Bassist, Sänger und Komponist. Meine Arbeit am Instrumentendesign beginnt mit Problemen, die bei Aufnahmen, Proben und Live-Auftritten tatsächlich auftreten.</p><p class="mb-4">Ich habe Philosophie an der Yonsei University studiert und nutze diesen Hintergrund vor allem als Arbeitsmethode: die Frage definieren, Annahmen von Belegen trennen und Form, Material und Nutzung miteinander verbinden, ohne Tradition selbst als Beweis zu behandeln. DEADWIRE, mein Melodic-Death-Metal-Projekt, bildet den praktischen Kontext vieler RavenForge-Fragen.</p><p>RavenForge entwickle ich derzeit als unabhängiges Forschungs- und Designprojekt für Instrumentenbau, parallel zu praktischer Reparatur-, Setup- und Prototypenausbildung. Die veröffentlichten Modelle sind Entwicklungsentwürfe und keine Behauptungen über bereits validierte Serienleistung.</p>`,
      brandMain: `<p class="mb-4 mt-4"><strong>RavenForge ist derzeit ein unabhängiges Forschungs- und Designprojekt für Instrumentenbau.</strong> Untersucht wird, wie musikalische Erzählung, körperliche Interaktion und reale Bühnensituationen in Geometrie, Materialwahl und Elektronik übersetzt werden können. „Form follows narrative“ dient als Entwurfsmethode und nicht als Behauptung einer bereits validierten Serienlösung.</p><p class="mb-4">Das Projekt zwingt nicht jedem Modell dieselbe Konstruktionsformel auf. EDDA, EMBLA und ASKR werden als eigenständige Plattformen mit unterschiedlichen strukturellen und elektronischen Prioritäten entwickelt. Materialien werden nach Verfügbarkeit, Stabilität, Masse, mechanischen Eigenschaften, Bearbeitbarkeit und den Anforderungen des jeweiligen Builds bewertet; Klangbehauptungen bleiben Hypothesen, bis sie an einem fertigen Prototyp gemessen oder spielerisch bewertet werden können.</p><p class="mb-4">Die gemeinsame Richtung ist ein Bass, der sich in dichten Arrangements klar verhält: kontrollierter Tieftonbereich, nutzbare Mittenzeichnung, praktische Ergonomie und wartungsfreundliche Konstruktion. Diese Punkte sind Entwicklungsziele für CAD, Komponentenauswahl und spätere Prototypenvalidierung.</p><p>Die auf dieser Website veröffentlichten Spezifikationen geben den aktuellen Konstruktionsstand wieder und können sich durch Fertigung, Messung, Setup und Spieltests ändern.</p>`,
      whyNorse: '<p>Askr, Embla und Edda bilden einen narrativen Rahmen für die Modellfamilien; Mythologie ersetzt jedoch keine technische Evidenz. Material- und Strukturentscheidungen werden separat über Forschungslogs, messbare Randbedingungen und Prototypenentwicklung dokumentiert.</p>',
      whyUs: '<p>RavenForge beginnt bei praktischen Fragen eines aktiven Musikers: Definition in dichten Arrangements, Reichweite und Balance, Stimmstabilität, Bedienlayout, Wartung und reproduzierbares Setup. Ziel ist es, daraus explizite Anforderungen zu formulieren und zu testen, statt unfertige Konzepte als bewiesene Lösungen darzustellen.</p>',
      edge: '<p>Technische Ziele sind modellspezifische Strukturstabilität, kontrollierte Masse und Balance, klares Tieftonverhalten, nutzbare Mittenprojektion und eine zum vorgesehenen Signalweg passende Elektronik. Laminathälse, Kammerung und andere Bauweisen werden nur eingesetzt, wenn sie diesen Anforderungen dienen; ihr Nutzen wird im Prototypen- und Messprozess bewertet.</p>',
      embla: 'Als breit einsetzbare und reaktionsschnelle Plattform entworfen; Balance, Sensibilität und ein großer nutzbarer Bereich sind Ziele der späteren Prototypenvalidierung.',
      askr: 'Für Down-Tuning und High-Gain entwickelt; Attack, Definition tiefer Noten und Bühnentauglichkeit werden als überprüfbare Konstruktionsziele behandelt.',
      edda: 'Eine Neuinterpretation heritage-orientierter Basssprache mit moderner Ergonomie und flexibler Elektronik, ohne Vintage-Konventionen als endgültige Antwort zu behandeln.',
      stageLabel: 'AKTUELLER PROJEKTSTAND',
      stageText: 'Design- und Forschungsphase — veröffentlichte Spezifikationen bleiben bis zur Fertigung und Prototypenvalidierung vorläufig.'
    },
    ko: {
      sectionEyebrow: 'MUSICIAN / DESIGNER / LUTHIER IN TRAINING',
      sectionTitle: '주요 발매작 및 공연',
      sectionIntro: 'RavenForge의 설계는 실제 녹음·합주·공연에서 악기를 사용하며 마주친 문제에서 출발합니다. 아래 작업은 설계 연구의 바탕이 되는 음악 활동을 보여줍니다.',
      releaseLabel: 'RELEASE',
      listen: '음원 듣기',
      performanceLabel: 'LIVE / PERFORMANCE',
      performanceTitle: 'DEADWIRE — INTO THE LIVE Vol.18',
      performanceMeta: '신촌 딥퍼플 · 서울 · 2026.06.20',
      performanceDesc: '베이스와 보컬, 그리고 하이게인 밴드 믹스라는 실제 사용 환경에서 RavenForge의 실전 설계 질문들이 출발합니다.',
      watch: '공연 영상 보기',
      profileTitle: '현재 프로필',
      nameLabel: '활동명',
      name: "'raven / Raven Cho",
      occupationLabel: '현재 역할',
      occupation: '뮤지션 · 베이시스트 & 보컬 · 작곡가 · 악기 디자이너 · 루씨어 수련생',
      careerLabel: '음악 활동',
      career: 'DEADWIRE — Bass & Vocal / 작곡 / 매니지먼트<br>전 Hate Device / Purgatorium 베이시스트',
      trainingLabel: '리페어 및 제작',
      training: 'Berklee GT Repair — 리페어·셋업 실무 견습<br>Moon Guitar — 프로토타입 개발 및 제작 수련<br>가구기능사 과정 — 2026',
      intro: `<p class="mb-4">안녕하세요, Raven Cho(@raven_deadwire)입니다. 베이스와 보컬, 작곡을 해온 뮤지션으로서 제 악기 설계는 녹음·합주·공연에서 실제로 마주친 문제에서 출발합니다.</p><p class="mb-4">연세대학교에서 철학을 전공했고, 이 배경을 단순한 이력보다 작업 방법으로 활용하고 있습니다. 질문을 명확히 정의하고, 가정과 근거를 분리하며, 전통 자체를 증거로 삼지 않은 채 형태·재료·사용 맥락을 연결하려 합니다. 멜로딕 데스 메탈 프로젝트 DEADWIRE는 RavenForge의 많은 설계 질문이 생겨나는 실제 음악 환경입니다.</p><p>현재 RavenForge는 독립적인 악기 설계·루씨어리 연구 프로젝트로 개발 중이며, 리페어·셋업과 프로토타입 제작 수련을 병행하고 있습니다. 홈페이지에 공개된 모델은 개발 중인 설계안이며, 아직 완성된 양산 제품의 성능을 주장하는 것이 아닙니다.</p>`,
      brandMain: `<p class="mb-4 mt-4"><strong>RavenForge는 현재 독립적인 악기 설계·루씨어리 연구 프로젝트입니다.</strong> 연주자의 음악적 서사와 신체적 상호작용, 실제 공연 환경을 악기의 기하 구조·재료 선택·전자계로 어떻게 번역할 수 있는지를 탐구합니다. ‘형태는 서사를 따른다(Form follows narrative)’는 완성품의 성능을 선언하는 문구가 아니라 설계 방법론으로 사용합니다.</p><p class="mb-4">모든 모델에 하나의 구조 공식을 강제하지 않습니다. EDDA, EMBLA, ASKR은 서로 다른 구조적·전자적 우선순위를 가진 개별 플랫폼으로 다룹니다. 재료는 수급성, 안정성, 중량, 기계적 물성, 가공성과 각 빌드의 요구조건을 기준으로 평가하며, 음향적 주장은 완성된 프로토타입에서 측정하거나 연주 평가를 거치기 전까지 가설로 남겨둡니다.</p><p class="mb-4">공통 설계 방향은 복잡한 합주에서도 명료함을 유지하는 베이스입니다. 제어된 저역 응답, 유효한 미드레인지 존재감, 실전적인 인체공학, 정비 가능한 구조를 설계 목표로 삼고 CAD·부품 선정·향후 프로토타입 검증에 연결합니다.</p><p>이 사이트의 공개 사양은 현재의 설계 의도를 나타내며, 실제 제작·측정·셋업·연주 평가를 거치면서 변경될 수 있습니다.</p>`,
      whyNorse: '<p>Askr, Embla, Edda는 모델군을 구분하는 서사적 프레임입니다. 신화가 공학적 근거를 대신하지는 않습니다. 재료와 구조에 대한 판단은 연구일지, 측정 가능한 제약조건, 프로토타입 개발 과정을 통해 별도로 기록합니다.</p>',
      whyUs: '<p>RavenForge는 실제 연주자가 마주치는 문제에서 출발합니다. 복잡한 합주에서의 명료도, 리치와 밸런스, 튜닝 안정성, 컨트롤 배치, 정비성과 반복 가능한 셋업을 명시적 설계 요구사항으로 바꾸고 검증하는 것이 목표입니다. 아직 제작되지 않은 개념을 이미 입증된 해결책처럼 제시하지 않습니다.</p>',
      edge: '<p>기술적 목표는 모델에 맞는 구조 안정성, 제어된 중량과 밸런스, 명확한 저역 거동, 유효한 미드레인지 투사, 사용 신호 체인에 맞는 전자계입니다. 라미네이트 넥·체임버링 등의 구조는 그 요구조건에 기여할 때만 적용하며, 실제 효용은 프로토타입 제작과 측정 과정에서 평가합니다.</p>',
      embla: '가장 폭넓고 반응성이 높은 플랫폼을 목표로 설계합니다. 밸런스·민감도·넓은 활용 범위는 향후 프로토타입에서 검증할 설계 목표입니다.',
      askr: '다운튜닝과 하이게인 환경을 목표로 하며, 어택·저음 정의감·무대 실전성을 측정·평가 가능한 설계 목표로 다룹니다.',
      edda: '빈티지 관습을 고정된 정답으로 두지 않고, 헤리티지 지향의 베이스 언어를 현대적 인체공학과 유연한 전자계로 재검토합니다.',
      stageLabel: 'CURRENT PROJECT STAGE',
      stageText: '설계·연구 단계 — 공개 사양은 실제 제작 및 프로토타입 검증 전까지 잠정안입니다.'
    }
  };

  const releases = [
    { year: '2026', artist: 'DEADWIRE', title: 'From Destiny They Called', meta: 'EP · Bass / Vocal / Composition', url: 'https://music.bugs.co.kr/album/20806769' },
    { year: '2023', artist: "'raven", title: 'DEADWIRE Ⅱ: A Warrior Betrayed Us', meta: 'EP · Bass / Vocal / Composition', url: 'https://music.bugs.co.kr/album/20597516' },
    { year: '2023', artist: "'raven", title: 'DEADWIRE Ⅰ: Revenant Raven', meta: 'EP · Bass / Vocal / Composition', url: 'https://music.bugs.co.kr/album/20592334' }
  ];

  const currentLanguage = () => copy[document.documentElement.lang] ? document.documentElement.lang : 'en';

  function installStyles() {
    if (document.getElementById('rf-profile-enhancement-style')) return;
    const style = document.createElement('style');
    style.id = 'rf-profile-enhancement-style';
    style.textContent = `
      .rf-profile-feature { margin: .25rem 0 2.5rem; padding-bottom: 2.5rem; border-bottom: 1px solid var(--rf-line); }
      .rf-profile-feature-head { display:grid; grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr); gap:2rem; align-items:end; margin-bottom:1.5rem; }
      .rf-profile-feature .rf-eyebrow { color:var(--rf-accent); margin:0 0 .6rem; }
      .rf-profile-feature h3 { margin:0; font-size:clamp(2rem,4vw,3.15rem); line-height:1.1; letter-spacing:-.035em; }
      .rf-profile-feature-intro { margin:0; color:var(--rf-muted); line-height:1.75; }
      .rf-release-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1rem; }
      .rf-release-card { display:flex; flex-direction:column; min-height:15.5rem; padding:1.2rem; background:#15242b; border:1px solid #3d5058; color:#eef4f1; text-decoration:none; transition:transform 160ms ease,border-color 160ms ease; }
      .rf-release-card:hover { transform:translateY(-2px); border-color:#b88965; }
      .rf-release-label { display:flex; justify-content:space-between; gap:.5rem; color:#c9956e; font-size:.72rem; letter-spacing:.12em; text-transform:uppercase; }
      .rf-release-card h4 { margin:auto 0 .55rem; color:#fff; font-size:1.22rem; line-height:1.25; }
      .rf-release-artist { margin:0 0 .35rem; color:#cbd5d1; font-size:.85rem; }
      .rf-release-meta { margin:0; color:#aebcb8; font-size:.8rem; line-height:1.5; }
      .rf-release-link { margin-top:1rem; padding-top:.75rem; border-top:1px solid rgb(218 229 225 / .16); color:#e4b38e; font-size:.84rem; }
      .rf-performance-card { display:grid; grid-template-columns:minmax(10rem,.72fr) minmax(0,1.28fr); margin-top:1rem; border:1px solid var(--rf-line); background:rgb(248 249 246 / .55); }
      .rf-performance-visual { min-height:14rem; display:flex; flex-direction:column; justify-content:space-between; padding:1.25rem; background:linear-gradient(135deg,#101b23,#273a43); color:#fff; }
      .rf-performance-visual strong { font-size:clamp(1.55rem,3vw,2.5rem); line-height:1.02; letter-spacing:-.04em; }
      .rf-performance-visual span { color:#d6b293; font-size:.75rem; letter-spacing:.14em; }
      .rf-performance-copy { padding:1.35rem 1.5rem; display:flex; flex-direction:column; justify-content:center; }
      .rf-performance-copy .rf-eyebrow { margin-bottom:.45rem; }
      .rf-performance-copy h4 { margin:0 0 .4rem; font-size:1.3rem; }
      .rf-performance-meta { color:var(--rf-muted); font-size:.85rem; margin:0 0 .9rem; }
      .rf-performance-copy p { color:var(--rf-muted); margin:0 0 1rem; }
      .rf-performance-copy a { align-self:flex-start; border-bottom:1px solid var(--rf-accent); color:var(--rf-ink); padding:.35rem 0; font-weight:600; }
      .rf-project-stage { margin:1rem 0 2rem; padding:1rem 1.1rem; border-left:3px solid #c9956e; background:#eef1ef; }
      .rf-project-stage strong { display:block; margin-bottom:.25rem; font-size:.74rem; letter-spacing:.12em; color:#7b4a2d; }
      .rf-project-stage p { margin:0; color:var(--rf-muted); font-size:.92rem; }
      @media (max-width:800px) { .rf-release-grid { grid-template-columns:1fr; } .rf-release-card { min-height:11rem; } .rf-profile-feature-head,.rf-performance-card { grid-template-columns:1fr; } .rf-performance-visual { min-height:10rem; } }
    `;
    document.head.append(style);
  }

  function buildFeatureSection(t) {
    const section = document.createElement('section');
    section.className = 'rf-profile-feature';
    section.dataset.rfProfileFeature = 'true';
    const cards = releases.map((release, index) => `
      <a class="rf-release-card" href="${release.url}" target="_blank" rel="noopener noreferrer">
        <div class="rf-release-label"><span>${t.releaseLabel} ${String(index + 1).padStart(2,'0')}</span><span>${release.year}</span></div>
        <h4>${release.title}</h4>
        <p class="rf-release-artist">${release.artist}</p>
        <p class="rf-release-meta">${release.meta}</p>
        <span class="rf-release-link">${t.listen} →</span>
      </a>`).join('');
    section.innerHTML = `
      <div class="rf-profile-feature-head">
        <div><p class="rf-eyebrow">${t.sectionEyebrow}</p><h3>${t.sectionTitle}</h3></div>
        <p class="rf-profile-feature-intro">${t.sectionIntro}</p>
      </div>
      <div class="rf-release-grid">${cards}</div>
      <article class="rf-performance-card">
        <div class="rf-performance-visual"><span>${t.performanceLabel}</span><strong>DEADWIRE<br>LIVE</strong></div>
        <div class="rf-performance-copy">
          <p class="rf-eyebrow">${t.performanceLabel}</p>
          <h4>${t.performanceTitle}</h4>
          <p class="rf-performance-meta">${t.performanceMeta}</p>
          <p>${t.performanceDesc}</p>
          <a href="https://www.youtube.com/@raven_deadwire/videos" target="_blank" rel="noopener noreferrer">${t.watch} →</a>
        </div>
      </article>`;
    return section;
  }

  function setHtml(selector, value) {
    const node = document.querySelector(selector);
    if (!node) return;
    node.innerHTML = value;
  }

  function render() {
    const t = copy[currentLanguage()];
    const bio = document.getElementById('about-content-bio');
    if (bio) {
      bio.querySelector('[data-rf-profile-feature]')?.remove();
      bio.prepend(buildFeatureSection(t));
      setHtml('#about-content-bio [data-lang-key="bioProfileTitle"]', t.profileTitle);
      setHtml('#about-content-bio [data-lang-key="bioNameLabel"]', t.nameLabel);
      setHtml('#about-content-bio [data-lang-key="bioNameValue"]', t.name);
      setHtml('#about-content-bio [data-lang-key="bioOccupationLabel"]', t.occupationLabel);
      setHtml('#about-content-bio [data-lang-key="bioOccupationValue"]', t.occupation);
      setHtml('#about-content-bio [data-lang-key="bioCareerLabel"]', t.careerLabel);
      setHtml('#about-content-bio [data-lang-key="bioCareerValue"]', t.career);
      setHtml('#about-content-bio [data-lang-key="bioTrainingLabel"]', t.trainingLabel);
      setHtml('#about-content-bio [data-lang-key="bioTrainingValue"]', t.training);
    }

    setHtml('#about-content-intro [data-lang-key="introContent"]', t.intro);
    setHtml('#about-content-brand [data-lang-key="brandMainDesc"]', t.brandMain);
    setHtml('#about-content-brand [data-lang-key="brandWhyNorseContent"]', t.whyNorse);
    setHtml('#about-content-brand [data-lang-key="brandWhyUsContent"]', t.whyUs);
    setHtml('#about-content-brand [data-lang-key="brandEdgeContent"]', t.edge);
    setHtml('#about-content-brand [data-lang-key="brandEmblaPhilosophy"]', t.embla);
    setHtml('#about-content-brand [data-lang-key="brandAskrPhilosophy"]', t.askr);
    setHtml('#about-content-brand [data-lang-key="brandEddaPhilosophy"]', t.edda);

    const brand = document.getElementById('about-content-brand');
    if (brand) {
      brand.querySelector('[data-rf-project-stage]')?.remove();
      const desc = brand.querySelector('[data-lang-key="brandMainDesc"]');
      if (desc) {
        const stage = document.createElement('div');
        stage.className = 'rf-project-stage';
        stage.dataset.rfProjectStage = 'true';
        stage.innerHTML = `<strong>${t.stageLabel}</strong><p>${t.stageText}</p>`;
        desc.insertAdjacentElement('afterend', stage);
      }
    }
  }

  function init() {
    installStyles();
    render();
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();