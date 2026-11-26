(() => {
'use strict';
function create(THREE,scene,settlements,karinTexture,environment={}){
 const apt=settlements.apartments,room1=apt.find(a=>a.number===1),room7=apt.find(a=>a.number===7),core=settlements.cores[1];
 const bottle={kind:'vodka',x:room1.x+1.6,z:room1.z+2.1,y:room1.y,shots:0};
 const binocular={kind:'binocular',x:room7.x-1.1,z:room7.z+1.75,y:room7.y,owned:false,zoom:false};
 const glass=new THREE.MeshPhongMaterial({color:0x879a87,transparent:true,opacity:.72,shininess:70}),brown=new THREE.MeshLambertMaterial({color:0x554737}),metal=new THREE.MeshLambertMaterial({color:0x585d54}),lens=new THREE.MeshBasicMaterial({color:0x151f1d});
 const bottleRoot=new THREE.Group();bottleRoot.position.set(bottle.x,bottle.y,bottle.z);scene.add(bottleRoot);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(.095,.105,.32,9),glass);base.position.y=.18;bottleRoot.add(base);
 const neck=new THREE.Mesh(new THREE.CylinderGeometry(.033,.042,.12,8),glass);neck.position.y=.4;bottleRoot.add(neck);
 const cap=new THREE.Mesh(new THREE.CylinderGeometry(.039,.039,.05,8),metal);cap.position.y=.48;bottleRoot.add(cap);
 const label=new THREE.Mesh(new THREE.BoxGeometry(.18,.12,.012),new THREE.MeshLambertMaterial({color:0xb3a987}));label.position.set(0,.2,.10);bottleRoot.add(label);
 const binoRoot=new THREE.Group();binoRoot.position.set(binocular.x,binocular.y+.1,binocular.z);binoRoot.rotation.set(.18,.7,.05);scene.add(binoRoot);
 for(const side of [-1,1]){const tube=new THREE.Mesh(new THREE.CylinderGeometry(.055,.069,.35,9),metal);tube.rotation.x=Math.PI/2;tube.position.x=side*.09;binoRoot.add(tube);
  const eyepiece=new THREE.Mesh(new THREE.CylinderGeometry(.057,.057,.017,9),lens);eyepiece.rotation.x=Math.PI/2;eyepiece.position.set(side*.09,0,.18);binoRoot.add(eyepiece);}
 const bridge=new THREE.Mesh(new THREE.BoxGeometry(.19,.07,.1),brown);binoRoot.add(bridge);
 const karin=(window.NovaKarinModelClassic||window.NovaKarinModel).create(karinTexture);scene.add(karin.group);
 const ground=environment.ground||window.NovaTerrain.height,obstacle=environment.blocked||(()=>false),home=settlements.housing;
 const random=window.NovaTerrain.rng(0x4b415249),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
 const navigator=window.NovaVermesser.createController(null);
 const actor={x:home.x-34,z:home.z-17,yaw:Math.PI,walked:0,mode:'idle',gathered:0};
 let route=[],goal=null,pendingGather=null,rest=0,stepTime=0,searchDelay=0;const visited=new Set();
 function solid(x,z){
  if(Math.hypot(x-home.x,z-home.z)>125||Math.abs(x-home.x)<56.5&&Math.abs(z-home.z)<10.6||ground(x,z)<.2)return true;
  const h=ground(x,z);return [[0,0],[.34,0],[-.34,0],[0,.34],[0,-.34]].some(([dx,dz])=>obstacle(x+dx,z+dz)||Math.abs(ground(x+dx,z+dz)-h)>.24);
 }
 function pose(mode){(window.NovaKarinModelClassic||window.NovaKarinModel).animate(karin,mode==='walk'?stepTime:time,mode);karin.group.position.set(actor.x,ground(actor.x,actor.z)+.005,actor.z);karin.group.rotation.y=actor.yaw;actor.mode=mode;}
 function resetKarin(){
  let spawn=null;for(let r=0;r<22&&!spawn;r+=1)for(let i=0;i<20;i++){const a=i*Math.PI/10,x=home.x-34+Math.sin(a)*r,z=home.z-17+Math.cos(a)*r;if(!solid(x,z)){spawn={x,z};break;}}
  if(!spawn)throw Error('No safe starting point for Karin in front of the apartments.');
  Object.assign(actor,spawn,{yaw:Math.PI,walked:0,mode:'idle',gathered:0});route=[];goal=null;pendingGather=null;rest=4;stepTime=searchDelay=0;visited.clear();pose('idle');
 }
 function chooseGoal(){
  const mushrooms=(environment.mushrooms||[]).filter(m=>m.kind==='mushroom'&&!visited.has(m.uid)&&(environment.isAvailable?.(m)??true)&&Math.hypot(m.x-home.x,m.z-home.z)<120&&Math.hypot(m.x-actor.x,m.z-actor.z)<65&&!solid(m.x,m.z)).sort((a,b)=>Math.hypot(a.x-actor.x,a.z-actor.z)-Math.hypot(b.x-actor.x,b.z-actor.z));
  const candidates=mushrooms.slice(0,8);
  for(let i=0;i<8;i++){const a=random()*Math.PI*2,d=8+random()*19,x=actor.x+Math.sin(a)*d,z=actor.z+Math.cos(a)*d;if(!solid(x,z))candidates.push({x,z});}
  for(const p of candidates){const path=navigator.findRoute(actor,p,solid);if(path.length){goal=p;route=path;return;}}
  goal=null;searchDelay=3;
 }
 const generator=new window.NovaKarinMarkov.WaldegraveMarkov(window.NovaKarinCorpus,0x4b415249);let near=false,dialogue=false,time=0;
 const speech=document.createElement('div');speech.id='karinSpeech';speech.hidden=true;speech.innerHTML='<p></p><small>E · weiter &nbsp; Esc · schließen</small>';document.body.appendChild(speech);
 function reset(){bottle.shots=0;binocular.owned=false;binocular.zoom=false;bottleRoot.visible=binoRoot.visible=true;dialogue=false;speech.hidden=true;near=false;resetKarin();}
 let lastText='';
 function close(){dialogue=false;speech.hidden=true;}
 function target(eye,look,player){let selected=null,best=100;
  for(const obj of [bottle,binocular]){if(obj.kind==='vodka'&&obj.shots>=10||obj.kind==='binocular'&&obj.owned)continue;
   const v=new THREE.Vector3(obj.x-eye.x,obj.y+.25-eye.y,obj.z-eye.z),d=v.length();if(d>3||Math.abs(player.walkY-obj.y)>1.4||v.dot(look)/d<.79)continue;if(d<best){best=d;selected=obj;}}
  const pos=karin.group.position,v=pos.clone().add(new THREE.Vector3(0,1.05,0)).sub(eye),d=v.length();
  if(d<4&&v.dot(look)/d>.73&&d<best)selected={kind:'karin',id:'karin',x:pos.x,z:pos.z};
  return selected;
 }
 function interact(obj,notice){if(obj.kind==='vodka'){if(obj.shots>=10)return;obj.shots++;notice('Der Wodka brennt im Hals.');if(obj.shots===10)bottleRoot.visible=false;return obj.shots===10?'spawn':null;}
  if(obj.kind==='binocular'){obj.owned=true;binoRoot.visible=false;notice('Ein altes Fernglas. Mit 1 ans Auge halten.');return'collected';}
  if(obj.kind==='karin'){dialogue=true;speech.hidden=false;const output=generator.reply();lastText=output.sentences.join(' ');speech.querySelector('p').textContent=lastText;return'dialogue';}
 }
 function update(dt,player,playing,ignorePlayer=false){
  const p=karin.group.position,d=Math.hypot(player.x-actor.x,player.z-actor.z),vertical=Math.abs(player.walkY-ground(actor.x,actor.z));near=!ignorePlayer&&d<4&&vertical<2.2;
  if(dialogue&&(d>6||vertical>3))close();
  if(!playing){pose(dialogue?'talk':'idle');return;}
  dt=Math.max(0,Math.min(dt,.05));time+=dt;
  if(dialogue||near){const angle=Math.atan2(player.x-actor.x,player.z-actor.z);actor.yaw=wrap(actor.yaw+wrap(angle-actor.yaw)*(1-Math.exp(-dt*2.2)));pose(dialogue?'talk':'listen');return;}
  if(rest>0){rest=Math.max(0,rest-dt);if(pendingGather&&rest<=2.7){if(environment.gather?.(pendingGather))actor.gathered++;pendingGather=null;}pose(goal?.uid?'gather':'idle');return;}
  if(goal?.uid&&!(environment.isAvailable?.(goal)??true)){route=[];goal=null;}
  searchDelay-=dt;if(!route.length&&searchDelay<=0)chooseGoal();
  if(!route.length){pose('idle');return;}
  let target=route[0],distance=Math.hypot(target.x-actor.x,target.z-actor.z);
  if(distance<.20){route.shift();if(!route.length){if(goal?.uid){visited.add(goal.uid);pendingGather=goal;}rest=goal?.uid?5:1.5;pose(goal?.uid?'gather':'idle');return;}target=route[0];distance=Math.hypot(target.x-actor.x,target.z-actor.z);}
  const heading=Math.atan2(target.x-actor.x,target.z-actor.z),step=Math.min(distance,.83*dt);actor.yaw=wrap(actor.yaw+wrap(heading-actor.yaw)*(1-Math.exp(-dt*5)));
  const x=actor.x+Math.sin(heading)*step,z=actor.z+Math.cos(heading)*step;
  if(solid(x,z)){route=[];searchDelay=.5;pose('idle');return;}
  actor.x=x;actor.z=z;actor.walked+=step;stepTime+=step/.72;pose('walk');
 }
 resetKarin();
 return{bottle,binocular,karin,actor,solid,target,interact,update,reset,close,get lastText(){return lastText;},get dialogue(){return dialogue;},get roll(){return bottle.shots>=3?Math.sin(time*.8)*(bottle.shots-2)*.022:0;},get state(){return{shots:bottle.shots,binocular:binocular.owned,zoom:binocular.zoom,karinNear:near,dialogue,karinPosition:karin.group.position.toArray(),karinMode:actor.mode,karinWalked:actor.walked,karinGathered:actor.gathered,karinGoal:goal?{x:goal.x,z:goal.z,mushroom:goal.uid||null}:null};}};
}
window.NovaApartmentEvents={create};
})();
