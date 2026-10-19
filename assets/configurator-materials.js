/* Original illustrative texture atlases. These are not photographs of stock boards. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.RavenForgeMaterials=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const groups={body:['ash','alder','zelkova','elm','maple','limba','red_toon','jindai_ash','jindai_zelkova'],fretboard:['rosewood','ebony','wenge','ironwood','bog_oak','snakewood','wamara','kingwood','african_blackwood'],top:['flame_maple','quilted_maple','figured_ash','figured_elm','maple_burl','buckeye_burl','walnut','jindai_elm','purpleheart']};
  const colours=['#c5a779','#bd8d61','#b68954','#bca070','#e2c695','#bba768','#b27257','#72634b','#65523d','#573c30','#242321','#493e32','#8f542a','#29281f','#8c3c24','#55352f','#563b4c','#201e20','#e2c695','#e2c695','#c5a779','#bca070','#d6b586','#a89470','#765644','#645238','#60405f'];
  const catalog={};let n=0;
  for(const [group,ids] of Object.entries(groups))ids.forEach((id,index)=>{catalog[id]={id,group,index,colour:colours[n++],source:'assets/configurator-materials/wood-'+group+'-atlas-v8.webp'};});
  for(const [index,id,colour] of [[0,'bloodwood','#9c381f'],[1,'bubinga','#8f4a35']])catalog[id]={id,group:'neck',index,colour,source:'assets/configurator-materials/wood-neck-atlas-v11.webp',cellSize:887,columns:2,sourceWidth:1774,sourceHeight:887};

  // Native individual sources; dimensions are measured, never upscale claims.
  const native={"ash":{"source":"assets/configurator-materials/native-v15/ash.webp","sourceWidth":724,"sourceHeight":2172,"native":true,"effectiveWidth":724,"effectiveHeight":2172},"elm":{"source":"assets/configurator-materials/native-v15/elm.webp","sourceWidth":724,"sourceHeight":2172,"native":true,"effectiveWidth":724,"effectiveHeight":2172},"rosewood":{"source":"assets/configurator-materials/native-v15/rosewood.webp","sourceWidth":724,"sourceHeight":2172,"native":true,"effectiveWidth":724,"effectiveHeight":2172},"wenge":{"source":"assets/configurator-materials/native-v15/wenge.webp","sourceWidth":724,"sourceHeight":2172,"native":true,"effectiveWidth":724,"effectiveHeight":2172},"flame_maple":{"source":"assets/configurator-materials/native-v15/flame_maple.webp","sourceWidth":724,"sourceHeight":2172,"native":true,"effectiveWidth":724,"effectiveHeight":2172},"maple":{"source":"assets/configurator-materials/native-v15/maple.webp","sourceWidth":724,"sourceHeight":2172,"native":true,"effectiveWidth":724,"effectiveHeight":2172},"bloodwood":{"source":"assets/configurator-materials/native-v15/bloodwood.webp","sourceWidth":724,"sourceHeight":2172,"native":true,"effectiveWidth":724,"effectiveHeight":2172},"bubinga":{"source":"assets/configurator-materials/native-v15/bubinga.webp","sourceWidth":724,"sourceHeight":2172,"native":true,"effectiveWidth":724,"effectiveHeight":2172}};
  for(const [id,asset] of Object.entries(native))Object.assign(catalog[id],asset);
  const key=id=>String(id||'').replace(/^guitar_(top_|body_)?/,'').replace(/^(core_|wing_)/,'').replace(/^indian_rosewood$/,'rosewood').replace(/^swamp_?ash$/,'ash');
  const get=id=>catalog[key(id)]||null;
  const media=p=>globalThis.RavenForgePreviewMedia?.[p]||p;
  // Neutralize the substrate before dyeing: dark/burl source chroma must never
  // push a red selection toward cyan. One sRGB pipeline for every wood surface.
  function finishFilter(name,colour){
    if(!/^#[a-f\d]{6}$/i.test(colour||''))return '';
    const rgb=colour.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255);
    return `<filter id="${name}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 0 0 0 1 0"/><feComponentTransfer>${['R','G','B'].map((ch,i)=>`<feFunc${ch} type="table" tableValues="${[.18,.38,.59,.8,1,1.17].map(l=>Math.min(1,rgb[i]*l).toFixed(5)).join(' ')}"/>`).join('')}</feComponentTransfer></filter>`;
  }
  function pattern(name,id,horizontal=false,sharedImageId=null){
    const w=get(id);if(!w)return '';
    if(w.native){
      const sw=w.sourceWidth,sh=w.sourceHeight;
      return `<pattern id="${name}" width="1" height="1" patternUnits="objectBoundingBox" viewBox="0 0 ${horizontal?sh:sw} ${horizontal?sw:sh}" preserveAspectRatio="xMidYMid slice" data-native-size="${sw}x${sh}"><g${horizontal?` transform="translate(${sh} 0) rotate(90)"`:''}>${sharedImageId?`<use href="#${sharedImageId}"/>`:`<image href="${media(w.source)}" width="${sw}" height="${sh}"/>`}</g></pattern>`;
    }
    // Inset each atlas cell by 4 pixels so no neighbouring wood can bleed in.
    const cell=w.cellSize||418,columns=w.columns||3,size=cell-8;
    const x=w.index%columns*cell+4,y=Math.floor(w.index/columns)*cell+4;
    return `<pattern id="${name}" width="1" height="1" patternUnits="objectBoundingBox" viewBox="0 0 ${size} ${size}" preserveAspectRatio="none"><g${horizontal?` transform="rotate(90 ${size/2} ${size/2})"`:''}>${sharedImageId?`<use href="#${sharedImageId}" x="${-x}" y="${-y}"/>`:`<image href="${media(w.source)}" x="${-x}" y="${-y}" width="${w.sourceWidth||1254}" height="${w.sourceHeight||1254}"/>`}</g></pattern>`;
  }
  return {catalog,key,get,pattern,finishFilter,sources:[...new Set(Object.values(catalog).map(w=>w.source))]};
});
