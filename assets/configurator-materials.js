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
  // grain > 1 deepens the dark grain steps (stain/open pore soak into soft grain).
  function finishFilter(name,colour,grain=1){
    if(!/^#[a-f\d]{6}$/i.test(colour||''))return '';
    const rgb=colour.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255);
    const steps=[.18,.38,.59,.8,1,1.17].map(l=>l<1?Math.max(.03,1-(1-l)*grain):l);
    return `<filter id="${name}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 0 0 0 1 0"/><feComponentTransfer>${['R','G','B'].map((ch,i)=>`<feFunc${ch} type="table" tableValues="${steps.map(l=>Math.min(1,rgb[i]*l).toFixed(5)).join(' ')}"/>`).join('')}</feComponentTransfer></filter>`;
  }
  // Illustrative finish models, not colour-managed proofs. Transparent finishes let
  // the wood's own colour through, so one finish colour reads differently per
  // species and per finish; opaque paint keeps the exact selected colour.
  const finishModels={
    // wood: how strongly the species' own hue modulates the finish colour.
    oil:{sheen:'matte',wood:.6,grain:1.05,warm:.07},
    stain:{sheen:'satin',wood:.35,grain:1.35},
    tint:{sheen:'satin',wood:.5,grain:.85},
    open:{sheen:'matte',wood:.4,grain:1.45,pore:true},
    gloss:{sheen:'gloss',wood:.35,grain:1.1,saturate:1.15,deepen:.07}
  };
  const channels=hex=>hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255);
  const toHex=rgb=>'#'+rgb.map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('');
  function finishKind(id){return (String(id||'').match(/(oil|stain|tint|open|gloss)$/)||[null,'oil'])[1];}
  function finishLook(state,back=false){
    const s=state.selections||{},kind=finishKind(back?s.color_back_side:s.color_top),m=finishModels[kind],f=state.finish||{};
    const look={kind,sheen:m.sheen,grain:m.grain,pore:!!m.pore,opaque:!!(f.opaque&&f.colour),colour:f.colour||null};
    if(look.opaque)return {...look,base:f.colour,dye:null,adjust:null};
    const wood=/^#[a-f\d]{6}$/i.test(state.bodyColour||'')?channels(state.bodyColour):[.5,.52,.54];
    const shape=rgb=>{
      if(m.warm)rgb=[rgb[0]*(1+m.warm*.3),rgb[1]*(1-m.warm*.15),rgb[2]*(1-m.warm)];
      if(m.saturate){const l=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];rgb=rgb.map(v=>l+(v-l)*m.saturate);}
      if(m.deepen)rgb=rgb.map(v=>v*(1-m.deepen));
      return rgb;
    };
    if(!f.colour)return {...look,base:toHex(shape(wood)),dye:null,adjust:{warm:m.warm||0,saturate:m.saturate||1,deepen:m.deepen||0}};
    const tint=channels(f.colour),peak=Math.max(...wood,.01);
    // The wood's hue (lightness removed) partly filters the finish colour.
    const filtered=tint.map((v,i)=>v*(1-m.wood+m.wood*wood[i]/peak));
    const scale=Math.max(...tint,.01)/Math.max(...filtered,.01);
    const dyed=filtered.map(v=>v*scale);
    // Textures already carry lightness; flat fills take it from the wood (light maple = 1).
    const flat=dyed.map(v=>v*Math.min(1.1,peak/.85));
    return {...look,base:toHex(shape(flat)),dye:toHex(shape(dyed)),adjust:null};
  }
  // Natural wood under each finish: oil warms, gloss deepens and saturates.
  function naturalFilter(name,adjust){
    if(!adjust)return '';
    const {warm,saturate,deepen}=adjust,k=1-deepen;
    const gain=[(1+warm*.3)*k,(1-warm*.15)*k,(1-warm)*k];
    return `<filter id="${name}" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="${saturate}"/><feComponentTransfer>${['R','G','B'].map((ch,i)=>`<feFunc${ch} type="linear" slope="${gain[i].toFixed(4)}" intercept="0"/>`).join('')}</feComponentTransfer></filter>`;
  }
  // One dye filter per side: selected colour over wood, or the natural-wood finish.
  // Opaque keeps the plain selected-colour dye that wood parts (guard, knobs) still use.
  function surfaceFilter(name,look){return look.opaque?finishFilter(name,look.colour):look.dye?finishFilter(name,look.dye,look.grain):naturalFilter(name,look.adjust);}
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
  return {catalog,key,get,pattern,finishFilter,finishLook,finishKind,naturalFilter,surfaceFilter,sources:[...new Set(Object.values(catalog).map(w=>w.source))]};
});
