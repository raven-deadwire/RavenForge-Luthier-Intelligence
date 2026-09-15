(()=>{
'use strict';
const root=document.documentElement;
root.classList.add('rf-analysis-loading');

const COPY={
 en:{title:'Loading analysis data…',sub:'Preparing charts, filters and representative media'},
 de:{title:'Analysedaten werden geladen…',sub:'Diagramme, Filter und Referenzbilder werden vorbereitet'},
 ko:{title:'분석 데이터를 불러오는 중…',sub:'그래프, 필터와 대표 이미지를 준비하고 있습니다'}
};

if(!document.getElementById('rf-analysis-load-gate')){
 const st=document.createElement('style');
 st.id='rf-analysis-load-gate';
 st.textContent=`
#analysis{position:relative}
#analysis>.rf-analysis-loader{display:none}
html.rf-analysis-loading #analysis>.rf-analysis-loader{position:absolute;z-index:30;inset:0 0 auto 0;min-height:360px;display:flex;align-items:center;justify-content:center;padding:3rem 1.25rem;background:linear-gradient(180deg,rgba(245,245,244,.98),rgba(245,245,244,.93) 72%,rgba(245,245,244,0));border-radius:.75rem}
html.rf-analysis-loading #analysis>:not(.rf-analysis-loader){opacity:0!important;pointer-events:none!important}
html.rf-analysis-ready #analysis>:not(.rf-analysis-loader){opacity:1;transition:opacity .22s ease}
.rf-analysis-loader-inner{display:flex;flex-direction:column;align-items:center;text-align:center;gap:.7rem;color:#334155}
.rf-analysis-loader-spinner{width:38px;height:38px;border:3px solid rgba(100,116,139,.2);border-top-color:#475569;border-radius:999px;animation:rf-analysis-spin .8s linear infinite}
.rf-analysis-loader-title{font-size:.98rem;font-weight:700;letter-spacing:.01em}
.rf-analysis-loader-sub{font-size:.78rem;color:#64748b}
@keyframes rf-analysis-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.rf-analysis-loader-spinner{animation-duration:1.8s}}
`;
 document.head.appendChild(st);
}

const installLoader=()=>{
 const section=document.getElementById('analysis');
 if(!section)return;
 let loader=document.getElementById('rf-analysis-loader');
 if(!loader){
  loader=document.createElement('div');
  loader.id='rf-analysis-loader';
  loader.className='rf-analysis-loader';
  loader.setAttribute('role','status');
  loader.setAttribute('aria-live','polite');
  loader.innerHTML='<div class="rf-analysis-loader-inner"><span class="rf-analysis-loader-spinner" aria-hidden="true"></span><strong class="rf-analysis-loader-title"></strong><span class="rf-analysis-loader-sub"></span></div>';
  section.insertBefore(loader,section.firstChild);
 }
 const applyCopy=()=>{
  const lang=COPY[root.lang]?root.lang:'en',c=COPY[lang];
  loader.querySelector('.rf-analysis-loader-title').textContent=c.title;
  loader.querySelector('.rf-analysis-loader-sub').textContent=c.sub;
 };
 applyCopy();
 new MutationObserver(applyCopy).observe(root,{attributes:true,attributeFilter:['lang']});
};
installLoader();

const load=src=>new Promise(done=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=s.onerror=done;document.body.appendChild(s)});
(async()=>{
 await load('assets/footer-core.js?v=20260915s5');
 await load('assets/mentor-section.js?v=20260915s2');
 await load('assets/analysis-review.js?v=20260916s12');
})();
})();