// v23 mask model/effects, mounted in the existing furnished game apartment.
// One renderer and one game loop; prepare first-visit resources before Play.
window.NovaMaskGame={create({THREE,scene,waterMaterial,settlements:S,textures,texture,wallpaper,interference,visual=()=>({})}){
 const $=id=>document.getElementById(id),controller=NovaMaskState.create(1),audio=NovaMaskAudio.create();
 let spaces=null,effect=null,inside=false,owned=false,inBag=false,returnPose=null,wasActive=false,suspended=null,tableLift=false,rigWorld=null;
 const machineRig=new THREE.Group();machineRig.name='Maskenmaschine draußen';
 const entry={x:S.cores[0].x+2.86,y:S.housing.y,z:S.housing.z-4.2};
 const exit={x:3.55,y:0,z:2.25},probe=new THREE.Vector3(),size=new THREE.Vector2();
 function door(parent,p,yaw){
  const g=new THREE.Group();g.name='Maskenraum · Tür';g.position.set(p.x,p.y,p.z);g.rotation.y=yaw;parent.add(g);
  const wood=new THREE.MeshLambertMaterial({map:textures.wood,color:0x48483b}),rim=new THREE.MeshLambertMaterial({map:textures.rust,color:0x55594b});
  const add=(w,h,d,x,y,z,m)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);g.add(mesh);};
  add(1.38,2.28,.07,0,1.14,0,wood);for(const x of [-.73,.73])add(.075,2.38,.13,x,1.19,.025,rim);add(1.54,.09,.13,0,2.38,.025,rim);
  add(.14,.025,.09,.48,1.03,.085,rim);add(.035,.15,.02,.48,1.01,.075,rim);
  g.updateMatrixWorld(true);g.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false;});return g;
 }
 const entryDoor=door(scene,entry,-Math.PI/2);
 // Join the initial asset barrier. Loading these on E used to restart loading
 // callbacks and force texture uploads during the first room visit.
 const maskTextures={...textures,wallpaper,vermesser:texture('vermesser-skin-v19.png',true),maskAtlas:texture('gasmask-gp5-atlas.jpg',true),maskInner:texture('gasmask-interior-clean.jpg',true),maskInterior:texture('gasmask-interior.jpg',true),memory:texture('erinnerung.jpg',true),
  // v106: the WOHNBLOCK episode from the Salviamaske test station (photos of Skrunda-1, the flats' walls, bark),
  // and the masked figure from the closing credits (classic Karin model).
  karin:textures.karinAtlasClassic||texture('karin-study-atlas-classic.png',true),birkenrinde:texture('bark/betula-pendula-r2.jpg'),kiefernrinde:texture('bark/pinus-sylvestris-r2.jpg'),
  block:{fassade:texture('wohnblock/fassade.jpg',true),ziegel:texture('wohnblock/ziegel.jpg'),himmel:texture('wohnblock/himmel.jpg',true),gras:texture('wohnblock/gras.jpg'),platten:texture('wohnblock/platten.jpg'),innen:['01','03','10','13','15','16','19'].map(n=>texture('wohnblock/innen'+n+'.jpg'))}};
 let prepared=false;
 function ensure(){
  if(spaces)return spaces;
  spaces=NovaMaskWorld.create(THREE,maskTextures);effect=NovaMaskEffect.create(THREE);door(spaces.apartment,exit,-Math.PI/2);
  if(waterMaterial)effect.hookShader(waterMaterial,'vec4 mv=modelViewMatrix*vec4(p,1.0);','vec4 mv=viewMatrix*vec4(novaMaskWarp((modelMatrix*vec4(p,1.0)).xyz),1.0);');
  // Patterns also inhabit the mask's replacement rooms and memory meadow.
  if(interference){interference.psilo.prepare(spaces.replacement,true);if(spaces.memory)interference.psilo.prepare(spaces.memory.scene,true);if(spaces.bau)interference.psilo.prepare(spaces.bau.scene,true);}
  const url=window.NOVA_ASSET_DATA?.['assets/gasmask-interior.jpg']||'assets/gasmask-interior.jpg';
  for(const image of document.querySelectorAll('[data-mask-photo="interior"]'))image.setAttribute('href',url);
  return spaces;
 }
 function prepare(){
  ensure();if(prepared)return spaces;
  // Install both shader hooks before warming. In particular, returning to the
  // coast must not invalidate every outdoor material after first using M/E.
  for(const world of [scene,spaces.apartment,spaces.replacement,spaces.memory?.scene,spaces.bau?.scene])if(world){
   interference?.psilo.prepare(world,true);effect.prepare(world);
  }
  prepared=true;return spaces;
 }
 function warmup(queue,renderer,camera){
  prepare();const eye=camera.clone();eye.position.set(2.95,1.68,2.25);eye.rotation.set(-.08,Math.PI/2,0,'YXZ');eye.updateMatrixWorld(true);
  spaces.update(controller.state,eye,true);
  for(const world of [spaces.apartment,spaces.replacement,spaces.memory?.scene,spaces.bau?.scene])if(world)queue.visit(world,eye);
  queue.draw(()=>{
   // A separate state exercises all compositor passes without acquiring the
   // mask, advancing the real timeline, playing sounds or moving the player.
   // v106: the timeline of the test station (WOHNBLOCK at 136 s, everything after it 78 s later):
   // the fractal and every stage of the episode once.
   const PLi=NovaMaskState.PLAN.inside,rehearsal=NovaMaskState.create(1);rehearsal.setIndoor(true);rehearsal.start();
   try{
    for(const t of [PLi.fractal[1]+18,...(PLi.bau!==undefined?[PLi.bau+10,PLi.bau+20,PLi.bau+40,PLi.bau+66]:[])]){
     rehearsal.seek(t);rehearsal.tick(0);const s=t===PLi.fractal[1]+18?{...rehearsal.state,memWorld:false,gapB:.2,memMix:1,fractal:1}:rehearsal.state;
     effect.render(renderer,spaces.apartment,eye,s,spaces,0,{indoor:true});
    }
   }finally{effect.reset();spaces.update(controller.state,eye,true);}
  });
 }
 function enter(player){ensure();returnPose={...player};inside=true;controller.setIndoor(true);Object.assign(player,{x:2.95,z:2.25,walkY:0,yaw:Math.PI/2,pitch:-.08,vx:0,vy:0,vz:0});return true;}
 function leave(player){if(!inside)return false;inside=false;controller.setIndoor(false);Object.assign(player,returnPose||{x:entry.x-1.1,z:entry.z,walkY:entry.y,yaw:Math.PI/2,pitch:0});returnPose=null;return true;}
 function suspend(player){if(inside){suspended={pose:{...player},returnPose};inside=false;if(returnPose)Object.assign(player,returnPose);}}
 function resume(player){if(suspended){Object.assign(player,suspended.pose);returnPose=suspended.returnPose;inside=true;suspended=null;controller.setIndoor(true);}}
 function abandon(player){if(inside)leave(player);suspended=null;controller.setIndoor(false);}
 function aim(eye,look,p,max=2.6,height=1.5){probe.set(p.x-eye.x,p.y+height-eye.y,p.z-eye.z);const d=probe.length();return d>0&&d<max&&probe.dot(look)/d>.88;}
 function target(eye,look,player,allowed=true){
  if(!allowed)return null;
  if(inside){
   if(aim(eye,look,exit))return{id:'mask-room-exit',kind:'maskDoor',label:'E · öffnen'};
   if(!owned&&aim(eye,look,spaces.maskPosition,3.0,0))return{id:'gasmask',kind:'gasmask',label:'E · aufsetzen'};
  }else if(Math.abs(player.walkY-entry.y)<.4&&eye.x<entry.x&&aim(eye,look,entry))return{id:'mask-room-entry',kind:'maskDoor',label:'E · öffnen'};
  return null;
 }
 function take(){if(owned||!inside)return false;owned=true;tableLift=true;return toggle();}
 function toggle(){
  if(!owned)return false;ensure();audio.activate();
  if(controller.state.maskOn){controller.release();inBag=true;tableLift=false;}
  else controller.start();
  return true;
 }
 function move(dt,player,input){
  const s=controller.state,n=Math.max(1,Math.hypot(input.forward,input.right)),speed=(input.run?4.1:2.8)*s.control;
  const dx=(-Math.sin(player.yaw)*input.forward+Math.cos(player.yaw)*input.right)*speed*dt/n,dz=(-Math.cos(player.yaw)*input.forward-Math.sin(player.yaw)*input.right)*speed*dt/n;
  const beforeX=player.x,beforeZ=player.z,steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/.08));
  for(let i=0;i<steps;i++){if(!spaces.blocked(player.x+dx/steps,player.z))player.x+=dx/steps;if(!spaces.blocked(player.x,player.z+dz/steps))player.z+=dz/steps;}
  const d=Math.hypot(player.x-beforeX,player.z-beforeZ);player.walkY=0;player.bob+=d*2.1;return d;
 }
 const liftRim=[0,0,0,0],approachStyle={},overlayStyle={};
 function style(el,cache,key,value){if(cache[key]!==value){cache[key]=value;el.style[key]=value;}}
 function overlays(s,camera){
  const H=innerHeight,W=innerWidth,lift=spaces.lift,u=s.wear,approach=$('maskApproach'),overlay=$('maskOverlay'),fusion=s.fusion,blurMax=H*.014;
  style(overlay,overlayStyle,'opacity',String(s.rim));style(overlay,overlayStyle,'transform',`rotate(${(-s.dir*s.pull*2).toFixed(3)}deg)`);style(overlay,overlayStyle,'filter',fusion>0&&fusion<1?`blur(${((1-fusion)*blurMax).toFixed(1)}px)`:'none');
  const fromTable=inside&&tableLift,smooth=NovaTerrain.smooth,shown=(fromTable?smooth(lift.handoff-.025,lift.handoff,u):smooth(0,.12,u))*(1-fusion);
  if(shown<=.001){style(approach,approachStyle,'opacity','0');style(approach,approachStyle,'filter','none');return;}
  const rim=spaces.liftScreen(camera,liftRim),contentH=Math.min(H,W*4/3),contentTop=(H-contentH)/2,top0=(1-rim[0])*H/2;
  const S0=Math.abs(rim[2]-rim[1])*W/2/(contentH*758/1024),T0=top0-H*.4-(contentTop+contentH*7/1024-H*.4)*S0;
  const p=Math.max(0,Math.min(1,(u-lift.handoff)/(1-lift.handoff))),pre=fromTable?0:(1-smooth(0,lift.handoff,u))*H*.45;
  const X0=fromTable?(rim[3]*W/2)-(33.5/768)*contentH*.75*S0:0;
  style(approach,approachStyle,'opacity',String(shown.toFixed(3)));style(approach,approachStyle,'transform',`translateX(${(X0*(1-p)).toFixed(1)}px) translateY(${(T0*(1-p)+pre).toFixed(1)}px) scale(${(S0+(3.6-S0)*Math.pow(p,1.25)).toFixed(4)}) rotate(${(-3*Math.sin(Math.PI*p)*s.dir).toFixed(3)}deg)`);
  style(approach,approachStyle,'filter',`brightness(${(.82-.1*p).toFixed(3)}) sepia(${(.28-.18*p).toFixed(3)}) blur(${(blurMax*.45*p*p).toFixed(1)}px)`);
 }
 // Place v23's outdoor machine once around the current eye, and re-anchor it
 // when changing worlds. It never becomes part of the room's static geometry.
 function placeMachine(world,camera,s){
  const g=spaces.apparatus.group;
  if(inside){if(g.parent!==spaces.apartment)spaces.apartment.add(g);machineRig.parent?.remove(machineRig);rigWorld=null;return;}
  if(!s.active||!(s.machine>0)){machineRig.parent?.remove(machineRig);rigWorld=null;return;}
  if(rigWorld===world)return;
  rigWorld=world;const yaw=camera.rotation.y,k=1.5;machineRig.scale.setScalar(k);
  machineRig.position.set(camera.position.x-1.7*k*Math.sin(yaw),camera.position.y-1.68,camera.position.z-1.7*k*Math.cos(yaw));
  machineRig.rotation.set(0,yaw,0);world.add(machineRig);machineRig.add(g);machineRig.updateMatrixWorld(true);
 }
 function tick(dt,{playing,enabled,volume=1,hidden=false,spectator=false}){
  if(!spaces)return;
  $('maskApproach').hidden=$('maskOverlay').hidden=spectator;
  controller.setIndoor(inside);controller.tick(playing&&!hidden&&!spectator?dt:0);const s=controller.state;
  audio.setVolume(volume);audio.setEnabled(enabled);const paused=!playing||hidden||spectator;
  for(const ev of controller.drainEvents())if(!paused)audio.event(ev,s);audio.update(s,paused,dt);
  if(wasActive&&!s.active){effect.reset();machineRig.parent?.remove(machineRig);rigWorld=null;style($('maskApproach'),approachStyle,'opacity','0');style($('maskOverlay'),overlayStyle,'opacity','0');}wasActive=s.active;
 }
 function render(renderer,world,camera,dt,playing,spectator=false){
  if(!spaces||spectator||(!inside&&!controller.state.active))return false;
  const s=controller.state,source=inside?spaces.apartment:world;placeMachine(source,camera,s);spaces.update(s,camera,inside);spaces.mask.visible=spaces.mask.visible&&(!owned||(tableLift&&inside&&s.maskOn));
  const draw=()=>{
   const fog=source.fog,density=fog?.density,waterFog=source===scene?waterMaterial?.uniforms.fogDensity:null,waterDensity=waterFog?.value;
   try{
    if(!inside&&density!==undefined){fog.density=density*(1-.42*(s.curl||0));if(waterFog)waterFog.value=fog.density;}
    if(s.active){const w=renderer.getDrawingBufferSize(size).x;effect.render(renderer,source,camera,s,spaces,playing?dt:0,{indoor:inside,sharpen:Math.min(.85,.3+.32*(Math.max(1,innerWidth/w)-1))});}
    else renderer.render(source,camera);
   }finally{if(density!==undefined)fog.density=density;if(waterFog)waterFog.value=waterDensity;}
  };
  if(interference)interference.render(renderer,source,camera,0,dt,playing,visual(),draw);else draw();
  for(const ev of spaces.apparatus.drainEvents())if(playing)audio.event(ev,s);if(spaces.bau)for(const ev of spaces.bau.drainEvents())if(playing)audio.event(ev,s);overlays(s,camera);return true;
 }
 function reset(){inside=owned=inBag=tableLift=false;returnPose=suspended=null;machineRig.parent?.remove(machineRig);rigWorld=null;if(spaces){spaces.apartment.add(spaces.apparatus.group);spaces.apparatus.group.visible=false;}controller.reset();effect?.reset();audio.update(controller.state,true,0);wasActive=false;style($('maskApproach'),approachStyle,'opacity','0');style($('maskOverlay'),overlayStyle,'opacity','0');}
 return{entry,entryDoor,prepare,warmup,enter,leave,suspend,resume,abandon,target,take,toggle,move,tick,render,reset,controller,activateAudio(){audio.setEnabled(true);if(controller.state.active)audio.activate();},mute(){audio.update(controller.state,true,0);},get inside(){return inside;},get owned(){return owned;},get inBag(){return inBag;},get active(){return controller.state.active;},get on(){return controller.state.maskOn;},get control(){return controller.state.active?controller.state.control:1;},get spaces(){return spaces;},get state(){return{inside,owned,inBag,initialized:!!spaces,...controller.state};}};
}};
