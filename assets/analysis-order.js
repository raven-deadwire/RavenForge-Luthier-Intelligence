(()=>{'use strict';
const root=document.documentElement;
const pinned=['Marleaux Basses','Sandberg Guitars','Vincent Bass Guitars'];
const pinRank=e=>{const i=pinned.indexOf(e.name);return i<0?999:i;};
const asiaCountries=new Set([
  'Japan','일본','Japon','South Korea','Korea','Republic of Korea','대한민국','한국','Südkorea',
  'China','중국','China (PRC)','Taiwan','대만','Taiwan (ROC)','Indonesia','인도네시아','Indonesien',
  'Singapore','싱가포르','Singapur','Thailand','태국','Vietnam','베트남','Malaysia','말레이시아','Philippines','필리핀'
]);
const isAsia=e=>e.region==='asia'||asiaCountries.has(e.country);
const rank=e=>e.country==='Germany'?0:e.region==='europe'?1:isAsia(e)?2:e.region==='usa'?4:3;
function normalizeRegions(){
  if(typeof translations!=='object')return;
  ['en','de','ko'].forEach(l=>{
    const arr=translations[l]&&translations[l].luthierData||[];
    arr.forEach(e=>{if(isAsia(e))e.region='asia';});
  });
}
function canonicalEntries(){
  if(typeof translations!=='object')return [];
  const master=translations.en&&translations.en.luthierData||[];
  const collator=new Intl.Collator('en',{sensitivity:'base',numeric:true});
  return [...master].sort((a,b)=>{
    const ra=rank(a),rb=rank(b);
    if(ra!==rb)return ra-rb;
    if(ra===0){const pa=pinRank(a),pb=pinRank(b);if(pa!==pb)return pa-pb;}
    return collator.compare(a.country||'',b.country||'')||collator.compare(a.name||'',b.name||'');
  });
}
function entryMap(){
  return new Map(canonicalEntries().map((e,i)=>[e.name,i]));
}
function reorder(){
  const grid=document.getElementById('luthier-grid');
  if(!grid)return;
  const map=entryMap();
  const cards=[...grid.children].filter(el=>el.tagName==='DIV'&&el.querySelector('h3'));
  if(cards.length<2)return;
  const desired=[...cards].sort((a,b)=>{
    const an=a.querySelector('h3').textContent.trim(),bn=b.querySelector('h3').textContent.trim();
    const ai=map.get(an),bi=map.get(bn);
    if(ai!=null||bi!=null)return (ai??9999)-(bi??9999);
    return an.localeCompare(bn,'en',{sensitivity:'base',numeric:true});
  });
  if(cards.every((el,i)=>el===desired[i]))return;
  const frag=document.createDocumentFragment();
  desired.forEach(el=>frag.appendChild(el));
  const empty=grid.querySelector('#rf-type-empty');
  grid.insertBefore(frag,empty||null);
}
function bind(){
  normalizeRegions();
  const grid=document.getElementById('luthier-grid');
  if(!grid)return;
  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;reorder();});};
  new MutationObserver(schedule).observe(grid,{childList:true});
  reorder();
  document.addEventListener('click',e=>{if(e.target.closest('#analysis select,#analysis button'))setTimeout(reorder,0);});
  new MutationObserver(()=>{normalizeRegions();setTimeout(reorder,0)}).observe(root,{attributes:true,attributeFilter:['lang']});
}
normalizeRegions();
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind):bind();
})();