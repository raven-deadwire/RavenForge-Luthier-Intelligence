(()=>{'use strict';
const R=document.documentElement;
const F={
  en:{contact:'Contact',updated:'Last Updated'},
  de:{contact:'Kontakt',updated:'Zuletzt aktualisiert'},
  ko:{contact:'연락',updated:'마지막 업데이트'}
};
const T={
  en:['All','Luthiers & Builders','Technology & Components','Builder','Technology','No analysis subjects match this category.'],
  de:['Alle','Gitarrenbauer','Technik & Komponenten','Gitarrenbauer','Technik','Keine Analyseobjekte entsprechen dieser Kategorie.'],
  ko:['전체','제작가','기술·부품','제작가','기술·부품','이 카테고리에 해당하는 분석 대상이 없습니다.']
};
const M='Moon Guitar — Chanho Moon',N='Nova — Innovative Pickup Systems',Z='ZUTA Group';
let K='all';
const lang=()=>T[R.lang]?R.lang:'en';
const put=(a,e)=>{const i=a.findIndex(x=>x.name===e.name);i<0?a.push(e):a[i]=e};

function install(){
  if(typeof translations!=='object')return;
  const regions={
    en:['All','Europe','USA','Asia','Other'],
    de:['Alle','Europa','USA','Asien','Andere'],
    ko:['전체','유럽','미국','아시아','기타']
  };
  ['en','de','ko'].forEach(l=>{
    const t=translations[l],r=regions[l];
    t.filterRegions={all:r[0],europe:r[1],usa:r[2],asia:r[3],other:r[4]};
    t.filterThemes.Methodology=l==='ko'?'연구 & 방법론':l==='de'?'Forschung & Methodik':'Research & Methodology';
    t.filterThemes.Amplification=l==='ko'?'앰프':l==='de'?'Verstärkung':'Amplification';
    t.filterThemes.Effects=l==='ko'?'이펙트':l==='de'?'Effekte':'Effects';
    t.analysisTitle=l==='ko'?'분석 및 탐색 (Analysis & Exploration)':l==='de'?'Analyse & Exploration':'Analysis & Exploration';
    t.innovationTitle=l==='ko'?'핵심 연구 테마 분석':l==='de'?'Analyse zentraler Forschungsthemen':'Key Research Theme Analysis';
    t.innovationDesc=l==='ko'
      ?'제작가와 기술·부품 메이커를 동일한 연구 테마로 비교합니다. 위 카테고리를 선택하면 차트와 탐색 결과가 함께 전환됩니다.'
      :l==='de'
      ?'Gitarrenbauer sowie Technik- und Komponentenhersteller werden anhand derselben Forschungsthemen verglichen. Die Kategorien oben aktualisieren Diagramm und Explorer gemeinsam.'
      :'Compare builders and technology/component makers across the same research themes. The category tabs above update both the chart and the explorer.';
    t.explorerTitle=l==='ko'?'분석 대상 탐색 (Analysis Explorer)':l==='de'?'Analyse-Explorer':'Analysis Explorer';
    t.explorerDesc=l==='ko'
      ?'지역과 연구 테마로 제작가 및 기술·부품 메이커를 탐색할 수 있습니다. 카드를 선택하면 상세 분석을 확인할 수 있습니다.'
      :l==='de'
      ?'Erkunden Sie Gitarrenbauer sowie Technik- und Komponentenhersteller nach Region und Forschungsthema.'
      :'Explore builders and technology/component makers by region and research theme.';
    t.chartLabel=l==='ko'?'관련 분석 대상 수':l==='de'?'Anzahl zugehöriger Analyseobjekte':'# of Analysis Subjects';
    t.chartTooltip=c=>l==='ko'?` ${c.raw}개 분석 대상`:l==='de'?` ${c.raw} Analyseobjekte`:` ${c.raw} subjects`;
    t.noLuthierMatch=l==='ko'?'조건에 맞는 분석 대상이 없습니다.':l==='de'?'Keine passenden Analyseobjekte gefunden.':'No matching analysis subjects found.';
    t.relatedLuthiersLabel=l==='ko'?'관련 분석 대상:':l==='de'?'Verwandte Analyseobjekte:':'Related analysis subjects:';
    (t.luthierData||[]).forEach(x=>x.entityType=x.entityType||'luthier');
  });

  translations.en.questsDesc='The strategic initiatives below translate lessons from builders and technology research into testable directions for RavenForge.';
  translations.de.questsDesc='Die folgenden strategischen Initiativen übersetzen Erkenntnisse aus Gitarrenbau- und Technologieforschung in überprüfbare Richtungen für RavenForge.';
  translations.ko.questsDesc='아래의 전략 과제들은 제작가와 기술 연구에서 얻은 배움을 RavenForge의 검증 가능한 개발 방향으로 전환합니다.';

  const moon={
    en:{c:'South Korea',s:'Moon Guitar treats handcraft not as an end in itself, but as a way to create an instrument with a reason to exist. Chanho Moon centers his practice on controlled comparison, accumulated material data, and an individual sound and narrative.',d:`<p><strong>For Chanho Moon, “handmade” alone is not a sufficient value proposition.</strong> A custom instrument should offer a sound, response and identity that are not already available off the shelf.</p><p>His method is empirical: compare builds under controlled conditions, change as few variables as possible, and accumulate the results as working data. He applies the same principle to wood, treating pieces of the same species as potentially different materials according to origin, density, stiffness and elasticity.</p><p><strong>RavenForge relevance:</strong> isolate variables, compare prototypes, record material behavior, and let differentiation emerge from verified function and musical intent. This directly complements <em>Form follows narrative</em>.</p>`},
    de:{c:'Südkorea',s:'Bei Moon Guitar ist Handarbeit kein Selbstzweck, sondern ein Mittel, ein Instrument mit eigener Existenzberechtigung zu schaffen. Kontrollierte Vergleiche, Materialdaten und ein eigenständiger Klang stehen im Zentrum.',d:`<p><strong>Für Chanho Moon ist „handgemacht“ allein noch kein ausreichender Wert.</strong> Ein Custom-Instrument sollte Klang, Ansprache und Identität bieten, die nicht bereits von der Stange erhältlich sind.</p><p>Seine Methode ist empirisch: Builds unter kontrollierten Bedingungen vergleichen, möglichst wenige Variablen verändern und Ergebnisse als Arbeitsdaten sammeln.</p><p><strong>Bedeutung für RavenForge:</strong> Variablen isolieren, Prototypen vergleichen und Materialverhalten dokumentieren. Das ergänzt unmittelbar <em>Form follows narrative</em>.</p>`},
    ko:{c:'대한민국',s:'문기타의 제작 철학에서 핸드메이드는 그 자체가 목적이 아닙니다. 문찬호 사장님의 작업은 통제된 비교와 축적된 재료 데이터, 그리고 기존 브랜드에서 그대로 살 수 없는 개별적인 소리와 서사를 통해 커스텀 악기의 존재 이유를 만들어 가는 데 중심을 둡니다.',d:`<p><strong>문찬호 사장님의 핵심 관점에서 ‘손으로 만들었다’는 사실만으로는 커스텀 악기의 가치가 성립하지 않습니다.</strong> 커스텀 악기는 이미 존재하는 유명 브랜드의 복제품이 아니라 시중에서 찾기 어려운 소리와 반응, 정체성을 제시해야 합니다.</p><p>제작 방법론은 매우 경험적입니다. 조건을 통제하고 변수를 최소화한 비교 제작을 통해 결과를 확인하며, 이를 다음 제작을 위한 데이터로 축적합니다. 목재 역시 수종 이름만으로 판단하지 않고 개체별 특성을 함께 살펴야 한다고 봅니다.</p><p><strong>RavenForge에서의 의미:</strong> 특정 형상이나 제작법의 모방이 아니라 제작을 검증 가능한 연구 과정으로 다루는 태도입니다. 이는 <em>Form follows narrative</em> 원칙과 직접 연결됩니다.</p>`}
  };

  const nova={
    en:{c:'Germany',s:'Nova develops contemporary pickup systems in Hanover, Germany, using modular multi-coil architecture to pursue clarity, hum control and flexible voicing.',d:`<p><strong>Nova approaches the pickup as an engineered system rather than a fixed vintage recipe.</strong> The Omnia platform uses a four-coil rail architecture designed for clarity, transparency, balance and broad wiring flexibility.</p><p>Omnia B4 MM is specified to remain hum-cancelling across its supported wiring options and to reduce the usual volume penalty when coils are split. Parallel operation is treated as a primary usable voice rather than an afterthought.</p><p><strong>RavenForge relevance:</strong> Nova is a reference for configurable signal-generating systems, flexible pickup layouts and multi-voice wiring instead of simply repeating legacy J/P/MM assumptions.</p><p class="text-sm text-slate-500 mt-4"><a href="https://www.nova-pickups.com/" target="_blank" rel="noopener">Official site</a> · <a href="https://www.nova-pickups.com/products/omnia-b4-mm" target="_blank" rel="noopener">Omnia B4 MM</a></p>`},
    de:{c:'Deutschland',s:'Nova entwickelt in Hannover zeitgemäße Tonabnehmersysteme. Modulare Mehrspulen-Architekturen verbinden Klarheit, Brummunterdrückung und flexible Voicings.',d:`<p><strong>Nova behandelt den Tonabnehmer als technisches System und nicht als unveränderliches Vintage-Rezept.</strong> Omnia nutzt eine Vier-Spulen-Rail-Architektur für Klarheit, Transparenz und flexible Verschaltung.</p><p>Der Omnia B4 MM soll in den vorgesehenen Schaltungen brummunterdrückend arbeiten und beim Splitten weniger Pegel verlieren. Parallelbetrieb wird als vollwertige Klangoption verstanden.</p><p><strong>Bedeutung für RavenForge:</strong> Nova ist eine Referenz für konfigurierbare Signalerzeuger, flexible Pickup-Layouts und Multi-Voice-Schaltungen.</p><p class="text-sm text-slate-500 mt-4"><a href="https://www.nova-pickups.com/" target="_blank" rel="noopener">Offizielle Website</a> · <a href="https://www.nova-pickups.com/products/omnia-b4-mm" target="_blank" rel="noopener">Omnia B4 MM</a></p>`},
    ko:{c:'독일',s:'Nova는 독일 하노버에서 현대적인 픽업 시스템을 개발합니다. 전통적인 픽업 공식을 반복하기보다 모듈형 멀티코일 구조를 통해 선명도, 험 억제와 유연한 보이싱을 함께 확보하는 방향을 추구합니다.',d:`<p><strong>Nova는 픽업을 고정된 빈티지 공식이 아니라 하나의 설계 가능한 전기 시스템으로 접근합니다.</strong> Omnia 플랫폼은 4코일 레일 구조를 사용하며 선명도, 투명도, 밸런스와 배선 유연성을 핵심으로 삼습니다.</p><p>Omnia B4 MM은 지원되는 배선에서 험캔슬링을 유지하도록 설계되며, 코일 스플릿 시 일반적인 픽업보다 볼륨 감소를 줄이는 것을 목표로 합니다. 병렬 연결 역시 적극적으로 사용할 수 있는 보이싱으로 다룹니다.</p><p><strong>RavenForge에서의 의미:</strong> Nova는 픽업을 교체 부품이 아니라 구성 가능한 신호 생성 시스템으로 보는 연구 사례입니다. 각 프로토타입의 목적에 맞춘 픽업 위치와 멀티보이스 배선 연구에 직접 연결됩니다.</p><p class="text-sm text-slate-500 mt-4"><a href="https://www.nova-pickups.com/" target="_blank" rel="noopener">공식 사이트</a> · <a href="https://www.nova-pickups.com/products/omnia-b4-mm" target="_blank" rel="noopener">Omnia B4 MM</a></p>`}
  };

  const zuta={
    en:{c:'Sweden',s:'ZUTA Group is best understood as an integrated analog signal ecosystem: onboard electronics, analog pedals, pedal infrastructure, studio utility devices and tube amplification are designed around the same priorities of headroom, low noise, serviceability and practical signal control.',d:`<p><strong>ZUTA Group extends far beyond onboard preamps.</strong> Its product ecosystem spans tube amplifiers, analog pedals, pedalboard and power infrastructure, DI/reamp and pro-audio utilities, as well as the CORE/LUXE onboard electronics.</p><p><strong>Amplification:</strong> boutique tube amplifiers are where ZUTA began. The LA25 combines a compact three-channel all-tube platform with a built-in Virtual Mic speaker simulator and reactive load, while the LA25 MKII adds an integrated re-amplifier, DI and multiple professional output levels. The GBG120 expands the concept to a four-channel high-power platform with multiple modes, serial and parallel effects loops and broad power-tube compatibility.</p><p><strong>Effects ecosystem:</strong> ZUTA currently groups a broad analog pedal line around the same “clean to extreme” philosophy. TRIAX combines up to 30 dB of clean boost, a fast gate and selectable EQ color; DUALITY combines vintage and modern overdrive circuits with gating; the wider line covers distortion, gate, compression, modulation and related tools. The Holy Rail pedalboard and isolated STRÖM power supply extend the concept from individual pedals into a mechanically and electrically integrated rig.</p><p><strong>Onboard and utility electronics:</strong> BASS CORE is a two-stage analog bass preamp with selectable mid targets, 9–18 V operation, high headroom and low noise. DI, reamp and pro-audio products show the same concern for interfacing instruments with stage and studio systems.</p><p><strong>RavenForge relevance:</strong> ZUTA is useful not merely as a preamp supplier but as a reference for <em>whole signal-chain design</em>: preserve a strong source signal, maintain headroom, shape deliberately, integrate stage/studio routing, and make every block of the rig serviceable. This expands RavenForge electronics research from onboard tone control toward instrument-to-amplifier system architecture.</p><p class="text-sm text-slate-500 mt-4"><a href="https://zutagroup.com/" target="_blank" rel="noopener">Official site</a> · <a href="https://zutagroup.com/collections/amplifiers" target="_blank" rel="noopener">Amplifiers</a> · <a href="https://zutagroup.com/collections/pedals" target="_blank" rel="noopener">Pedals</a> · <a href="https://zutagroup.com/products/zuta-bass-core" target="_blank" rel="noopener">BASS CORE</a></p>`},
    de:{c:'Schweden',s:'ZUTA Group lässt sich am treffendsten als integriertes analoges Signal-Ökosystem verstehen: Onboard-Elektronik, Analogpedale, Pedal-Infrastruktur, Studio-Utilities und Röhrenverstärkung folgen denselben Prioritäten aus Headroom, geringem Rauschen, Wartbarkeit und praktischer Signalkontrolle.',d:`<p><strong>ZUTA Group reicht weit über Onboard-Preamps hinaus.</strong> Das Ökosystem umfasst Röhrenverstärker, Analogpedale, Pedalboard- und Stromversorgungssysteme, DI/Reamp- und Pro-Audio-Werkzeuge sowie die CORE/LUXE-Onboard-Elektronik.</p><p><strong>Verstärkung:</strong> Boutique-Röhrenverstärker bilden den Ursprung der Marke. Der LA25 verbindet drei Kanäle mit Virtual-Mic-Simulation und reaktiver Last; der LA25 MKII ergänzt Re-Amplifier, DI und mehrere professionelle Ausgangspegel. Der GBG120 erweitert das Konzept auf vier Kanäle, verschiedene Modes, serielle und parallele Effektwege und eine breite Auswahl kompatibler Endröhren.</p><p><strong>Effekt-Ökosystem:</strong> TRIAX kombiniert bis zu 30 dB Clean-Boost, Gate und wählbare EQ-Färbungen; DUALITY verbindet Vintage- und Modern-Overdrive mit Gate. Hinzu kommen weitere Verzerrungs-, Gate-, Kompressions- und Modulationseffekte. Holy Rail und die isolierte STRÖM-Stromversorgung erweitern das Konzept vom Einzelpedal zum integrierten Rig.</p><p><strong>Onboard- und Utility-Elektronik:</strong> BASS CORE arbeitet als zweistufiger Analog-Preamp mit wählbaren Mittenfrequenzen, 9–18 V, hohem Headroom und niedrigem Rauschen. DI-, Reamp- und Pro-Audio-Produkte verfolgen dieselbe Schnittstellenlogik zwischen Instrument, Bühne und Studio.</p><p><strong>Bedeutung für RavenForge:</strong> ZUTA ist nicht nur ein Preamp-Lieferant, sondern eine Referenz für das Design der gesamten Signalkette: Quellsignal erhalten, Headroom sichern, gezielt formen, Stage-/Studio-Routing integrieren und die einzelnen Baugruppen wartbar halten.</p><p class="text-sm text-slate-500 mt-4"><a href="https://zutagroup.com/" target="_blank" rel="noopener">Offizielle Website</a> · <a href="https://zutagroup.com/collections/amplifiers" target="_blank" rel="noopener">Verstärker</a> · <a href="https://zutagroup.com/collections/pedals" target="_blank" rel="noopener">Pedale</a> · <a href="https://zutagroup.com/products/zuta-bass-core" target="_blank" rel="noopener">BASS CORE</a></p>`},
    ko:{c:'스웨덴',s:'ZUTA Group은 단순한 온보드 프리앰프 회사라기보다 하나의 통합 아날로그 신호 생태계로 보는 편이 정확합니다. 온보드 전자회로, 아날로그 이펙터, 페달보드와 전원 인프라, 스튜디오 유틸리티, 진공관 앰프가 높은 헤드룸·낮은 노이즈·정비성·실전적인 신호 제어라는 공통 철학 아래 연결됩니다.',d:`<p><strong>ZUTA Group의 범위는 온보드 프리앰프를 훨씬 넘어섭니다.</strong> 진공관 앰프, 아날로그 이펙터, 페달보드와 전원 시스템, DI/Reamp 및 프로오디오 유틸리티, 그리고 CORE/LUXE 계열 온보드 전자회로까지 하나의 신호 체인으로 전개합니다.</p><p><strong>앰프 생태계:</strong> ZUTA가 출발한 분야 자체가 부티크 진공관 앰프입니다. LA25는 3채널 올튜브 구조에 Virtual Mic 스피커 시뮬레이터와 리액티브 로드를 통합하고, LA25 MKII는 여기에 Re-Amplifier와 DI, 복수의 프로페셔널 출력 레벨까지 넣습니다. GBG120은 4채널, 다양한 모드, 직렬·병렬 FX 루프와 여러 종류의 파워관 운용까지 확장해 라이브와 스튜디오를 하나의 앰프 플랫폼에서 연결합니다.</p><p><strong>이펙터 생태계:</strong> TRIAX는 최대 30dB의 클린 부스트, 빠른 게이트와 4가지 EQ 컬러를 하나로 결합하고, DUALITY는 빈티지·모던 오버드라이브 회로와 게이트를 통합합니다. 이외에도 디스토션, 게이트, 컴프레션, 모듈레이션 계열까지 폭넓게 전개하며, Holy Rail 페달보드와 절연형 STRÖM 파워서플라이를 통해 개별 페달을 넘어 리그 전체의 기계적·전기적 통합까지 확장합니다.</p><p><strong>온보드 및 유틸리티:</strong> BASS CORE는 미드 주파수 선택, 9–18V 운용, 높은 헤드룸과 낮은 노이즈를 지향하는 2단 아날로그 프리앰프입니다. DI·Reamp·프로오디오 제품군 역시 악기와 무대·스튜디오 시스템 사이의 인터페이스를 같은 철학으로 다룹니다.</p><p><strong>RavenForge에서의 의미:</strong> ZUTA는 단순한 프리앰프 공급업체가 아니라 <em>전체 신호 체인을 설계하는 방식</em>의 연구 사례입니다. 픽업에서 강한 원 신호를 확보하고, 충분한 헤드룸을 유지한 뒤, 필요한 만큼 의도적으로 가공하고, 무대와 레코딩의 라우팅까지 통합하며, 각 블록을 정비 가능한 구조로 만드는 접근입니다. RavenForge의 전자 연구를 온보드 EQ 수준에서 ‘악기→이펙터→앰프/DI→레코딩’의 시스템 아키텍처로 확장하는 데 직접적인 참고가 됩니다.</p><p class="text-sm text-slate-500 mt-4"><a href="https://zutagroup.com/" target="_blank" rel="noopener">공식 사이트</a> · <a href="https://zutagroup.com/collections/amplifiers" target="_blank" rel="noopener">앰프</a> · <a href="https://zutagroup.com/collections/pedals" target="_blank" rel="noopener">이펙터</a> · <a href="https://zutagroup.com/products/zuta-bass-core" target="_blank" rel="noopener">BASS CORE</a></p>`}
  };

  ['en','de','ko'].forEach(l=>{
    const a=translations[l].luthierData||(translations[l].luthierData=[]);
    put(a,{name:M,country:moon[l].c,region:'asia',entityType:'luthier',tags:['Methodology','Wood','Structure','Customization','Aesthetics'],summary:moon[l].s,details:moon[l].d});
    put(a,{name:N,country:nova[l].c,region:'europe',entityType:'technology',tags:['Electronics','Customization','Methodology'],summary:nova[l].s,details:nova[l].d});
    put(a,{name:Z,country:zuta[l].c,region:'europe',entityType:'technology',tags:['Electronics','Amplification','Effects','Customization','Methodology'],summary:zuta[l].s,details:zuta[l].d});
    const c=new Intl.Collator(l==='ko'?'ko-KR':l,{sensitivity:'base',numeric:true});
    a.sort((x,y)=>c.compare(x.country||'',y.country||'')||c.compare(x.name||'',y.name||''));
  });

  translations.en.mentor2Name='Chanho Moon (Moon Guitar)';
  translations.en.mentor2Desc='<p>Chanho Moon of Moon Guitar is one of the luthiers under whom Raven studies instrument making in practice. His teaching emphasizes controlled comparison, material observation and accumulated build data, while insisting that a custom instrument should have its own reason to exist.</p>';
  translations.de.mentor2Name='Chanho Moon (Moon Guitar)';
  translations.de.mentor2Desc='<p>Chanho Moon von Moon Guitar ist einer der Gitarrenbauer, bei denen Raven den Instrumentenbau praktisch erlernt. Seine Lehre betont kontrollierte Vergleiche, Materialbeobachtung und gesammelte Baudaten sowie eine eigene Existenzberechtigung des Custom-Instruments.</p>';
  translations.ko.mentor2Name='문찬호 (Moon Guitar)';
  translations.ko.mentor2Desc='<p>문기타 문찬호 사장님은 Raven이 실제 제작 현장에서 악기 제작을 배우고 있는 스승 중 한 분입니다. 목재의 개체차를 관찰하고 조건을 통제한 비교 제작과 결과 기록을 통해 데이터를 축적하는 과정, 그리고 커스텀 악기가 스스로 존재할 이유와 고유한 소리를 가져야 한다는 점을 중요하게 가르칩니다.</p>';

  const q={
    en:{title:'Empirical Craft & Iterative Prototyping',content:'Treat instrument making as a cycle of hypothesis, controlled comparison, observation and accumulated data rather than craft intuition alone.',details:'<ul><li><strong>Controlled comparison:</strong> Change as few variables as possible between prototypes.</li><li><strong>Material records:</strong> Track individual material behavior.</li><li><strong>Validate differentiation:</strong> Adopt new solutions only when function and player feedback justify them.</li></ul>'},
    de:{title:'Empirischer Instrumentenbau & iteratives Prototyping',content:'Instrumentenbau wird als Kreislauf aus Hypothese, kontrolliertem Vergleich, Beobachtung und angesammelten Daten verstanden.',details:'<ul><li><strong>Kontrollierte Vergleiche:</strong> Möglichst wenige Variablen verändern.</li><li><strong>Materialdaten:</strong> Einzelnes Materialverhalten dokumentieren.</li><li><strong>Differenzierung verifizieren:</strong> Neue Lösungen nur bei nachweisbarem Nutzen einsetzen.</li></ul>'},
    ko:{title:'경험적 제작과 반복 프로토타이핑',content:'악기 제작을 장인의 직감만이 아니라 가설, 통제된 비교, 관찰, 데이터 축적이 반복되는 개발 사이클로 다룹니다.',details:'<ul><li><strong>통제된 비교 제작:</strong> 한 번에 바꾸는 변수를 가능한 한 줄입니다.</li><li><strong>개체별 재료 기록:</strong> 실제 물성과 반응을 기록합니다.</li><li><strong>차별화의 검증:</strong> 기능과 연주자 피드백으로 유효성을 확인합니다.</li></ul>'}
  };
  const et={en:'Expanding Electronics & Tonal Palette',de:'Erweiterung von Elektronik & Klangpalette',ko:'전자장치 및 톤 팔레트 확장'};
  ['en','de','ko'].forEach(l=>{
    const a=translations[l].proposalsData||(translations[l].proposalsData=[]),e={...q[l],related:[M]},i=a.findIndex(x=>x.title===e.title);
    i<0?a.unshift(e):a[i]=e;
    const p=a.find(x=>x.title===et[l]);
    if(p)p.related=[...new Set([...(p.related||[]),N,Z])];
  });
}

const L=()=>translations[lang()].luthierData||[];
const subset=()=>K==='all'?L():L().filter(x=>(x.entityType||'luthier')===K);

function tabs(){
  const c=T[lang()];
  document.querySelectorAll('#analysis-type-filter button').forEach((b,i)=>{
    const k=['all','luthier','technology'][i];
    b.textContent=c[i];
    b.classList.toggle('on',K===k);
    b.setAttribute('aria-pressed',K===k);
  });
}

function chart(){
  const e=document.getElementById('innovationChart');
  if(!e||typeof Chart==='undefined'||!Chart.getChart)return;
  const c=Chart.getChart(e);
  if(!c)return;
  const t=translations[lang()],keys=Object.keys(t.filterThemes||{}).filter(x=>x!=='all');
  const n=subset().flatMap(x=>x.tags||[]).reduce((a,x)=>(a[x]=(a[x]||0)+1,a),{});
  c.data.labels=keys.map(x=>t.filterThemes[x]||x);
  c.data.datasets[0].data=keys.map(x=>n[x]||0);
  c.data.datasets[0].label=t.chartLabel;
  c.update();
}

function cards(){
  const g=document.getElementById('luthier-grid');
  if(!g)return;
  const c=T[lang()],m=new Map(L().map(x=>[x.name,x.entityType||'luthier']));
  let old=document.getElementById('rf-type-empty'),n=0,v=0;
  g.querySelectorAll(':scope>div').forEach(d=>{
    const h=d.querySelector('h3');
    if(!h)return;
    n++;
    const k=m.get(h.textContent.trim())||'luthier',show=K==='all'||K===k;
    d.style.display=show?'':'none';
    if(show)v++;
    let b=d.querySelector('.rf-kind');
    if(!b){b=document.createElement('span');b.className='rf-kind';h.after(b);}
    b.textContent=k==='technology'?c[4]:c[3];
  });
  if(n&&!v){
    if(!old){old=document.createElement('p');old.id='rf-type-empty';old.className='col-span-full text-center text-slate-500 py-8';g.appendChild(old);}
    old.textContent=c[5];
  }else if(old)old.remove();
}

function apply(){tabs();chart();cards();}

function ui(){
  const a=document.getElementById('analysis'),h=a&&a.querySelector('h2');
  if(!h||document.getElementById('analysis-type-filter'))return;
  const w=document.createElement('div');
  w.id='analysis-type-filter';
  w.className='rf-type';
  ['all','luthier','technology'].forEach(k=>{
    const b=document.createElement('button');
    b.type='button';
    b.dataset.k=k;
    b.onclick=()=>{K=k;apply();};
    w.appendChild(b);
  });
  h.after(w);
  const s=document.createElement('style');
  s.textContent='.rf-type{display:flex;flex-wrap:wrap;gap:.55rem;margin:0 0 1.5rem}.rf-type button{min-height:42px;padding:.55rem 1rem;border:1px solid #cbd5e1;border-radius:3px;background:#fff;color:#334155;font-weight:600}.rf-type button.on{background:#1e293b;color:#fff;border-color:#1e293b}.rf-kind{display:inline-block;margin:.4rem 0 .55rem;padding:.18rem .48rem;border:1px solid #cbd5e1;border-radius:999px;color:#64748b;font-size:.72rem;font-weight:600}';
  document.head.appendChild(s);
  const g=document.getElementById('luthier-grid');
  if(g)new MutationObserver(cards).observe(g,{childList:true});
  apply();
}

function foot(){
  const l=F[R.lang]?R.lang:'en';
  document.querySelectorAll('[data-footer-key]').forEach(n=>{
    const k=n.dataset.footerKey;
    if(F[l][k])n.textContent=F[l][k];
  });
}

install();
foot();
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',ui):ui();
new MutationObserver(()=>{foot();setTimeout(apply);}).observe(R,{attributes:true,attributeFilter:['lang']});
})();