(()=>{'use strict';
const id='rf-analysis-media-tuning';
if(document.getElementById(id))return;
const s=document.createElement('style');
s.id=id;
s.textContent=`
/* Marleaux product shots need body-first crops because the source images
   include unusually large neck/background areas. Keep the square frame,
   but make the body the visual subject rather than the full instrument. */
.rf-featured-card-image img[alt="Marleaux Basses Contra 6 H. Jung"],
.rf-featured-modal-item img[alt="Marleaux Basses Contra 6 H. Jung"]{
  transform:scale(2.35)!important;
  transform-origin:50% 79%!important;
  object-position:50% 78%!important;
}
.rf-featured-card-image img[alt="Marleaux Basses Spock 5"],
.rf-featured-modal-item img[alt="Marleaux Basses Spock 5"]{
  transform:scale(1.34)!important;
  transform-origin:34% 61%!important;
  object-position:34% 61%!important;
}
@media(max-width:640px){
  .rf-featured-modal-item img[alt="Marleaux Basses Contra 6 H. Jung"]{
    transform:scale(2.15)!important;
  }
  .rf-featured-modal-item img[alt="Marleaux Basses Spock 5"]{
    transform:scale(1.26)!important;
  }
}
`;
document.head.appendChild(s);
})();