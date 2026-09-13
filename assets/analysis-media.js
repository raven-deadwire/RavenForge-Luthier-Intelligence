(()=>{'use strict';
if(typeof translations!=='object')return;
const root=document.documentElement;
const UI={
 en:{label:'Representative model',source:'Image / model source'},
 de:{label:'Repräsentatives Modell',source:'Bild- / Modellquelle'},
 ko:{label:'대표 모델',source:'이미지 / 모델 출처'}
};
const media={
 'Marleaux Basses':{model:'Contra',images:['https://www.mikigakki.com/ec/bass/BS-Contra5VF_S_2m.jpg'],source:'https://www.marleaux-bass.de/',imageSource:'https://www.mikigakki.com/shop/g/gBS-Contra5VF/'},
 'Sandberg Guitars':{model:'Patchwork',images:['https://images.musicstore.de/langtextbilder/1280/sandberg-california-tm4-patchwork-rare-wood-body_BAS0012182-000.jpg'],source:'https://www.sandberg-guitars.de/new-member-in-the-sandberg-family/',imageSource:'https://www.musicstore.com/en_US/USD/Sandberg-California-TM4-Patchwork-Rare-Wood/art-BAS0012182-000'},
 'Vincent Bass Guitars':{model:'Akkurat PJ',images:['https://thumbs.static-thomann.de/thumb//bdbmagic/pics/prod/634526.jpg'],source:'https://vincent-bassguitars.info/product/akkurat/',imageSource:'https://www.thomann.de/de/vincent_akkurat_5_pj_celeste.htm'},
 'LeFay':{model:'REMINGTON STEELE',images:['https://www.notreble.com/wp-content/uploads/2018/07/Le-Fay-Remington-Steele-Angle-3-1000x667.jpg'],source:'https://www.lefay.de/index.php/EN/bass_models/remington-steele',imageSource:'https://www.notreble.com/buzz/2018/07/16/bass-of-the-week-le-fay-basses-remington-steele/'},
 'Warwick Basses':{model:'Streamer Stage I',images:['https://img.audiofanzine.com/images/u/product/normal/warwick-streamer-stage-i-4-196599.jpg'],source:'https://www.warwickbass.com/en/Warwick--Products--Instruments--Customshop---Masterbuilt--Basic-Bass-Models--Streamer--Streamer-Stage-I.html',imageSource:'https://en.audiofanzine.com/electric-fretted-bass/warwick/streamer-stage-i-4-natural-oil/'},
 'Mayones Guitars':{model:'Caledonius',images:['https://www.musicstorelive.com/media/catalog/product/2/0/20241031-dsc00989.jpg?bg-color=255%2C255%2C255&canvas=700%3A700&fit=bounds&height=700&optimize=medium&width=700'],source:'https://new.mayones.com/',imageSource:'https://www.musicstorelive.com/may-021720233.html'},
 'Kiesel Guitars':{model:'O2 Bass',images:['https://cdn.shopify.com/s/files/1/0362/3485/4444/files/o2bm5-be-rash1-tmg-tbst-rnc-rtf-cali-2wm-ref-isor-ia-strf-kt3-dgp-bc-dlbs-bpe-nathannavarro-163241_fullbody-black.png?v=1735934007'],source:'https://www.kieselguitars.com/series/bass/o2-bass',imageSource:'https://www.kieselguitars.com/series/bass/o2-bass'},
 'ZUTA Group':{model:'GBG120',images:['https://zutagroup.com/cdn/shop/files/GBG120_front-straight_1920x1920_482a9051-edd5-432c-a9a0-d179310009dd.jpg?v=1708977545'],source:'https://zutagroup.com/products/gbg120-tube-amp-by-zuta',imageSource:'https://zutagroup.com/products/gbg120-tube-amp-by-zuta'},
 'Nova — Innovative Pickup Systems':{model:'Omnia Custom Series',images:['https://cdn.shopify.com/s/files/1/0818/0996/5393/files/IMG_1799_1_600x600.jpg?v=1747758991','https://cdn.shopify.com/s/files/1/0818/0996/5393/files/Bildschirmfoto_2025-05-11_um_22.14.08_600x600.png?v=1746994578'],source:'https://www.nova-pickups.com/blogs/news/luthiers-custom-pickups-for-custom-builds',imageSource:'https://www.nova-pickups.com/blogs/news/luthiers-custom-pickups-for-custom-builds'},
 'Skervesen Guitars':{model:'Prometheus',images:['https://rare-gallery.com/uploads/posts/973426-Skervesen-Skervesen-Prometheus-bass-guitars-fanned-frets.jpg'],source:'https://skervesen.eu/',imageSource:'https://rare-gallery.com/xfsearch/alt/multiscale/'}
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function lang(){return UI[root.lang]?root.lang:'en'}
function heroHtml(name,m){
 const u=UI[lang()],imgs=m.images.map((src,i)=>`<figure class="rf-featured-modal-item"><img src="${esc(src)}" alt="${esc(name+' '+m.model+(m.images.length>1?' '+(i+1):''))}" loading="lazy" referrerpolicy="no-referrer"></figure>`).join('');
 return `<section class="rf-featured-modal" data-rf-featured="1"><div class="rf-featured-modal-grid ${m.images.length>1?'is-multi':''}">${imgs}</div><div class="rf-featured-modal-caption"><span>${esc(u.label)}</span><strong>${esc(m.model)}</strong><a href="${esc(m.imageSource||m.source)}" target="_blank" rel="noopener noreferrer">${esc(u.source)}</a></div></section>`;
}
function installData(){
 ['en','de','ko'].forEach(l=>{
  const arr=translations[l]&&translations[l].luthierData||[];
  arr.forEach(e=>{const m=media[e.name];if(!m)return;e.featuredModel=m.model;e.featuredImages=[...m.images];e.featuredSource=m.source;if(!String(e.details||'').includes('data-rf-featured="1"'))e.details=heroHtml(e.name,m)+(e.details||'');});
 });
}
function decorateCards(){
 const grid=document.getElementById('luthier-grid');if(!grid)return;
 [...grid.children].forEach(card=>{
  const h=card.querySelector('h3');if(!h)return;
  const name=h.textContent.trim(),m=media[name];
  const old=card.querySelector(':scope > .rf-featured-card');
  if(!m){if(old)old.remove();return}
  const u=UI[lang()];
  if(old){const cap=old.querySelector('.rf-featured-card-caption');if(cap)cap.innerHTML=`<span>${esc(u.label)}</span><strong>${esc(m.model)}</strong>`;return}
  const wrap=document.createElement('div');wrap.className='rf-featured-card';
  wrap.innerHTML=`<div class="rf-featured-card-image"><img src="${esc(m.images[0])}" alt="${esc(name+' '+m.model)}" loading="lazy" referrerpolicy="no-referrer"></div><div class="rf-featured-card-caption"><span>${esc(u.label)}</span><strong>${esc(m.model)}</strong></div>`;
  const img=wrap.querySelector('img');img.addEventListener('error',()=>wrap.remove(),{once:true});
  card.insertBefore(wrap,card.firstChild);
 });
}
function style(){if(document.getElementById('rf-analysis-media-style'))return;const s=document.createElement('style');s.id='rf-analysis-media-style';s.textContent=`
.rf-featured-card{margin:-1rem -1rem 1rem;border-bottom:1px solid #e2e8f0;background:#f8fafc;overflow:hidden;border-radius:.5rem .5rem 0 0}.rf-featured-card-image{aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;padding:.55rem;background:linear-gradient(180deg,#fff,#f8fafc)}.rf-featured-card-image img{width:100%;height:100%;object-fit:contain;display:block}.rf-featured-card-caption{display:flex;gap:.45rem;align-items:baseline;padding:.5rem .8rem .6rem;line-height:1.2}.rf-featured-card-caption span{font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;font-weight:700}.rf-featured-card-caption strong{font-size:.78rem;color:#334155}.rf-featured-modal{margin:0 0 1.25rem}.rf-featured-modal-grid{display:grid;grid-template-columns:1fr;gap:.6rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:.65rem;overflow:hidden;padding:.6rem}.rf-featured-modal-grid.is-multi{grid-template-columns:repeat(2,minmax(0,1fr))}.rf-featured-modal-item{margin:0;min-height:0;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:.4rem;overflow:hidden}.rf-featured-modal-item img{width:100%;height:100%;object-fit:contain;display:block}.rf-featured-modal-caption{display:flex;flex-wrap:wrap;gap:.45rem .7rem;align-items:baseline;padding:.55rem .1rem 0}.rf-featured-modal-caption span{font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;font-weight:700}.rf-featured-modal-caption strong{font-size:.92rem;color:#1e293b}.rf-featured-modal-caption a{margin-left:auto;font-size:.72rem;color:#64748b;text-decoration:underline}.rf-featured-modal img[src=""]{display:none}@media(max-width:640px){.rf-featured-modal-grid.is-multi{grid-template-columns:1fr}.rf-featured-modal-caption a{width:100%;margin-left:0}}
`;document.head.appendChild(s)}
function bind(){style();installData();const grid=document.getElementById('luthier-grid');if(grid){let q=false;new MutationObserver(()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;decorateCards()})}).observe(grid,{childList:true});decorateCards()}new MutationObserver(()=>{installData();setTimeout(decorateCards,0)}).observe(root,{attributes:true,attributeFilter:['lang']});}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
})();