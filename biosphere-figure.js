// v105: the Mundmann (the "Maulkopf" of the entity test station) in the biosphere backrooms.
// He appears at most once per game. Each newly entered room rolls for him, the more likely the
// deeper the room lies (rooms away from the entrance, counted along the grid): 6 % one room in,
// 14 % two, 38 % five, at most 60 %. He stays in his room; only while hunting does he follow the
// player through a passage. His hunt brings an aggressive white noise (sound.js figures()).
(() => {
'use strict';
const PACE={walk:1.7,chase:4.6,leap:8.5,leapRange:4.5,detect:16,keep:24,lose:7,catch:.95,radius:.3};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function chance(depth){return depth?Math.min(.6,.06+.08*(depth-1)):0;}
function create(THREE,{biosphere,random=Math.random,onCatch}={}){
 const W=window.BiosWorld,model=window.NovaBackroomEntities.createMouthHead(THREE);
 model.group.name='Der Mundmann';model.group.visible=false;biosphere.scene.add(model.group);
 let figure=null,spawned=false,lastRoom=null,lastPlayer=null;
 const key=z=>z?z.cx+','+z.cz:null,depthOf=z=>Math.abs(z.cx)+Math.abs(z.cz);
 const ground=(x,z)=>{const zone=biosphere.current;return zone?W.height(x,z,zone):0;};
 const walkable=(x,z)=>biosphere.canWalk(x,z);
 // Sight across the rolling ground: the line between both heads must clear the hills.
 function sight(player,d){
  if(d>PACE.detect*(figure.state==='chase'?1.5:1))return false;
  const ay=ground(figure.x,figure.z)+1.6,by=(player.walkY??ground(player.x,player.z))+1.6,n=Math.max(2,Math.ceil(d/2));
  for(let i=1;i<n;i++){const t=i/n,x=figure.x+(player.x-figure.x)*t,z=figure.z+(player.z-figure.z)*t;if(ground(x,z)>ay+(by-ay)*t-.2)return false;}
  return true;
 }
 function spawnPoint(zone,player){
  const small=Math.min(zone.w,zone.d)<24;
  for(let i=0;i<80;i++){
   const a=random()*Math.PI*2,d=(small?6:18)+random()*(small?8:40),x=clamp(player.x+Math.sin(a)*d,-zone.w/2+2,zone.w/2-2),z=clamp(player.z+Math.cos(a)*d,-zone.d/2+2,zone.d/2-2);
   if(Math.hypot(x-player.x,z-player.z)<(small?5:14)||!walkable(x,z))continue;
   return{x,z,yaw:Math.atan2(player.x-x,player.z-z)};
  }
  return null;
 }
 function enterRoom(zone,player,from){
  const k=key(zone);
  // Hunting: he comes through the same passage a few seconds later.
  if(figure&&from&&figure.room===from&&figure.state==='chase'){
   const d=lastPlayer?Math.hypot(figure.x-lastPlayer.x,figure.z-lastPlayer.z):10;
   Object.assign(figure,{room:k,arrive:clamp(1.5+d/PACE.chase,1.5,7),x:player.x,z:player.z,speed:0,lost:0,wander:null});return;
  }
  if(spawned||random()>=chance(depthOf(zone)))return;
  const p=spawnPoint(zone,player);if(!p)return;
  spawned=true;figure={room:k,x:p.x,z:p.z,yaw:p.yaw,speed:0,walk:0,state:'roam',lost:0,wander:null,wanderT:0,arrive:0};
 }
 function move(dx,dz){
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12)),x0=figure.x,z0=figure.z;
  for(let i=0;i<steps;i++){const x=figure.x+dx/steps,z=figure.z+dz/steps;if(walkable(x,z)){figure.x=x;figure.z=z;}else{if(walkable(x,figure.z))figure.x=x;else if(walkable(figure.x,z))figure.z=z;}}
  return Math.hypot(figure.x-x0,figure.z-z0);
 }
 function hide(){model.group.visible=false;}
 function update(dt,player,playing){
  dt=clamp(dt,0,.05);const zone=biosphere.active?biosphere.current:null;
  if(!zone){hide();return;}
  const k=key(zone);if(k!==lastRoom){const from=lastRoom;lastRoom=k;enterRoom(zone,player,from);}
  lastPlayer={x:player.x,z:player.z};
  if(!figure||figure.room!==k){hide();return;}
  if(figure.arrive>0){figure.arrive-=dt;hide();if(figure.arrive>0)return;figure.state='chase';}
  const d=Math.hypot(player.x-figure.x,player.z-figure.z),see=playing&&sight(player,d);
  if(see){figure.state='chase';figure.lost=0;}
  else if(figure.state==='chase'){figure.lost+=dt;if(figure.lost>PACE.lose||!playing)figure.state='roam';}
  let goal=null,speed=0;
  if(figure.state==='chase'){goal={x:player.x,z:player.z};speed=see&&d<PACE.leapRange?PACE.leap:PACE.chase;}
  else{
   figure.wanderT-=dt;
   if(!figure.wander||figure.wanderT<=0||Math.hypot(figure.wander.x-figure.x,figure.wander.z-figure.z)<1){
    // Half of his walks lead somewhere near the player, so even the 768 m rooms are not safe.
    const lead=random()<.5,a=random()*Math.PI*2,r=lead?4+random()*14:4+random()*26,cx=lead?player.x:figure.x,cz=lead?player.z:figure.z;
    figure.wander={x:clamp(cx+Math.sin(a)*r,-zone.w/2+2,zone.w/2-2),z:clamp(cz+Math.cos(a)*r,-zone.d/2+2,zone.d/2-2)};figure.wanderT=8+random()*14;
   }
   goal=figure.wander;speed=PACE.walk;
  }
  let want=0;
  if(goal){const dx=goal.x-figure.x,dz=goal.z-figure.z;if(Math.hypot(dx,dz)>.05){const diff=wrap(Math.atan2(dx,dz)-figure.yaw);figure.yaw=wrap(figure.yaw+clamp(diff,-4.5*dt,4.5*dt));want=speed*Math.max(0,Math.cos(diff));}}
  figure.speed+=(want-figure.speed)*(1-Math.exp(-dt*5));
  const moved=move(Math.sin(figure.yaw)*figure.speed*dt,Math.cos(figure.yaw)*figure.speed*dt);figure.walk+=moved;
  if(figure.state!=='chase'&&want>.5&&moved<want*dt*.2)figure.wanderT=0; // walked into something: pick a new goal
  if(playing&&figure.state==='chase'&&see&&d<PACE.catch){onCatch?.();}
  const g=model.group;g.visible=true;g.position.set(figure.x,ground(figure.x,figure.z)+.005,figure.z);g.rotation.y=figure.yaw;
  model.update(dt,{speed:figure.speed,walk:figure.walk,mouth:clamp(1.15-d/9,.15,1)});
  figure.distance=d;
 }
 // Loudness of his white noise: only while he hunts in the player's room.
 function noise(){
  if(!figure||!biosphere.active||figure.room!==key(biosphere.current)||figure.arrive>0||figure.state!=='chase')return 0;
  return .35+.65*(1-Math.min(1,(figure.distance??30)/22));
 }
 function reset(){figure=null;spawned=false;lastRoom=null;lastPlayer=null;hide();}
 return{update,noise,reset,model,chance,
  debugSpawn(player){const zone=biosphere.current;if(!zone)return false;const p=spawnPoint(zone,player);if(!p)return false;spawned=true;lastRoom=key(zone);figure={room:key(zone),x:p.x,z:p.z,yaw:p.yaw,speed:0,walk:0,state:'roam',lost:0,wander:null,wanderT:0,arrive:0};return true;},
  get state(){return{spawned,room:lastRoom,figure:figure?{room:figure.room,x:figure.x,z:figure.z,state:figure.state,arrive:figure.arrive,distance:figure.distance}:null};}};
}
window.NovaBiosphereFigure={create,chance,PACE};
})();
