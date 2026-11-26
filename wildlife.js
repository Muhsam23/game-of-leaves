// Deer, bear, fox and five independent hares. Original photo-textured studies, driven by the same
// heading-ring / obstacle sensors as the Vermesser, with herd and flight steering.
(() => {
'use strict';
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function create(THREE,scene,textures,environment){
 const {blocked,ground,habitat}=environment,T=window.NovaTerrain,random=T.rng(0x57494c44),animals=[];
 const kinds=['deer','deer','deer','bear','fox'];let time=0,herdAlert=0;
 const radii={deer:.35,bear:.65,fox:.25},pace={deer:3.6,bear:3,fox:4.1},escape={deer:7.8,bear:7,fox:8.5};
 radii.hare=.23;
 function solid(kind,x,z){const r=radii[kind];return !habitat(x,z)||[[0,0],[r,0],[-r,0],[0,r],[0,-r]].some(([dx,dz])=>blocked(x+dx,z+dz));}
 function safe(kind,x,z){for(let radius=0;radius<85;radius+=2)for(let i=0;i<24;i++){const a=i*Math.PI/12,px=x+Math.sin(a)*radius,pz=z+Math.cos(a)*radius;if(!solid(kind,px,pz))return{x:px,z:pz};}throw Error('No forest position for '+kind);}
 for(const [i,kind] of kinds.entries()){
  const model=window.Wildlife.createAnimal(kind,textures[kind]);scene.add(model.group);
  animals.push({id:kind+'-'+i,kind,model,brain:window.NovaFlyBrain.create(0x57494c44+i*271),x:0,z:0,yaw:0,speed:0,angularVelocity:0,phase:0,flee:0,state:'roam',sees:false,sense:0,walked:0,blockedFrames:0});
 }
 const residents=[...animals],hares=window.NovaHares.create(THREE,scene,textures.hare,{ground,blocked:(x,z)=>solid('hare',x,z),occluded:blocked,within:habitat,boundaryRadius:Infinity,homes:[[-280,157],[-38,187],[70,338],[215,345],[-292,393]].map(([x,z])=>safe('hare',x,z))});
 animals.push(...hares.animals);
 function reset(){time=herdAlert=0;const x=T.pathX(150)-22,z=178;
  for(const [i,a]of residents.entries()){
   const p=safe(a.kind,i<3?x+(i-1)*4:i===3?-115:110,i<3?z+i*3:i===3?325:365);
   Object.assign(a,p,{yaw:random()*Math.PI*2,speed:0,angularVelocity:0,phase:i*.7,flee:0,alive:true,consumed:0,state:'roam',threat:null,sees:false,sense:0,walked:0,blockedFrames:0});a.model.group.visible=true;a.model.group.scale.setScalar(1);a.model.group.rotation.set(0,0,0);a.brain.reset(a.yaw);pose(a,0);
  }hares.reset();
 }
 function sense(a,angle){let value=0;for(const [d,w]of [[1,.5],[2.8,1]])if(solid(a.kind,a.x-Math.sin(a.yaw+angle)*d,a.z-Math.cos(a.yaw+angle)*d))value=w;return value;}
 function seesPlayer(a,player){
  const dx=player.x-a.x,dz=player.z-a.z,d=Math.hypot(dx,dz),angle=wrap(Math.atan2(-dx,-dz)-a.yaw);
  if(d>42||d>4&&Math.abs(angle)>(a.kind==='deer'?2.25:1.85))return false;
  const eye=ground(a.x,a.z)+(a.kind==='bear'?.95:a.kind==='deer'?1:.4),target=player.walkY+1.45,n=Math.ceil(d/.7);
  for(let i=1;i<n;i++){const t=i/n,x=a.x+dx*t,z=a.z+dz*t;if(blocked(x,z)||ground(x,z)>eye+(target-eye)*t)return false;}return true;
 }
 // A nearby hunter can be heard from behind. Longer-range detection uses
 // an unobstructed sightline, without the player's narrow forward cone.
 function noticesPredator(a,p){
  const dx=p.x-a.x,dz=p.z-a.z,d=Math.hypot(dx,dz);if(d<14)return true;if(d>24)return false;
  const eye=ground(a.x,a.z)+(a.kind==='deer'?1:a.kind==='bear'?.95:.4),target=ground(p.x,p.z)+1.6,n=Math.ceil(d/.7);
  for(let i=1;i<n;i++){const t=i/n,x=a.x+dx*t,z=a.z+dz*t;if(blocked(x,z)||ground(x,z)>eye+(target-eye)*t)return false;}return true;
 }
 function pose(a,dt){
  const moving=Math.abs(a.speed)>.07,run=a.state==='flee';
  a.phase+=moving?dt*Math.min(3.6,Math.abs(a.speed)/a.model.info.speed):dt*.35;
  window.Wildlife.animate(a.model,a.phase,moving?(run?'run':'walk'):'idle');
  a.model.group.position.set(a.x,ground(a.x,a.z),a.z);
  // The study faces +X; locomotion uses -Z, just like the entity.
  a.model.group.rotation.y=a.yaw+Math.PI/2;
 }
 function update(dt,player,active,ignorePlayer=false,predator=null){
  if(!active)return;dt=Math.max(0,Math.min(.05,dt));time+=dt;herdAlert=Math.max(0,herdAlert-dt);
  const predators=(Array.isArray(predator)?predator:[predator]).filter(p=>p?.active);
  let herdThreat=null;
  for(const a of residents){if(!a.alive)continue;a.sense-=dt;if(ignorePlayer)a.sees=false;if(a.sense<=0){a.sense=.12;a.sees=!ignorePlayer&&seesPlayer(a,player);const hunter=predators.filter(p=>noticesPredator(a,p)).sort((p,q)=>Math.hypot(p.x-a.x,p.z-a.z)-Math.hypot(q.x-a.x,q.z-a.z))[0];if(a.sees||hunter){a.flee=8;const t=hunter||player;a.threat={x:t.x,z:t.z,kind:hunter?'predator':'player'};if(a.kind==='deer'){herdAlert=8;if(!herdThreat||hunter)herdThreat={...a.threat};}}}}
  if(herdThreat)for(const a of residents)if(a.kind==='deer'&&a.alive){a.threat={...herdThreat};a.flee=8;}
  const deer=animals.slice(0,3).filter(a=>a.alive),center={x:deer.reduce((n,a)=>n+a.x,0)/Math.max(1,deer.length),z:deer.reduce((n,a)=>n+a.z,0)/Math.max(1,deer.length)};
  for(const a of residents){
   if(!a.alive)continue;
   a.flee=Math.max(0,a.flee-dt);if(a.kind==='deer'&&herdAlert>0)a.flee=Math.max(a.flee,herdAlert);
   const front=sense(a,0),left=sense(a,-.65),right=sense(a,.65);
   const out=a.brain.update(dt,{x:a.x,z:a.z,yaw:a.yaw,angularVelocity:a.angularVelocity,ignorePlayer:true,playerSideLeft:0,playerSideRight:0,obstacleFront:front,obstacleLeft:left,obstacleRight:right});
   let turn=out.turn,wanted=out.forward*pace[a.kind];a.state=a.flee>0?'flee':'roam';
   let tx=0,tz=0,weight=0;
   if(a.flee>0){const threat=a.threat||player,d=Math.max(.1,Math.hypot(a.x-threat.x,a.z-threat.z));tx=(a.x-threat.x)/d;tz=(a.z-threat.z)/d;weight=1;wanted=escape[a.kind];}
   if(a.kind==='deer'){
    const d=Math.hypot(center.x-a.x,center.z-a.z),cohesion=a.flee>0?0:Math.max(0,(d-5)/10);
    if(d>.01){tx+=(center.x-a.x)/d*cohesion;tz+=(center.z-a.z)/d*cohesion;weight=Math.max(weight,Math.min(1,cohesion));}
    for(const b of deer)if(b!==a){const dx=a.x-b.x,dz=a.z-b.z,dist=Math.hypot(dx,dz);if(dist<2.8&&dist>.001){tx+=dx/dist*(2.8-dist);tz+=dz/dist*(2.8-dist);weight=Math.max(weight,.7);}}
    if(d>12&&a.flee<=0)wanted=3.5;
   }
   if(weight>0&&Math.hypot(tx,tz)>.001){const delta=wrap(Math.atan2(-tx,-tz)-a.yaw);turn=turn*(1-weight)+T.clamp(delta*3,-2.8,2.8)*weight;wanted*=Math.max(.15,Math.cos(delta));}
   if(front>.4){turn+=(left>right?1:-1)*2.6;wanted=Math.min(wanted,.6);}
   const oldYaw=a.yaw;a.yaw=wrap(a.yaw+turn*dt);a.angularVelocity=wrap(a.yaw-oldYaw)/Math.max(dt,.001);a.speed+=(wanted-a.speed)*(1-Math.exp(-dt*4));
   const dx=-Math.sin(a.yaw)*a.speed*dt,dz=-Math.cos(a.yaw)*a.speed*dt,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.10));let moved=0;
   for(let i=0;i<steps;i++){const x=a.x+dx/steps,z=a.z+dz/steps;if(!solid(a.kind,x,z)){moved+=Math.hypot(x-a.x,z-a.z);a.x=x;a.z=z;}else{a.speed=0;break;}}
   a.walked+=moved;pose(a,dt);
  }
  hares.update(dt,player,{ignorePlayer,predators:predators.map(p=>({...p,kind:'kopffuessler'}))});
 }
 function capture(id){if(hares.animals.some(a=>a.id===id))return hares.capture(id);const a=animals.find(a=>a.id===id&&a.alive);if(!a)return null;a.alive=false;a.speed=0;a.flee=0;a.state='caught';a.consumed=0;pose(a,0);a.model.group.rotation.z=Math.PI/2;a.model.group.position.y=ground(a.x,a.z)+(a.kind==='bear'?.5:a.kind==='deer'?.4:.18);return a;}
 function consume(id,progress){if(hares.animals.some(a=>a.id===id))return hares.consume(id,progress);const a=animals.find(a=>a.id===id);if(!a||a.alive)return false;a.consumed=Math.max(a.consumed,Math.min(1,progress));a.state=a.consumed>=1?'eaten':'being-eaten';a.model.group.scale.setScalar(1-a.consumed*.78);a.model.group.visible=a.consumed<1;return true;}
 reset();return{animals,update,reset,seesPlayer,capture,consume,get state(){return animals.map(a=>({id:a.id,kind:a.kind,x:a.x,z:a.z,yaw:a.yaw,alive:a.alive,consumed:a.consumed,state:a.state,speed:a.speed,walked:a.walked,seesPlayer:a.sees}));}};
}
window.NovaWildlife={create};
})();
