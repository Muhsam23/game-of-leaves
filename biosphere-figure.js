// v105: the Mundmann (the "Maulkopf" of the entity test station) in the biosphere backrooms.
// Each newly entered room rolls for him, the more likely the deeper the room lies (rooms away from
// the entrance, counted along the grid). He stays in his room; only while hunting does he follow
// the player through a passage. His hunt brings an aggressive white noise (sound.js figures()).
// v107: he can come again and again (lower chance: 5 % one room in, 25 % five rooms in, at most 30 %),
// at most CAP at a time; walking and hunting live in open-figures.js.
(() => {
'use strict';
const CAP=2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function chance(depth){return depth?Math.min(.3,.05+.05*(depth-1)):0;}
function create(THREE,{biosphere,random=Math.random,onCatch}={}){
 const W=window.BiosWorld,key=z=>z?z.cx+','+z.cz:null,depthOf=z=>Math.abs(z.cx)+Math.abs(z.cz);
 const ground=(x,z)=>{const zone=biosphere.current;return zone?W.height(x,z,zone):0;};
 const crowd=window.NovaOpenFigures.create(THREE,{scene:biosphere.scene,ground,walkable:(x,z)=>biosphere.canWalk(x,z),random,onCatch:()=>onCatch?.()});
 let lastRoom=null,lastPlayer=null,spawnedCount=0;
 function spawnPoint(zone,player){
  const small=Math.min(zone.w,zone.d)<24;
  for(let i=0;i<80;i++){
   const a=random()*Math.PI*2,d=(small?6:18)+random()*(small?8:40),x=clamp(player.x+Math.sin(a)*d,-zone.w/2+2,zone.w/2-2),z=clamp(player.z+Math.cos(a)*d,-zone.d/2+2,zone.d/2-2);
   if(Math.hypot(x-player.x,z-player.z)<(small?5:14)||!biosphere.canWalk(x,z))continue;
   return{x,z,yaw:Math.atan2(player.x-x,player.z-z)};
  }
  return null;
 }
 function add(zone,player){
  const k=key(zone),mine=crowd.list;
  if(mine.length>=CAP){const old=mine.find(f=>f.room!==k);if(!old)return false;crowd.remove(old);}
  const p=spawnPoint(zone,player);if(!p)return false;
  crowd.spawn('mouth',p.x,p.z,p.yaw,{room:k});spawnedCount++;return true;
 }
 function enterRoom(zone,player,from){
  const k=key(zone);
  // Hunting: they come through the same passage a few seconds later.
  for(const f of crowd.list)if(from&&f.room===from&&f.state==='chase'){
   const d=lastPlayer?Math.hypot(f.x-lastPlayer.x,f.z-lastPlayer.z):10;
   Object.assign(f,{room:k,arrive:clamp(1.5+d/window.NovaOpenFigures.PACE.mouth.chase,1.5,7),x:player.x,z:player.z,speed:0,lost:0,wander:null});
  }
  if(random()<chance(depthOf(zone)))add(zone,player);
 }
 function update(dt,player,playing){
  dt=clamp(dt,0,.05);const zone=biosphere.active?biosphere.current:null;
  if(!zone){for(const f of crowd.list)crowd.step(f,dt,player,false,false);return;}
  const k=key(zone);if(k!==lastRoom){const from=lastRoom;lastRoom=k;enterRoom(zone,player,from);}
  lastPlayer={x:player.x,z:player.z};
  for(const f of crowd.list)crowd.step(f,dt,player,playing,f.room===k);
 }
 // Loudness of their white noise: only while one hunts in the player's room.
 function noise(){if(!biosphere.active)return 0;const k=key(biosphere.current);return crowd.sound(f=>f.room===k).noise;}
 function reset(){crowd.clear();lastRoom=null;lastPlayer=null;spawnedCount=0;}
 return{update,noise,reset,chance,crowd,
  debugSpawn(player){const zone=biosphere.current;if(!zone)return false;lastRoom=key(zone);return add(zone,player);},
  get state(){const f=crowd.list.find(q=>q.room===lastRoom)||crowd.list[0]||null;return{spawned:spawnedCount>0,count:crowd.list.length,room:lastRoom,figure:f?{room:f.room,x:f.x,z:f.z,state:f.state,arrive:f.arrive,distance:f.distance}:null};}};
}
window.NovaBiosphereFigure={create,chance,CAP};
})();
