(()=>{'use strict';if(typeof translations!=='object')return;
const LABEL={en:'Critical review',de:'Kritische Einordnung',ko:'비판적 검토'};
const M={
 'KD Basses':{
  en:'Highly individual material choices and boutique execution are attractive, but one-off combinations make tonal attribution, repeatability and long-term material supply difficult to separate. RavenForge should document which result comes from geometry, electronics and setup before assigning explanatory power to exotic wood selection.',
  de:'Sehr individuelle Materialkombinationen und Boutique-Ausführung sind attraktiv, erschweren jedoch die Trennung von Materialwirkung, Reproduzierbarkeit und langfristiger Beschaffung. RavenForge sollte zunächst Geometrie, Elektronik und Setup dokumentieren, bevor exotischer Holzwahl erklärende Klangwirkung zugeschrieben wird.',
  ko:'개별성이 강한 재료 조합과 부티크 제작은 매력적이지만 원오프 조합일수록 결과를 재현하기 어렵고 희귀 목재의 수급도 불안정해집니다. RavenForge는 톤의 원인을 목재에 귀속하기 전에 형상·전자계·셋업 변수를 먼저 기록하고 검증해야 합니다.'},
 'Rikkers Basses':{
  en:'Careful ergonomic refinement and custom work are strong, but small-workshop personalization can make specification, lead time and after-sales support highly case-dependent. The lesson is to preserve bespoke fit while standardizing interfaces, adjustment ranges and service documentation.',
  de:'Sorgfältige ergonomische Verfeinerung und Custom-Arbeit sind Stärken, doch individuelle Kleinserienfertigung kann Spezifikation, Lieferzeit und Service stark fallabhängig machen. Wichtig ist, individuelle Passform mit standardisierten Schnittstellen, Einstellbereichen und Servicedokumenten zu verbinden.',
  ko:'세밀한 인체공학 개선과 커스텀 대응은 강점이지만 소규모 공방의 개인화는 사양·납기·사후지원이 주문별로 크게 달라질 수 있습니다. 맞춤성을 유지하면서도 인터페이스·조절 범위·서비스 문서만큼은 표준화할 필요가 있습니다.'},
 'Aviator Guitars':{
  en:'Lightweight modern geometry can be genuinely ergonomic, but strong body shaping is not equally comfortable for every posture or player. Weight reduction also needs to be evaluated together with balance, structural stiffness and hardware placement rather than as an isolated goal.',
  de:'Leichte moderne Geometrie kann echte ergonomische Vorteile bieten, ist aber nicht für jede Haltung und jeden Spieler gleichermaßen bequem. Gewichtsreduktion muss zusammen mit Balance, Struktursteifigkeit und Hardwareposition bewertet werden und darf kein isoliertes Ziel sein.',
  ko:'경량화와 현대적 바디 형상은 실제 인체공학적 이득을 줄 수 있지만 모든 체형과 자세에 보편적으로 맞는 것은 아닙니다. 경량화 역시 단독 목표가 아니라 밸런스·구조 강성·하드웨어 위치와 함께 검증해야 합니다.'},
 'Anaconda Basses':{
  en:'Organic sculpting and one-off visual identity can make a custom bass feel uniquely fitted, but the same sculptural freedom can reduce dimensional repeatability and make refinishing or reproducing a damaged part more difficult. Critical dimensions should remain controlled even when the exterior is highly individual.',
  de:'Organische Formgebung und Einzelstück-Ästhetik können einen Bass sehr individuell wirken lassen, doch dieselbe Freiheit kann Maßhaltigkeit, Neulackierung und Reproduktion beschädigter Teile erschweren. Kritische Maße sollten auch bei stark individueller Außenform kontrolliert bleiben.',
  ko:'유기적인 카빙과 원오프 외형은 강한 개성을 만들지만 같은 자유도가 치수 재현성을 낮추고 재도장이나 파손 부위 복제를 어렵게 할 수 있습니다. 외관이 자유롭더라도 핵심 치수와 조인트는 통제되어야 합니다.'},
 'Brubaker Guitars':{
  en:'The blend of familiar bass architecture with boutique execution is practical, but when the platform remains conventional the premium has to be visible in manufacturing precision, ergonomics and support. Option count alone should not be confused with a distinct engineering system.',
  de:'Die Verbindung vertrauter Bassarchitektur mit Boutique-Ausführung ist praxisnah, doch bei konventioneller Plattform muss sich der Premiumpreis in Fertigungspräzision, Ergonomie und Service zeigen. Eine große Optionszahl ist nicht automatisch ein eigenständiges Konstruktionssystem.',
  ko:'익숙한 베이스 구조를 부티크 완성도로 다듬는 방식은 실용적이지만 플랫폼이 전통적일수록 프리미엄의 근거는 가공 정밀도·인체공학·서비스에서 보여야 합니다. 옵션의 개수 자체를 독자적인 공학 시스템과 혼동해서는 안 됩니다.'},
 'Elrick Bass Guitars':{
  en:'Refinement and consistency within a familiar modern-bass format are useful benchmarks, but conservative architecture means innovation is often incremental. RavenForge should distinguish excellent execution from genuinely new system-level solutions and pay a premium only where that distinction is clear.',
  de:'Verfeinerung und Konsistenz innerhalb eines vertrauten modernen Bassformats sind wertvolle Maßstäbe, doch konservative Architektur bedeutet oft inkrementelle Innovation. RavenForge sollte hervorragende Ausführung von tatsächlich neuen Systemlösungen unterscheiden.',
  ko:'익숙한 현대 베이스 형식 안에서의 정교한 개선과 일관성은 좋은 기준이지만 구조가 보수적일수록 혁신은 점진적인 수준에 머물 수 있습니다. RavenForge는 뛰어난 제작 완성도와 실제 새로운 시스템 설계를 구분해서 평가해야 합니다.'},
 'G. Gould Music':{
  en:'A designer-led boutique lineage is valuable, but small-scale production makes continuity of parts, documentation and service an important part of the design itself. A good instrument should remain understandable and repairable even if the original builder is no longer the only service path.',
  de:'Eine designergeführte Boutique-Tradition ist wertvoll, doch Kleinserienfertigung macht Teileversorgung, Dokumentation und Servicekontinuität zum Bestandteil der Konstruktion. Ein gutes Instrument sollte verständlich und reparierbar bleiben, auch wenn der ursprüngliche Erbauer nicht der einzige Serviceweg ist.',
  ko:'디자이너 중심의 부티크 계보는 가치가 있지만 소규모 생산일수록 부품·문서·서비스의 지속성 자체가 설계의 일부가 됩니다. 원 제작자만이 유일한 수리 경로가 되지 않도록 구조와 전자계를 이해 가능하게 남길 필요가 있습니다.'},
 'Halo Custom Guitars':{
  en:'Extreme specification freedom can serve unusual players, but unrestricted custom menus can also produce internally inconsistent instruments when scale, bridge, pickup, string and ergonomic choices are selected independently. The builder must actively govern compatibility rather than merely accept options.',
  de:'Extreme Spezifikationsfreiheit kann ungewöhnliche Spieleranforderungen erfüllen, doch ein nahezu unbegrenztes Custom-Menü kann inkonsistente Instrumente erzeugen, wenn Mensur, Brücke, Pickups, Saiten und Ergonomie unabhängig gewählt werden. Der Hersteller muss Kompatibilität aktiv steuern statt Optionen nur zu akzeptieren.',
  ko:'극단적으로 넓은 커스텀 범위는 특수한 요구를 해결할 수 있지만 스케일·브릿지·픽업·현·인체공학 옵션을 독립적으로 고르면 내부적으로 모순된 악기가 나올 수 있습니다. 제작자는 옵션을 받아주는 데 그치지 않고 호환성을 적극적으로 통제해야 합니다.'},
 'Skjold Design Guitars':{
  en:'Distinctive ergonomics and voicing are strengths, but a strongly authored body feel and pickup concept can be highly player-specific. Before borrowing the solution, RavenForge should test whether the benefit survives different playing positions, strap heights and repertoire rather than assuming boutique specificity is universal.',
  de:'Ausgeprägte Ergonomie und eigenes Voicing sind Stärken, können jedoch stark spielerspezifisch sein. RavenForge sollte prüfen, ob der Vorteil bei unterschiedlichen Spielhaltungen, Gurthöhen und Repertoires bestehen bleibt, statt Boutique-Spezifität als universell anzunehmen.',
  ko:'뚜렷한 인체공학과 보이싱은 강점이지만 제작자의 의도가 강한 바디 감각과 픽업 설계는 연주자별로 호불호가 클 수 있습니다. 다른 자세·스트랩 높이·레퍼토리에서도 이점이 유지되는지 검증한 뒤 차용해야 합니다.'},
 'Benevolent Basses':{
  en:'Very small custom production can produce exceptional attention to individual instruments, but continuity risk is proportionally higher: documentation, replacement parts and service routes need to survive changes in workshop capacity. RavenForge should treat maintainability after delivery as part of the product.',
  de:'Sehr kleine Custom-Fertigung kann einzelnen Instrumenten außergewöhnliche Aufmerksamkeit geben, erhöht aber das Kontinuitätsrisiko. Dokumentation, Ersatzteile und Servicewege müssen auch bei veränderter Werkstattkapazität bestehen bleiben. Wartbarkeit nach der Auslieferung ist Teil des Produkts.',
  ko:'극소규모 커스텀 제작은 한 악기에 높은 집중도를 줄 수 있지만 공방 상황이 바뀌었을 때 문서·교체 부품·서비스 경로가 끊길 위험도 비례해 커집니다. RavenForge는 출고 이후의 유지보수 가능성까지 제품의 일부로 봐야 합니다.'},
 'Maurizio Über Basses':{
  en:'Rare materials and highly individual artisanal builds create strong identity, but they also make cost, supply and repeatability difficult to normalize. RavenForge should distinguish craft value from material rarity and avoid making scarcity itself the reason for a premium specification.',
  de:'Seltene Materialien und stark individualisierte Handarbeit erzeugen Identität, erschweren jedoch Normalisierung von Kosten, Beschaffung und Reproduzierbarkeit. RavenForge sollte Handwerkswert von Materialseltenheit trennen und Knappheit nicht selbst zum Grund für eine Premium-Spezifikation machen.',
  ko:'희귀 재료와 강한 수공예 개성은 정체성을 만들지만 비용·수급·재현성을 표준화하기 어렵게 합니다. RavenForge는 공예적 가치와 재료의 희소성을 구분하고 ‘구하기 어렵다’는 사실 자체를 프리미엄 사양의 이유로 삼지 않아야 합니다.'},
 'Zakrzewski Basses':{
  en:'Sculptural one-off work can challenge conventional ergonomics productively, but the more unique every instrument becomes, the harder it is to compare outcomes, reproduce a successful setup and provide standardized service. Experimental form still needs controlled reference dimensions.',
  de:'Skulpturale Einzelstücke können konventionelle Ergonomie produktiv hinterfragen, doch je einzigartiger jedes Instrument ist, desto schwieriger werden Vergleich, Reproduktion erfolgreicher Setups und standardisierter Service. Experimentelle Form braucht weiterhin kontrollierte Referenzmaße.',
  ko:'조형적인 원오프 제작은 기존 인체공학을 생산적으로 흔들 수 있지만 악기마다 지나치게 달라지면 결과 비교·성공한 셋업의 재현·표준 서비스가 어려워집니다. 실험적인 외형에도 통제된 기준 치수는 필요합니다.'},
 'Stradi Basses':{
  en:'Natural-edge and material-forward aesthetics can create a powerful identity, but irregular outlines need to be checked against seated stability, case fit, weight distribution and reproducible manufacturing. Preserving the visible character of a wood blank should not take priority over the player interface.',
  de:'Naturkanten und materialbetonte Ästhetik schaffen starke Identität, doch unregelmäßige Konturen müssen auf Sitzstabilität, Kofferpassform, Gewichtsverteilung und reproduzierbare Fertigung geprüft werden. Der sichtbare Charakter eines Holzstücks darf die Schnittstelle zum Spieler nicht überstimmen.',
  ko:'자연스러운 엣지와 소재를 전면에 드러내는 미학은 강한 정체성을 만들지만 불규칙한 외곽은 착좌 안정성·케이스 호환·무게 배분·생산 재현성과 충돌할 수 있습니다. 목재 원판의 개성을 살리는 것이 연주자와 닿는 인터페이스보다 우선해서는 안 됩니다.'},
 'Roks Instruments':{
  en:'Experimental construction is valuable precisely because it challenges assumptions, but a small ecosystem also means less field data on long-term wear, parts and repair. New mechanisms should therefore be documented and stress-tested more rigorously, not less, than conventional ones.',
  de:'Experimentelle Konstruktion ist wertvoll, weil sie Annahmen hinterfragt, doch ein kleines Ökosystem bedeutet weniger Felddaten zu Verschleiß, Teilen und Reparatur. Neue Mechanismen sollten deshalb strenger dokumentiert und belastungsgeprüft werden als konventionelle.',
  ko:'실험적 구조는 기존 전제를 흔든다는 점에서 가치가 있지만 작은 생태계일수록 장기 마모·부품·수리 데이터가 부족합니다. 새로운 메커니즘일수록 관습적 구조보다 더 강한 문서화와 스트레스 테스트가 필요합니다.'},
 'Moon Guitar':{
  en:'Full-custom handwork allows direct iteration between drawing and workshop, but small-shop production can make process knowledge too dependent on the individual maker. Jigs, tolerances, wiring records and setup criteria should be documented so quality is a repeatable system rather than personal memory.',
  de:'Vollständige Custom-Handarbeit erlaubt direkte Iteration zwischen Zeichnung und Werkstatt, kann Prozesswissen in kleinen Betrieben jedoch stark an eine Person binden. Vorrichtungen, Toleranzen, Verdrahtungspläne und Setup-Kriterien sollten dokumentiert werden, damit Qualität ein reproduzierbares System statt persönlicher Erinnerung ist.',
  ko:'풀 커스텀 수작업은 도면과 공방 사이의 빠른 반복을 가능하게 하지만 소규모 제작에서는 공정 지식이 제작자 개인에게 지나치게 의존할 수 있습니다. 지그·공차·배선 기록·셋업 기준을 문서화해 품질이 개인 기억이 아니라 재현 가능한 시스템이 되도록 해야 합니다.'},
 'Wal Basses':{
  en:'The multi-coil pickup and filter-preamp system is historically distinctive, but proprietary electronics, limited supply and strong scarcity pricing make ownership and service expensive. RavenForge should study the signal architecture while designing equivalents around replaceable modules and documented service paths rather than reproducing scarcity.',
  de:'Multi-Coil-Pickups und Filter-Preamp sind historisch eigenständig, doch proprietäre Elektronik, begrenzte Verfügbarkeit und Knappheitspreise machen Besitz und Service teuer. RavenForge sollte die Signalarchitektur untersuchen, sie aber mit austauschbaren Modulen und dokumentierten Servicewegen statt künstlicher Knappheit neu interpretieren.',
  ko:'멀티코일 픽업과 필터 프리앰프는 역사적으로 독창적이지만 전용 전자계·제한된 공급·희소성 가격 때문에 소유와 수리가 비싸집니다. RavenForge는 신호 구조를 연구하되 희소성을 복제하기보다 교체 가능한 모듈과 문서화된 서비스 경로로 재해석하는 편이 낫습니다.'}
};
function replace(e,l,text){
 let d=String(e.details||'');
 const p=`<p data-rf-critical-review="1"><strong>${LABEL[l]}:</strong> ${text}</p>`;
 const re=/<p data-rf-critical-review="1">[\s\S]*?<\/p>/;
 if(re.test(d))e.details=d.replace(re,p);
}
for(const l of ['en','de','ko']){
 const a=translations[l]&&translations[l].luthierData||[];
 a.forEach(e=>{const x=M[e.name]&&M[e.name][l];if(x)replace(e,l,x)});
}
})();