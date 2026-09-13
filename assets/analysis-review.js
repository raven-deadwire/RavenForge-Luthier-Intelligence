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
load('assets/analysis-review-core.js?v=20260914g',()=>load('assets/analysis-degier.js?v=20260914g',()=>load('assets/analysis-media.js?v=20260914g',()=>load('assets/analysis-order.js?v=20260914g',refreshCurrentLanguage))));
})();