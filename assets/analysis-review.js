(()=>{
'use strict';
const v='20260918s21';
const load=src=>new Promise(done=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=s.onerror=done;document.body.appendChild(s)});
const files=[
'analysis-theme-methodology.js','analysis-special-entities.js','analysis-special-carl-thompson.js','analysis-special-meta.js','analysis-special-nova.js','analysis-special-zuta.js','analysis-special-darkglass-mtd.js','analysis-special-stenback.js','analysis-special-components.js','analysis-special-components-2.js','analysis-special-amplification.js','analysis-lusithand-effects.js','analysis-technology-cleanup.js','analysis-review-core.js','analysis-degier.js','analysis-structure-normalize.js','analysis-special-fodera.js','analysis-carl-thompson-review.js','analysis-meta-review.js','analysis-amplification-review.js','analysis-technology-sources.js','analysis-amplification-sources.js','analysis-cautionary-alleva.js','analysis-cautionary-dingwall.js','analysis-critical-review-all.js','analysis-critical-review-specific.js','analysis-critical-review-mattisson-leadtime.js','analysis-critical-review-technology-specific.js','analysis-critical-review-lefay-order.js','analysis-critical-review-exclusions.js','analysis-spector-korg-aguilar.js','analysis-media.js','analysis-media-extra.js','analysis-carl-thompson-media.js','analysis-meta-media.js','analysis-fodera-media.js','analysis-cautionary-alleva-media.js','analysis-components-media.js','analysis-components-media-pair-1.js','analysis-components-media-pair-2.js','analysis-components-media-pair-3.js','analysis-components-media-pair-4.js','analysis-components-media-pair-5.js','analysis-components-media-pair-6.js','analysis-moon-media.js','analysis-media-hotfix.js','analysis-media-curation.js','analysis-media-final.js','analysis-darkglass-mtd-media.js','analysis-stenback-media.js','analysis-media-extra-render.js','analysis-order.js'
];
const reveal=()=>{
 const root=document.documentElement;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  setTimeout(()=>{
   root.classList.remove('rf-analysis-loading');
   root.classList.add('rf-analysis-ready');
   const loader=document.getElementById('rf-analysis-loader');
   if(loader){loader.setAttribute('aria-hidden','true');setTimeout(()=>loader.remove(),260)}
  },90);
 }));
};
(async()=>{
 try{
  for(const f of files){
   await load(`assets/${f}?v=${v}`);
   if(f==='analysis-media.js'){
    let st=document.getElementById('rf-contra-focus');if(st)st.remove();
    st=document.createElement('style');st.id='rf-contra-focus';st.textContent='.rf-featured-card-image>.rf-bg-shot{background-size:460% !important;background-position:50% 85% !important}.rf-featured-modal-item>.rf-bg-shot{background-size:410% !important;background-position:50% 83% !important}';document.head.appendChild(st);
   }
  }
  const lang=['en','de','ko'].includes(document.documentElement.lang)?document.documentElement.lang:'en';
  const id=lang==='ko'?'lang-kr-btn':`lang-${lang}-btn`;
  document.getElementById(id)?.click();
 }finally{
  reveal();
 }
})();
})();