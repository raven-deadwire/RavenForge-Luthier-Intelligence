(()=>{'use strict';
const refreshCurrentLanguage=()=>{
  const run=()=>{
    const lang=['en','de','ko'].includes(document.documentElement.lang)?document.documentElement.lang:'en';
    const id=lang==='ko'?'lang-kr-btn':`lang-${lang}-btn`;
    const btn=document.getElementById(id);
    if(btn)btn.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
  };
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true}):setTimeout(run,0);
};
const load=(src,done)=>{const s=document.createElement('script');s.src=src;s.async=false;if(done)s.onload=done;document.body.appendChild(s);};
const tuneContra=()=>{
  let s=document.getElementById('rf-contra-focus');
  if(s)s.remove();
  s=document.createElement('style');
  s.id='rf-contra-focus';
  s.textContent=`
    .rf-featured-card-image>.rf-bg-shot{background-size:460% !important;background-position:50% 85% !important;}
    .rf-featured-modal-item>.rf-bg-shot{background-size:410% !important;background-position:50% 83% !important;}
  `;
  document.head.appendChild(s);
};
load('assets/analysis-review-core.js?v=20260914q',()=>load('assets/analysis-degier.js?v=20260914q',()=>load('assets/analysis-media.js?v=20260914q',()=>{tuneContra();load('assets/analysis-order.js?v=20260914q',refreshCurrentLanguage);})))
})();