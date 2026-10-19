/* GRAMR front/rear projections: extracted PDF contours; illustrative materials.
 * Historical four-bolt plate is omitted. The current 2-2-1 joint is explicitly
 * schematic, with unapproved positions shown as symbols instead of machined parts. */
(function(root,factory){const options=typeof module==='object'&&module.exports?require('./configurator-option-renderer.js'):root.RavenForgeOptionRenderer;const parts=typeof module==='object'&&module.exports?require('./configurator-parts-renderer.js'):root.RavenForgeParts;const api=factory(options,parts);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.RavenForgeDrawingRenderer=api;})(typeof globalThis!=='undefined'?globalThis:this,function(options,parts){
  'use strict';
  const media=path=>globalThis.RavenForgePreviewMedia?.[path]||path;
  const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const point=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const polygon=p=>p.map(q=>q.join(',')).join(' ');
  function render(state,view,language,layout,copy,ovalMark){
    const back=view==='back',g=back?Object.assign({},state.g,state.g.back):state.g,s=state.selections,t=copy[language]||copy.en,p='rf-preview-gramr';
    const path=(d,a='')=>`<path d="${d}" ${a}/>`;
    const line=(a,b,attr='')=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" ${attr}/>`;
    const dye=(base,colour)=>'#'+[0,1,2].map(i=>Math.round(parseInt(base.slice(1+i*2,3+i*2),16)*.16+parseInt(colour.slice(1+i*2,3+i*2),16)*.84).toString(16).padStart(2,'0')).join('');
    const metal=`url(#${p}-metal)`,poleMetal='#aeb4b5',unknown=`url(#${p}-unknown)`,base=state.bodyColour||'#8d9196';
    const colour=state.finish.colour?(state.finish.opaque?state.finish.colour:dye(base,state.finish.colour)):base;
    const opaque=state.finish.opaque&&!!state.finish.colour;
    const woodFilter=(id,hex)=>{
      const c=hex.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16)/255);
      return `<filter id="${p}-${id}" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer>${['R','G','B'].map((k,i)=>`<feFunc${k} type="linear" slope="${c[i]*1.3}" intercept="0"/>`).join('')}</feComponentTransfer></filter>`;
    };
    const texture=(x,y,w,h,filter)=>`<image href="${media('assets/configurator-materials/ash-illustrative.webp')}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" transform="rotate(90 ${x+w/2} ${y+h/2})" filter="url(#${p}-${filter})"/>`;
    const title=id=>`<title>${esc(state.labels[id]||s[id])}</title>`;
    let out=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${(layout==='portrait'?g.portrait:g.views).full}" role="img" aria-labelledby="${p}-title ${p}-desc" data-preview-svg="GRAMR" data-neck-joint="bolt-on" data-renderer="drawing-composite" data-side="${back?'back':'front'}" data-layout="${layout==='portrait'?'portrait':'landscape'}"><title id="${p}-title">GRAMR · ${esc(back?t.back:t.front)}</title><desc id="${p}-desc">${esc(back?t.backNote:t.drawingNote)}</desc><defs>${options.definitions(p,state,true)}${parts.definitions(p,state)}${options.materials.pattern(p+'-head-natural','maple',true)}
      <clipPath id="${p}-neck-clip"><polygon points="${polygon(back?g.neck:g.board)}"/></clipPath><clipPath id="${p}-body-clip">${path(g.body)}</clipPath><clipPath id="${p}-head-clip">${path(g.head)}</clipPath><clipPath id="${p}-board-clip"><polygon points="${polygon(g.board)}"/></clipPath>
      <pattern id="${p}-unknown" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#5e6670"/><path d="M0 12L12 0" stroke="#b4bdc7" stroke-width="2"/></pattern>
      <radialGradient id="${p}-joint-fade"><stop offset=".5" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient>
      <mask id="${p}-joint-region" maskUnits="userSpaceOnUse" x="650" y="235" width="120" height="102"><ellipse cx="710" cy="286" rx="60" ry="51" fill="url(#${p}-joint-fade)"/></mask>
      ${woodFilter('body-wood',colour)}${woodFilter('board-wood',state.boardColour||'#6b6256')}
      <linearGradient id="${p}-body-light" x1="0" y1="0" x2=".35" y2="1"><stop stop-color="#fff8dc" stop-opacity=".22"/><stop offset=".28" stop-color="#fff" stop-opacity=".03"/><stop offset=".7" stop-color="#000" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
      <linearGradient id="${p}-rim" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="#fff8dd" stop-opacity=".85"/><stop offset=".35" stop-color="#fff" stop-opacity=".35"/><stop offset=".6" stop-color="#000" stop-opacity=".2"/><stop offset="1" stop-color="#050606" stop-opacity=".85"/></linearGradient>
      <linearGradient id="${p}-gloss" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".23" stop-color="#fff" stop-opacity="0"/><stop offset=".29" stop-color="#fff" stop-opacity=".18"/><stop offset=".33" stop-color="#fff" stop-opacity=".02"/><stop offset=".75" stop-color="#fff" stop-opacity="0"/><stop offset=".91" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="${p}-metal" x1="0" y1="0" x2=".35" y2="1"><stop stop-color="#151719"/><stop offset=".14" stop-color="${state.metal}"/><stop offset=".28" stop-color="#f4f2e8"/><stop offset=".36" stop-color="${state.metal}"/><stop offset=".75" stop-color="${state.metal}"/><stop offset="1" stop-color="#272b2d"/></linearGradient>
      <radialGradient id="${p}-knob" cx=".35" cy=".25" r=".7"><stop stop-color="#f6eddb"/><stop offset=".28" stop-color="${state.metal}"/><stop offset=".72" stop-color="${state.metal}"/><stop offset="1" stop-color="#25292a"/></radialGradient>
      <linearGradient id="${p}-plastic" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#34363a"/><stop offset=".4" stop-color="#121315"/><stop offset="1" stop-color="#050607"/></linearGradient>
      <filter id="${p}-relief" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="3" result="edge-height"/><feSpecularLighting in="edge-height" surfaceScale="4" specularConstant=".65" specularExponent="22" lighting-color="#fff5de" result="edge-light"><feDistantLight azimuth="235" elevation="45"/></feSpecularLighting><feComposite in="edge-light" in2="SourceAlpha" operator="in" result="edge-light-clipped"/><feComposite in="SourceGraphic" in2="edge-light-clipped" operator="arithmetic" k1="0" k2="1" k3=".7" k4="0"/></filter>
      <filter id="${p}-shadow" x="-15%" y="-15%" width="140%" height="140%"><feDropShadow dx="3" dy="5" stdDeviation="5" flood-opacity=".65"/></filter>
      </defs><g transform="${layout==='portrait'?g.portraitTransform:g.transform}">`;
    // The outline is the extracted curve itself, not a hand-traced approximation.
    out+=`<g filter="url(#${p}-shadow)">${path(g.body,'fill="#16120e"')}${path(g.head,'fill="#16120e"')}</g>`;
    const surface=(d,clip,tex)=>`<g filter="url(#${p}-relief)">${path(d,`fill="${colour}"`)}${!opaque?`<g clip-path="url(#${p}-${clip}-clip)">${options.materials.get(state.topId)?path(d,`fill="url(#${p}-material)" ${state.finish.colour?`filter="url(#${p}-surface-dye)"`:""}`):tex}</g>`:''}${path(d,`fill="url(#${p}-body-light)"`)}<g clip-path="url(#${p}-${clip}-clip)">${path(d,'fill="none" stroke="#100e0b" stroke-width="9" stroke-opacity=".25"')}${path(d,`fill="none" stroke="url(#${p}-rim)" stroke-width="1.7"`)}${path(d,'fill="none" stroke="#fff7e2" stroke-width=".45" stroke-opacity=".35"')}</g>${options.finish(state,p,d,back,clip==='body')}</g>`;
    if(back){
      out+=`<g data-layer="rear-body" data-material="${esc(state.bodyId)}" data-finish="${esc(s.color_back_side)}" data-colour="${colour}" data-opaque="${opaque}" data-contour="pdf-vector">${surface(g.body,'body',texture(535,-4,550,550,'body-wood'))}</g>`;
      out+=options.bodyPieces(state,p,g.body,true,286,100,true);
      out+=`<g data-layer="rear-headstock" data-contour="pdf-vector">${options.neckFinish(state,p,g.head,path(g.head,`fill="url(#${p}-head-natural)"`)+path(g.head,`fill="url(#${p}-body-light)"`),'rear-head-finish')}</g>`;
      out+=`<g data-layer="rear-neck" data-neck-joint="bolt-on" data-appearance="illustrative-lamination">${options.neckFinish(state,p,'M'+polygon(g.neck)+' Z',`<polygon points="${polygon(g.neck)}" fill="#e2cda8" stroke="#72664f" stroke-width="1"/>${options.lamination(state,g.neck,p+'-neck-clip')}<polygon points="${polygon(g.neck)}" fill="url(#${p}-body-light)"/>`)}</g>`;
      out+=`<g data-layer="rear-joint-seam" data-placement="source-envelope">${line(g.neck[3],g.neck[2],'stroke="#15120f" stroke-width="1.8" vector-effect="non-scaling-stroke"')}</g>`;
      // This unfinished region communicates the confirmed bolt-on construction
      // without inventing an approved heel or manufacturing hole coordinates.
      out+=`<g data-layer="rear-joint-schematic" data-neck-joint="bolt-on" data-coordinate-status="unverified" clip-path="url(#${p}-body-clip)"><ellipse cx="710" cy="286" rx="60" ry="51" fill="${unknown}" opacity=".55" mask="url(#${p}-joint-region)"/><title>${esc(t.backNote)}</title><g data-layer="rear-bolts" data-count="5" data-pattern="2-2-1" data-placement="spec-schematic">`;
      for(const [x,y] of [[686,270],[686,302],[711,270],[711,302],[736,286]])out+=`<circle cx="${x}" cy="${y}" r="6" fill="#20292e" stroke="#e5dcc4" stroke-width="1.3"/><path d="M${x-2},${y}h4 M${x},${y-2}v4" stroke="#e5dcc4" stroke-width=".8"/>`;
      out+='</g></g>';
      out+=`<g data-layer="rear-cavity" data-contour="pdf-vector">${path(g.cavity,'fill="#181b1c" stroke="#978f7e" stroke-width="1.1"')}${path(g.cavity,`fill="${unknown}" opacity=".3"`)}</g>`;
      out+=`<g data-layer="rear-tuners" data-count="6" data-appearance="drawing-envelope" data-colour="${state.metal}">`;
      (parts.profile(state,'hardware_machine_head')?[]:g.tuners).forEach(([x,y])=>{out+=`<circle cx="${x}" cy="${y}" r="10" fill="${metal}" stroke="#303536" stroke-width="1"/><circle cx="${x}" cy="${y}" r="4" fill="#424847"/>`;});
      return out+'</g>'+parts.tuners(state,p,true)+'</g></svg>';
    }
    out+=`<g data-layer="body" data-option="${esc(state.topId)}" data-material="${esc(state.bodyId)}" data-contour="pdf-vector">${title(state.hasTop?'top_wood_selection':'body_wood_single')}${surface(g.body,'body',texture(535,-4,550,550,'body-wood'))}${!state.bodyColour?path(g.body,`fill="${unknown}" opacity=".4"`):''}</g>`;
    out+=options.bodyPieces(state,p,g.body,true,286,100);
    if(state.finish.colour) out+=`<g data-layer="finish" data-colour="${state.finish.colour}" data-opaque="${opaque}"><title>${esc(t.colour)}: ${state.finish.colour}</title></g>`;
    out+=`<g data-layer="headstock" data-option="${esc(s.color_headstock)}" data-contour="pdf-vector">${s.color_headstock==='head_natural'?path(g.head,'fill="#d9c29b" stroke="#77684d" stroke-width=".8"')+path(g.head,`fill="url(#${p}-head-natural)"`)+path(g.head,`fill="url(#${p}-body-light)"`):surface(g.head,'head',texture(5,170,240,240,'body-wood'))}</g>`;
    out+=parts.guard(state,p);
    out+=`<g data-layer="fretboard" data-option="${esc(s.fretboard)}"><polygon points="${polygon(g.board)}" fill="${state.boardColour||'#49423c'}" stroke="#9b8063" stroke-width="1.2"/><g clip-path="url(#${p}-board-clip)">${state.boardColour?`<polygon points="${polygon(g.board)}" fill="url(#${p}-board-material)"/>`:`<polygon points="${polygon(g.board)}" fill="${unknown}"/>`}</g><polygon points="${polygon(g.board)}" fill="url(#${p}-body-light)"/>${title('fretboard')}</g>`;
    out+=options.boardEdges(state,g.board)+options.bindrune(state,g.board,p+'-board-clip');
    out+='<g data-layer="frets" data-count="24" data-position-source="pdf-vector">';
    g.frets.forEach(([a,b])=>{out+=line(a,b,'stroke="#141414" stroke-width="2.5"')+line(a,b,`stroke="${s.fret_material==='mat_brass'?'#dfc38b':'#d7d8d4'}" stroke-width="${options.fretWidth(s)}"`);});out+='</g>';
    out+=`<g data-layer="nut" data-option="${esc(s.nut_material)}" data-zero-fret="false">${line(g.board[0],g.board[1],'stroke="#797466" stroke-width="4"')}${line(g.board[0],g.board[1],'stroke="#eee4ce" stroke-width="2.5"')}</g>`;
    if(s.inlay_type==='inlay_oval'||(s.inlay_type==='inlay_dot'&&s.inlay_dot_pos!=='pos_custom')){
      out+=`<g data-layer="inlays" data-material="${esc(s.inlay_dot_mat||s.inlay_oval_mat)}" fill="${options.dotColour(state)}" stroke="#eee8d4" stroke-width=".25">`;
      [3,5,7,9,12,15,17,19,21,24].forEach(n=>{const a=point(g.frets[n-2][0],g.frets[n-1][0],.5),b=point(g.frets[n-2][1],g.frets[n-1][1],.5);(n%12===0?[.28,.72]:[s.inlay_type==='inlay_oval'?.5:s.inlay_dot_pos==='pos_left'?.2:s.inlay_dot_pos==='pos_right'?.8:.5]).forEach(f=>{const p=point(a,b,f);out+=s.inlay_type==='inlay_oval'?ovalMark(p,Math.hypot(b[0]-a[0],b[1]-a[1])*(n%12===0?.3:.62),3.5,Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI,s.inlay_oval_mat,state.boardColour):`<ellipse cx="${p[0]}" cy="${p[1]}" rx="1.7" ry="1.7"/>`;});});out+='</g>';
    }
    if(parts.profile(state,'pickups'))out+=parts.pickups(state,p);else{
    out+=`<g data-layer="pickups" data-option="${esc(s.pickups)}" data-appearance="${parts.profile(state,'pickups')?'manufacturer-reference':'drawing-envelope'}" data-profile="${parts.profile(state,'pickups')?.style||'unconfirmed'}">${title('pickups')}`;
    g.pickups.forEach((r,index)=>{
      out+=path(g.pickupOutlines[index],'fill="#08090a" stroke="#030404" stroke-width="3.4"');
      for(let coil=0;coil<2;coil++){
        const x=r.x+coil*r.w/2;
        out+=`<rect x="${x+.9}" y="${r.y+1}" width="${r.w/2-1.6}" height="${r.h-2}" rx="9" fill="url(#${p}-plastic)" stroke="#5b5c5c" stroke-width=".5"/>`;
        for(let i=0;i<6;i++){
          const y=r.y+8+i*(r.h-16)/5;
          out+=`<circle cx="${x+r.w/4}" cy="${y}" r="2.3" fill="${poleMetal}" stroke="#070707" stroke-width=".65"/>`;
          if(coil&&s.pickups!=='guitar_lundgren_m6')out+=`<path d="M${x+r.w/4-1.4},${y}h2.8" stroke="#222" stroke-width=".5"/>`;
        }
      }
    });out+='</g>';
    }
    if(parts.profile(state,'hardware_bridge'))out+=parts.bridge(state,p);else{
    out+=`<g data-layer="bridge" data-option="${esc(s.hardware_bridge)}" data-colour="${state.bridgeColour}" data-appearance="drawing-envelope">${title('hardware_bridge')}${path(g.bridgeOutline,`fill="${metal}" stroke="#161819" stroke-width="1.2"`)}`;
    for(let i=0;i<6;i++){
      const y=point(g.bridge[0],g.bridge[1],i/5)[1],x=g.bridge[0][0];
      out+=`<rect x="${x-9}" y="${y-5}" width="27" height="10" rx="1.3" fill="${metal}" stroke="#44484a" stroke-width=".7"/><rect x="${x-4+i*.6}" y="${y-3.7}" width="13" height="7.4" rx="1" fill="${metal}" stroke="#272b2c" stroke-width=".5"/><circle cx="${x+14}" cy="${y}" r="1.9" fill="#1c1c1c"/><path d="M${x+13},${y}h2" stroke="#aaa" stroke-width=".4"/>`;
    }
    out+='</g>';
    }
    out+=`<g data-layer="hardware" data-option="${esc(s.hardware_color)}" data-colour="${state.metal}" data-appearance="drawing-envelope">${title('hardware_color')}${path(g.jack,`fill="${metal}" stroke="#171a1b" stroke-width="1.5"`)}<ellipse cx="952" cy="186" rx="17" ry="6" transform="rotate(-53 952 186)" fill="#242727" stroke="${state.metal}" stroke-width="1.7"/>`;
    if(parts.electronicsPlan(state))out+=parts.knobs(state,p,10);else{
    out+=`<g data-layer="knobs" data-count="${g.controls.length}" data-placement="source-retained">`;
    g.controls.forEach(([x,y])=>{out+=`<circle cx="${x+1}" cy="${y+2}" r="11" fill="#080909"/><circle cx="${x}" cy="${y}" r="10" fill="url(#${p}-knob)" stroke="#292a28" stroke-width=".8"/><circle cx="${x}" cy="${y}" r="7.6" fill="${metal}" stroke="#d2c7ac" stroke-opacity=".5" stroke-width=".5"/><path d="M${x},${y-7}v3" stroke="#151616" stroke-width=".8"/>`;});
    out+=options.knobs(state,p,g.controls,10)+'</g>';}
    out+=line(...g.selector,'stroke="#080808" stroke-width="2.7"')+line(...g.selector,'stroke="#878b89" stroke-width=".65"');
    const sel=point(...g.selector,.55);out+=`<rect x="${sel[0]-2}" y="${sel[1]-5}" width="4" height="10" rx="1.5" transform="rotate(54 ${sel[0]} ${sel[1]})" fill="#ddd8c6" stroke="#5c5a52" stroke-width=".5"/>`;
    (parts.profile(state,'hardware_machine_head')?[]:g.tuners).forEach(([x,y])=>{out+=`<path d="M${x-2},${y+4}v15h4v-15" fill="${metal}" stroke="#202323" stroke-width=".6"/><rect x="${x-7}" y="${y+16}" width="14" height="9" rx="3" fill="${metal}" stroke="#333" stroke-width=".7"/><circle cx="${x}" cy="${y}" r="6.9" fill="${metal}" stroke="#272a2a" stroke-width=".6"/><circle cx="${x}" cy="${y}" r="3.9" fill="${metal}" stroke="#17191a" stroke-width=".9"/>`;});out+='</g>';
    out+=parts.tuners(state,p)+parts.controls(state,p,10);
    out+='<g data-layer="strings" data-count="6" data-scope="whole-instrument">';
    for(let i=0;i<6;i++){
      const a=point(g.board[0],g.board[1],.08+.84*i/5),b=point(g.bridge[0],g.bridge[1],i/5),c=g.tuners[i];
      const d=`M${c[0]},${c[1]} L${a[0]},${a[1]} L${b[0]},${b[1]}`;
      out+=path(d,`fill="none" stroke="#111" stroke-width="${1.7-i*.18}" opacity=".9"`)+path(d,`fill="none" stroke="#ded9c8" stroke-width="${1.05-i*.14}"`);
    }
    return out+'</g></g></svg>';
  }
  return {render};
});
