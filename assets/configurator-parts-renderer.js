/* Independent display geometry, not manufacturer CAD or routing templates.
 * Shape-family references and unresolved dimensions: docs/CONFIGURATOR_PARTS.md. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.RavenForgeParts=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const point=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const rect=(x,y,w,h,fill,r=2,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
  const circle=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
  const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
  const screw=(x,y,r=1.5)=>circle(x,y,r,'#9a9d9b','stroke="#101314" stroke-width=".6"')+path(`M${x-r*.5},${y}h${r}`,'none','stroke="#171a1b" stroke-width=".6"');
  const pickupFamilies={nova_mm:'mm',häussel_triple:'triple',delano_sbc:'soapbar',delano_oval:'oval',delano_ts:'square-poles',häussel_jbuck:'jazzbucker',emg:'sealed',fishman:'sealed',askr_delano_sbc5_e:'soapbar',guitar_lundgren_m6:'open-humbucker'};
  const bridgeFamilies={ets_custom:'reference',payson:'reference',gotoh_404BO:'block',hipshot_a:'block',hipshot_b:'barrel',hipshot_kick:'mass',hipshot_lock:'single',babicz_top:'cam',babicz_solo:'single-cam',schaller_3d:'roller',nova_parts:'single',guitar_gotoh_510t:'drawing'};
  const tunerFamilies={gotoh_707:'compact',gotoh_350:'compact-light',gotoh_528:'clover',hipshot_ul_38:'y',hipshot_ul_38_xt:'y-xtender',graphtech:'compact',schaller_bm:'clover',schaller_bm_lt:'clover-light',schaller_m4_locking:'locking',guitar_gotoh_sg381:'guitar'};
  const defaults={EDDA:'nova_mm',EMBLA:'delano_sbc',ASKR:'fishman',GRAMR:'guitar_lundgren_m6'};
  function definitions(p,state){
    const metal=(id,colour)=>`<linearGradient id="${p}-${id}" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="#171b1d"/><stop offset=".17" stop-color="${colour}"/><stop offset=".28" stop-color="#faf6e9"/><stop offset=".39" stop-color="${colour}"/><stop offset=".79" stop-color="${colour}"/><stop offset="1" stop-color="#202528"/></linearGradient>`;
    return metal('part-metal',state.metal)+metal('part-bridge',state.bridgeColour)+`<linearGradient id="${p}-part-plastic" x1="0" y1="0" x2=".35" y2="1"><stop stop-color="#414747"/><stop offset=".11" stop-color="#292d2e"/><stop offset=".52" stop-color="#15181a"/><stop offset="1" stop-color="#080b0c"/></linearGradient><linearGradient id="${p}-part-sheen"><stop stop-color="#fff6de" stop-opacity=".22"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>`;
  }
  function pickupPlan(state){
    const source=state.g.pickups||[],three=state.selections.pickup_configuration==='pickup_3'&&['ASKR','EMBLA'].includes(state.model);
    if(!three||source.length!==2)return source.map(r=>({...r}));
    // Proposed spacing only: keep full-size housings and clear the board/bridge.
    const first=source[0],last=source[1],start=state.model==='ASKR'?858:first.y-first.h*.85,end=state.model==='ASKR'?954:last.y;
    return [0,.5,1].map(t=>({...first,x:first.x+(last.x-first.x)*t,y:start+(end-start)*t}));
  }
  const replacePickups=state=>state.model!=='GRAMR'&&!!pickupFamilies[state.selections.pickups]&&(state.selections.pickups!==defaults[state.model]||state.selections.pickup_configuration==='pickup_3');
  const replaceBridge=state=>state.model!=='GRAMR'&&bridgeFamilies[state.selections.hardware_bridge]&&!['reference','drawing'].includes(bridgeFamilies[state.selections.hardware_bridge]);
  const replaceTuners=state=>state.model!=='GRAMR'&&!!tunerFamilies[state.selections.hardware_machine_head]&&state.selections.hardware_machine_head!=='gotoh_707';
  function pickups(state,p){
    const id=state.selections.pickups,family=pickupFamilies[id];if(!family)return '';
    const plan=pickupPlan(state),metal=`url(#${p}-part-metal)`,plastic=`url(#${p}-part-plastic)`;
    let out=`<g data-layer="pickups" data-option="${esc(id)}" data-family="${family}" data-count="${plan.length}" data-appearance="illustrative-family" data-placement="${plan.length===3?'proposed-three-pickup':'reference-centres'}">`;
    for(const r of plan){
      const w=r.w,h=r.h;
      out+=`<g transform="translate(${r.x+r.w/2} ${r.y+r.h/2}) rotate(${r.angle||0}) translate(${-w/2} ${-h/2})">`;
      if(family==='oval'){
        out+=`<ellipse cx="${w/2+1}" cy="${h/2+2}" rx="${w/2+1}" ry="${h/2+2}" fill="#080909"/><ellipse cx="${w/2}" cy="${h/2}" rx="${w/2}" ry="${h/2}" fill="${plastic}" stroke="#616463" stroke-width=".8"/>`;
      }else{
        out+=rect(-1,1,w+2,h+2,'#080a0b',5)+rect(0,0,w,h,plastic,family==='mm'||family==='triple'?5:3,'stroke="#626765" stroke-width=".8"');
      }
      if(['mm','triple','jazzbucker','square-poles'].includes(family)){
        const rows=family==='triple'?3:2,n=state.g.strings;
        for(let j=0;j<rows;j++)for(let i=0;i<n;i++){
          const x=12+(w-24)*i/(n-1),y=h*(j+1)/(rows+1);
          if(family==='square-poles')out+=rect(x-3.8,y-4.1,7.6,8.2,metal,.5,'stroke="#080909" stroke-width=".65"');
          else if(family==='jazzbucker')out+=circle(x-2,y,1.8,metal)+circle(x+2,y,1.8,metal);
          else out+=circle(x,y,3.2,metal,'stroke="#0b0b0b" stroke-width=".6"');
        }
      }
      if(family!=='oval'){out+=screw(4,h/2,1.1)+screw(w-4,h/2,1.1);}
      out+=path(`M${w*.18},${h*.13}H${w*.8}`,'none','stroke="#a0a7a5" stroke-opacity=".18" stroke-width=".7"')+'</g>';
    }return out+'</g>';
  }
  function bridge(state,p){
    const id=state.selections.hardware_bridge,family=bridgeFamilies[id],g=state.g;if(!replaceBridge(state))return '';
    const n=g.strings,a=g.bridge[0],b=g.bridge[1],cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2,w=Math.hypot(b[0]-a[0],b[1]-a[1])+24,h=state.model==='EMBLA'?64:50,angle=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI,metal=`url(#${p}-part-bridge)`;
    let out=`<g data-layer="bridge" data-option="${esc(id)}" data-family="${family}" data-colour="${state.bridgeColour}" data-finish-fixed="${!!state.bridgeFinishFixed}" data-appearance="illustrative-family" transform="translate(${cx} ${cy}) rotate(${angle})">`;
    if(!family.startsWith('single')){
      const inset=family==='mass'?4:family==='roller'?8:0;
      out+=path(`M${-w/2},${-h*.52+inset} Q${-w/2},${-h*.58} ${-w/2+6},${-h*.58} H${w/2-6} Q${w/2},${-h*.58} ${w/2},${-h*.52+inset} V${h*.48} H${-w/2}Z`,metal,'stroke="#171b1b" stroke-width="1.3"');
      out+=rect(-w/2+3,h*.3,w-6,h*.12,metal,1,'stroke="#25292a" stroke-width=".8"');
      for(const x of [-w/2+5,w/2-5])out+=screw(x,-h*.38);
    }
    for(let i=0;i<n;i++){
      const x=(i/(n-1)-.5)*(w-24),sw=(w-24)/(n-1)*.72,offset=(i%3-1)*1.8;
      if(family.startsWith('single'))out+=rect(x-sw*.6,-h*.51,sw*1.2,h,metal,3,'stroke="#111617" stroke-width="1"');
      out+=rect(x-sw*.43,-h*.15+offset,sw*.86,h*.4,metal,1.5,'stroke="#262b2e" stroke-width=".8"');
      if(['barrel','roller'].includes(family))out+=rect(x-sw*.49,-h*.1+offset,sw*.98,9,metal,4,'stroke="#333c3c" stroke-width=".7"');
      if(family.includes('cam'))out+=circle(x,offset,sw*.43,metal,'stroke="#2b3335" stroke-width="1"');
      out+=path(`M${x},${h*.1}v${h*.25}`,'none','stroke="#303638" stroke-width="1.2"')+circle(x,h*.36,2,'#161b1d');
      for(const dx of [-sw*.27,sw*.27])out+=circle(x+dx,-h*.02+offset,.9,'#171c1e');
      out+=path(`M${x},${-h*.4}v${h*.28}`,'none','stroke="#bbb9ad" stroke-width=".7"');
    }return out+'</g>';
  }
  const guards={EDDA:'M491 787 Q463 771 455 804 L443 932 Q442 971 480 981 L597 968 Q620 953 613 924 L607 812 Q600 788 572 787Z',EMBLA:'M559 778 Q518 775 503 814 L486 953 Q484 981 516 982 L704 980 Q725 976 718 944 L698 813 Q690 786 660 778Z',ASKR:'M588 851 Q554 841 546 870 L527 1002 Q526 1040 563 1045 L692 991 Q704 986 697 957 L682 865 Q675 843 654 837Z'};
  function guard(state,p){
    const id=state.pickguard;if(id==='none')return '';
    const d=state.model==='GRAMR'?state.g.pickguard:guards[state.model];if(!d)return '';
    const fill=id==='wood'?`url(#${p}-material)`:id==='ivory'?'#ddd8c9':`url(#${p}-part-plastic)`;
    let out=`<g data-layer="pickguard" data-option="${id}" data-appearance="${state.model==='GRAMR'?'drawing-contour':'proposed-contour'}">`+path(d,'#080a0b','stroke="#080a0b" stroke-width="3.5"')+path(d,fill,`stroke="#a9aaa0" stroke-width=".9" ${id==='wood'&&state.finish.colour?`filter="url(#${p}-surface-dye)"`:''}`)+path(d,`url(#${p}-part-sheen)`);
    if(state.model==='GRAMR')for(const [x,y] of state.g.pickguardScrews)out+=screw(x,y,1.8);
    return out+'</g>';
  }
  function ramps(state,p){
    if(state.model==='GRAMR')return '';
    const s=state.selections,plan=pickupPlan(state),r=plan[0],last=plan[plan.length-1],a=state.g.board[3],b=state.g.board[2];let out='';
    const raised=(name,id,points,fill)=>`<g data-layer="${name}" data-option="${id}" data-appearance="proposed-placement"><polygon points="${points.map(v=>v.join(',')).join(' ')}" fill="${fill}" ${id!=='extense_fretless'&&state.finish.colour?`filter="url(#${p}-surface-dye)"`:''} stroke="#2c231b" stroke-width="2.2"/><polygon points="${points.map(v=>v.join(',')).join(' ')}" fill="url(#${p}-part-sheen)" stroke="#cfb994" stroke-opacity=".5" stroke-width=".6"/></g>`;
    if(s.fretboard_extense==='extense_slap'||s.fretboard_extense==='extense_fretless'){
      const top=Math.max(a[1],b[1])+5,bottom=r.y-13;
      if(bottom>top+4)out+=raised('fretboard-extension',s.fretboard_extense,[[a[0],a[1]+4],[b[0],b[1]+4],[b[0]+1,bottom-((r.angle||0)?13:0)],[a[0]-1,bottom]],`url(#${p}-${s.fretboard_extense==='extense_fretless'?'board-material':'material'})`);
    }
    if(s.finger_ramp==='ramp_wood'&&plan.length===2&&s.pickup_configuration!=='pickup_3'){
      const corner=(r,u,v,dy)=>{const a=(r.angle||0)*Math.PI/180,x=(u-.5)*r.w,y=(v-.5)*r.h;return [r.x+r.w/2+x*Math.cos(a)-y*Math.sin(a),r.y+r.h/2+x*Math.sin(a)+y*Math.cos(a)+dy];};
      const points=[corner(r,.12,1,4),corner(r,.88,1,4),corner(last,.88,0,-4),corner(last,.12,0,-4)];
      if(points[3][1]>points[0][1])out+=raised('finger-ramp',s.finger_ramp,points,`url(#${p}-material)`);
    }return out;
  }
  function controlPlan(state){
    const s=state.selections,extras=state.specialOptions||[],positions=state.g.controls||[],plan=positions.map((xy,i)=>({xy,type:'knob',index:i,functions:[]}));
    let available=plan.slice(1).reverse();
    if(extras.includes('kill_switch')&&available.length){const slot=available.shift();slot.type='kill';slot.functions.push('kill_switch');}
    const count=state.model==='EDDA'||['emg','fishman'].includes(s.pickups)||s.electronics==='fishman'?0:Number((s.coil_switch||'').match(/^coil_([12])_/)?.[1]||0);
    for(let i=0;i<count&&available.length;i++){const slot=available.shift();slot.type='toggle';slot.functions.push(s.coil_switch);}
    if(extras.includes('dual_tone')&&plan.length&&['passive','guitar_passive'].includes(s.electronics)){const slot=available[0]||plan[0];slot.functions.push('dual_tone');}
    if(s.pickup_configuration==='pickup_3'&&plan.length)plan[0].functions.push('pickup_3');
    return plan;
  }
  function controls(state,p,radius){
    const plan=controlPlan(state),metal=`url(#${p}-part-metal)`;let out='<g data-layer="control-options" data-placement="existing-positions-proposal">';
    for(const {xy:[x,y],type,functions,index} of plan){if(type==='knob'&&!functions.length)continue;
      out+=`<g data-control-index="${index}" data-control-type="${type}" data-functions="${functions.join(' ')}" transform="translate(${x} ${y})">`;
      if(type==='kill')out+=circle(0,1,radius+1,'#121617')+circle(0,0,radius,metal,'stroke="#151b1c" stroke-width=".9"')+circle(0,0,radius*.67,'#24292a','stroke="#bbc1be" stroke-width=".65"')+circle(-radius*.18,-radius*.22,radius*.27,'#717b7a','opacity=".6"');
      if(type==='toggle')out+=circle(0,0,radius*.78,metal,'stroke="#1b2021" stroke-width=".9"')+circle(0,0,radius*.3,'#121717')+path(`M0,0L${radius*.26},${-radius*.92}`,'none',`stroke="#161b1c" stroke-width="${radius*.48}" stroke-linecap="round"`)+path(`M0,0L${radius*.26},${-radius*.92}`,'none',`stroke="${state.metal}" stroke-width="${radius*.29}" stroke-linecap="round"`);
      if(type==='knob')out+=circle(0,0,radius+1,'none','stroke="#c9bc99" stroke-width="1.1"')+path(`M${-radius*.45},${-radius-4}l${radius*.45},-3 ${radius*.45},3`,'none','stroke="#eee4c8" stroke-width="1.1"');
      out+='</g>';
    }return out+'</g>';
  }
  // Positions remain the reference headstock arrangement, even when the sample
  // tuner count differs from the sales specification. No new drill coordinates.
  const frontTuners={EDDA:[[534,65,-1],[531,97,-1],[523,130,-1],[520,160,-1]],EMBLA:[[604,78,-1],[596,103,-1],[591,126,-1],[660,88,1],[663,110,1],[670,131,1]],ASKR:[[602,97,-1],[594,126,-1],[657,109,1],[667,140,1]]};
  function tunerSymbol(p,family,scale=1,rear=false,xtender=false){
    const metal=`url(#${p}-part-metal)`,clover=family.includes('clover');
    let d=clover?'M24 -3 C18 -16 26 -21 30 -12 C35 -21 44 -17 37 -8 C46 -4 41 7 33 2 C34 13 22 13 25 2Z':family.startsWith('y')?'M22 -11 Q18 -16 25 -17 L31 -9 L37 -17 Q44 -15 39 -9 L34 -2 L34 7 L27 7 L27 -2Z':'M24 -10 Q27 -7 32 -8 L38 -11 Q42 -8 40 6 Q36 3 31 4 L25 6 Q21 2 24 -10Z';
    let out=`<g transform="scale(${scale})">`+rect(0,-2.5,29,5,metal,1,'stroke="#262d2f" stroke-width=".7"')+path(d,metal,'stroke="#282f30" stroke-width=".8"');
    if(rear){out+=rect(-7,-8,18,16,metal,family==='compact-light'?5:3,'stroke="#242a2d" stroke-width=".7"');if(clover||family.startsWith('y'))out+=circle(0,0,6,metal,'stroke="#3c4140" stroke-width="1.6"')+screw(0,0,2);if(family==='locking')out+=circle(0,0,5,'#303637')+circle(0,0,3,metal);}
    else out+=circle(0,0,6,metal,'stroke="#252d2d" stroke-width=".9"')+circle(0,0,3.5,'#20292a');
    if(xtender)out+=path('M-5 7L-9 17L6 17','none',`stroke="${metal}" stroke-width="3" stroke-linejoin="round"`);
    return out+'</g>';
  }
  function tuners(state,p,placements,rear=false){
    if(!replaceTuners(state))return '';
    const family=tunerFamilies[state.selections.hardware_machine_head],points=placements||frontTuners[state.model];if(!points)return '';
    return `<g data-layer="${rear?'rear-tuners':'tuners'}" data-option="${state.selections.hardware_machine_head}" data-family="${family}" data-count="${points.length}" data-appearance="illustrative-family" data-placement="reference-layout">`+points.map(([x,y,side=1,angle=0,scale=.8],i)=>`<g transform="translate(${x} ${y}) rotate(${angle}) scale(${side} 1)">${tunerSymbol(p,family,scale,rear,family==='y-xtender'&&i===0)}</g>`).join('')+'</g>';
  }
  return {definitions,pickupFamilies,bridgeFamilies,tunerFamilies,pickupPlan,replacePickups,replaceBridge,replaceTuners,pickups,bridge,guard,ramps,controlPlan,controls,tuners};
});
