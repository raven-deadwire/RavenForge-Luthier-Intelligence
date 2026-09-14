(()=>{'use strict';
if(typeof translations!=='object')return;
const patterns={
 en:/<p><strong>RavenForge relevance:<\/strong>[\s\S]*?<\/p>/gi,
 de:/<p><strong>Bedeutung für RavenForge:<\/strong>[\s\S]*?<\/p>/gi,
 ko:/<p><strong>RavenForge에서의 의미:<\/strong>[\s\S]*?<\/p>/gi
};
for(const l of ['en','de','ko']){
 const arr=translations[l]&&translations[l].luthierData||[];
 for(const e of arr){
  if((e.entityType||'luthier')!=='technology')continue;
  if(typeof e.details==='string')e.details=e.details.replace(patterns[l],'');
 }
}
})();