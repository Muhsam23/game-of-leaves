// Outdoor hunting is independent of the player and of the selected debug camera.
(() => {
'use strict';
// v89: prey is perceived only within a few metres and in clear line of sight. Out of
// range the hunter wanders without a goal; a lost animal is followed to where it was
// last seen, then given up.
const PREY_SIGHT=7,PREY_KEEP=12,PREY_MEMORY=4;
function create(navigator,random){
 const state={x:0,z:0,yaw:0,speed:0,phase:'search',prey:null,eaten:0,walked:0,eatProgress:0};
 let route=[],replan=0,scan=0,target=null,targetSeen=0,targetLast=null,roam=null,roamTime=0,lost=0,lastPlayer=null,meal=null,stuck=0,side=1,detour=null,detourTime=0,progressTime=0,bestDistance=Infinity,clock=0;
 const retryAfter=new Map();
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 function clear(a,b,blocked){const n=Math.max(1,Math.ceil(distance(a,b)/.18));for(let i=1;i<=n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true;}
 function reset(p){Object.assign(state,{...p,speed:0,phase:'search',prey:null,eaten:0,walked:0,eatProgress:0});route=[];replan=scan=roamTime=lost=stuck=detourTime=progressTime=clock=targetSeen=0;bestDistance=Infinity;target=targetLast=roam=lastPlayer=meal=detour=null;retryAfter.clear();side=random()<.5?-1:1;}
 function update(dt,player,{blocked,ground,wildlife,ignorePlayer=false,onCatch}){
  dt=Math.min(.1,Math.max(0,dt));if(!dt)return state;clock+=dt;
  const near=!ignorePlayer&&distance(state,player)<=4&&Math.abs((player.walkY||0)-ground(state.x,state.z))<1.5&&clear(state,player,blocked);
  if(near){lastPlayer={x:player.x,z:player.z};lost=0;}else lost+=dt;
  const chase=!ignorePlayer&&!!lastPlayer&&lost<3;
  if(!chase)lastPlayer=null;
  state.prey=meal?.id||target?.id||null;
  if(meal&&!chase&&distance(state,meal)<1.4){
   state.phase='eat';state.speed=0;state.eatProgress=Math.min(1,state.eatProgress+dt/14);
   wildlife?.consume(meal.id,state.eatProgress);
   if(state.eatProgress<1)return state;
   state.eaten++;meal=target=null;state.prey=null;scan=0;state.phase='search';bestDistance=Infinity;progressTime=0;
  }
  scan-=dt;roamTime-=dt;replan-=dt;
  if(scan<=0||target&&!target.alive){
   scan=.3;const living=wildlife?.animals.filter(a=>a.alive!==false&&(retryAfter.get(a.id)||0)<=clock)||[];
   const visible=(a,range)=>distance(state,a)<=range&&clear(state,a,blocked);
   if(target&&(!living.includes(target)||!target.alive))target=targetLast=null;
   if(target&&visible(target,PREY_KEEP)){targetSeen=clock;targetLast={x:target.x,z:target.z};}
   else if(target&&(clock-targetSeen>PREY_MEMORY||targetLast&&distance(state,targetLast)<1)){target=targetLast=null;route=[];replan=0;roamTime=0;}
   // Hold a moving target instead of oscillating between nearby animals.
   if(!target){
    const nearest=living.filter(a=>visible(a,PREY_SIGHT)).reduce((best,a)=>!best||distance(state,a)<distance(state,best)?a:best,null);
    if(nearest){target=nearest;targetSeen=clock;targetLast={x:nearest.x,z:nearest.z};route=[];replan=0;bestDistance=Infinity;progressTime=0;}
   }
  }
  const seenNow=target&&clock-targetSeen<.35;
  let goal=chase?lastPlayer:meal||(target?(seenNow?target:targetLast):null);
  if(!goal){
   if(!roam||distance(state,roam)<1||roamTime<=0){
    roam=null;roamTime=9+random()*8;
    for(let i=0;i<32;i++){const a=random()*Math.PI*2,r=12+random()*24,p={x:state.x+Math.sin(a)*r,z:state.z+Math.cos(a)*r};if(!blocked(p.x,p.z)){roam=p;route=[];replan=0;break;}}
   }goal=roam;
  }
  state.phase=chase?'hunt-player':meal?'return-meal':target?'hunt-animal':'search';
  state.prey=meal?.id||target?.id||null;state.speed=0;
  if(!goal)return state;
  const maxSpeed=chase?6.9:state.phase==='hunt-animal'?9.1:4.4;
  detourTime-=dt;if(detour&&(detourTime<=0||distance(state,detour)<.4||chase))detour=null;
  const preyGoal=goal;if(detour)goal=detour;
  let aim=goal;
  if(!clear(state,goal,blocked)){
   if(replan<=0){
    const d=distance(state,goal),f=Math.min(1,28/Math.max(d,.001));let waypoint={x:state.x+(goal.x-state.x)*f,z:state.z+(goal.z-state.z)*f};
    if(blocked(waypoint.x,waypoint.z))for(let i=0;i<24;i++){const a=i*Math.PI/12,r=1+Math.floor(i/8),p={x:waypoint.x+Math.sin(a)*r,z:waypoint.z+Math.cos(a)*r};if(!blocked(p.x,p.z)){waypoint=p;break;}}
    route=navigator.findRoute(state,waypoint,blocked);replan=1.15;
   }
   while(route.length&&distance(state,route[0])<.3)route.shift();
   aim=null;
   // Farthest visible waypoint avoids the old first-cell trap at tree trunks.
   for(let i=0;i<route.length;i++){if(clear(state,route[i],blocked))aim=route[i];else if(aim)break;}
   if(!aim){
    const bearing=Math.atan2(goal.x-state.x,goal.z-state.z);
    for(const angle of [0,.4,-.4,.85,-.85,1.35,-1.35,1.9,-1.9,2.6,Math.PI]){
     const a=bearing+angle*side,p={x:state.x+Math.sin(a)*1.4,z:state.z+Math.cos(a)*1.4};if(clear(state,p,blocked)){aim=p;break;}
    }
   }
  }else route=[];
  if(aim){
   const dx=aim.x-state.x,dz=aim.z-state.z,d=Math.hypot(dx,dz),travel=Math.min(d,maxSpeed*dt),n=Math.max(1,Math.ceil(travel/.075));
   for(let i=0;i<n;i++){const x=state.x+dx/Math.max(d,.001)*travel/n,z=state.z+dz/Math.max(d,.001)*travel/n;if(blocked(x,z)){replan=0;break;}state.walked+=travel/n;state.speed+=travel/n/dt;state.x=x;state.z=z;}
   if(state.speed>.02)state.yaw=Math.atan2(dx,dz);
  }
  stuck=state.speed<.1?stuck+dt:0;
  const remaining=distance(state,preyGoal);
  if(remaining<bestDistance-.6){bestDistance=remaining;progressTime=0;}else progressTime+=dt;
  if(stuck>.65||progressTime>4){
   side*=-1;route=[];replan=0;roamTime=0;stuck=0;progressTime=0;bestDistance=Infinity;
   // Commit to an escape direction for several steps instead of repeatedly
   // choosing the same blocked first cell at a trunk or concave obstacle.
   const bearing=Math.atan2(preyGoal.x-state.x,preyGoal.z-state.z);
   for(const turn of [1,-1,1.6,-1.6,2.2,-2.2,Math.PI,0]){
    const a=bearing+turn*side,p={x:state.x+Math.sin(a)*3,z:state.z+Math.cos(a)*3};
    if(clear(state,p,blocked)){detour=p;detourTime=2.5;break;}
   }
   if(target&&!chase&&!meal){retryAfter.set(target.id,clock+6);target=targetLast=null;scan=0;}
  }
  if(chase&&distance(state,player)<.88&&Math.abs((player.walkY||0)-ground(state.x,state.z))<1.2&&clear(state,player,blocked))onCatch?.('Der Kopffüßler hat dich erreicht.');
  if(!chase&&!meal&&target&&distance(state,target)<1.15&&clear(state,target,blocked)){
   meal=wildlife.capture(target.id);if(meal){state.yaw=Math.atan2(meal.x-state.x,meal.z-state.z);state.phase='eat';state.speed=0;state.eatProgress=0;route=[];detour=null;progressTime=0;bestDistance=Infinity;}
  }
  return state;
 }
 return{reset,update,get state(){return{...state,routePoints:route.length};}};
}
window.NovaPredator={create};
})();
