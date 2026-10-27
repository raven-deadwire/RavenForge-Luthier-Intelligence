/* Display-only options. Approximate surfaces never alter approved contours or prices. */
(function(root,factory){
  const mats=typeof module==='object'&&module.exports?require('./configurator-materials.js'):root.RavenForgeMaterials;
  const runes=typeof module==='object'&&module.exports?require('./configurator-bindrune-motifs.js'):root.RavenForgeBindruneMotifs;
  const api=factory(mats,runes);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.RavenForgeOptionRenderer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(materials,motifs){
  'use strict';
  const point=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const line=(a,b,attrs)=>`<path d="M${a} L${b}" fill="none" ${attrs}/>`;
  const polygon=p=>p.map(q=>q.join(',')).join(' ');
  function definitions(p,state,horizontal=false,back=false){
    // Open-pore finishes fill the pores darker than the surrounding grain.
    // Transparent pixels read as black, so the result is clipped to the shape.
    const pores=`<filter id="${p}-pores" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .07 0 0 0 0 .05 0 0 0 0 .04 -.2126 -.7152 -.0722 0 1"/><feComponentTransfer><feFuncA type="table" tableValues="0 0 0 .12 .55 .9"/></feComponentTransfer><feComposite in2="SourceAlpha" operator="in"/></filter>`;
    return materials.surfaceFilter(p+'-surface-dye',materials.finishLook(state,back))+pores+materials.pattern(p+'-material',state.topId,horizontal)+materials.pattern(p+'-board-material',state.selections.fretboard,horizontal)+materials.pattern(p+'-knob-material',state.topId,horizontal)+materials.pattern(p+'-wing-material',state.selections.body_wing_wood,horizontal)+
      `<linearGradient id="${p}-detail-gloss" x1="0" y1="0" x2="1" y2="1"><stop stop-color="white" stop-opacity="0"/><stop offset=".25" stop-color="white" stop-opacity="0"/><stop offset=".32" stop-color="white" stop-opacity=".26"/><stop offset=".36" stop-color="white" stop-opacity=".01"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>
      <radialGradient id="${p}-knob-shade" cx=".3" cy=".25"><stop stop-color="#fff6df" stop-opacity=".4"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
      <pattern id="${p}-flakes" width="31" height="37" patternUnits="userSpaceOnUse">${Array.from({length:18},(_,i)=>{const x=(i*17.73)%31,y=(i*11.81)%37;return `<circle cx="${x}" cy="${y}" r="${i%4===0?.65:.3}" fill="${i%3?'#f5dfac':'#fff'}" opacity="${i%3?.6:.95}"/>`;}).join('')}</pattern>`;
  }
  function finish(state,p,d,back=false,body=true){
    const s=state.selections,id=back?s.color_back_side:s.color_top,look=materials.finishLook(state,back);
    let out=`<g data-layer="${back?'rear-':''}finish-details" data-finish="${id||''}" data-finish-kind="${look.kind}" data-sheen="${look.sheen}" data-appearance="illustrative">`;
    // Sheen: gloss keeps the full clear-coat highlight, satin a softened one, matte none.
    if(look.sheen==='gloss')out+=`<path d="${d}" fill="url(#${p}-detail-gloss)"/>`;
    if(look.sheen==='satin')out+=`<path d="${d}" fill="url(#${p}-detail-gloss)" opacity=".4"/>`;
    if(look.pore&&!look.opaque&&materials.get(state.topId))out+=`<path data-effect="open-pore" d="${d}" fill="url(#${p}-material)" filter="url(#${p}-pores)" opacity=".5"/>`;
    if(body&&s.extra_finish_burst==='burst_add'){
      // Derive the band from the actual silhouette, including both cutaways.
      // A centred ellipse puts the dark patch in the wrong place on asymmetry.
      const width=back?(state.model==='EDDA'?18:10):({EDDA:12,EMBLA:15,ASKR:12,GRAMR:11}[state.model]);
      const id=p+'-burst-'+(back?'back':'front');
      out+=`<defs><filter id="${id}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feMorphology in="SourceAlpha" operator="erode" radius="${width}" result="inner"/><feGaussianBlur in="inner" stdDeviation="${width*.65}" result="soft-inner"/><feComposite in="SourceAlpha" in2="soft-inner" operator="out" result="edge"/><feFlood flood-color="#160b08" flood-opacity=".96"/><feComposite in2="edge" operator="in"/></filter></defs><path data-effect="burst" data-placement="body-contour" data-side="${back?'back':'front'}" d="${d}" fill="black" filter="url(#${id})"/>`;
    }
    if(!back&&s.extra_finish_flake==='flake_add')out+=`<path data-effect="flake" d="${d}" fill="url(#${p}-flakes)"/>`;
    return out+'</g>';
  }
  function neckFinish(state,p,d,contents,layer='neck-finish'){
    const f=state.neckFinish||state.finish,match=state.neckColour==='body',colour=match&&f.colour;
    const attrs=`data-layer="${layer}" data-mode="${match?'body':'natural'}" data-colour="${colour||''}" data-opaque="${!!(colour&&f.opaque)}"`;
    if(!colour)return `<g ${attrs}>${contents}</g>`;
    if(f.opaque)return `<g ${attrs}><path d="${d}" fill="${colour}"/><path d="${d}" fill="url(#${p}-knob-shade)" opacity=".45"/></g>`;
    return `<g ${attrs}><defs>${materials.finishFilter(p+'-'+layer+'-dye',colour)}</defs><g filter="url(#${p}-${layer}-dye)">${contents}</g></g>`;
  }
  function boardEdges(state,board){
    const s=state.selections;let out='';
    if(['side_binding','side_purfling'].includes(s.fret_side)){
      const w=s.fret_side==='side_binding'?3:1;
      out+=`<g data-layer="fretboard-edge" data-option="${s.fret_side}" data-appearance="illustrative">`;
      for(const [a,b] of [[board[0],board[3]],[board[1],board[2]]]){
        out+=line(a,b,`stroke="#e9d9b7" stroke-width="${w}"`);
        if(w===1)out+=line(point(a,board[0]===a?board[1]:board[0],.045),point(b,board[3]===b?board[2]:board[3],.045),'stroke="#241d16" stroke-width=".6"');
      }out+='</g>';
    }
    return out;
  }
  function wings(state,p,d,horizontal,centre,width){
    const s=state.selections;
    if(!/^3pc_/.test(s.body_construction)||!s.body_wing_wood||!materials.get(s.body_wing_wood)||materials.key(s.body_wing_wood)===materials.key(state.bodyId)||state.finish.opaque)return '';
    // Display-only tone-block width; never a through-neck or a machining boundary.
    const rect=horizontal?`x="0" y="${centre-width/2}" width="1800" height="${width}"`:`x="${centre-width/2}" y="0" width="${width}" height="1800"`;
    return `<defs><mask id="${p}-wing-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1800" height="1800"><rect width="1800" height="1800" fill="white"/><rect ${rect} fill="black"/></mask></defs><g data-layer="body-wings" data-option="${s.body_wing_wood}" data-appearance="illustrative-body-tone-block"><path d="${d}" fill="url(#${p}-wing-material)" ${state.finish.colour?`filter="url(#${p}-surface-dye)"`:''} mask="url(#${p}-wing-mask)" opacity=".9"/><path d="${d}" fill="url(#${p}-light)" mask="url(#${p}-wing-mask)"/></g>`;
  }
  function bodyPieces(state,p,d,horizontal,centre,width,back=false){
    const id=state.selections.body_construction||'',count=/^(?:guitar_body_)?1pc/.test(id)?1:/^(?:guitar_body_)?3pc/.test(id)?3:id==='guitar_body_2pc'?2:null;
    const covered=(!back&&(state.hasTop||(/^3pc_/.test(id)&&state.selections.top_type==='none')))||state.finish.opaque;
    if(!count||covered)return '';
    const cuts=count===3?[centre-width/2,centre+width/2]:count===2?[centre]:[];
    return `<defs><clipPath id="${p}-pieces-clip"><path d="${d}"/></clipPath></defs><g data-layer="body-pieces" data-option="${id}" data-count="${count}" data-appearance="illustrative-joins" clip-path="url(#${p}-pieces-clip)">${cuts.map(at=>`<path d="${horizontal?`M0 ${at}H1800`:`M${at} 0V1800`}" stroke="#302317" stroke-opacity=".35" stroke-width=".8"/><path d="${horizontal?`M0 ${at+1}H1800`:`M${at+1} 0V1800`}" stroke="#f4dbb3" stroke-opacity=".23" stroke-width=".6"/>`).join('')}</g>`;
  }
  function dotColour(state){
    return {dot_avalon:'#94beb0',dot_mop:'#eee7d1',dot_bw:state.boardColour&&parseInt(state.boardColour.slice(1,3),16)>160?'#171615':'#eee8d5',dot_lum:'#b6e9bd'}[state.selections.inlay_dot_mat]||'#d3c9b0';
  }
  const fretWidth=s=>({size_vintage:.85,size_medium:1.2,size_jumbo:1.65,size_xjumbo:2.05}[s.fret_size]||1.2);
  function bindrune(state,board,clip){
    const id=state.bindruneExample,s=state.selections,m=motifs[id];
    if(!m||s.inlay_type!=='inlay_custom'||s.inlay_custom_spec!=='custom_bindrune')return '';
    const [tl,tr,br,bl]=m.board,sourceWidth=(tr[0]-tl[0]+br[0]-bl[0])/2;
    const width=(Math.hypot(board[1][0]-board[0][0],board[1][1]-board[0][1])+Math.hypot(board[2][0]-board[3][0],board[2][1]-board[3][1]))/2;
    const map=(x,y)=>{const v=(y-tl[1])/(bl[1]-tl[1]),left=point(tl,bl,v),right=point(tr,br,v),u=(x-left[0])/(right[0]-left[0]);return point(point(board[0],board[3],v),point(board[1],board[2],v),u).map(x=>x.toFixed(3)).join(',');};
    return `<g data-layer="bindrune-inlay" data-example="${id}" data-appearance="guide-example" clip-path="url(#${clip})">`+m.paths.map(shape=>`<path d="${shape.d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g,(_,x,y)=>map(+x,+y))}" fill="${shape.fill?'#eee5ce':'none'}" stroke="${shape.fill?'none':'#eee5ce'}" stroke-width="${shape.width*width/sourceWidth}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')+'</g>';
  }
  function knobs(state,p,positions,radius){
    if(state.selections.knob!=='knob_wood'||!materials.get(state.topId))return '';
    return `<g data-layer="wood-knobs" data-material="${state.topId}" data-appearance="illustrative">`+positions.map(([x,y])=>`<circle cx="${x+1}" cy="${y+2}" r="${radius+1}" fill="#14110d"/><circle cx="${x}" cy="${y}" r="${radius}" fill="url(#${p}-knob-material)" ${state.finish.colour?`filter="url(#${p}-surface-dye)"`:''} stroke="#2c2118" stroke-width=".7"/><circle cx="${x}" cy="${y}" r="${radius}" fill="url(#${p}-knob-shade)"/><path d="M${x},${y-radius*.65}v${radius*.28}" stroke="#e9dbc2" stroke-width=".8"/>`).join('')+'</g>';
  }
  function laminatePlan(state){
    const accent=state.neckAccent==='bloodwood'?'bloodwood':'walnut';
    // Bass specs list species, not their order/width. These symmetric sequences
    // are explicitly display proposals. GRAMR 5pc order is stated in the platform.
    const plans={
      '1pc':['maple'], '3pc':['maple','maple','maple'],
      '5pc':['ash','wenge','maple','wenge','ash'],
      '7pc':['ash','purpleheart','maple','wenge','maple','purpleheart','ash'],
      '9pc':['ash',accent,'purpleheart','maple','wenge','maple','purpleheart',accent,'ash'],
      '13pc':['ash',accent,'purpleheart','maple','bubinga','wenge','maple','wenge','bubinga','maple','purpleheart',accent,'ash'],
      guitar_neck_1pc:['maple'],guitar_neck_3pc:['maple','maple','maple'],
      guitar_neck_5pc:['maple','wenge','purpleheart','wenge','maple']
    };
    return plans[state.selections.neck]||null;
  }
  function lamination(state,board,clip){
    const id=state.selections.neck,woods=laminatePlan(state);if(!woods)return '';
    const count=woods.length,horizontal=Math.abs(board[3][0]-board[0][0])>Math.abs(board[3][1]-board[0][1]);
    const weights=count===1?[1]:count===3?[.36,.28,.36]:Array.from({length:count},(_,i)=>i===0||i===count-1?3:i%2?1:1.4),sum=weights.reduce((a,b)=>a+b,0);let at=0;
    const length=Math.hypot(board[3][0]-board[0][0],board[3][1]-board[0][1]),patternWidth=horizontal?length:110,patternHeight=horizontal?110:length;
    const shade=clip+'-laminate-shade',unique=[...new Set(woods)],sources=[...new Set(unique.map(w=>materials.get(w).source))];
    const atlasDefs=sources.map((src,i)=>{const w=unique.map(x=>materials.get(x)).find(w=>w.source===src);return `<image id="${clip}-atlas-${i}" href="${globalThis.RavenForgePreviewMedia?.[src]||src}" width="${w.sourceWidth||1254}" height="${w.sourceHeight||1254}"/>`;}).join('');
    return `<g data-layer="neck-laminates" data-option="${id}" data-count="${count}" data-materials="${woods.join(' ')}" data-accent="${state.neckAccent||'walnut'}" data-appearance="species-textures" data-order="${id==='guitar_neck_5pc'?'specified':'illustrative'}" clip-path="url(#${clip})"><defs>${atlasDefs}${unique.map(wood=>materials.pattern(clip+'-laminate-'+wood,wood,horizontal,clip+'-atlas-'+sources.indexOf(materials.get(wood).source)).replace('width="1" height="1" patternUnits="objectBoundingBox"',`width="${patternWidth}" height="${patternHeight}" patternUnits="userSpaceOnUse"`)).join('')}<linearGradient id="${shade}" x1="0" y1="0" x2="${horizontal?0:1}" y2="${horizontal?1:0}"><stop stop-color="#17100a" stop-opacity=".42"/><stop offset=".3" stop-color="#fff4db" stop-opacity=".12"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#17100a" stop-opacity=".38"/></linearGradient></defs>`+weights.map((w,i)=>{
      const a=at/sum;at+=w;const b=at/sum;
      return `<polygon data-laminate-piece="${i+1}" data-material="${woods[i]}" points="${polygon([point(board[0],board[1],a),point(board[0],board[1],b),point(board[3],board[2],b),point(board[3],board[2],a)])}" fill="url(#${clip}-laminate-${woods[i]})" stroke="#392a1e" stroke-opacity=".55" stroke-width=".35"/>`;
    }).join('')+`<polygon points="${polygon(board)}" fill="url(#${shade})"/></g>`;
  }
  function orientation(svg,state){
    const left=state.selections.orientation==='left_hand';
    svg=svg.replace('data-preview-svg=',`data-orientation="${left?'left_hand':'right_hand'}" data-preview-svg=`);
    if(!left)return svg;
    const [x,y,w,h]=svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
    const portrait=svg.includes('data-layout="portrait"');
    return svg.replace('</defs>',`</defs><g data-layer="orientation" transform="${portrait?`translate(${2*x+w} 0) scale(-1 1)`:`translate(0 ${2*y+h}) scale(1 -1)`}">`).replace('</svg>','</g></svg>');
  }
  return {definitions,finish,neckFinish,wings,bodyPieces,boardEdges,dotColour,fretWidth,bindrune,knobs,laminatePlan,lamination,orientation,materials};
});
