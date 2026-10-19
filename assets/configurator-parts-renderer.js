/* Test-only guards, ramps and additive control proposals.
 * Manufacturer hardware is retained from source images/drawings. Generic family
 * substitutions were removed: a family name is not a verified product asset. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.RavenForgeParts=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const circle=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
  const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
  const screw=(x,y,r=1.5)=>circle(x,y,r,'#9a9d9b','stroke="#101314" stroke-width=".6"')+path(`M${x-r*.5},${y}h${r}`,'none','stroke="#171a1b" stroke-width=".6"');
  function definitions(p,state){
    const metal=(id,colour)=>`<linearGradient id="${p}-${id}" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="#171b1d"/><stop offset=".17" stop-color="${colour}"/><stop offset=".28" stop-color="#faf6e9"/><stop offset=".39" stop-color="${colour}"/><stop offset=".79" stop-color="${colour}"/><stop offset="1" stop-color="#202528"/></linearGradient>`;
    return metal('part-metal',state.metal)+`<linearGradient id="${p}-part-plastic" x1="0" y1="0" x2=".35" y2="1"><stop stop-color="#414747"/><stop offset=".11" stop-color="#292d2e"/><stop offset=".52" stop-color="#15181a"/><stop offset="1" stop-color="#080b0c"/></linearGradient><linearGradient id="${p}-part-sheen"><stop stop-color="#fff6de" stop-opacity=".22"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>`;
  }
  // Keep the supplied pickup envelopes. Deferred third-pickup layouts must not
  // invent another housing or change existing parts without a placement drawing.
  const pickupPlan=state=>(state.g.pickups||[]).map(r=>({...r}));
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
  // Preview coordinates only, deliberately separate from every source knob.
  // They are NOT drilling positions and never enter order/PDF state.
  const controlProposals={
    EDDA:{kill:[610,991],coils:[]},
    EMBLA:{kill:[744,1017],coils:[[716,914],[736,951]]},
    ASKR:{kill:[704,1069],coils:[[693,933],[718,947]]},
    GRAMR:{kill:[915,218],coils:[]}
  };
  function controlPlan(state){
    const s=state.selections,extras=state.specialOptions||[],positions=state.g.controls||[];
    const plan=positions.map((xy,i)=>({xy:[...xy],type:'knob',index:i,functions:[],placement:'source-retained'}));
    const proposal=controlProposals[state.model];
    if(!proposal)return plan;
    const add=(xy,type,fn)=>plan.push({xy:[...xy],type,index:plan.length,functions:[fn],placement:'preview-only-unconfirmed'});
    // Stable locations: toggling one option must not move another control.
    if(extras.includes('kill_switch'))add(proposal.kill,'kill','kill_switch');
    const count=['EDDA','GRAMR'].includes(state.model)||['emg','fishman'].includes(s.pickups)||s.electronics==='fishman'?0:Number((s.coil_switch||'').match(/^coil_([12])_/)?.[1]||0);
    proposal.coils.slice(0,count).forEach(xy=>add(xy,'toggle',s.coil_switch));
    if(extras.includes('dual_tone')&&plan.length&&['passive','guitar_passive'].includes(s.electronics))plan[0].functions.push('dual_tone');
    return plan;
  }
  function controls(state,p,radius){
    const plan=controlPlan(state),metal=`url(#${p}-part-metal)`;let out='<g data-layer="control-options" data-placement="additive-preview-proposal">';
    for(const {xy:[x,y],type,functions,index,placement} of plan){if(type==='knob'&&!functions.length)continue;
      out+=`<g data-control-index="${index}" data-control-type="${type}" data-placement="${placement}" data-functions="${functions.join(' ')}" transform="translate(${x} ${y})">`;
      if(type!=='knob')out+=circle(0,0,radius+3,'none','stroke="#cdb98f" stroke-width=".9" stroke-dasharray="2 2" opacity=".85"');
      if(type==='kill')out+=circle(0,1,radius+1,'#121617')+circle(0,0,radius,metal,'stroke="#151b1c" stroke-width=".9"')+circle(0,0,radius*.67,'#24292a','stroke="#bbc1be" stroke-width=".65"')+circle(-radius*.18,-radius*.22,radius*.27,'#717b7a','opacity=".6"');
      if(type==='toggle')out+=circle(0,0,radius*.78,metal,'stroke="#1b2021" stroke-width=".9"')+circle(0,0,radius*.3,'#121717')+path(`M0,0L${radius*.26},${-radius*.92}`,'none',`stroke="#161b1c" stroke-width="${radius*.48}" stroke-linecap="round"`)+path(`M0,0L${radius*.26},${-radius*.92}`,'none',`stroke="${state.metal}" stroke-width="${radius*.29}" stroke-linecap="round"`);
      if(type==='knob')out+=circle(0,0,radius+1,'none','stroke="#c9bc99" stroke-width="1.1"')+path(`M${-radius*.45},${-radius-4}l${radius*.45},-3 ${radius*.45},3`,'none','stroke="#eee4c8" stroke-width="1.1"');
      out+='</g>';
    }return out+'</g>';
  }
  return {definitions,pickupPlan,guard,ramps,controlPlan,controls};
});
