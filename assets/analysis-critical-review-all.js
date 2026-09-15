(()=>{'use strict';if(typeof translations!=='object')return;
const LABEL={en:'Critical review',de:'Kritische Einordnung',ko:'비판적 검토'};
const NAMED={
 'Marleaux Basses':{
  en:'The depth of handwork and customization is a strength, but it also makes price, lead time and repeatability more dependent on a small workshop process. RavenForge should separate genuinely functional custom work from decorative complexity and make service information as explicit as the craft narrative.',
  de:'Die große Fertigungstiefe und Individualisierung sind Stärken, machen Preis, Lieferzeit und Reproduzierbarkeit jedoch stärker von einem kleinen Werkstattprozess abhängig. RavenForge sollte funktional notwendige Sonderarbeit klar von dekorativer Komplexität trennen und Wartungsinformationen ebenso transparent machen wie die Handwerksgeschichte.',
  ko:'높은 수작업 비중과 커스텀 깊이는 강점이지만 가격·납기·재현성이 소규모 공방 공정에 크게 의존하게 됩니다. RavenForge는 실제 기능을 위한 커스텀과 장식적 복잡성을 구분하고, 제작 서사만큼 유지보수 정보도 명확하게 제공할 필요가 있습니다.'},
 'Sandberg Guitars':{
  en:'A broad semi-custom catalogue and strong production discipline improve accessibility, but a very large option matrix can make customization feel incremental rather than structurally innovative. Relic, finish and visual options should not become substitutes for measurable ergonomic, structural or electronic development.',
  de:'Ein breiter Semi-Custom-Katalog und disziplinierte Serienfertigung erhöhen die Zugänglichkeit, doch eine sehr große Optionsmatrix kann Individualisierung auf inkrementelle Varianten reduzieren. Relic-, Finish- und Optikoptionen sollten messbare ergonomische, strukturelle oder elektronische Entwicklung nicht ersetzen.',
  ko:'넓은 세미커스텀 옵션과 안정된 생산 체계는 접근성을 높이지만, 옵션이 지나치게 많아지면 커스터마이징이 구조적 혁신보다 사양 조합에 머물 수 있습니다. 릴릭·도장·외관 옵션이 인체공학·구조·전자계의 실질적인 개발을 대체하지 않도록 볼 필요가 있습니다.'},
 'Vincent Bass Guitars':{
  en:'The refinement of familiar bass architecture is convincing, but the closer a design remains to established Fender-derived geometry, the more its premium has to be justified by execution, ergonomics and service rather than novelty alone.',
  de:'Die Verfeinerung vertrauter Bassarchitektur überzeugt, doch je näher ein Entwurf an etablierten Fender-abgeleiteten Geometrien bleibt, desto stärker muss sich ein Premiumpreis durch Ausführung, Ergonomie und Service statt allein durch Neuheitsanspruch rechtfertigen.',
  ko:'익숙한 베이스 구조를 정교하게 다듬는 접근은 설득력이 있지만, Fender 계열의 확립된 형상에 가까울수록 프리미엄 가격은 새로움 자체보다 가공 완성도·인체공학·서비스로 설명되어야 합니다.'},
 'Jens Ritter Instruments':{
  en:'The sculptural art-object approach expands what an electric bass can look like, but extreme visual identity and collector pricing can separate the instrument from ordinary working-musician requirements. RavenForge should borrow the courage of the form without allowing spectacle to overrule balance, serviceability or functional value.',
  de:'Der skulpturale Kunstobjekt-Ansatz erweitert die mögliche Form des E-Basses, doch extreme visuelle Identität und Sammlerpreise können das Instrument von den Anforderungen arbeitender Musiker entfernen. RavenForge sollte den Mut der Form übernehmen, ohne Balance, Wartbarkeit oder funktionalen Wert dem Spektakel unterzuordnen.',
  ko:'악기를 조형 예술품으로 확장하는 태도는 강력하지만, 극단적인 시각적 정체성과 수집품 가격은 직업 연주자의 실사용 요구와 멀어질 수 있습니다. RavenForge는 형태의 대담함은 참고하되 밸런스·유지보수성·기능적 가치를 조형적 과시에 종속시키지 않아야 합니다.'},
 'Warwick Basses':{
  en:'A strong proprietary ecosystem and recognizable construction language create identity, but model-to-model weight, hardware dependency and wide price-tier separation can make serviceability and value perception uneven. Proprietary solutions need a clear functional gain and long-term parts support.',
  de:'Ein starkes proprietäres Ökosystem und eine klar erkennbare Konstruktionssprache schaffen Identität, doch Gewichtsunterschiede, Hardware-Abhängigkeit und große Preisabstände zwischen Serien können Wartbarkeit und Wertwahrnehmung uneinheitlich machen. Proprietäre Lösungen brauchen einen klaren funktionalen Gewinn und langfristige Ersatzteilversorgung.',
  ko:'강한 독자 하드웨어 생태계와 뚜렷한 제작 언어는 정체성을 만들지만, 모델별 중량 차이·전용 부품 의존성·넓은 가격대는 유지보수성과 가치 인식을 불균일하게 만들 수 있습니다. 독자 규격은 명확한 기능적 이득과 장기 부품 공급이 함께할 때 의미가 있습니다.'},
 'LeFay':{
  en:'Unconventional ergonomics and electronics can solve problems ignored by traditional layouts, but radical geometry is highly player-specific. The same body concept that improves access for one posture can reduce familiarity, case compatibility or resale liquidity for another user.',
  de:'Unkonventionelle Ergonomie und Elektronik können Probleme lösen, die traditionelle Layouts übergehen, doch radikale Geometrie ist stark spielerspezifisch. Eine Form, die für eine Haltung Vorteile bietet, kann für andere Nutzer Vertrautheit, Kofferkompatibilität oder Wiederverkauf einschränken.',
  ko:'비전통적 인체공학과 전자계는 기존 구조가 놓친 문제를 해결할 수 있지만, 급진적인 형상은 연주자 체형과 자세에 크게 의존합니다. 한 자세에서 유리한 바디가 다른 사용자에게는 익숙함·케이스 호환성·중고 유동성을 떨어뜨릴 수 있습니다.'},
 'Maruszczyk Instruments':{
  en:'Very broad configuration freedom is a major value proposition, but the option count transfers a large specification burden to the buyer. A configurator needs strong compatibility rules, predictable QC and clear defaults so freedom does not become decision risk.',
  de:'Die sehr große Konfigurationsfreiheit ist ein starkes Wertversprechen, verlagert jedoch einen erheblichen Teil der Spezifikationsverantwortung auf den Käufer. Ein Konfigurator braucht klare Kompatibilitätsregeln, vorhersehbare Qualitätskontrolle und sinnvolle Defaults, damit Freiheit nicht zum Entscheidungsrisiko wird.',
  ko:'폭넓은 컨피규레이션 자유도는 큰 장점이지만 그만큼 사양 결정의 책임이 구매자에게 넘어갑니다. 자유도가 잘못된 조합의 위험으로 바뀌지 않도록 호환성 규칙·예측 가능한 QC·명확한 기본 추천안이 필요합니다.'},
 'Dingwall Guitars':{
  en:'The technical contribution of the multi-scale system is not in question; the current concern is price architecture. As hybrid China/Canada and Indonesia/Canada Ready-to-Play models move toward roughly KRW 4–5.7 million in the Korean market, the brand must preserve a visible affordability advantage over full boutique production or risk weakening the accessibility rationale of the RTP tier.',
  de:'Der technische Beitrag des Multiscale-Systems steht nicht infrage; kritisch ist derzeit die Preisarchitektur. Wenn hybride China/Kanada- beziehungsweise Indonesien/Kanada-Ready-to-Play-Modelle auf dem koreanischen Markt in Bereiche von etwa 4 bis 5,7 Mio. KRW steigen, muss ein klarer Preisvorteil gegenüber vollständiger Boutique-Fertigung erkennbar bleiben, sonst verliert die RTP-Stufe einen Teil ihrer Zugänglichkeitslogik.',
  ko:'멀티스케일 시스템의 기술적 공헌과 품질을 문제 삼는 것이 아니라 현재의 가격 구조를 비판적으로 봅니다. 중국/캐나다 또는 인도네시아/캐나다 하이브리드 Ready-to-Play 모델들이 국내에서 대략 400만~570만 원대까지 올라온 만큼, 풀 부티크 제작 대비 체감 가능한 가격 이점을 유지하지 못하면 RTP 라인의 본래 접근성 논리가 약해질 수 있습니다.'},
 'Padalka Guitars':{
  en:'Highly integrated sculpting and custom geometry can produce excellent ergonomics, but the more body contours, neck joints and hardware are visually integrated, the more repair, refinishing and reproduction may depend on the original workshop. Integration should not create unnecessary service lock-in.',
  de:'Stark integrierte Formgebung und individuelle Geometrie können hervorragende Ergonomie erzeugen, doch je stärker Konturen, Halsübergang und Hardware gestalterisch verschmelzen, desto stärker können Reparatur, Neulackierung und Reproduktion von der ursprünglichen Werkstatt abhängen. Integration sollte keine unnötige Servicebindung erzeugen.',
  ko:'바디 카빙·넥 조인트·하드웨어를 하나의 조형으로 통합하는 방식은 뛰어난 인체공학을 만들 수 있지만, 통합도가 높을수록 수리·재도장·재현이 원 제작자에게 종속될 수 있습니다. 통합 설계가 불필요한 서비스 락인으로 이어지지 않는지 봐야 합니다.'},
 'Alusonic Aluminium Instruments':{
  en:'Aluminium offers consistency and a distinctive structural response, but thermal feel, weight distribution, repair/refinish methods and a strong material-specific voice can be polarizing. The measurable structural advantages should be distinguished from claims that material identity alone guarantees a superior tone.',
  de:'Aluminium bietet hohe Konsistenz und ein charakteristisches Strukturverhalten, kann aber bei Haptik, Temperaturgefühl, Gewichtsverteilung, Reparatur und klanglicher Eigenart polarisieren. Messbare strukturelle Vorteile sollten von der Annahme getrennt werden, dass die Materialidentität allein einen besseren Klang garantiere.',
  ko:'알루미늄은 재료 편차가 작고 독특한 구조적 반응을 주지만, 촉감과 온도감·무게 배분·수리/재마감 방식·강한 재료 고유 캐릭터는 취향을 크게 탈 수 있습니다. 측정 가능한 구조적 장점과 ‘재료 자체가 우월한 톤을 만든다’는 주장은 분리해서 볼 필요가 있습니다.'},
 'Sugi Guitars':{
  en:'Exceptional wood selection and handwork are genuine craft strengths, yet rare figured materials can push cost and availability upward without a proportional functional gain. RavenForge should avoid treating visual rarity as acoustic evidence and evaluate each material by stability, supply and use-case first.',
  de:'Außergewöhnliche Holzauswahl und Handarbeit sind reale handwerkliche Stärken, doch seltene, stark gemaserte Materialien können Kosten und Verfügbarkeit erhöhen, ohne proportionalen Funktionsgewinn. RavenForge sollte optische Seltenheit nicht als akustischen Beweis behandeln und Materialien zuerst nach Stabilität, Beschaffung und Einsatzzweck bewerten.',
  ko:'뛰어난 목재 선별과 수작업은 분명한 강점이지만 희귀하고 화려한 목재가 가격과 수급 난도를 크게 올리는 데 비해 기능적 이득은 비례하지 않을 수 있습니다. RavenForge는 시각적 희소성을 음향적 우위의 근거로 보지 않고 안정성·수급·용도부터 검증해야 합니다.'},
 'Aristides Guitars':{
  en:'Composite construction offers repeatability and environmental stability, but it also creates dependence on a proprietary material and manufacturing process. Long-term repair routes, modification limits and service continuity are as important as the consistency advantage, and material-related tone claims still require evidence.',
  de:'Verbundwerkstoff-Konstruktion bietet Reproduzierbarkeit und Umweltstabilität, erzeugt jedoch Abhängigkeit von proprietärem Material und Fertigungsprozess. Langfristige Reparaturwege, Änderungsgrenzen und Servicekontinuität sind ebenso wichtig wie die Konsistenzvorteile; klangliche Materialbehauptungen benötigen weiterhin Belege.',
  ko:'복합재 구조는 높은 재현성과 환경 안정성을 제공하지만 독자 재료와 제조 공정에 대한 의존성도 만듭니다. 장기 수리 경로·개조 가능 범위·서비스 지속성이 일관성만큼 중요하며, 재료의 톤 우위에 관한 주장은 별도로 검증되어야 합니다.'},
 'Mayones Guitars':{
  en:'Modern production quality and premium finishing are strong, but escalating option depth, artist association and visual luxury can make it difficult to see where functional improvement ends and premium positioning begins. A high price should remain legible in process, hardware, service and measurable performance.',
  de:'Moderne Fertigungsqualität und Premium-Finish sind stark, doch wachsende Optionsvielfalt, Artist-Bezug und visuelle Luxusmerkmale können die Grenze zwischen funktionalem Mehrwert und Premiumpositionierung verwischen. Ein hoher Preis sollte in Prozess, Hardware, Service und messbarer Leistung nachvollziehbar bleiben.',
  ko:'현대적 생산 품질과 고급 마감은 강점이지만 옵션 확대·아티스트 브랜딩·시각적 럭셔리 요소가 커질수록 기능적 향상과 프리미엄 포지셔닝의 경계가 흐려질 수 있습니다. 높은 가격은 공정·하드웨어·서비스·측정 가능한 성능으로 설명 가능해야 합니다.'},
 'Jerzy Drozd Basses':{
  en:'Extreme extended-range and highly bespoke builds expand technical possibility, but scale length, neck width, control complexity, weight and price can cross a point where theoretical capability exceeds practical usability. Each extension should be justified by a specific musical task.',
  de:'Extreme Extended-Range- und stark individualisierte Instrumente erweitern die technischen Möglichkeiten, doch Mensur, Halsbreite, Bedienkomplexität, Gewicht und Preis können einen Punkt überschreiten, an dem theoretische Fähigkeiten die praktische Nutzbarkeit übersteigen. Jede Erweiterung sollte durch eine konkrete musikalische Aufgabe begründet sein.',
  ko:'극단적인 확장현·커스텀 설계는 가능성을 넓히지만 스케일·넥 폭·컨트롤 복잡도·중량·가격이 실제 연주 효용보다 앞설 수 있습니다. 모든 확장은 ‘가능하니까’가 아니라 구체적인 음악적 과제가 있을 때 정당화되어야 합니다.'},
 'Mattisson Basses':{
  en:'Experimental neck shapes, electronics and custom systems are valuable references, but very small-scale proprietary development makes component availability and future service a critical issue. Innovation should be documented well enough that the instrument remains maintainable beyond its original builder.',
  de:'Experimentelle Halsformen, Elektronik und Custom-Systeme sind wertvolle Referenzen, doch proprietäre Entwicklung in sehr kleiner Stückzahl macht Bauteilverfügbarkeit und zukünftigen Service besonders wichtig. Innovation sollte so dokumentiert sein, dass das Instrument auch jenseits des ursprünglichen Erbauers wartbar bleibt.',
  ko:'실험적인 넥 형상·전자계·커스텀 시스템은 좋은 연구 대상이지만 소규모 독자 개발은 부품 수급과 장기 서비스가 핵심 리스크가 됩니다. 제작자가 바뀌어도 유지보수할 수 있을 정도의 문서화와 표준화가 혁신과 함께 가야 합니다.'},
 'Alan Cringean Guitars (ACG)':{
  en:'The filter-based electronics are unusually powerful, but their learning curve and interaction can exceed what some players need on stage. More parameters are useful only when their roles are understandable, repeatable and serviceable; otherwise flexibility becomes cognitive and maintenance cost.',
  de:'Die filterbasierte Elektronik ist außergewöhnlich leistungsfähig, ihre Lernkurve und Interaktion können jedoch über das hinausgehen, was manche Spieler auf der Bühne benötigen. Mehr Parameter sind nur dann ein Vorteil, wenn ihre Funktion verständlich, reproduzierbar und wartbar bleibt.',
  ko:'필터 기반 전자계는 매우 강력하지만 컨트롤 간 상호작용과 학습 난도가 실제 무대에서 필요한 수준을 넘어설 수 있습니다. 파라미터가 많다는 것보다 역할이 이해 가능하고 재현 가능하며 수리 가능한지가 더 중요합니다.'},
 'Kiesel Guitars':{
  en:'Direct-to-consumer customization can offer strong value, but an enormous option matrix shifts specification risk to the customer, especially when some choices are difficult to reverse or return. Design governance, compatibility rules and clear recommended configurations are necessary so configurability does not become accidental over-specification.',
  de:'Direct-to-Consumer-Customization kann ein starkes Preis-Leistungs-Verhältnis bieten, doch eine enorme Optionsmatrix verlagert Spezifikationsrisiken auf den Kunden, besonders bei schwer rückgängig zu machenden Entscheidungen. Klare Kompatibilitätsregeln und empfohlene Konfigurationen sind nötig, damit Konfigurierbarkeit nicht zu zufälliger Über-Spezifikation wird.',
  ko:'직판 기반의 높은 커스텀 자유도는 가격 대비 장점이 있지만 거대한 옵션표는 사양 결정 리스크를 고객에게 넘길 수 있습니다. 되돌리기 어려운 선택이 많은 만큼 호환성 규칙과 추천 조합이 명확해야 하며, 자유도가 우연한 과사양으로 이어지지 않아야 합니다.'},
 'Spector Basses':{
  en:'The NS body and neck-through identity are historically important, but weight, player fit and the very wide spread from mass-production tiers to USA Custom Shop mean that “the Spector experience” is not uniform. Heritage should not hide tier-specific differences in hardware, fretwork and service expectations.',
  de:'NS-Korpus und Neck-through-Identität sind historisch bedeutend, doch Gewicht, individuelle Passform und die große Spanne von Serienlinien bis zum USA Custom Shop bedeuten, dass die „Spector-Erfahrung“ nicht einheitlich ist. Heritage sollte tier-spezifische Unterschiede bei Hardware, Bundierung und Serviceerwartung nicht verdecken.',
  ko:'NS 바디와 넥스루 정체성은 역사적으로 중요하지만, 중량과 체형 적합성, 양산 라인부터 USA Custom Shop까지 넓은 등급 차이 때문에 ‘Spector 경험’을 하나로 일반화하기 어렵습니다. 헤리티지가 각 등급의 하드웨어·프렛잡·서비스 차이를 가리지 않도록 봐야 합니다.'},
 'Alembic Inc.':{
  en:'Alembic established foundational ideas in active electronics, filters and neck-through construction, but those systems also bring weight, control complexity, proprietary service requirements and extreme pricing. Heritage is most useful when the functional principle is separated from complexity that survives mainly because it is historically prestigious.',
  de:'Alembic prägte grundlegende Ideen zu aktiver Elektronik, Filtern und Neck-through-Bauweise, doch diese Systeme bringen auch Gewicht, Bedienkomplexität, proprietären Servicebedarf und extreme Preise mit sich. Heritage ist am wertvollsten, wenn das funktionale Prinzip von Komplexität getrennt wird, die vor allem aus historischer Autorität fortbesteht.',
  ko:'액티브 전자계·필터·넥스루 구조의 역사적 공헌은 매우 크지만, 그 시스템은 중량·컨트롤 복잡도·전용 서비스 의존성·극단적 가격이라는 비용도 함께 가집니다. 헤리티지는 기능적 원리를 계승할 때 의미가 있으며 역사적 권위 때문에 남은 복잡성까지 답습할 필요는 없습니다.'},
 'De Gier Basses':{
  en:'The vintage-informed refinement is exceptionally coherent, but deliberate closeness to classic bass vocabulary naturally limits how radical the architecture can become. RavenForge should learn from the disciplined refinement while keeping space for structural and electronic ideas that cannot fit inside a heritage silhouette.',
  de:'Die vintage-orientierte Verfeinerung ist außergewöhnlich schlüssig, doch die bewusste Nähe zur klassischen Basssprache begrenzt naturgemäß die Radikalität der Architektur. RavenForge sollte die disziplinierte Weiterentwicklung übernehmen und zugleich Raum für strukturelle und elektronische Ideen lassen, die nicht in eine Heritage-Silhouette passen.',
  ko:'빈티지 문법을 정교하게 개선하는 방식은 매우 완성도가 높지만, 클래식 형상에 의도적으로 가까이 머무르는 만큼 구조적 혁신의 폭에는 자연스러운 한계가 있습니다. RavenForge는 개선의 정밀함을 배우되 헤리티지 실루엣에 들어맞지 않는 구조·전자계 아이디어도 남겨둘 필요가 있습니다.'},
 'Skervesen Guitars':{
  en:'Extended-range capability and bold customization fit modern players well, but aggressive geometry and very dense option sets can produce niche instruments whose ergonomics, resale and service are highly user-specific. A technically possible specification is not automatically a coherent instrument.',
  de:'Extended-Range-Fähigkeit und mutige Individualisierung passen gut zu modernen Spielern, doch aggressive Geometrie und dichte Optionspakete können Nischeninstrumente erzeugen, deren Ergonomie, Wiederverkauf und Service stark nutzerspezifisch sind. Eine technisch mögliche Spezifikation ist nicht automatisch ein schlüssiges Instrument.',
  ko:'확장현 대응과 과감한 커스텀은 현대 연주자에게 잘 맞지만 공격적 형상과 복잡한 옵션 조합은 인체공학·중고 가치·서비스가 특정 사용자에게 지나치게 종속된 악기를 만들 수 있습니다. 제작 가능한 사양이 곧 일관된 악기라는 뜻은 아닙니다.'},
 'Carl Thompson':{
  en:'The historical willingness to explore six-string basses, unusual scale lengths and scroll bodies is essential, but some of those solutions also carry obvious reach, weight and ergonomic costs. RavenForge should treat the experiments as permission to question standards, not as forms that deserve repetition simply because they are historically important.',
  de:'Die historische Bereitschaft zu sechssaitigen Bässen, ungewöhnlichen Mensuren und Scroll-Bodies ist wesentlich, doch einige dieser Lösungen bringen klare Reichweiten-, Gewichts- und Ergonomiekosten mit sich. RavenForge sollte die Experimente als Erlaubnis zum Hinterfragen von Standards verstehen, nicht als Formen, die allein wegen ihrer Geschichte wiederholt werden müssen.',
  ko:'6현 베이스·비정상적으로 긴 스케일·스크롤 바디를 일찍부터 실험한 태도는 중요하지만, 그중 일부는 리치·중량·인체공학적 비용도 분명합니다. RavenForge는 이 형상들을 역사적 권위 때문에 답습하기보다 ‘표준을 의심해도 된다’는 실험 정신을 계승해야 합니다.'},
 'Meta Guitars':{
  en:'Strong ergonomic carving, headless construction and custom hardware can solve real playing problems, but proprietary hardware and radical geometry increase long-term parts and service dependence. Each curve needs to prove a posture or access benefit rather than becoming a visual signature for its own sake.',
  de:'Ausgeprägte Ergonomie, Headless-Konstruktion und eigene Hardware können reale Spielprobleme lösen, erhöhen jedoch die langfristige Abhängigkeit von Ersatzteilen und Service. Jede Kurve sollte einen Haltungs- oder Zugänglichkeitsvorteil nachweisen statt nur zur visuellen Signatur zu werden.',
  ko:'강한 인체공학 카빙·헤드리스 구조·자체 하드웨어는 실제 연주 문제를 해결할 수 있지만 전용 부품과 급진적 형상은 장기 부품 수급과 서비스 의존성을 높입니다. 모든 곡선은 시각적 시그니처가 되기 전에 자세·리치·접근성의 실제 이득을 증명해야 합니다.'},
 'Fodera Guitars':{
  en:'Fodera already contains a dedicated critical-review section in this entry.',de:'Dieser Eintrag enthält bereits eine eigene kritische Einordnung.',ko:'이 항목에는 별도의 비판적 검토가 이미 포함되어 있습니다.'},
 'Alleva-Coppolo':{
  en:'Alleva-Coppolo already contains a dedicated critical-review section in this entry.',de:'Dieser Eintrag enthält bereits eine eigene kritische Einordnung.',ko:'이 항목에는 별도의 비판적 검토가 이미 포함되어 있습니다.'}
};
const GENERIC={
 en:{Ergonomics:'Ergonomic solutions must be validated across seated and standing positions, different body sizes and instrument weights; a distinctive contour is not automatically a universal improvement.',Electronics:'Additional electronic flexibility can increase control complexity, noise/debugging points and service dependence, so every added function should earn its place in real playing use.',Wood:'Material selection should be judged by stability, supply, machining and the actual design requirement; rarity or figure alone is not evidence of acoustic superiority.',Structure:'Structural innovation should be tested together with repairability, adjustment range, weight and long-term parts availability rather than evaluated only by stiffness or novelty.',Aesthetics:'A strong visual identity can add value, but it should not overrule ergonomics, maintainability, manufacturing repeatability or cost transparency.',Customization:'Customization adds value only when option interactions are controlled; too much freedom can reduce repeatability, make pricing opaque and transfer design risk to the customer.',Methodology:'Design narratives and engineering claims should remain falsifiable and measurable; persuasive explanation should not run ahead of prototype evidence.',default:'The brand is useful as a reference, but RavenForge should separate documented functional advantages from prestige, aesthetic preference and marketing narrative, then validate the relevant principle through its own prototypes.'},
 de:{Ergonomics:'Ergonomische Lösungen müssen im Sitzen und Stehen, bei unterschiedlichen Körpergrößen und Instrumentgewichten geprüft werden; eine markante Kontur ist nicht automatisch universell besser.',Electronics:'Zusätzliche elektronische Flexibilität kann Bedienkomplexität, Fehlerquellen und Serviceabhängigkeit erhöhen; jede Funktion muss sich im realen Spielbetrieb rechtfertigen.',Wood:'Materialwahl sollte nach Stabilität, Beschaffung, Bearbeitung und konkreter Konstruktionsaufgabe beurteilt werden; Seltenheit oder Maserung sind kein Beweis akustischer Überlegenheit.',Structure:'Strukturelle Innovation muss zusammen mit Reparierbarkeit, Einstellbereich, Gewicht und langfristiger Teileversorgung bewertet werden und nicht nur nach Steifigkeit oder Neuheitswert.',Aesthetics:'Eine starke visuelle Identität kann Wert schaffen, darf Ergonomie, Wartbarkeit, Reproduzierbarkeit und Kostentransparenz jedoch nicht überstimmen.',Customization:'Individualisierung schafft nur dann Mehrwert, wenn Wechselwirkungen zwischen Optionen kontrolliert werden; zu viel Freiheit kann Reproduzierbarkeit und Preistransparenz schwächen und Konstruktionsrisiken auf den Kunden verlagern.',Methodology:'Konstruktionsnarrative und technische Behauptungen sollten messbar und widerlegbar bleiben; eine überzeugende Erklärung darf der Prototypen-Evidenz nicht vorauslaufen.',default:'Die Marke ist als Referenz nützlich, doch RavenForge sollte dokumentierte Funktionsvorteile von Prestige, Geschmacksfragen und Marketingnarrativen trennen und das relevante Prinzip anschließend in eigenen Prototypen verifizieren.'},
 ko:{Ergonomics:'인체공학적 해법은 착좌·스탠딩, 다양한 체형과 악기 중량에서 검증되어야 하며 독특한 곡선 자체가 보편적인 개선을 뜻하지는 않습니다.',Electronics:'전자계의 기능이 늘어날수록 조작 복잡도·노이즈/디버깅 지점·서비스 의존성도 증가할 수 있으므로 실제 연주에서 쓰이는 기능인지 검증해야 합니다.',Wood:'목재와 재료는 안정성·수급·가공성·설계 목적을 기준으로 판단해야 하며 희소성이나 무늬 자체를 음향적 우위의 증거로 보아서는 안 됩니다.',Structure:'구조 혁신은 강성이나 새로움만 볼 것이 아니라 수리 가능성·조절 범위·중량·장기 부품 수급과 함께 검증해야 합니다.',Aesthetics:'강한 시각적 정체성은 가치가 있지만 인체공학·유지보수성·생산 재현성·가격 투명성을 압도해서는 안 됩니다.',Customization:'커스텀 자유도는 옵션 간 상호작용이 통제될 때 가치가 있으며, 지나친 자유도는 재현성과 가격 투명성을 낮추고 설계 리스크를 고객에게 전가할 수 있습니다.',Methodology:'설계 서사와 공학적 주장은 측정·반증 가능한 형태로 남아야 하며, 설득력 있는 설명이 실제 프로토타입 증거보다 앞서가서는 안 됩니다.',default:'이 브랜드는 참고 가치가 있지만 RavenForge는 검증 가능한 기능적 장점과 브랜드 권위·미적 취향·마케팅 서사를 분리한 뒤, 필요한 원리만 자체 프로토타입으로 다시 검증해야 합니다.'}
};
function criticalText(e,l){
 const n=NAMED[e.name]&&NAMED[e.name][l];if(n&&!String(e.details||'').includes('data-rf-critical-review="1"'))return n;
 if(String(e.details||'').includes('data-rf-critical-review="1"'))return '';
 const g=GENERIC[l],tags=(e.tags||[]).filter(t=>g[t]);
 const pick=[];for(const t of tags){if(!pick.includes(g[t]))pick.push(g[t]);if(pick.length===2)break}
 return pick.length?pick.join(' '):g.default;
}
function inject(e,l){
 const text=criticalText(e,l);if(!text)return;
 let d=String(e.details||'');
 const p=`<p data-rf-critical-review="1"><strong>${LABEL[l]}:</strong> ${text}</p>`;
 const markers={en:'<p><strong>RavenForge relevance:</strong>',de:'<p><strong>Bedeutung für RavenForge:</strong>',ko:'<p><strong>RavenForge에서의 의미:</strong>'};
 const m=markers[l],i=d.indexOf(m);
 if(i>=0){e.details=d.slice(0,i)+p+d.slice(i);return}
 const sm=d.search(/<p class=["']text-sm text-slate-500 mt-4["']/);
 if(sm>=0)e.details=d.slice(0,sm)+p+d.slice(sm);else e.details=d+p;
}
for(const l of ['en','de','ko']){
 const a=translations[l]&&translations[l].luthierData||[];
 a.forEach(e=>inject(e,l));
}
})();