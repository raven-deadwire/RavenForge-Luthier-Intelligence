(()=>{
'use strict';
const v='20260915s21';
const load=src=>new Promise(done=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=s.onerror=done;document.body.appendChild(s)});
const files=[
'analysis-theme-methodology.js','analysis-special-entities.js','analysis-special-carl-thompson.js','analysis-special-nova.js','analysis-special-zuta.js','analysis-special-components.js','analysis-special-components-2.js','analysis-special-amplification.js','analysis-technology-cleanup.js','analysis-review-core.js','analysis-degier.js','analysis-structure-normalize.js','analysis-carl-thompson-review.js','analysis-amplification-review.js','analysis-technology-sources.js','analysis-amplification-sources.js','analysis-media.js','analysis-media-extra.js','analysis-carl-thompson-media.js','analysis-components-media.js','analysis-components-media-pair-1.js','analysis-components-media-pair-2.js','analysis-components-media-pair-3.js','analysis-components-media-pair-4.js','analysis-components-media-pair-5.js','analysis-components-media-pair-6.js','analysis-moon-media.js','analysis-media-hotfix.js','analysis-media-curation.js','analysis-media-final.js','analysis-media-extra-render.js','analysis-order.js'
];
(async()=>{
 for(const f of files){
  await load(`assets/${f}?v=${v}`);
  if(f==='analysis-media.js'){
   let st=document.getElementById('rf-contra-focus');if(st)st.remove();
   st=document.createElement('style');st.id='rf-contra-focus';st.textContent='.rf-featured-card-image>.rf-bg-shot{background-size:460% !important;background-position:50% 85% !important}.rf-featured-modal-item>.rf-bg-shot{background-size:410% !important;background-position:50% 83% !important}';document.head.appendChild(st);
  }
 }
 const lang=['en','de','ko'].includes(document.documentElement.lang)?document.documentElement.lang:'en';
 const id=lang==='ko'?'lang-kr-btn':`lang-${lang}-btn`;
 setTimeout(()=>document.getElementById(id)?.click(),0);
})();
})();