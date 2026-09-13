(()=>{'use strict';
const refreshCurrentLanguage=()=>{
 const run=()=>{const lang=['en','de','ko'].includes(document.documentElement.lang)?document.documentElement.lang:'en';const id=lang==='ko'?'lang-kr-btn':`lang-${lang}-btn`;const btn=document.getElementById(id);if(btn)btn.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}))};
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true}):setTimeout(run,0);
};
const load=src=>new Promise(resolve=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=resolve;document.body.appendChild(s)});
const tuneContra=()=>{let s=document.getElementById('rf-contra-focus');if(s)s.remove();s=document.createElement('style');s.id='rf-contra-focus';s.textContent='.rf-featured-card-image>.rf-bg-shot{background-size:460% !important;background-position:50% 85% !important}.rf-featured-modal-item>.rf-bg-shot{background-size:410% !important;background-position:50% 83% !important}';document.head.appendChild(s)};
(async()=>{
 const v='20260914v';
 await load(`assets/analysis-special-entities.js?v=${v}`);
 await load(`assets/analysis-special-nova.js?v=${v}`);
 await load(`assets/analysis-special-zuta.js?v=${v}`);
 await load(`assets/analysis-review-core.js?v=${v}`);
 await load(`assets/analysis-degier.js?v=${v}`);
 await load(`assets/analysis-media.js?v=${v}`);
 tuneContra();
 await load(`assets/analysis-media-extra.js?v=${v}`);
 await load(`assets/analysis-media-final.js?v=${v}`);
 await load(`assets/analysis-moon-media.js?v=${v}`);
 await load(`assets/analysis-media-extra-render.js?v=${v}`);
 await load(`assets/analysis-order.js?v=${v}`);
 refreshCurrentLanguage();
})();
})();