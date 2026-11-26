// Independent 10% rolls for an adjacent passage and the interior of each new room.
// Never reroll on frames or revisits; keep at most one physical Vermesser active.
(() => {
'use strict';
function createMaze(THREE,travel,scene,skin,random=Math.random){
 const B=window.NovaBackrooms,C=window.NovaFactory,visited=new Set(),model=window.NovaVermesser.createModel(THREE,skin);
 const v={...model,brain:window.NovaFlyBrain.create(0x4d415a45),x:0,z:0,yaw:0,speed:0,angularVelocity:0,walk:0,brainOut:null,encounter:{phase:'roam',fx:0}};
 const controller=window.NovaVermesser.createController(v.brain,0x4d415a45);scene.add(v.group);v.group.visible=false;
 let active=false,revision=-1,rolls=0,spawns=0,roomRolls=0,roomSpawns=0,spawnZone=null;
 const blocked=(x,z)=>travel.entityBlocked(x,z);
 function lineOfSight(player){const d=Math.hypot(player.x-v.x,player.z-v.z),n=Math.ceil(d/.4);for(let i=1;i<=n;i++)if(blocked(v.x+(player.x-v.x)*i/n,v.z+(player.z-v.z)*i/n))return false;return true;}
 function reset(){active=false;revision=-1;rolls=spawns=roomRolls=roomSpawns=0;spawnZone=null;visited.clear();controller.reset();v.group.visible=false;v.encounter={phase:'roam',fx:0};}
 function visit(player){
  if(!travel.active){active=false;v.group.visible=false;return;}
  if(revision===travel.revision)return;revision=travel.revision;
  const path=travel.preview(),key=travel.level+':'+travel.snapshot().upperSeed+':'+path.join('/');if(visited.has(key))return;visited.add(key);rolls++;
  const rolled=random()<.10,roomEligible=travel.current.depth>0&&travel.current.kind!==0;
  if(roomEligible)roomRolls++;
  const roomRolled=roomEligible&&random()<.10;if(active||(!rolled&&!roomRolled))return;
  const roomCandidates=[];
  if(roomRolled){const s=travel.current;for(const fx of [-.7,-.35,0,.35,.7])for(const fz of [-.7,-.35,0,.35,.7]){const p={x:B.origin.x+s.rx*fx,z:B.origin.z+s.rz*fz};if(!blocked(p.x,p.z)&&Math.hypot(p.x-player.x,p.z-player.z)>6)roomCandidates.push(p);}}
  const corridorCandidates=travel.current.ports.filter(p=>B.neighbour(path,p)!==null).map(p=>({x:B.origin.x+B.dirs[p][0]*(travel.current.half+6),z:B.origin.z+B.dirs[p][1]*(travel.current.half+6)})).filter(p=>!blocked(p.x,p.z)&&Math.hypot(p.x-player.x,p.z-player.z)>10);
  const useRoom=roomCandidates.length>0,candidates=useRoom?roomCandidates:rolled?corridorCandidates:[];
  if(!candidates.length)return;spawnZone=useRoom?'room':'corridor';if(useRoom)roomSpawns++;const p=candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))];
  Object.assign(v,p,{yaw:Math.atan2(p.x-player.x,p.z-player.z),speed:0,angularVelocity:0,walk:0});v.brain.reset(v.yaw);controller.reset();v.encounter={phase:'roam',fx:0};active=true;spawns++;v.group.visible=true;
 }
 function transition(before,player,wasActive){
  if(wasActive&&travel.active&&active){v.x+=player.x-before.x;v.z+=player.z-before.z;if(blocked(v.x,v.z)){active=false;v.group.visible=false;}}
  visit(player);
 }
 function sense(angle){let value=0;for(const [d,w]of [[1.15,.45],[3.1,1]])if(blocked(v.x-Math.sin(v.yaw+angle)*d,v.z-Math.cos(v.yaw+angle)*d))value=w;return value;}
 function update(dt,player,playing,flashlight=null){
  visit(player);if(!active||!travel.active){v.group.visible=false;return null;}
  if(playing){const rel=Math.atan2(Math.sin(Math.atan2(v.x-player.x,v.z-player.z)-v.yaw),Math.cos(Math.atan2(v.x-player.x,v.z-player.z)-v.yaw));
   v.encounter=controller.update(v,dt,{player,blocked,flashlight,ground:C.floor+travel.rise,lineOfSight:()=>lineOfSight(player),brainInput:{x:v.x,z:v.z,yaw:v.yaw,angularVelocity:v.angularVelocity,playerX:player.x,playerZ:player.z,playerSideLeft:rel<0?1:0,playerSideRight:rel>=0?1:0,obstacleFront:sense(0),obstacleLeft:sense(-.55),obstacleRight:sense(.55)}});
  }
  v.group.position.set(v.x,C.floor,v.z);v.group.rotation.y=v.yaw;v.pose(v.walk,v.speed,v.encounter.phase,v.encounter.time||0);return v.encounter;
 }
 return{entity:v,reset,transition,update,lineOfSight,get active(){return active&&travel.active;},get state(){return{active:active&&travel.active,rolls,spawns,roomRolls,roomSpawns,spawnZone,visited:visited.size,x:v.x,z:v.z,encounter:v.encounter};}};
}
window.NovaEncounters={createMaze};
})();
