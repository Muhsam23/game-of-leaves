// v107: the three figures of the entity test station (Anzugmann, Zitterer, Mundmann) on open ground:
// the biosphere backrooms (biosphere-figure.js) and the forest at night (game.js). Each figure has
// its own model. They wander, hunt on sight (over the hills: the line between both heads must clear
// the ground), give up after a while without sight, and catch at arm's length. The Zitterer moves
// in bursts with short hops and screams when a hunt begins; the hunting Anzugmann and Mundmann bring
// the aggressive white noise, the Zitterer crackles nearby (sound.js figures()).
(() => {
'use strict';
const PACE={
 mouth:{walk:1.7,chase:4.6,leap:8.5,leapRange:4.5,detect:16,lose:7,catch:.95,turn:4.5,accel:5,noise:true,name:'Der Mundmann'},
 suit:{walk:1.3,chase:3.2,detect:12,lose:7,catch:.85,turn:4.5,accel:5,noise:true,name:'Der Anzugmann'},
 flicker:{walk:3.4,chase:7.5,detect:24,lose:7,catch:.95,turn:30,accel:16,burst:true,scream:true,crackle:true,name:'Der Zitterer'}
};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function create(THREE,{scene,ground,walkable,random=Math.random,onCatch,onScream,lead=.5,area=null}={}){
 const E=window.NovaBackroomEntities,list=[];let count=0;
 function model(kind){return kind==='suit'?E.createSuitMan(THREE):kind==='flicker'?E.createFlicker(THREE):E.createMouthHead(THREE);}
 function spawn(kind,x,z,yaw=0,extra={}){
  const m=model(kind),f={id:kind+':'+(++count),kind,x,z,yaw,speed:0,walk:0,state:'roam',lost:0,wander:null,wanderT:0,arrive:0,hide:0,burst:1,burstT:0,model:m,distance:Infinity,...extra};
  m.group.name=PACE[kind].name;m.group.visible=false;scene.add(m.group);if(m.trail){m.trail.visible=false;scene.add(m.trail);}
  list.push(f);return f;
 }
 function remove(f){const i=list.indexOf(f);if(i<0)return;list.splice(i,1);scene.remove(f.model.group);if(f.model.trail)scene.remove(f.model.trail);}
 function clear(){for(const f of [...list])remove(f);}
 function show(f,on){f.model.group.visible=on&&f.hide<=0;if(f.model.trail)f.model.trail.visible=on;}
 // Sight across rolling ground: both heads 1.6 m up, the line between them above the ground.
 function sight(f,player,d){
  const K=PACE[f.kind];if(d>K.detect*(f.state==='chase'?1.5:1))return false;
  const ay=ground(f.x,f.z)+1.6,by=(player.walkY??ground(player.x,player.z))+1.6,n=Math.max(2,Math.ceil(d/2));
  for(let i=1;i<n;i++){const t=i/n,x=f.x+(player.x-f.x)*t,z=f.z+(player.z-f.z)*t;if(ground(x,z)>ay+(by-ay)*t-.2)return false;}
  return true;
 }
 function move(f,dx,dz){
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12)),x0=f.x,z0=f.z;
  for(let i=0;i<steps;i++){const x=f.x+dx/steps,z=f.z+dz/steps;if(walkable(x,z)){f.x=x;f.z=z;}else{if(walkable(x,f.z))f.x=x;else if(walkable(f.x,z))f.z=z;}}
  return Math.hypot(f.x-x0,f.z-z0);
 }
 // One figure, one frame. active: false hides it and lets it rest (other room, daytime).
 function step(f,dt,player,playing,active=true){
  if(!active){show(f,false);return;}
  if(f.arrive>0){f.arrive-=dt;show(f,false);if(f.arrive>0)return;f.state='chase';}
  const K=PACE[f.kind],d=Math.hypot(player.x-f.x,player.z-f.z),see=playing&&sight(f,player,d);f.distance=d;
  if(see){if(f.state!=='chase'&&K.scream)onScream?.(Math.max(.35,1-d/40),f.kind);f.state='chase';f.lost=0;}
  else if(f.state==='chase'){f.lost+=dt;if(f.lost>K.lose||!playing)f.state='roam';}
  let goal=null,speed=0;
  if(f.state==='chase'){goal={x:player.x,z:player.z};speed=K.leap&&see&&d<K.leapRange?K.leap:K.chase;}
  else{
   f.wanderT-=dt;
   if(!f.wander||f.wanderT<=0||Math.hypot(f.wander.x-f.x,f.wander.z-f.z)<1){
    // Some walks lead near the player, the rest anywhere around.
    const near=random()<lead,a=random()*Math.PI*2,r=near?4+random()*14:4+random()*26,cx=near?player.x:f.x,cz=near?player.z:f.z;
    let x=cx+Math.sin(a)*r,z=cz+Math.cos(a)*r;if(area){x=clamp(x,area.x0,area.x1);z=clamp(z,area.z0,area.z1);}
    f.wander={x,z};f.wanderT=8+random()*14;
   }
   goal=f.wander;speed=K.walk;
  }
  if(K.burst){f.burstT-=dt;if(f.burstT<=0){f.burst=[.05,.4,1.1,1.7,2.4][Math.floor(random()*5)];f.burstT=.05+random()*.2;}speed*=f.burst;}
  let want=0;
  if(goal){const dx=goal.x-f.x,dz=goal.z-f.z;if(Math.hypot(dx,dz)>.05){const diff=wrap(Math.atan2(dx,dz)-f.yaw);f.yaw=wrap(f.yaw+clamp(diff,-K.turn*dt,K.turn*dt));want=speed*Math.max(0,Math.cos(diff));}}
  f.speed+=(want-f.speed)*(1-Math.exp(-dt*K.accel));
  const moved=move(f,Math.sin(f.yaw)*f.speed*dt,Math.cos(f.yaw)*f.speed*dt);f.walk+=moved;
  if(K.burst&&f.state==='chase'&&see&&d>6&&random()<dt*.7){const hop=2+random()*1.6;f.walk+=move(f,Math.sin(f.yaw)*hop,Math.cos(f.yaw)*hop);f.hide=.06+random()*.1;}
  f.hide-=dt;
  if(f.state!=='chase'&&want>.5&&moved<want*dt*.2)f.wanderT=0; // walked into something: pick a new goal
  if(playing&&f.state==='chase'&&see&&d<K.catch)onCatch?.(f.kind,f);
  const g=f.model.group;g.position.set(f.x,ground(f.x,f.z)+.005,f.z);if(f.kind!=='flicker')g.rotation.y=f.yaw;show(f,true);
  const eye={x:player.x,y:(player.walkY??0)+1.68,z:player.z};
  f.model.update(dt,{speed:f.speed,walk:f.walk,camera:{position:eye},calm:f.state!=='chase',lookAt:eye,mouth:clamp(1.15-d/9,.15,1)});
 }
 // Noise: a hunting Anzugmann or Mundmann; crackle: a Zitterer within 14 m.
 function sound(only=null){let noise=0,crackle=0;
  for(const f of list){if(only&&!only(f))continue;if(f.arrive>0)continue;const K=PACE[f.kind];
   if(K.noise&&f.state==='chase')noise=Math.max(noise,.35+.65*(1-Math.min(1,f.distance/22)));
   if(K.crackle)crackle=Math.max(crackle,1-Math.min(1,f.distance/14));}
  return{noise,crackle};
 }
 return{spawn,remove,clear,step,sound,get list(){return list;}};
}
window.NovaOpenFigures={create,PACE};
})();
