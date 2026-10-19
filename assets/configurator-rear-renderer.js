/* Rear-only display renderer. Uploaded ASKR/EMBLA contours and five bolt centres
 * are kept separately from illustrative surfaces. EDDA is explicitly a concept.
 * No rear image changes the configurator's option, price or PDF state. */
(function(root,factory){const options=typeof module==='object'&&module.exports?require('./configurator-option-renderer.js'):root.RavenForgeOptionRenderer;const parts=typeof module==='object'&&module.exports?require('./configurator-parts-renderer.js'):root.RavenForgeParts;const api=factory(options,parts);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.RavenForgeRearRenderer=api;})(typeof globalThis!=='undefined'?globalThis:this,function(options,parts){
  'use strict';
  const media=path=>globalThis.RavenForgePreviewMedia?.[path]||path;
  const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const eddaBody='M486 922 Q525 895 565 925 Q617 964 648 835 Q651 769 672 779 C704 781 725 820 711 886 C703 935 675 985 665 1037 C651 1112 702 1184 735 1254 C764 1318 751 1390 682 1433 C620 1477 430 1507 345 1435 C269 1373 297 1284 326 1226 C357 1160 390 1115 365 1052 C333 1015 335 970 353 955 C378 930 387 978 413 1008 Q459 1055 486 1008 Z';
  const eddaNeck='M495 275 L556 275 L565 925 Q525 895 486 922 Z';
  const eddaHead='M510 24 Q520 19 529 39 L542 68 L539 101 L547 137 L567 185 L579 252 L560 276 Q527 301 497 278 L478 242 L462 214 L477 169 L477 116 L463 86 Z';
  function tone(id,colour,opaque=false){
    const c=colour.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16)/255);
    const values=c.map(v=>[0,.2,.4,.6,.8,1].map(l=>opaque?v*(.45+l*.65):Math.min(1,v*l/ .62)).join(' '));
    return `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer>${['R','G','B'].map((channel,i)=>`<feFunc${channel} type="table" tableValues="${values[i]}"/>`).join('')}</feComponentTransfer></filter>`;
  }
  function render(state,language,layout,copy){
    const g=state.g.back,t=copy[language]||copy.en,s=state.selections,p='rf-rear-'+state.model.toLowerCase(),concept=g.kind==='rear-concept',portrait=layout==='portrait';
    const natural=s.color_back_side==='back_oil';
    const finish=natural?{colour:null,opaque:false}:state.finish;
    state={...state,finish};
    const colour=finish.colour||state.bodyColour||'#a6a8aa';
    const vb=concept?(portrait?'220 0 600 1536':'0 180 1536 660'):(portrait?g.portraitBox:g.viewBox);
    const transform=concept?(portrait?'':'translate(0 1024) rotate(-90)'):(portrait?g.portraitTransform:'');
    const path=(d,a='')=>`<path d="${d}" ${a}/>`;
    const texture=media('assets/configurator-materials/ash-illustrative.webp');
    let out=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-labelledby="${p}-title ${p}-desc" data-preview-svg="${state.model}" data-renderer="${concept?'rear-concept-composite':'rear-drawing-composite'}" data-side="back" data-layout="${portrait?'portrait':'landscape'}" data-neck-joint="bolt-on"><title id="${p}-title">${esc(state.model+' · '+t.back)}</title><desc id="${p}-desc">${esc(concept?t.rearConceptNote:t.bassRearNote)}</desc><defs>${options.definitions(p,state,!concept)}${parts.definitions(p,state)}${tone(p+'-wood',colour,finish.opaque)}${tone(p+'-neck','#eddbb5')}${tone(p+'-metal-tint',state.metal)}
      <linearGradient id="${p}-light" x1="0" y1="0" x2="0.3" y2="1"><stop stop-color="#fff7dd" stop-opacity=".40"/><stop offset=".18" stop-color="#fff" stop-opacity=".04"/><stop offset=".65" stop-color="#000" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></linearGradient>
      <linearGradient id="${p}-metal" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="#23292c"/><stop offset=".27" stop-color="${state.metal}"/><stop offset=".4" stop-color="#f8f7ec"/><stop offset=".52" stop-color="${state.metal}"/><stop offset="1" stop-color="#22272a"/></linearGradient>
      <pattern id="${p}-grain" width="600" height="600" patternUnits="userSpaceOnUse"><image href="${texture}" width="600" height="600" transform="rotate(90 300 300)"/></pattern>
      <pattern id="${p}-neck-grain" width="600" height="600" patternUnits="userSpaceOnUse" patternTransform="translate(137 -219) scale(1.6)"><image href="${texture}" width="600" height="600" transform="rotate(90 300 300)"/></pattern>
      <linearGradient id="${p}-neck-round" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#372817" stop-opacity=".40"/><stop offset=".28" stop-color="#fff3d1" stop-opacity=".3"/><stop offset=".58" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#372817" stop-opacity=".36"/></linearGradient>
      <clipPath id="${p}-body">${path(concept?eddaBody:g.body)}</clipPath>
      <filter id="${p}-source-relief" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/></filter><filter id="${p}-shadow" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity=".55"/></filter>`;
    if(concept){
      const sourceTuners=[[548,65,26,8],[553,119,38,7],[568,177,38,8],[581,231,34,8]].map(([x,y,rx,ry])=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('')+[[565,60],[578,115],[599,171],[608,224]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="20" ry="24"/>`).join('');
      const tuners=parts.profile(state,'hardware_machine_head')?'':sourceTuners;
      out+=`<clipPath id="${p}-metal-clip">${tuners}${[[507,939],[556,939],[532,971],[507,1003],[558,1003]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="13"/>`).join('')}</clipPath><clipPath id="${p}-neck-clip">${path(eddaNeck)}</clipPath><clipPath id="${p}-all">${path(eddaBody)}${path(eddaNeck)}${path(eddaHead)}${tuners}</clipPath></defs><g transform="${transform}">`;
      const source=attrs=>`<image href="${media(g.source)}" width="1024" height="1536" ${attrs}/>`;
      out+=`<g clip-path="url(#${p}-all)" data-layer="rear-concept" data-appearance="ai-concept">${source('')}</g>`;
      out+=`<g data-layer="rear-body" data-material="${esc(state.bodyId)}" data-finish="${esc(s.color_back_side)}" data-colour="${colour}" data-opaque="${!!finish.opaque}" clip-path="url(#${p}-body)">${source(`filter="url(#${p}-wood)"`)}${!finish.opaque&&state.bodyColour?path(eddaBody,`fill="url(#${p}-material)" ${finish.colour?`filter="url(#${p}-surface-dye)"`: 'opacity=".6" style="mix-blend-mode:soft-light"'}`):''}${options.wings(state,p,eddaBody,false,525,110)}${source(`filter="url(#${p}-source-relief)" style="mix-blend-mode:multiply"`)}${options.bodyPieces(state,p,eddaBody,false,525,110,true)}${options.finish(state,p,eddaBody,true)}</g>`;
      out+=`<g data-layer="rear-neck" data-neck-joint="bolt-on" data-appearance="concept-retained">${options.neckFinish(state,p,eddaNeck,source(`clip-path="url(#${p}-neck-clip)"`)+options.lamination(state,[[495,275],[556,275],[565,925],[486,922]],p+'-neck-clip'))}</g><g data-layer="rear-bolts" data-count="5" data-placement="concept-only"/><g data-layer="rear-hardware" data-colour="${state.metal}" clip-path="url(#${p}-metal-clip)">${source(`filter="url(#${p}-metal-tint)"`)}</g>`;
    }else{
      out+=`<clipPath id="${p}-neck-clip">${path(g.neck)}</clipPath><clipPath id="${p}-head-clip">${path(g.head)}</clipPath></defs><g transform="${transform}">`;
      const surface=(d,filter,stroke=1)=>`<g filter="url(#${p}-shadow)">${path(d,`fill="url(#${p}-${filter==='neck'?'neck-grain':state.bodyColour&&!finish.opaque?'material':'grain'})" ${filter==='neck'||finish.colour||!state.bodyColour?`filter="url(#${p}-${filter==='wood'&&finish.colour?'surface-dye':filter})"`:''}`)}${path(d,`fill="url(#${p}-${filter==='neck'?'neck-round':'light'})" stroke="#5b4934" stroke-width="${stroke}"`)}${path(d,'fill="none" stroke="#fff0cd" stroke-width=".6" stroke-opacity=".6"')}</g>`;
      // The neck ends at the source heel. No stripe continues through the body.
      out+=`<g data-layer="rear-neck" data-part="detachable-neck" data-grain="independent-neck" data-neck-joint="bolt-on" data-lamination="illustrative">`;
      let neckContents=surface(g.neck,'neck')+`<g clip-path="url(#${p}-neck-clip)">`;
      const neckBoard=state.model==='ASKR'?[[171.53,130.105],[200.3,174.64],[790.385,186.955],[763.31,118.78]]:[[155.085,139.64],[155.085,176.945],[664.025,190.625],[623.945,127.295]];
      neckContents+=options.lamination(state,neckBoard,p+'-neck-clip')+'</g>';
      out+=options.neckFinish(state,p,g.neck,neckContents)+'</g>';
      out+=`<g data-layer="rear-headstock">${surface(g.head,'neck')}</g>`;
      out+=`<g data-layer="rear-body" data-contour="pdf-vector" data-material="${esc(state.bodyId)}" data-finish="${esc(s.color_back_side)}" data-colour="${colour}" data-opaque="${!!finish.opaque}">${surface(g.body,'wood')}${options.wings(state,p,g.body,true,state.model==='ASKR'?152.4:158.3,65)}${options.bodyPieces(state,p,g.body,true,state.model==='ASKR'?152.4:158.3,65,true)}${options.finish(state,p,g.body,true)}${path(g.scoop,'fill="none" stroke="#4c3b2a" stroke-width="1.3" stroke-opacity=".22"')}</g>`;
      out+=`<g data-layer="rear-heel" data-neck-joint="bolt-on">${path(g.heel,'fill="none" stroke="#4a382b" stroke-width="1.7" stroke-opacity=".8"')}</g>`;
      // Trace the actual neck/body boundary, not the heel relief contour.
      // A continuous seam remains readable at full-instrument mobile size.
      out+=`<g data-layer="rear-joint-seam" data-placement="pdf-boundary" data-relief="illustrative">${path(g.jointSeam,'fill="none" stroke="#050403" stroke-width="3.2" stroke-opacity=".55" vector-effect="non-scaling-stroke" stroke-linecap="round"')}${path(g.jointSeam,'fill="none" stroke="#fff0cc" stroke-width=".8" transform="translate(-2 0)" vector-effect="non-scaling-stroke"')}${path(g.jointSeam,'fill="none" stroke="#15120f" stroke-width="1.3" vector-effect="non-scaling-stroke" stroke-linecap="round"')}</g>`;
      out+=`<g data-layer="rear-cavity" data-contour="pdf-vector">${path(g.cavity,`fill="url(#${p}-grain)" filter="url(#${p}-wood)"`)}${path(g.cavity,'fill="#000" fill-opacity=".12" stroke="#302c27" stroke-width="1.3"')}</g>`;
      out+=`<g data-layer="rear-battery" data-contour="pdf-vector">${path(g.battery,'fill="#262827" stroke="#777b78" stroke-width="1"')}</g>`;
      out+=`<g data-layer="rear-bolts" data-count="5" data-placement="pdf-centres">`;
      for(const [x,y,r] of g.bolts)out+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#2a2521"/><circle cx="${x}" cy="${y}" r="${r*.82}" fill="url(#${p}-metal)" stroke="#151617" stroke-width=".6"/><circle cx="${x}" cy="${y}" r="${r*.27}" fill="#282b2a"/>`;
      out+=`</g><g data-layer="rear-reference-tuners" data-count="5" data-colour="${state.metal}">`;
      for(const tuner of (parts.profile(state,'hardware_machine_head')?[]:g.tuners))out+=path(tuner.key,`fill="url(#${p}-metal)" stroke="#272a2b" stroke-width=".7"`)+path(tuner.housing,`fill="url(#${p}-metal)" stroke="#25282a" stroke-width=".8"`);
      out+='</g>';
    }
    if(parts.profile(state,'hardware_machine_head'))out+=parts.tuners(state,p,true);
    return out+'</g></svg>';
  }
  return {render};
});
