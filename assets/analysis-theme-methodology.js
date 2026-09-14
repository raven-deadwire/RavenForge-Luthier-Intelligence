(()=>{'use strict';
if(typeof translations!=='object')return;
const labels={en:'Methodology & Research',de:'Methodik & Forschung',ko:'방법론 & 연구'};
for(const l of ['en','de','ko']){
 const t=translations[l];
 if(!t)continue;
 t.filterThemes=t.filterThemes||{};
 t.filterThemes.Methodology=labels[l];
}
})();
