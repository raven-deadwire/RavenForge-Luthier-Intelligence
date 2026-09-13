(()=>{'use strict';
const id='rf-analysis-media-tuning';
const old=document.getElementById(id);if(old)old.remove();
const s=document.createElement('style');
s.id=id;
s.textContent=`
/* Marleaux source shots contain large baked-in canvas margins.
   Crop those margins out explicitly instead of relying on object-fit. */
.rf-featured-card-image:has(img[alt="Marleaux Basses Contra 6 H. Jung"]),
.rf-featured-modal-item:has(img[alt="Marleaux Basses Contra 6 H. Jung"]),
.rf-featured-card-image:has(img[alt="Marleaux Basses Spock 5"]),
.rf-featured-modal-item:has(img[alt="Marleaux Basses Spock 5"]){
  background:#111827!important;
}
.rf-featured-card-image img[alt="Marleaux Basses Contra 6 H. Jung"]{
  transform:translateX(-12%) scale(2.72)!important;
  transform-origin:50% 80%!important;
  object-position:50% 80%!important;
}
.rf-featured-modal-item img[alt="Marleaux Basses Contra 6 H. Jung"]{
  transform:translateX(-10%) scale(2.58)!important;
  transform-origin:50% 80%!important;
  object-position:50% 80%!important;
}
.rf-featured-card-image img[alt="Marleaux Basses Spock 5"]{
  transform:translateX(-3%) scale(1.52)!important;
  transform-origin:38% 63%!important;
  object-position:38% 63%!important;
}
.rf-featured-modal-item img[alt="Marleaux Basses Spock 5"]{
  transform:translateX(-2%) scale(1.44)!important;
  transform-origin:38% 63%!important;
  object-position:38% 63%!important;
}
@media(max-width:640px){
  .rf-featured-modal-item img[alt="Marleaux Basses Contra 6 H. Jung"]{
    transform:translateX(-9%) scale(2.38)!important;
  }
  .rf-featured-modal-item img[alt="Marleaux Basses Spock 5"]{
    transform:translateX(-2%) scale(1.34)!important;
  }
}
`;
document.head.appendChild(s);
})();