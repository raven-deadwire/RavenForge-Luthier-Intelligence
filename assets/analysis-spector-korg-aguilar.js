(()=>{'use strict';
if(typeof translations!=='object')return;
const EXTRA={
 en:`<span data-rf-spector-korg-aguilar="1">A further critical point is the electronics direction after KORG USA's acquisition. Spector's own history states that KORG USA took over North American distribution in 2015 and purchased Spector in 2019. In the following era, Aguilar pickups and/or OBP electronics repeatedly appeared across lines including Legend Neck-Thru, NS Ethos, Euro RST and the current NS Icon. RavenForge's assessment is that this pairing is poorly matched to the historic Spector identity built around the fast attack, compressed aggression and upper-mid growl associated with EMG-driven instruments and classic Spector preamp voicings. Aguilar's generally warmer, smoother and broader presentation can be excellent on its own, but here it tends to soften the very edge that makes a Spector immediately identifiable. "Failure" here does not claim commercial failure; it means repeated failure, in RavenForge's view, to preserve the core Spector voice despite several attempts to integrate Aguilar into the platform. The current NS Icon's custom-voiced Aguilar DCB/OBP-2 package is especially useful as a reminder that component quality and brand-voice compatibility are separate questions.</span>`,
 de:`<span data-rf-spector-korg-aguilar="1">Ein weiterer kritischer Punkt ist die Elektronikstrategie nach der Übernahme durch KORG USA. Laut Spectors eigener Firmengeschichte übernahm KORG USA 2015 den Vertrieb in Nordamerika und kaufte Spector 2019. In der folgenden Ära tauchten Aguilar-Tonabnehmer und/oder OBP-Elektroniken wiederholt in Reihen wie Legend Neck-Thru, NS Ethos, Euro RST und dem aktuellen NS Icon auf. Aus RavenForge-Sicht passt diese Kombination nur bedingt zur historischen Spector-Identität, die von schnellem Attack, komprimierter Aggressivität und ausgeprägtem oberen Mitten-Growl geprägt ist, wie man ihn von EMG-bestückten Instrumenten und klassischen Spector-Preamps kennt. Aguilars meist wärmere, glattere und breiter abgestimmte Klangästhetik kann für sich hervorragend sein, nimmt einem Spector hier jedoch häufig genau die Schärfe, die ihn unmittelbar erkennbar macht. Mit „Fehlschlag“ ist ausdrücklich kein kommerzieller Misserfolg gemeint, sondern die RavenForge-Bewertung, dass mehrere Integrationsversuche den Kerncharakter von Spector klanglich nicht überzeugend bewahrt haben. Gerade das aktuelle NS Icon mit speziell für Spector abgestimmten Aguilar DCBs und OBP-2 zeigt, dass Bauteilqualität und Passung zur Markenstimme zwei unterschiedliche Fragen sind.</span>`,
 ko:`<span data-rf-spector-korg-aguilar="1">또 하나의 비판 지점은 KORG USA 인수 이후의 전자계 방향입니다. Spector 공식 히스토리상 KORG USA는 2015년 북미 유통을 맡기 시작했고 2019년에 Spector를 인수했습니다. 이후 Legend Neck-Thru, NS Ethos, Euro RST, 현재의 NS Icon까지 Aguilar 픽업 및 OBP 계열 전자계를 여러 라인에서 반복적으로 전개했습니다. RavenForge의 평가는 이 조합이 역사적인 Spector의 핵심인 EMG 기반의 빠른 어택, 압축된 공격성, 거친 상부 중역의 'growl'과는 캐릭터적으로 잘 맞지 않는다는 것입니다. Aguilar 특유의 비교적 따뜻하고 매끈하며 넓은 성향은 그 자체로는 훌륭하지만, Spector에 적용되면 오히려 이 브랜드를 즉시 알아보게 만드는 날과 공격성을 희석시키는 경우가 많습니다. 여기서 '실패'는 판매량이나 상업적 실패를 단정하는 의미가 아니라, Spector 고유 캐릭터를 계승하는 보이싱이라는 기준에서 여러 차례 시도됐음에도 RavenForge가 반복적으로 설득력이 부족했다고 평가한다는 뜻입니다. 특히 최신 NS Icon에서조차 Spector용으로 커스텀 보이스한 Aguilar DCB와 OBP-2 조합을 다시 채택한 점은, 부품 자체의 품질과 브랜드 보이스에 대한 적합성은 별개의 문제라는 사례로 볼 수 있습니다.</span>`
};
const SOURCE={
 en:`<span class="block text-sm text-slate-500 mt-2" data-rf-spector-source="1">Official sources: <a href="https://spectorbass.com/pages/history" target="_blank" rel="noopener noreferrer">Spector history</a> · <a href="https://spectorbass.com/products/icon-ns-5-bolt-on" target="_blank" rel="noopener noreferrer">NS Icon / Aguilar electronics</a></span>`,
 de:`<span class="block text-sm text-slate-500 mt-2" data-rf-spector-source="1">Offizielle Quellen: <a href="https://spectorbass.com/pages/history" target="_blank" rel="noopener noreferrer">Spector-Historie</a> · <a href="https://spectorbass.com/products/icon-ns-5-bolt-on" target="_blank" rel="noopener noreferrer">NS Icon / Aguilar-Elektronik</a></span>`,
 ko:`<span class="block text-sm text-slate-500 mt-2" data-rf-spector-source="1">공식 출처: <a href="https://spectorbass.com/pages/history" target="_blank" rel="noopener noreferrer">Spector 공식 히스토리</a> · <a href="https://spectorbass.com/products/icon-ns-5-bolt-on" target="_blank" rel="noopener noreferrer">NS Icon / Aguilar 전자계</a></span>`
};
for(const l of ['en','de','ko']){
 const arr=translations[l]&&translations[l].luthierData||[];
 const e=arr.find(x=>x&&x.name==='Spector Basses');
 if(!e)continue;
 let d=String(e.details||'');
 if(d.includes('data-rf-spector-korg-aguilar="1"'))continue;
 const extra=EXTRA[l]+SOURCE[l];
 const re=/<p data-rf-critical-review="1">([\s\S]*?)<\/p>/;
 if(re.test(d))d=d.replace(re,(m,body)=>`<p data-rf-critical-review="1">${body}<br>${extra}</p>`);
 else d+=`<p data-rf-critical-review="1">${extra}</p>`;
 e.details=d;
}

const LABEL={en:'Critical review',de:'Kritische Einordnung',ko:'비판적 검토'};
const BASS_FIRST={
 'Skervesen Guitars':{
  en:'RavenForge’s comparative assessment is that Skervesen’s bass work shows excellent fabrication and extended-range custom capability, but the design logic often still feels guitar-first. Multiscale and extended-string options are present, yet scale choice, low-string response, pickup placement, mass distribution and electronics can read more like an expansion of modern metal-guitar language than a bass platform whose variables were developed as one integrated low-frequency system. This is not a criticism of workmanship; it is a criticism of how clearly bass-specific priorities are expressed compared with Skervesen’s much more mature guitar identity.',
  de:'In der vergleichenden RavenForge-Bewertung zeigt Skervesen bei Bässen eine sehr hohe Fertigungsqualität und starke Extended-Range-Custom-Fähigkeiten, die Konstruktionslogik wirkt jedoch häufig weiterhin gitarrenzentriert. Multiscale- und erweiterte Saitenkonzepte sind vorhanden, doch Mensurwahl, Verhalten der tiefen Saiten, Pickup-Position, Massenverteilung und Elektronik erscheinen eher als Erweiterung moderner Metal-Gitarren-Sprache denn als vollständig integriertes Basssystem. Das ist keine Kritik an der handwerklichen Qualität, sondern daran, wie deutlich bassspezifische Prioritäten im Vergleich zur wesentlich ausgereifteren Gitarrenidentität formuliert werden.',
  ko:'RavenForge의 비교 평가에서는 Skervesen의 베이스도 제작 완성도와 확장현 커스텀 역량 자체는 뛰어나지만, 설계 논리는 여전히 기타 중심으로 느껴지는 부분이 있습니다. 멀티스케일과 확장현 사양을 제공하더라도 스케일 선택, 저현 반응, 픽업 위치, 질량 배분, 전자계가 하나의 저주파 악기 시스템으로 통합 설계됐다기보다 현대 메탈 기타의 설계 언어를 베이스로 확장한 인상이 강합니다. 이는 가공 품질의 문제가 아니라, 기타에서 보여주는 성숙한 설계 정체성에 비해 베이스 고유의 우선순위가 얼마나 선명하게 드러나는가에 대한 비판입니다.'
 },
 'Aristides Guitars':{
  en:'RavenForge sees a similar guitar-first bias in Aristides’ bass history. The one-piece Arium/exoskeleton concept gives the brand unusual consistency and structural stability, but those strengths originate in a platform whose deepest design maturity was established on guitars. The current S/B generation is an important counterpoint: Aristides explicitly describes it as a ground-up, bass-focused redesign developed through years of research, with multiscale layouts and bass-specific dimensions. Even so, RavenForge’s comparative impression is that the brand’s understanding of low-frequency mass, extended-range ergonomics, pickup-position voicing and the bass as an independent system is still less deeply proven than its guitar expertise or that of specialist bass builders. The criticism therefore concerns relative maturity, not the absence of bass R&D.',
  de:'RavenForge erkennt auch in der Bassgeschichte von Aristides eine gewisse Gitarren-Priorität. Das einteilige Arium-/Exoskelett-Konzept bietet außergewöhnliche Reproduzierbarkeit und strukturelle Stabilität, seine größte konstruktive Reife entstand jedoch zunächst auf der Gitarrenplattform. Die aktuelle S/B-Generation ist dabei ein wichtiger Gegenpunkt: Aristides beschreibt sie ausdrücklich als von Grund auf bassorientierte Neuentwicklung nach mehrjähriger Forschung, mit Multiscale-Layouts und bassspezifischen Abmessungen. Dennoch wirkt das Verständnis von tieffrequenter Masse, Extended-Range-Ergonomie, Pickup-Positionierung und dem Bass als eigenständigem Gesamtsystem in der RavenForge-Gegenüberstellung noch weniger tief belegt als die Gitarrenkompetenz der Marke oder die Arbeit spezialisierter Bassbauer. Die Kritik betrifft somit die relative Reife, nicht das Fehlen von Bass-Forschung.',
  ko:'Aristides에서도 RavenForge는 비슷한 기타 우선의 흔적을 봅니다. Arium 코어와 일체형 exoskeleton 구조는 높은 재현성과 구조 안정성을 주지만, 이 기술의 가장 깊은 설계 경험은 본래 기타 플랫폼에서 축적됐습니다. 다만 현재 S/B 세대는 중요한 반례입니다. Aristides 스스로 수년간의 연구를 거쳐 베이스를 위해 처음부터 다시 설계한 라인이라고 설명하며, 멀티스케일과 베이스 전용 치수도 적극적으로 적용하고 있습니다. 그럼에도 RavenForge의 비교 인상에서는 저주파 질량감, 확장현 인체공학, 픽업 위치와 보이싱, 그리고 베이스를 하나의 독립 시스템으로 다루는 깊이가 아직 자사의 기타 설계나 전문 베이스 루씨어들만큼 충분히 축적됐다고 느껴지지는 않습니다. 따라서 이 비판은 베이스 R&D가 없다는 뜻이 아니라 기타 대비 설계 성숙도의 상대적 차이에 관한 것입니다.'
 }
};
const ARISTIDES_SOURCE={
 en:`<span class="block text-sm text-slate-500 mt-2">Official reference: <a href="https://aristidesinstruments.com/basses/" target="_blank" rel="noopener noreferrer">Aristides S/B Bass Series</a></span>`,
 de:`<span class="block text-sm text-slate-500 mt-2">Offizielle Referenz: <a href="https://aristidesinstruments.com/basses/" target="_blank" rel="noopener noreferrer">Aristides S/B Bass Series</a></span>`,
 ko:`<span class="block text-sm text-slate-500 mt-2">공식 참고: <a href="https://aristidesinstruments.com/basses/" target="_blank" rel="noopener noreferrer">Aristides S/B Bass Series</a></span>`
};
for(const l of ['en','de','ko']){
 const arr=translations[l]&&translations[l].luthierData||[];
 for(const name of Object.keys(BASS_FIRST)){
  const e=arr.find(x=>x&&x.name===name);if(!e)continue;
  let d=String(e.details||'');
  const source=name==='Aristides Guitars'?ARISTIDES_SOURCE[l]:'';
  const p=`<p data-rf-critical-review="1"><strong>${LABEL[l]}:</strong> ${BASS_FIRST[name][l]}${source}</p>`;
  const re=/<p data-rf-critical-review="1">[\s\S]*?<\/p>/;
  e.details=re.test(d)?d.replace(re,p):d+p;
 }
}
})();