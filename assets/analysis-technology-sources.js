(()=>{'use strict';
if(typeof translations!=='object')return;
const labels={en:'Official source',de:'Offizielle Quelle',ko:'공식 자료'};
const sources={
 'Nova — Innovative Pickup Systems':'https://www.nova-pickups.com/',
 'ZUTA Group':'https://zutagroup.com/',
 'Lusithand Devices':'https://lusithanddevices.com/',
 'Underhill Bass Electronics':'https://www.underhillbass.com/',
 'Turner Pickups':'https://www.turnerpickups.com/',
 'Herrick Pickups':'https://www.herrickpickups.com/',
 'ACG Filter Electronics — John East':'https://acguitars.co.uk/electronics/',
 'Fishman Fluence Bass':'https://fishman.com/fluence/',
 'KTS Musical Products — Titanium Reinforcement':'https://k-t-s.com/en/pages/kts-neck-support-rods',
 'Payson Bass — Multi-Scale Hardware':'https://www.paysonbass.com/',
 'Delano Pickup Systems':'https://www.delano.de/',
 'Häussel Pickups':'https://www.haeussel.com/',
 'McGrath Guitars — 12-Way Rotary Selector':'https://mcgrathguitars.com/blogs/news/12-way-rotary-selector'
};
const officialPara=/<p(?:\s+class="[^"]*")?>\s*<a\b[^>]*>(?:Official source|Offizielle Quelle|공식 자료)<\/a>\s*<\/p>/gi;
const novaRefs=/<p>\s*<a\b[^>]*nova-pickups\.com[^>]*>Omnia B4 MM<\/a>\s*·\s*<a\b[^>]*nova-pickups\.com[^>]*>Omnia B4 PQ<\/a>\s*·\s*<a\b[^>]*nova-pickups\.com[^>]*>Flux \/ Apex \/ FRFR<\/a>\s*<\/p>/gi;
for(const l of ['en','de','ko']){
 const arr=translations[l]&&translations[l].luthierData||[];
 for(const e of arr){
  if((e.entityType||'luthier')!=='technology')continue;
  const url=sources[e.name];if(!url)continue;
  let d=String(e.details||'').replace(officialPara,'').replace(novaRefs,'').trim();
  d+=`<p class="text-sm text-slate-500 mt-4"><a href="${url}" target="_blank" rel="noopener">${labels[l]}</a></p>`;
  e.details=d;
 }
}
})();