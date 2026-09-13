(()=>{'use strict';
const root=document.documentElement;
const currentLang=()=>['en','de','ko'].includes(root.lang)?root.lang:'en';
const german=new Set(['Germany','Deutschland','독일']);
const rank=e=>german.has(e.country)?0:e.region==='europe'?1:e.region==='asia'?2:e.region==='usa'?4:3;
function entryMap(){
  if(typeof translations!=='object')return new Map();
  const l=currentLang(),arr=translations[l]&&translations[l].luthierData||[];
  const collator=new Intl.Collator(l==='ko'?'ko-KR':l,{sensitivity:'base',numeric:true});
  const sorted=[...arr].sort((a,b)=>rank(a)-rank(b)||collator.compare(a.country||'',b.country||'')||collator.compare(a.name||'',b.name||''));
  return new Map(sorted.map((e,i)=>[e.name,i]));
}
function reorder(){
  const grid=document.getElementById('luthier-grid');
  if(!grid)return;
  const map=entryMap();
  const cards=[...grid.children].filter(el=>el.tagName==='DIV'&&el.querySelector('h3'));
  if(cards.length<2)return;
  const desired=[...cards].sort((a,b)=>(map.get(a.querySelector('h3').textContent.trim())??9999)-(map.get(b.querySelector('h3').textContent.trim())??9999));
  if(cards.every((el,i)=>el===desired[i]))return;
  const frag=document.createDocumentFragment();
  desired.forEach(el=>frag.appendChild(el));
  const empty=grid.querySelector('#rf-type-empty');
  grid.insertBefore(frag,empty||null);
}
function bind(){
  const grid=document.getElementById('luthier-grid');
  if(!grid)return;
  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;reorder();});};
  new MutationObserver(schedule).observe(grid,{childList:true});
  reorder();
  document.addEventListener('click',e=>{if(e.target.closest('#analysis select,#analysis button'))setTimeout(reorder,0);});
  new MutationObserver(()=>setTimeout(reorder,0)).observe(root,{attributes:true,attributeFilter:['lang']});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind):bind();
})();