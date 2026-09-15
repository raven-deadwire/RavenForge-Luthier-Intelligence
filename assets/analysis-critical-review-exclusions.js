(()=>{'use strict';if(typeof translations!=='object')return;
const EXCLUDED=new Set([
 'Marleaux Basses',
 'Sandberg Guitars',
 'Vincent Bass Guitars',
 'Nova — Innovative Pickup Systems',
 'ZUTA Group'
]);
const re=/<p data-rf-critical-review="1">[\s\S]*?<\/p>/g;
for(const l of ['en','de','ko']){
 const a=translations[l]&&translations[l].luthierData||[];
 a.forEach(e=>{if(EXCLUDED.has(e.name))e.details=String(e.details||'').replace(re,'');});
}
})();