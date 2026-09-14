(()=>{'use strict';if(typeof translations!=='object')return;
const labels={en:'Official source',de:'Offizielle Quelle',ko:'공식 자료'};
const sources={
 'EICH Amplification':'https://www.eich-amps.com/',
 'Vanderkley Amplification':'https://vanderkley.blogspot.com/'
};
for(const l of ['en','de','ko']){const arr=translations[l]&&translations[l].luthierData||[];for(const e of arr){const url=sources[e.name];if(!url)continue;let d=String(e.details||'').replace(/<p\s+class="text-sm text-slate-500 mt-4">[\s\S]*?<\/p>/gi,'').trim();d+=`<p class="text-sm text-slate-500 mt-4"><a href="${url}" target="_blank" rel="noopener">${labels[l]}</a></p>`;e.details=d}}
})();