(()=>{
'use strict';
const root=document.documentElement;
root.classList.add('rf-analysis-loading');
if(!document.getElementById('rf-analysis-load-gate')){
 const st=document.createElement('style');
 st.id='rf-analysis-load-gate';
 st.textContent='html.rf-analysis-loading #luthier-grid{opacity:0!important;pointer-events:none}#luthier-grid{transition:opacity .18s ease}';
 document.head.appendChild(st);
}
const load=src=>new Promise(done=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=s.onerror=done;document.body.appendChild(s)});
(async()=>{
 await load('assets/footer-core.js?v=20260915s5');
 await load('assets/mentor-section.js?v=20260915s2');
 await load('assets/analysis-review.js?v=20260916s11');
})();
})();