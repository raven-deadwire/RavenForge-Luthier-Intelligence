(()=>{'use strict';if(typeof translations!=='object')return;
const N='Meta Guitars';
const D={
 en:{country:'France',summary:'Meta Guitars is a French custom workshop centered on deeply sculpted ergonomics, headless multi-scale construction and proprietary hardware, with the Veil and Pragma treating body geometry as a functional interface with the player.'},
 de:{country:'Frankreich',summary:'Meta Guitars ist eine französische Custom-Werkstatt mit stark skulpturierter Ergonomie, Headless-Multiscale-Konstruktion und eigener Hardware. Veil und Pragma behandeln die Korpusgeometrie als funktionale Schnittstelle zum Spieler.'},
 ko:{country:'프랑스',summary:'Meta Guitars는 깊은 인체공학적 카빙, 헤드리스 멀티스케일 구조, 자체 하드웨어를 중심으로 전개되는 프랑스 커스텀 제작사입니다. Veil과 Pragma는 바디 형상을 단순한 미감이 아니라 연주자와 악기가 접촉하는 기능적 인터페이스로 다룹니다.'}
};
for(const l of ['en','de','ko']){
 const a=translations[l].luthierData||(translations[l].luthierData=[]);
 const e={name:N,country:D[l].country,region:'europe',entityType:'luthier',tags:['Ergonomics','Structure','Customization','Aesthetics','Wood','Methodology'],summary:D[l].summary,details:'<p>Meta Guitars</p>'};
 const i=a.findIndex(x=>x.name===N);i<0?a.push(e):Object.assign(a[i],e);
}
})();