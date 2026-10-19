/* Original illustrative texture atlases. These are not photographs of stock boards. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.RavenForgeMaterials=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const groups={body:['ash','alder','zelkova','elm','maple','limba','red_toon','jindai_ash','jindai_zelkova'],fretboard:['rosewood','ebony','wenge','ironwood','bog_oak','snakewood','wamara','kingwood','african_blackwood'],top:['flame_maple','quilted_maple','figured_ash','figured_elm','maple_burl','buckeye_burl','walnut','jindai_elm','purpleheart']};
  const colours=['#c5a779','#bd8d61','#b68954','#bca070','#e2c695','#bba768','#b27257','#72634b','#65523d','#573c30','#242321','#493e32','#8f542a','#29281f','#8c3c24','#55352f','#563b4c','#201e20','#e2c695','#e2c695','#c5a779','#bca070','#d6b586','#a89470','#765644','#645238','#60405f'];
  const catalog={};let n=0;
  for(const [group,ids] of Object.entries(groups))ids.forEach((id,index)=>{catalog[id]={id,group,index,colour:colours[n++],source:'assets/configurator-materials/wood-'+group+'-atlas-v8.webp'};});
  const key=id=>String(id||'').replace(/^guitar_(top_|body_)?/,'').replace(/^(core_|wing_)/,'').replace(/^indian_rosewood$/,'rosewood').replace(/^swamp_?ash$/,'ash');
  const get=id=>catalog[key(id)]||null;
  const media=p=>globalThis.RavenForgePreviewMedia?.[p]||p;
  function pattern(name,id,horizontal=false){
    const w=get(id);if(!w)return '';
    // Inset each atlas cell by 4 pixels so no neighbouring wood can bleed in.
    const x=w.index%3*418+4,y=Math.floor(w.index/3)*418+4;
    return `<pattern id="${name}" width="1" height="1" patternUnits="objectBoundingBox" viewBox="0 0 410 410" preserveAspectRatio="none"><g${horizontal?' transform="rotate(90 205 205)"':''}><image href="${media(w.source)}" x="${-x}" y="${-y}" width="1254" height="1254"/></g></pattern>`;
  }
  return {catalog,key,get,pattern,sources:Object.keys(groups).map(g=>'assets/configurator-materials/wood-'+g+'-atlas-v8.webp')};
});
