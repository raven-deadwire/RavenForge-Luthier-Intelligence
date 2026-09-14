(()=>{'use strict';
if(typeof translations!=='object')return;
const H={
 en:{focus:'Analysis focus',systems:'Representative design & technology',current:'Current review',rf:'RavenForge relevance'},
 de:{focus:'Analysefokus',systems:'Repräsentative Konstruktion & Technik',current:'Aktueller Stand',rf:'Bedeutung für RavenForge'},
 ko:{focus:'분석 관점',systems:'대표 설계·기술',current:'현재 검토',rf:'RavenForge에서의 의미'}
};
const specificCurrent={
 'Nova — Innovative Pickup Systems':{
  en:'RavenForge currently treats Nova as a high-priority co-development candidate rather than a simple parts vendor, with particular interest in custom magnet grades, multiscale/slanted geometry, split voicing and pickup-to-preamp integration.',
  de:'RavenForge betrachtet Nova derzeit als priorisierten Co-Development-Partner und nicht nur als Teilelieferanten – insbesondere für kundenspezifische Magnetgrade, Multiscale-/Slant-Geometrien, Split-Voicings und die Kopplung von Pickup und Preamp.',
  ko:'현재 RavenForge에서는 Nova를 단순 부품 공급사가 아니라 우선순위가 높은 공동개발 후보로 보고 있습니다. 커스텀 자석 등급, 멀티스케일·슬랜트 지오메트리, 스플릿 보이싱, 픽업과 프리앰프의 결합 설계를 중점적으로 검토하고 있습니다.'},
 'ZUTA Group':{
  en:'Current evaluation centers on the CORE/LUXE onboard platform and how its analog design language can extend from instrument electronics into pedals, DI/reamp and amplification without breaking signal-chain consistency.',
  de:'Aktuell liegt der Schwerpunkt auf CORE/LUXE und der Frage, wie sich dieselbe analoge Designsprache von der Onboard-Elektronik über Pedale und DI/Reamp bis zur Verstärkung konsistent fortsetzen lässt.',
  ko:'현재는 CORE/LUXE 온보드 플랫폼을 중심으로, 동일한 아날로그 설계 철학이 이펙터·DI/Reamp·앰프까지 이어질 때 전체 신호 체인의 일관성이 어떻게 유지되는지를 검토하고 있습니다.'},
 'Lusithand Devices':{
  en:'The Double NFP remains one of the primary filter-preamp references for EDDA, especially for evaluating per-pickup resonant filtering against more conventional boost/cut EQ architectures.',
  de:'Der Double NFP bleibt eine der wichtigsten Filter-Preamp-Referenzen für EDDA, insbesondere beim Vergleich pickup-spezifischer Resonanzfilter mit konventionellen Boost/Cut-EQs.',
  ko:'Double NFP는 EDDA의 핵심 필터 프리앰프 비교군 중 하나로 보고 있으며, 픽업별 공진 필터가 일반적인 부스트/컷 EQ와 어떤 차이를 만드는지 중점 검토하고 있습니다.'},
 'Underhill Bass Electronics':{
  en:'Underhill is being reviewed as an alternative EDDA architecture where buffers, pickup-specific filters and multicoil routing can be assembled as modular functional blocks.',
  de:'Underhill wird als alternative EDDA-Architektur geprüft, bei der Buffer, pickup-spezifische Filter und Multicoil-Routing als modulare Funktionsblöcke kombiniert werden.',
  ko:'Underhill은 버퍼·픽업별 필터·멀티코일 라우팅을 기능 블록처럼 조합할 수 있는 EDDA의 대안 전자계통으로 검토하고 있습니다.'},
 'Turner Pickups':{
  en:'Turner is a primary comparison target for EDDA multicoil work, particularly where per-string sensing and downstream routing matter more than a conventional internally summed pickup output.',
  de:'Turner ist eine zentrale Vergleichsreferenz für EDDAs Multicoil-Entwicklung, besonders wenn saitenweise Abtastung und nachgelagertes Routing wichtiger sind als ein intern summiertes Standardsignal.',
  ko:'Turner는 EDDA 멀티코일 연구의 주요 비교군으로 보고 있으며, 일반적인 내부 합산 출력보다 현별 감지와 후단 라우팅의 자유도가 중요한 경우를 중심으로 검토하고 있습니다.'},
 'Herrick Pickups':{
  en:'Herrick is being compared with Turner and Nova as a different path to multicoil construction, especially for custom coil counts, per-string humbuckers and chassis-driven magnetic structures.',
  de:'Herrick wird mit Turner und Nova als anderer Multicoil-Ansatz verglichen, insbesondere hinsichtlich variabler Spulenzahlen, Humbuckern pro Saite und chassisbasierter Magnetstrukturen.',
  ko:'Herrick은 Turner·Nova와 다른 멀티코일 구현 방식으로 비교하고 있으며, 커스텀 코일 수, 현당 험버커, 섀시 기반 자기회로를 중점적으로 보고 있습니다.'},
 'ACG Filter Electronics — John East':{
  en:'EQ01/DFM is used as a benchmark for translating classic filter-bass logic into a modern onboard system and for deciding how much control density is actually useful on a RavenForge instrument.',
  de:'EQ01/DFM dient als Benchmark dafür, klassische Filter-Bass-Logik in ein modernes Onboard-System zu übertragen und die sinnvolle Reglerdichte für RavenForge zu bestimmen.',
  ko:'EQ01/DFM은 클래식 필터 베이스의 논리를 현대적인 온보드 시스템으로 옮기는 방식과, RavenForge 악기에 어느 정도의 컨트롤 밀도가 실제로 유효한지를 판단하는 기준으로 사용하고 있습니다.'},
 'Fishman Fluence Bass':{
  en:'Fluence is being retained as the reference for a standardized active multi-voice platform, useful for comparing predefined electronic voices against passive/custom multicoil systems.',
  de:'Fluence bleibt die Referenz für eine standardisierte aktive Multi-Voice-Plattform und dient dem Vergleich definierter elektronischer Voices mit passiven beziehungsweise kundenspezifischen Multicoils.',
  ko:'Fluence는 표준화된 액티브 멀티보이스 플랫폼의 기준으로 유지하고 있으며, 미리 정의된 전자적 보이스와 패시브·커스텀 멀티코일 시스템을 비교하는 용도로 보고 있습니다.'},
 'KTS Musical Products — Titanium Reinforcement':{
  en:'KTS titanium reinforcement is under direct consideration for ASKR and EMBLA as a controlled alternative to carbon rods, with emphasis on neck response, mass and adjustability rather than tone claims.',
  de:'KTS-Titanverstärkungen werden für ASKR und EMBLA direkt als kontrollierte Alternative zu Carbonstäben geprüft – mit Fokus auf Halsverhalten, Masse und Einstellbarkeit statt auf Klangbehauptungen.',
  ko:'KTS 티타늄 보강재는 ASKR와 EMBLA에서 카본로드의 통제 비교 대상으로 직접 검토 중이며, 음색 주장보다 넥의 변형 거동·질량·조정성을 중심으로 평가하고 있습니다.'},
 'Payson Bass — Multi-Scale Hardware':{
  en:'The Payson fanned-fret bridge is already tied to the ASKR prototype direction, so current review focuses on real setup range, string compatibility, supply consistency and how the bridge behaves as part of the whole 37–34 inch system.',
  de:'Die Payson-Fanned-Fret-Brücke ist bereits mit dem ASKR-Prototyp verknüpft; aktuell stehen realer Einstellbereich, Saitenkompatibilität, Lieferkonsistenz und das Verhalten im gesamten 37–34-Zoll-System im Fokus.',
  ko:'Payson 팬프렛 브리지는 이미 ASKR 프로토타입 방향과 직접 연결되어 있어, 실제 셋업 범위·스트링 호환성·공급 안정성·37–34인치 전체 시스템 안에서의 거동을 중점 검토하고 있습니다.'},
 'Delano Pickup Systems':{
  en:'Delano is both a proven personal reference and a future design candidate: JMVC provides an existing hum-cancelling benchmark, while Xtender-type geometry is being considered for projects that need a less conventional sensing aperture.',
  de:'Delano ist sowohl bewährte persönliche Referenz als auch künftiger Designkandidat: JMVC dient als vorhandener Hum-Cancelling-Benchmark, während Xtender-Geometrien für weniger konventionelle Abtastfelder geprüft werden.',
  ko:'Delano는 이미 사용 경험이 있는 기준점이자 향후 설계 후보입니다. JMVC는 험캔슬링 재즈 픽업의 실사용 기준으로, Xtender 계열은 비정형 감지 범위가 필요한 모델의 후보로 검토하고 있습니다.'},
 'Häussel Pickups':{
  en:'Häussel is being reviewed mainly for custom geometry—string spacing, slant angle, housing and coil format—where a pickup must be adapted to the instrument rather than the opposite.',
  de:'Häussel wird vor allem wegen kundenspezifischer Geometrie geprüft – Saitenabstand, Slant-Winkel, Gehäuse und Spulenformat –, wenn sich der Pickup an das Instrument anpassen soll und nicht umgekehrt.',
  ko:'Häussel은 스트링 스페이싱·슬랜트 각도·하우징·코일 형상 등 픽업을 악기 설계에 맞춰야 하는 경우의 커스텀 공급 후보로 중점 검토하고 있습니다.'},
 'Moon Guitar — Chanho Moon':{
  en:'Current review is practical rather than archival: Raven is studying build process, material behaviour and controlled comparison directly in the workshop and translating those observations into prototype documentation.',
  de:'Die aktuelle Auseinandersetzung ist praktisch statt rein dokumentarisch: Raven untersucht Bauprozess, Materialverhalten und kontrollierte Vergleiche direkt in der Werkstatt und überführt die Beobachtungen in die Prototyp-Dokumentation.',
  ko:'현재 검토는 문헌 조사보다 실제 제작 과정에 가깝습니다. 작업 현장에서 제작 공정·재료 거동·통제 비교 방식을 배우고, 그 관찰 결과를 RavenForge 프로토타입 기록과 설계 판단에 연결하고 있습니다.'}
};
const specificRf={
 'Nova — Innovative Pickup Systems':{en:'Potential core partner for custom pickup development across ASKR, EMBLA, EDDA and later multiscale designs, particularly where magnet choice, geometry and switching must be co-designed with the instrument.',de:'Potenzieller Kernpartner für kundenspezifische Pickup-Entwicklung bei ASKR, EMBLA, EDDA und späteren Multiscale-Modellen, wenn Magnetwahl, Geometrie und Schaltung gemeinsam mit dem Instrument entwickelt werden sollen.',ko:'ASKR·EMBLA·EDDA 및 향후 멀티스케일 모델에서 자석 선택, 픽업 지오메트리와 스위칭을 악기와 함께 공동 설계할 수 있는 핵심 협력사 후보라는 의미가 큽니다.'},
 'ZUTA Group':{en:'Provides a route to treating onboard electronics, effects and amplification as one continuous analog design problem instead of separate purchases.',de:'Eröffnet die Möglichkeit, Onboard-Elektronik, Effekte und Verstärkung als ein zusammenhängendes analoges Designproblem statt als getrennte Käufe zu behandeln.',ko:'온보드 전자계통·이펙터·앰프를 각각의 구매 부품이 아니라 하나의 연속된 아날로그 신호 설계 문제로 다룰 수 있다는 점이 RavenForge와 맞닿습니다.'},
 'Lusithand Devices':{en:'Directly informs EDDA’s filter architecture and future models where pickup-specific subtractive shaping is more important than conventional three-band EQ.',de:'Wirkt direkt auf EDDAs Filterarchitektur und künftige Modelle ein, bei denen pickup-spezifische subtraktive Klangformung wichtiger ist als ein konventioneller 3-Band-EQ.',ko:'EDDA의 필터 구조와, 일반적인 3밴드 EQ보다 픽업별 감산형 보이싱이 중요한 향후 모델에 직접 연결됩니다.'},
 'Underhill Bass Electronics':{en:'Supports a modular design philosophy for EDDA and future multi-pickup instruments where buffer, mixer and filter stages can be changed independently.',de:'Unterstützt eine modulare Designphilosophie für EDDA und künftige Mehrpickup-Instrumente, bei denen Buffer-, Mixer- und Filterstufen unabhängig verändert werden können.',ko:'EDDA와 향후 다중 픽업 모델에서 버퍼·믹서·필터 단계를 독립적으로 바꿀 수 있는 모듈형 전자계통 설계에 의미가 있습니다.'},
 'Turner Pickups':{en:'A key reference for EDDA when per-string information and multicoil routing are treated as part of the instrument’s signal architecture.',de:'Wichtige Referenz für EDDA, wenn saitenweise Information und Multicoil-Routing als Teil der Signalarchitektur des Instruments verstanden werden.',ko:'현별 정보와 멀티코일 라우팅을 악기의 신호 구조 자체로 다루는 EDDA 연구에서 핵심 비교 기준입니다.'},
 'Herrick Pickups':{en:'Broadens RavenForge’s multicoil research beyond a single construction school and gives a practical reference for highly customized coil and chassis layouts.',de:'Erweitert RavenForges Multicoil-Forschung über eine einzelne Konstruktionsschule hinaus und bietet eine praktische Referenz für stark angepasste Spulen- und Chassis-Layouts.',ko:'RavenForge의 멀티코일 연구가 한 가지 제작 방식에 고정되지 않게 해 주며, 고도 커스텀 코일·섀시 설계의 실질적인 비교군이 됩니다.'},
 'ACG Filter Electronics — John East':{en:'Acts as a mature reference point for deciding how RavenForge should balance expressive filter control against player-facing simplicity.',de:'Dient als ausgereifte Referenz dafür, wie RavenForge ausdrucksstarke Filterkontrolle und spielerische Einfachheit ausbalancieren kann.',ko:'RavenForge가 필터의 표현력과 연주자가 실제로 다룰 수 있는 조작성 사이의 균형을 정할 때 성숙한 비교 기준이 됩니다.'},
 'Fishman Fluence Bass':{en:'Provides a contrasting system-level benchmark for repeatable multi-voice behavior, useful when evaluating whether RavenForge should expose raw coil options or curated voices.',de:'Bietet einen systemischen Gegenpol mit reproduzierbaren Multi-Voice-Zuständen und hilft zu entscheiden, ob RavenForge rohe Spulenoptionen oder kuratierte Voices anbieten soll.',ko:'RavenForge가 원시적인 코일 조합을 직접 노출할지, 정리된 멀티보이스를 제공할지 판단할 때 시스템 수준의 대조군이 됩니다.'},
 'KTS Musical Products — Titanium Reinforcement':{en:'Connects directly to RavenForge neck-structure research by making reinforcement material itself a controlled design variable.',de:'Verbindet sich direkt mit RavenForges Halsstruktur-Forschung, indem das Verstärkungsmaterial selbst zur kontrollierten Designvariable wird.',ko:'보강재 자체를 통제 가능한 설계 변수로 삼는 RavenForge 넥 구조 연구와 직접 연결됩니다.'},
 'Payson Bass — Multi-Scale Hardware':{en:'ASKR depends on treating bridge, strings, scale distribution and setup as one mechanical system; Payson is therefore not just a hardware choice but part of the prototype architecture.',de:'ASKR setzt voraus, Brücke, Saiten, Mensurverteilung und Setup als ein mechanisches System zu behandeln; Payson ist damit Teil der Prototyp-Architektur und nicht nur eine Hardwarewahl.',ko:'ASKR는 브리지·현·스케일 분배·셋업을 하나의 기계 시스템으로 다루기 때문에 Payson은 단순 하드웨어 선택이 아니라 프로토타입 구조의 일부입니다.'},
 'Delano Pickup Systems':{en:'Useful where RavenForge needs familiar passive behavior but with stronger hum control, output and geometry choices than conventional vintage-format pickups.',de:'Relevant, wenn RavenForge vertrautes passives Verhalten mit stärkerer Brummunterdrückung, höherem Output und freierer Geometrie als bei klassischen Vintage-Formaten verbinden will.',ko:'빈티지 형식의 익숙한 패시브 반응을 유지하면서도 더 강한 험 억제·출력·지오메트리 선택이 필요한 RavenForge 모델에 유효합니다.'},
 'Häussel Pickups':{en:'Fits RavenForge’s instrument-first customization philosophy because pickup dimensions and electrical topology can follow the instrument instead of dictating it.',de:'Passt zur instrumentenzentrierten Custom-Philosophie von RavenForge, weil Abmessungen und elektrische Topologie dem Instrument folgen können statt es zu diktieren.',ko:'픽업 규격에 악기를 맞추는 대신 픽업의 치수와 전기적 구조를 악기에 맞추는 RavenForge의 instrument-first 커스텀 철학과 잘 맞습니다.'},
 'Moon Guitar — Chanho Moon':{en:'Provides the empirical craft discipline behind RavenForge: isolate variables, compare builds, document material behaviour and let differentiation emerge from verified function and musical intent.',de:'Liefert die empirische handwerkliche Disziplin hinter RavenForge: Variablen isolieren, Builds vergleichen, Materialverhalten dokumentieren und Differenzierung aus überprüfter Funktion und musikalischer Absicht entstehen lassen.',ko:'변수를 분리하고, 제작 결과를 비교하며, 재료 거동을 기록하고, 검증된 기능과 음악적 의도에서 차별화를 도출하는 RavenForge의 경험적 제작 방법론과 직접 연결됩니다.'}
};
const esc=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const genericCurrent={
 en:'Current review is based on documented construction methods, representative instruments and available official material; any direct RavenForge adoption remains subject to prototype-level verification.',
 de:'Die aktuelle Bewertung stützt sich auf dokumentierte Bauweisen, repräsentative Instrumente und verfügbare offizielle Unterlagen; eine direkte Übernahme in RavenForge bleibt einer Verifikation am Prototyp vorbehalten.',
 ko:'현재 검토는 공개된 제작 방식·대표 악기·공식 자료를 기준으로 하며, RavenForge에 직접 적용할 때에는 프로토타입 단계에서 구조적·기능적 검증을 별도로 진행하는 것을 전제로 합니다.'
};
const genericRf=(e,l)=>{
 const t=(e.tags||[]).slice(0,3).join(', ');
 return l==='ko'?`${t||'설계 방법론'} 관점에서 RavenForge의 프로토타입과 비교 가능한 외부 기준으로 활용합니다.`:l==='de'?`Dient RavenForge als externe Vergleichsreferenz für ${t||'Konstruktionsmethodik'} und die eigenen Prototypen.`:`Serves RavenForge as an external comparison point for ${t||'design methodology'} and its own prototypes.`;
};
for(const l of ['en','de','ko']){
 const h=H[l],arr=translations[l]&&translations[l].luthierData||[];
 for(const e of arr){
  let d=String(e.details||'');
  const get=label=>{const m=d.match(new RegExp(`<p><strong>${esc(label)}:<\\/strong>\\s*([\\s\\S]*?)<\\/p>`,'i'));return m?m[1].trim():''};
  const existingCurrent=get(h.current),existingRf=get(h.rf);
  const sourceParts=[];
  d=d.replace(/<p\s+class="text-sm text-slate-500 mt-4">[\s\S]*?<\/p>/gi,m=>{sourceParts.push(m);return''});
  for(const label of [h.focus,h.current,h.rf])d=d.replace(new RegExp(`<p><strong>${esc(label)}:<\\/strong>[\\s\\S]*?<\\/p>`,'gi'),'');
  d=d.replace(new RegExp(`<p><strong>${esc(h.systems)}:<\\/strong><\\/p>`,'gi'),'').trim();
  const current=(specificCurrent[e.name]&&specificCurrent[e.name][l])||existingCurrent||genericCurrent[l];
  const rf=(specificRf[e.name]&&specificRf[e.name][l])||existingRf||genericRf(e,l);
  e.details=`<p><strong>${h.focus}:</strong> ${e.summary||''}</p><p><strong>${h.systems}:</strong></p>${d}<p><strong>${h.current}:</strong> ${current}</p><p><strong>${h.rf}:</strong> ${rf}</p>${(e.entityType||'luthier')==='technology'?'':sourceParts.join('')}`;
 }
}
})();