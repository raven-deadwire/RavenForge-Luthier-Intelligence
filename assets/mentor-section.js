(()=>{
'use strict';
const VERSION='20260915-mentors-2';
const root=document.documentElement;
const imageFiles=[
 {key:'hojin',url:`assets/mentors/hojin-jeong.txt?v=${VERSION}`,alt:{en:'Berklee GT Repair illustration',de:'Illustration von Berklee GT Repair',ko:'버클리 GT 리페어 이미지'},fit:'cover'},
 {key:'chanho',url:`assets/mentors/chanho-moon.txt?v=${VERSION}`,alt:{en:'Moon Guitar logo',de:'Moon-Guitar-Logo',ko:'문기타 로고'},fit:'contain'},
 {key:'dongseok',url:`assets/mentors/dongseok-lee.txt?v=${VERSION}`,alt:{en:'Art N Crew studio',de:'Studio von Art N Crew',ko:'아트앤크루 스튜디오'},fit:'cover'}
];
const copy={
 en:{
  title:'My Mentors',
  intro:'Three mentors whose experience provides the practical foundation for how RavenForge approaches repair, instrument making, sound and electronics.',
  credentialLabel:'BACKGROUND',
  cards:[
   {name:'Hojin Jeong',org:'Berklee GT Repair',role:'REPAIR · SETUP · DIAGNOSIS',authority:'A veteran repair specialist known among professional players and collectors for high-end and vintage instrument work. Before focusing on repair, he spent 15 years in product development at Dexter Guitars and has since built more than two decades of specialist repair experience.',desc:'Through hands-on repair and setup training with Hojin Jeong, I am learning to diagnose an instrument before changing it, recover performance without erasing its identity, and treat serviceability as part of the original design problem.'},
   {name:'Chanho Moon',org:'Moon Guitar',role:'LUTHERIE · PROTOTYPING · MATERIALS',authority:'A full-custom luthier who graduated as valedictorian from the Galloup School of Lutherie in the United States. His work is built around direct control of the entire process, from material preparation through construction and final setup, and his instruments have been used by working artists in Korea and abroad.',desc:'My work with Chanho Moon connects RavenForge drawings to actual fabrication. Prototype development, wood preparation, construction sequence and repeated fit-and-adjust decisions are where design ideas are tested against the realities of the workshop.'},
   {name:'Dongseok Lee (Remi Lee)',org:'Art N Crew',role:'SOUND · ELECTRONICS · SIGNAL FLOW',authority:'An educator, sound engineer and builder whose career spans recording, circuit design and instrument-related electronics. He has taught at the Yonsei University Conservatory, worked on recordings for major Korean artists including Light and Salt, served as a builder at Freebud Mod Shop and Craftshouse, and now continues his work as Sound Master at Art N Crew.',desc:'Professor Dongseok Lee has influenced how I think about sound as a complete signal system rather than a pickup or amplifier in isolation. His perspective on recording, circuits, amplifiers and effects provides an important reference for RavenForge electronics and listening tests.'}
  ]
 },
 de:{
  title:'Meine Mentoren',
  intro:'Drei Mentoren, deren Erfahrung die praktische Grundlage dafür bildet, wie RavenForge Reparatur, Instrumentenbau, Klang und Elektronik betrachtet.',
  credentialLabel:'HINTERGRUND',
  cards:[
   {name:'Hojin Jeong',org:'Berklee GT Repair',role:'REPARATUR · SETUP · DIAGNOSE',authority:'Ein erfahrener Reparaturspezialist, der unter professionellen Musikern und Sammlern für Arbeiten an hochwertigen und Vintage-Instrumenten bekannt ist. Vor seiner Spezialisierung auf Reparatur arbeitete er 15 Jahre in der Produktentwicklung bei Dexter Guitars und verfügt heute über mehr als zwei Jahrzehnte spezialisierter Reparaturpraxis.',desc:'In der praktischen Reparatur- und Setup-Ausbildung bei Hojin Jeong lerne ich, ein Instrument zuerst zu diagnostizieren, seine Funktion wiederherzustellen ohne seine Identität auszulöschen und Wartungsfreundlichkeit bereits als Teil der Konstruktion zu verstehen.'},
   {name:'Chanho Moon',org:'Moon Guitar',role:'GITARRENBAU · PROTOTYPING · MATERIAL',authority:'Ein Full-Custom-Luthier, der die Galloup School of Lutherie in den USA als Jahrgangsbester abgeschlossen hat. Er kontrolliert den gesamten Prozess von der Materialvorbereitung über die Konstruktion bis zum finalen Setup selbst; seine Instrumente werden von aktiven Musikern in Korea und im Ausland eingesetzt.',desc:'Die Arbeit mit Chanho Moon verbindet RavenForge-Zeichnungen mit tatsächlicher Fertigung. Prototypenentwicklung, Holzvorbereitung, Fertigungsreihenfolge und wiederholte Passungs- und Korrekturschritte zeigen, wo sich Entwurfsideen in der Werkstatt bewähren müssen.'},
   {name:'Dongseok Lee (Remi Lee)',org:'Art N Crew',role:'KLANG · ELEKTRONIK · SIGNALWEG',authority:'Pädagoge, Toningenieur und Builder mit Erfahrung in Recording, Schaltungsentwicklung und Instrumentenelektronik. Er lehrte am Yonsei University Conservatory, arbeitete an Produktionen namhafter koreanischer Künstler wie Light and Salt, war Builder bei Freebud Mod Shop und Craftshouse und ist heute als Sound Master bei Art N Crew tätig.',desc:'Professor Dongseok Lee hat meinen Blick auf Klang als vollständiges Signalsystem geprägt, nicht als isolierte Frage von Pickup oder Verstärker. Seine Perspektive auf Recording, Schaltungen, Verstärker und Effekte ist ein wichtiger Bezugspunkt für RavenForge-Elektronik und Hörtests.'}
  ]
 },
 ko:{
  title:'나의 멘토',
  intro:'RavenForge에서 리페어, 악기 제작, 사운드와 전자계를 바라보는 방식의 실무적 토대를 만들어 준 세 분의 멘토입니다.',
  credentialLabel:'대표 경력',
  cards:[
   {name:'정호진 사장님',org:'버클리 GT 리페어',role:'REPAIR · SETUP · DIAGNOSIS',authority:'프로 연주자와 컬렉터들 사이에서 빈티지·하이엔드 악기 리페어로 높은 신뢰를 받아 온 베테랑 리페어 전문가입니다. Dexter Guitars에서 15년간 제품 개발을 담당하며 악기 설계와 구조를 익혔고, 이후 20년 이상 전문 리페어 현장에서 경력을 쌓아 왔습니다.',desc:'정호진 사장님께 리페어와 셋업 실무를 배우며, 손대기 전에 악기의 상태를 먼저 진단하는 법, 악기의 정체성을 해치지 않으면서 본래 성능을 되찾는 법, 그리고 유지보수성까지 처음부터 설계의 일부로 보아야 한다는 관점을 익히고 있습니다.'},
   {name:'문찬호 사장님',org:'문기타',role:'LUTHERIE · PROTOTYPING · MATERIALS',authority:'미국 Galloup School of Lutherie를 수석으로 졸업한 풀 커스텀 루씨어입니다. 목재 준비와 선별부터 가공, 조립, 셋업까지 제작 전 과정을 직접 통제하는 방식으로 작업하며, 그의 악기들은 국내외 현업 아티스트들에게도 사용되어 왔습니다.',desc:'문찬호 사장님과의 작업은 RavenForge의 도면을 실제 제작으로 연결하는 과정입니다. 프로토타입 개발, 목재 준비, 제작 순서, 반복적인 가공과 피팅을 거치며 설계 아이디어가 공방의 현실 속에서 어떻게 검증되고 수정되는지를 배우고 있습니다.'},
   {name:'이동석 교수님 (Remi Lee)',org:'아트앤크루',role:'SOUND · ELECTRONICS · SIGNAL FLOW',authority:'교육자이자 사운드 엔지니어, 빌더로서 레코딩과 회로 설계, 악기 전자계 전반을 다뤄 온 인물입니다. 연세대학교 콘서바토리에서 후학을 가르쳤고, 빛과 소금을 비롯한 주요 뮤지션들의 음반 작업에 참여했으며 Freebud Mod Shop과 Craftshouse에서 빌더로 활동했습니다. 현재는 아트앤크루의 Sound Master로 활동하고 있습니다.',desc:'이동석 교수님에게서는 픽업이나 앰프 하나를 따로 보는 대신 전체 신호 경로를 하나의 시스템으로 듣고 분석하는 관점을 배웠습니다. 레코딩, 회로, 앰프와 이펙터를 함께 보는 그의 접근은 RavenForge의 전자계 설계와 청감 평가에서 중요한 기준이 됩니다.'}
  ]
 }
};
const images={};
const lang=()=>copy[root.lang]?root.lang:'en';
function patchTranslations(){
 if(typeof translations!=='object')return;
 for(const l of ['en','de','ko']){
  const t=translations[l];if(!t)continue;const c=copy[l];
  t.mentorsTitle=c.title;
  c.cards.forEach((card,i)=>{const n=i+1;t[`mentor${n}Name`]=`${card.name} (${card.org})`;t[`mentor${n}Desc`]=`<p>${card.authority}</p><p>${card.desc}</p>`});
 }
}
function render(){
 const section=document.querySelector('#about-content-mentors #mentors-section');
 if(!section)return;
 const l=lang(),t=copy[l];
 section.innerHTML=`<div class="rf-mentors-head"><p class="rf-mentors-eyebrow">RAVENFORGE / MENTORSHIP</p><h3>${t.title}</h3><p>${t.intro}</p></div><div class="rf-mentor-grid">${t.cards.map((card,i)=>{const meta=imageFiles[i],src=images[meta.key]||'';return `<article class="rf-mentor-card"><div class="rf-mentor-media"><img ${src?`src="${src}"`:''} data-mentor-image="${meta.key}" alt="${meta.alt[l]}" style="object-fit:${meta.fit}"></div><div class="rf-mentor-copy"><p class="rf-mentor-role">${card.role}</p><h4>${card.name}</h4><p class="rf-mentor-org">${card.org}</p><div class="rf-mentor-authority"><span>${t.credentialLabel}</span><p>${card.authority}</p></div><p class="rf-mentor-desc">${card.desc}</p></div></article>`}).join('')}</div>`;
}
function styles(){
 if(document.getElementById('rf-mentor-style'))return;
 const s=document.createElement('style');s.id='rf-mentor-style';s.textContent=`
 #about-content-mentors #mentors-section{max-width:1180px;margin:0 auto}
 .rf-mentors-head{margin:0 0 1.5rem}.rf-mentors-eyebrow{font-size:.72rem;letter-spacing:.16em;font-weight:700;color:#64748b;margin:0 0 .45rem}.rf-mentors-head h3{font-size:1.65rem;font-weight:700;color:#1e293b;margin:0 0 .55rem}.rf-mentors-head>p:last-child{max-width:820px;color:#64748b;line-height:1.7;margin:0}
 .rf-mentor-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.4rem;align-items:stretch}.rf-mentor-card{background:#fff;border:1px solid #d6d3d1;border-radius:.65rem;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.06);display:flex;flex-direction:column}.rf-mentor-media{min-height:190px;background:#eef0ee;display:flex;align-items:center;justify-content:center;border-bottom:1px solid #e7e5e4}.rf-mentor-media img{display:block;width:150px;height:150px;max-width:150px;max-height:150px;border:1px solid rgba(100,116,139,.18);background:#fff}.rf-mentor-copy{padding:1.2rem 1.2rem 1.35rem}.rf-mentor-role{font-size:.68rem;letter-spacing:.11em;font-weight:700;color:#64748b;margin:0 0 .55rem}.rf-mentor-copy h4{font-size:1.2rem;font-weight:700;color:#1e293b;margin:0 0 .25rem}.rf-mentor-org{font-size:.88rem;font-weight:600;color:#475569;margin:0 0 .9rem}.rf-mentor-authority{padding:.8rem .85rem;background:#f8fafc;border-left:3px solid #94a3b8;margin:0 0 .95rem}.rf-mentor-authority>span{display:block;font-size:.64rem;letter-spacing:.1em;font-weight:700;color:#64748b;margin:0 0 .35rem}.rf-mentor-authority p{font-size:.88rem;line-height:1.62;color:#475569;margin:0}.rf-mentor-desc{font-size:.93rem;line-height:1.72;color:#64748b;margin:0}
 @media(max-width:900px){.rf-mentor-grid{grid-template-columns:1fr}.rf-mentor-card{display:grid;grid-template-columns:190px 1fr}.rf-mentor-media{min-height:100%;border-bottom:0;border-right:1px solid #e7e5e4}}
 @media(max-width:600px){.rf-mentor-card{display:flex}.rf-mentor-media{min-height:180px;border-right:0;border-bottom:1px solid #e7e5e4}.rf-mentor-copy{padding:1rem 1rem 1.2rem}}
 `;document.head.appendChild(s);
}
async function loadImages(){
 await Promise.all(imageFiles.map(async item=>{try{const r=await fetch(item.url,{cache:'reload'});if(!r.ok)throw new Error(String(r.status));const b=(await r.text()).trim();if(b)images[item.key]=b.startsWith('data:')?b:`data:image/jpeg;base64,${b}`}catch(e){console.warn('Mentor image could not be loaded:',item.key,e)}}));
 render();
}
function init(){patchTranslations();styles();render();loadImages();new MutationObserver(()=>{patchTranslations();render()}).observe(root,{attributes:true,attributeFilter:['lang']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();