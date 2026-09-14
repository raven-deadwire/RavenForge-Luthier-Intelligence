(()=>{
'use strict';
const VERSION='20260915-mentors-1';
const root=document.documentElement;
const imageFiles=[
 {key:'hojin',url:`assets/mentors/hojin-jeong.txt?v=${VERSION}`,alt:{en:'Berklee Guitar Repair illustration',de:'Illustration von Berklee Guitar Repair',ko:'버클리 기타 리페어 이미지'},fit:'cover'},
 {key:'chanho',url:`assets/mentors/chanho-moon.txt?v=${VERSION}`,alt:{en:'Moon Guitar logo',de:'Moon-Guitar-Logo',ko:'문기타 로고'},fit:'contain'},
 {key:'dongseok',url:`assets/mentors/dongseok-lee.txt?v=${VERSION}`,alt:{en:'Art N Crew studio',de:'Studio von Art N Crew',ko:'아트앤크루 스튜디오'},fit:'cover'}
];
const copy={
 en:{
  title:'My Mentors',
  intro:'Three mentors whose work has directly shaped how I approach repair, instrument making, sound and electronics in RavenForge.',
  cards:[
   {name:'Hojin Jeong',org:'Berklee Guitar Repair (Berklee GT Repair)',role:'REPAIR · SETUP · DIAGNOSIS',desc:'Through hands-on repair and setup training with Hojin Jeong, I am learning to diagnose an instrument before changing it, restore performance without erasing its identity, and treat serviceability as part of the original design problem.'},
   {name:'Chanho Moon',org:'Moon Guitar',role:'LUTHERIE · PROTOTYPING · MATERIALS',desc:'My work with Chanho Moon connects RavenForge drawings to actual fabrication. Prototype development, wood preparation, construction sequence and repeated fit-and-adjust decisions are where design ideas are tested against the realities of the workshop.'},
   {name:'Dongseok Lee (Remi Lee)',org:'Art N Crew',role:'SOUND · ELECTRONICS · SIGNAL FLOW',desc:'Professor Dongseok Lee has influenced how I think about sound as a complete signal system rather than a pickup or amplifier in isolation. His perspective on recording, circuits, amplifiers and effects provides an important reference for RavenForge electronics and listening tests.'}
  ]
 },
 de:{
  title:'Meine Mentoren',
  intro:'Drei Mentoren, deren Arbeit meinen Umgang mit Reparatur, Instrumentenbau, Klang und Elektronik bei RavenForge unmittelbar geprägt hat.',
  cards:[
   {name:'Hojin Jeong',org:'Berklee Guitar Repair (Berklee GT Repair)',role:'REPARATUR · SETUP · DIAGNOSE',desc:'In der praktischen Reparatur- und Setup-Ausbildung bei Hojin Jeong lerne ich, ein Instrument zuerst zu diagnostizieren, seine Funktion wiederherzustellen ohne seine Identität auszulöschen und Wartungsfreundlichkeit bereits als Teil der Konstruktion zu verstehen.'},
   {name:'Chanho Moon',org:'Moon Guitar',role:'GITARRENBAU · PROTOTYPING · MATERIAL',desc:'Die Arbeit mit Chanho Moon verbindet RavenForge-Zeichnungen mit tatsächlicher Fertigung. Prototypenentwicklung, Holzvorbereitung, Fertigungsreihenfolge und wiederholte Passungs- und Korrekturschritte zeigen, wo sich Entwurfsideen in der Werkstatt bewähren müssen.'},
   {name:'Dongseok Lee (Remi Lee)',org:'Art N Crew',role:'KLANG · ELEKTRONIK · SIGNALWEG',desc:'Professor Dongseok Lee hat meinen Blick auf Klang als vollständiges Signalsystem geprägt, nicht als isolierte Frage von Pickup oder Verstärker. Seine Perspektive auf Recording, Schaltungen, Verstärker und Effekte ist ein wichtiger Bezugspunkt für RavenForge-Elektronik und Hörtests.'}
  ]
 },
 ko:{
  title:'나의 멘토',
  intro:'RavenForge에서 리페어, 악기 제작, 사운드와 전자계를 바라보는 방식에 직접적인 영향을 준 세 분의 멘토입니다.',
  cards:[
   {name:'정호진 사장님',org:'버클리 기타 리페어 (버클리 GT 리페어)',role:'REPAIR · SETUP · DIAGNOSIS',desc:'정호진 사장님께 리페어와 셋업 실무를 배우며, 손대기 전에 악기의 상태를 먼저 진단하는 법, 악기의 정체성을 해치지 않으면서 본래 성능을 되찾는 법, 그리고 유지보수성까지 처음부터 설계의 일부로 보아야 한다는 관점을 익히고 있습니다.'},
   {name:'문찬호 사장님',org:'문기타',role:'LUTHERIE · PROTOTYPING · MATERIALS',desc:'문찬호 사장님과의 작업은 RavenForge의 도면을 실제 제작으로 연결하는 과정입니다. 프로토타입 개발, 목재 준비, 제작 순서, 반복적인 가공과 피팅을 거치며 설계 아이디어가 공방의 현실 속에서 어떻게 검증되고 수정되는지를 배우고 있습니다.'},
   {name:'이동석 교수님 (Remi Lee)',org:'아트앤크루',role:'SOUND · ELECTRONICS · SIGNAL FLOW',desc:'이동석 교수님에게서는 픽업이나 앰프 하나를 따로 보는 대신 전체 신호 경로를 하나의 시스템으로 듣고 분석하는 관점을 배웠습니다. 레코딩, 회로, 앰프와 이펙터를 함께 보는 그의 접근은 RavenForge의 전자계 설계와 청감 평가에서 중요한 기준이 됩니다.'}
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
  c.cards.forEach((card,i)=>{const n=i+1;t[`mentor${n}Name`]=`${card.name} (${card.org})`;t[`mentor${n}Desc`]=`<p>${card.desc}</p>`});
 }
}
function render(){
 const section=document.querySelector('#about-content-mentors #mentors-section');
 if(!section)return;
 const l=lang(),t=copy[l];
 section.innerHTML=`<div class="rf-mentors-head"><p class="rf-mentors-eyebrow">RAVENFORGE / MENTORSHIP</p><h3>${t.title}</h3><p>${t.intro}</p></div><div class="rf-mentor-grid">${t.cards.map((card,i)=>{const meta=imageFiles[i],src=images[meta.key]||'';return `<article class="rf-mentor-card"><div class="rf-mentor-media"><img ${src?`src="${src}"`:''} data-mentor-image="${meta.key}" alt="${meta.alt[l]}" style="object-fit:${meta.fit}"></div><div class="rf-mentor-copy"><p class="rf-mentor-role">${card.role}</p><h4>${card.name}</h4><p class="rf-mentor-org">${card.org}</p><p class="rf-mentor-desc">${card.desc}</p></div></article>`}).join('')}</div>`;
}
function styles(){
 if(document.getElementById('rf-mentor-style'))return;
 const s=document.createElement('style');s.id='rf-mentor-style';s.textContent=`
 #about-content-mentors #mentors-section{max-width:1180px;margin:0 auto}
 .rf-mentors-head{margin:0 0 1.5rem}.rf-mentors-eyebrow{font-size:.72rem;letter-spacing:.16em;font-weight:700;color:#64748b;margin:0 0 .45rem}.rf-mentors-head h3{font-size:1.65rem;font-weight:700;color:#1e293b;margin:0 0 .55rem}.rf-mentors-head>p:last-child{max-width:760px;color:#64748b;line-height:1.7;margin:0}
 .rf-mentor-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.4rem;align-items:stretch}.rf-mentor-card{background:#fff;border:1px solid #d6d3d1;border-radius:.65rem;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.06);display:flex;flex-direction:column}.rf-mentor-media{min-height:190px;background:#eef0ee;display:flex;align-items:center;justify-content:center;border-bottom:1px solid #e7e5e4}.rf-mentor-media img{display:block;width:150px;height:150px;max-width:150px;max-height:150px;border:1px solid rgba(100,116,139,.18);background:#fff}.rf-mentor-copy{padding:1.2rem 1.2rem 1.35rem}.rf-mentor-role{font-size:.68rem;letter-spacing:.11em;font-weight:700;color:#64748b;margin:0 0 .55rem}.rf-mentor-copy h4{font-size:1.2rem;font-weight:700;color:#1e293b;margin:0 0 .25rem}.rf-mentor-org{font-size:.88rem;font-weight:600;color:#475569;margin:0 0 .85rem}.rf-mentor-desc{font-size:.93rem;line-height:1.72;color:#64748b;margin:0}
 @media(max-width:900px){.rf-mentor-grid{grid-template-columns:1fr}.rf-mentor-card{display:grid;grid-template-columns:190px 1fr}.rf-mentor-media{min-height:100%;border-bottom:0;border-right:1px solid #e7e5e4}}
 @media(max-width:600px){.rf-mentor-card{display:flex}.rf-mentor-media{min-height:180px;border-right:0;border-bottom:1px solid #e7e5e4}.rf-mentor-copy{padding:1rem 1rem 1.2rem}}
 `;document.head.appendChild(s);
}
async function loadImages(){
 await Promise.all(imageFiles.map(async item=>{try{const r=await fetch(item.url,{cache:'force-cache'});if(!r.ok)throw new Error(String(r.status));const b=(await r.text()).trim();if(b)images[item.key]=`data:image/jpeg;base64,${b}`}catch(e){console.warn('Mentor image could not be loaded:',item.key,e)}}));
 render();
}
function init(){patchTranslations();styles();render();loadImages();new MutationObserver(()=>{patchTranslations();render()}).observe(root,{attributes:true,attributeFilter:['lang']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();