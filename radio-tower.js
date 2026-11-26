// Contact starts the climb. W/S follows the ladder, A/D can leave its edge.
// The platform and the landing share the mast's visible geometry.
(() => {
'use strict';
function create(landmarks,{onImpact=()=>{},blocked=()=>false}={}){
 const t=landmarks.tower,{clamp}=window.NovaTerrain;
 const ladder=y=>({x:t.x,z:t.ladderZ(y)-.43,walkY:y});
 const ground=()=>ladder(t.ladderBaseY);
 const landing=()=>({x:t.x,z:t.z-.1,walkY:t.platformY});
 let mode='ground',transition=null,lateral=0,fall=null;
 function supported(x,z){
  const dx=x-t.x,dz=z-t.z;
  return Math.abs(dx)<=t.platformHalf&&Math.abs(dz)<=t.platformHalf
   && !(Math.abs(dx)<t.hatchHalf&&dz<t.hatchInner);
 }
 function obstacle(x,z,r=.29){
  // The antenna and surviving corner posts still have physical thickness.
  if(Math.hypot(x-t.x,z-t.z-.8)<.075+r)return true;
  for(const dx of [-t.platformHalf,t.platformHalf])for(const dz of [-t.platformHalf,t.platformHalf])if(Math.hypot(x-t.x-dx,z-t.z-dz)<.045+r)return true;
  return blocked(x,z,t.platformY,r);
 }
 function target(p,eye,look){
  if(mode!=='platform'||!eye||!look||p.z>t.z+.35||Math.hypot(p.x-t.x,p.z-(t.z-.1))>1.5)return null;
  // Ray against the visible upper ladder and its handholds, not proximity alone.
  const lower={x:t.x-.42,y:t.platformY-.65,z:t.ladderZ(t.platformY)-.08},upper={x:t.x+.42,y:t.platformY+1.15,z:t.ladderZ(t.platformY)+.08};
  let near=0,far=2.8;
  for(const axis of ['x','y','z']){
   if(Math.abs(look[axis])<1e-8){if(eye[axis]<lower[axis]||eye[axis]>upper[axis])return null;continue;}
   const a=(lower[axis]-eye[axis])/look[axis],b=(upper[axis]-eye[axis])/look[axis];
   near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));if(near>far)return null;
  }
  if(look.y<0){const floorHit=(t.platformY-eye.y)/look.y;if(floorHit>0&&floorHit<near&&supported(eye.x+look.x*floorHit,eye.z+look.z*floorHit))return null;}
  return{id:'radio-ladder',kind:'radioLadder',label:'E · Absteigen'};
 }
 function begin(p,to,next,duration){transition={from:{x:p.x,z:p.z,walkY:p.walkY},to,next,time:0,duration};mode='landing';}
 function tryGrab(p){
  if(mode!=='ground')return false;
  const z=t.ladderZ(t.ladderBaseY);
  if(Math.abs(p.walkY-t.ladderBaseY)>.65||Math.abs(p.x-t.x)>.44||p.z<z-.50||p.z>z+.12)return false;
  lateral=0;begin(p,ground(),'climb',.22);return true;
 }
 function use(p,eye,look){
  if(!target(p,eye,look))return false;
  lateral=0;begin(p,ladder(t.platformY),'climb',.75);return true;
 }
 function drop(vx=0,vz=0){mode='fall';transition=null;fall={vx,vy:0,vz};}
 function move(p,dt,{forward=0,right=0,run=false}={}){
  if(mode==='ground'||mode==='fallen'||dt<=0)return 0;
  if(mode==='fall'){
   // Fixed-size substeps keep impact accurate even after a slow frame.
   const steps=Math.max(1,Math.ceil(dt/.025)),step=dt/steps;
   for(let i=0;i<steps;i++){
    p.x+=fall.vx*step;p.z+=fall.vz*step;p.walkY+=fall.vy*step-4.905*step*step;fall.vy-=9.81*step;
    const floor=landmarks.walkHeight(p.x,p.z);
    if(p.walkY<=floor){p.walkY=floor;mode='fallen';onImpact();break;}
   }return 0;
  }
  if(mode==='landing'){
   transition.time=Math.min(transition.duration,transition.time+dt);
   const a=transition.time/transition.duration,s=a*a*(3-2*a);
   for(const k of ['x','z','walkY'])p[k]=transition.from[k]+(transition.to[k]-transition.from[k])*s;
   if(transition.next!=='ground'){lateral-=clamp(right,-1,1)*1.2*dt;p.x+=lateral;if(Math.abs(lateral)>.34){drop(-right*1.2,-.28);return 0;}}
   if(a===1){mode=transition.next;transition=null;if(mode==='platform'||mode==='ground')lateral=0;}return 0;
  }
  if(mode==='climb'){
   const y=clamp(p.walkY+clamp(forward,-1,1)*(run?2.4:1.85)*dt,t.ladderBaseY,t.platformY);
   lateral-=clamp(right,-1,1)*1.2*dt;Object.assign(p,ladder(y));p.x+=lateral;
   if(Math.abs(lateral)>.34){drop(-right*1.2,-.28);return 0;}
   if(y>=t.platformY&&forward>0){lateral=0;begin(p,landing(),'platform',.75);}
   else if(y<=t.ladderBaseY&&forward<0){const a=ground();a.z-=.65;a.walkY=landmarks.walkHeight(a.x,a.z);lateral=0;begin(p,a,'ground',.45);}
   return 0;
  }
  const n=Math.max(1,Math.hypot(forward,right)),speed=run?3:2,vx=(-Math.sin(p.yaw)*forward+Math.cos(p.yaw)*right)*speed/n,vz=(-Math.cos(p.yaw)*forward-Math.sin(p.yaw)*right)*speed/n,dx=vx*dt,dz=vz*dt;
  const before={x:p.x,z:p.z},steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/.06));
  for(let i=0;i<steps;i++)for(const axis of ['x','z']){
   const x=p.x+(axis==='x'?dx/steps:0),z=p.z+(axis==='z'?dz/steps:0);
   if(!obstacle(x,z)){p.x=x;p.z=z;if(!supported(x,z)){drop(vx,vz);return 0;}}
  }
  p.walkY=t.platformY;const d=Math.hypot(p.x-before.x,p.z-before.z);p.bob+=d*2.1;return d;
 }
 return{target,tryGrab,use,move,supported,reset(){mode='ground';transition=null;lateral=0;fall=null;},get active(){return mode!=='ground';},get climbing(){return mode==='climb'||mode==='landing';},get falling(){return mode==='fall'||mode==='fallen';},get state(){return{mode,height:t.height,platformY:t.platformY};},contains(x,z,y){return mode!=='ground'&&Math.abs(x-t.x)<t.platformHalf+.3&&Math.abs(z-t.z)<3.5&&y>=t.ladderBaseY-.1&&y<=t.platformY+.1;}};
}
window.NovaRadioTower={create};
})();
