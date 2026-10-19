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
  function definitions(p,state,horizontal=false){
    return materials.finishFilter(p+'-surface-dye',state.finish.colour)+materials.pattern(p+'-material',state.topId,horizontal)+materials.pattern(p+'-board-material',state.selections.fretboard,horizontal)+materials.pattern(p+'-knob-material',state.topId,horizontal)+materials.pattern(p+'-wing-material',state.selections.body_wing_wood,horizontal)+
      `<linearGradient id="${p}-detail-gloss" x1="0" y1="0" x2="1" y2="1"><stop stop-color="white" stop-opacity="0"/><stop offset=".25" stop-color="white" stop-opacity="0"/><stop offset=".32" stop-color="white" stop-opacity=".26"/><stop offset=".36" stop-color="white" stop-opacity=".01"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>
      <radialGradient id="${p}-burst"><stop offset=".45" stop-color="#170b08" stop-opacity="0"/><stop offset=".72" stop-color="#331409" stop-opacity=".16"/><stop offset=".9" stop-color="#1a0906" stop-opacity=".62"/><stop offset="1" stop-color="#080504" stop-opacity=".95"/></radialGradient>
      <radialGradient id="${p}-knob-shade" cx=".3" cy=".25"><stop stop-color="#fff6df" stop-opacity=".4"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
      <pattern id="${p}-flakes" width="31" height="37" patternUnits="userSpaceOnUse">${Array.from({length:18},(_,i)=>{const x=(i*17.73)%31,y=(i*11.81)%37;return `<circle cx="${x}" cy="${y}" r="${i%4===0?.65:.3}" fill="${i%3?'#f5dfac':'#fff'}" opacity="${i%3?.6:.95}"/>`;}).join('')}</pattern>`;
  }
  function finish(state,p,d,back=false){
    const s=state.selections,id=back?s.color_back_side:s.color_top;
    let out=`<g data-layer="${back?'rear-':''}finish-details" data-finish="${id||''}" data-appearance="illustrative">`;
    if(id?.endsWith('gloss'))out+=`<path d="${d}" fill="url(#${p}-detail-gloss)"/>`;
    if(id?.endsWith('stain')||id?.endsWith('tint'))out+=`<path d="${d}" fill="#b7aea0" opacity=".055"/>`;
    if(!back&&s.extra_finish_burst==='burst_add')out+=`<path data-effect="burst" d="${d}" fill="url(#${p}-burst)"/>`;
    if(!back&&s.extra_finish_flake==='flake_add')out+=`<path data-effect="flake" d="${d}" fill="url(#${p}-flakes)"/>`;
    return out+'</g>';
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
    if(!/^3pc_/.test(s.body_construction)||!s.body_wing_wood||!materials.get(s.body_wing_wood)||materials.key(s.body_wing_wood)===materials.key(state.bodyId)||(s.color_back_side!=='back_oil'&&state.finish.opaque))return '';
    // Display-only tone-block width; never a through-neck or a machining boundary.
    const rect=horizontal?`x="0" y="${centre-width/2}" width="1800" height="${width}"`:`x="${centre-width/2}" y="0" width="${width}" height="1800"`;
    return `<defs><mask id="${p}-wing-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1800" height="1800"><rect width="1800" height="1800" fill="white"/><rect ${rect} fill="black"/></mask></defs><g data-layer="body-wings" data-option="${s.body_wing_wood}" data-appearance="illustrative-body-tone-block"><path d="${d}" fill="url(#${p}-wing-material)" ${state.finish.colour&&s.color_back_side!=='back_oil'?`filter="url(#${p}-surface-dye)"`:''} mask="url(#${p}-wing-mask)" opacity=".9"/><path d="${d}" fill="url(#${p}-light)" mask="url(#${p}-wing-mask)"/></g>`;
  }
  function bodyPieces(state,p,d,horizontal,centre,width,back=false){
    const id=state.selections.body_construction||'',count=/^(?:guitar_body_)?1pc/.test(id)?1:/^(?:guitar_body_)?3pc/.test(id)?3:id==='guitar_body_2pc'?2:null;
    const covered=(!back&&(state.hasTop||(/^3pc_/.test(id)&&state.selections.top_type==='none')))||(state.finish.opaque&&(!back||state.selections.color_back_side!=='back_oil'));
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
  function lamination(state,board,clip){
    const id=state.selections.neck;
    const count={'1pc':1,'3pc':3,'5pc':5,'7pc':7,'9pc':9,'13pc':13,guitar_neck_1pc:1,guitar_neck_3pc:3,guitar_neck_5pc:5}[id];
    if(!count)return '';
    const colours=count===3?['#e2c99e','#cbb187','#e2c99e']:Array.from({length:count},(_,i)=>i%2===0?'#dec99f':i%4===1?'#49352b':'#674054');
    if(id==='guitar_neck_5pc')colours.splice(0,5,'#e5d1a8','#49352b','#674054','#49352b','#e5d1a8');
    const weights=count===1?[1]:count===3?[.36,.28,.36]:Array.from({length:count},(_,i)=>i===0||i===count-1?3:i%2?1:1.4),sum=weights.reduce((a,b)=>a+b,0);let at=0;
    return `<g data-layer="neck-laminates" data-option="${id}" data-count="${count}" data-appearance="illustrative" clip-path="url(#${clip})">`+weights.map((w,i)=>{const a=at/sum;at+=w;const b=at/sum;return `<polygon points="${polygon([point(board[0],board[1],a),point(board[0],board[1],b),point(board[3],board[2],b),point(board[3],board[2],a)])}" fill="${colours[i]}" fill-opacity="${count===1?.83:i%2?.86:.42}" stroke="#5e4d35" stroke-width="${count===3?.4:0}"/>`;}).join('')+'</g>';
  }
  function orientation(svg,state){
    const left=state.selections.orientation==='left_hand';
    svg=svg.replace('data-preview-svg=',`data-orientation="${left?'left_hand':'right_hand'}" data-preview-svg=`);
    if(!left)return svg;
    const [x,y,w,h]=svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
    const portrait=svg.includes('data-layout="portrait"');
    return svg.replace('</defs>',`</defs><g data-layer="orientation" transform="${portrait?`translate(${2*x+w} 0) scale(-1 1)`:`translate(0 ${2*y+h}) scale(1 -1)`}">`).replace('</svg>','</g></svg>');
  }
  return {definitions,finish,wings,bodyPieces,boardEdges,dotColour,fretWidth,bindrune,knobs,lamination,orientation,materials};
});
