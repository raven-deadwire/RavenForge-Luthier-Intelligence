(()=>{'use strict';
const posts=['https://www.instagram.com/p/DWkycGrEauM/','https://www.instagram.com/p/DWs-e1EEXbR/'];
const mediaUrl=u=>u.replace(/\/$/,'')+'/media/?size=l';
const embedUrl=u=>u.replace(/\/$/,'')+'/embed/';
window.RF_MOON_POSTS=posts;
window.RF_ANALYSIS_EXTRA_MEDIA=Object.assign(window.RF_ANALYSIS_EXTRA_MEDIA||{}, {
 'Moon Guitar — Chanho Moon':{
   model:'Custom Build I / Custom Build II',
   shots:[
    {label:'Moon Guitar Custom Build I',src:mediaUrl(posts[0]),embed:embedUrl(posts[0]),pos:'50% 58%'},
    {label:'Moon Guitar Custom Build II',src:mediaUrl(posts[1]),embed:embedUrl(posts[1]),pos:'50% 58%'}
   ],
   source:posts[0]
 }
});
})();