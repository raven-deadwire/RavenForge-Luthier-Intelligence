(()=>{
'use strict';
const load=src=>new Promise(done=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=s.onerror=done;document.body.appendChild(s)});
(async()=>{
 await load('assets/footer-core.js?v=20260915s5');
 await load('assets/mentor-section.js?v=20260915s2');
 await load('assets/analysis-review.js?v=20260916s5');
})();
})();