(()=>{'use strict';
const id='rf-analysis-media-tuning';
const old=document.getElementById(id);if(old)old.remove();
const s=document.createElement('style');
s.id=id;
s.textContent=`
/* Marleaux Spock still benefits from a mild body-first crop.
   Contra now uses a square body-focused source image and needs no special transform. */
.rf-featured-card-image img[alt="Marleaux Basses Spock 5"]{
  transform:scale(1.18)!important;
  transform-origin:42% 60%!important;
  object-position:42% 60%!important;
}
.rf-featured-modal-item img[alt="Marleaux Basses Spock 5"]{
  transform:scale(1.12)!important;
  transform-origin:42% 60%!important;
  object-position:42% 60%!important;
}
@media(max-width:640px){
  .rf-featured-modal-item img[alt="Marleaux Basses Spock 5"]{
    transform:scale(1.08)!important;
  }
}
`;
document.head.appendChild(s);
})();