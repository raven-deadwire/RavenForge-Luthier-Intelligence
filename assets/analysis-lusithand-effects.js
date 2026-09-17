(()=>{'use strict';
if(typeof translations!=='object')return;
const labels={en:'Effects',de:'Effekte',ko:'이펙트'};
for(const l of ['en','de','ko']){
 const t=translations[l];if(!t)continue;
 t.filterThemes=t.filterThemes||{};
 t.filterThemes.Effects=t.filterThemes.Effects||labels[l];
 const e=(t.luthierData||[]).find(x=>x.name==='Lusithand Devices');
 if(!e)continue;
 e.tags=Array.from(new Set([...(e.tags||[]),'Effects']));
}
})();