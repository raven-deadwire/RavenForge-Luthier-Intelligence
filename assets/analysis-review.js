(()=>{'use strict';
const load=(src,done)=>{const s=document.createElement('script');s.src=src;s.async=false;if(done)s.onload=done;document.body.appendChild(s);};
load('assets/analysis-review-core.js?v=20260914b',()=>load('assets/analysis-order.js?v=20260914b'));
})();