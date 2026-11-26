(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Earliest intersection with a circular boundary; shared by player and entity motion.
function entryFraction(px,pz,dx,dz,radius){
 const a=dx*dx+dz*dz,b=2*(px*dx+pz*dz),c=px*px+pz*pz-radius*radius,disc=b*b-4*a*c;
 if(c<=1e-9)return 0;
 if(a<=0||disc<0)return null;
 const t=(-b-Math.sqrt(disc))/(2*a);return t>=0&&t<=1?t:null;
}
class Encounter {
 constructor(){this.effectRadius=10;this.triggerRadius=5;this.lockIntensity=.38;this.speed=.22;this.roamSpeed=.34;this.playerRadius=.28;this.halfWidth=1.02;this.halfDepth=.24;this.reset();}
 reset(){this.active=true;this.home={x:0,z:-6};this.player={x:0,z:8};this.entity={x:0,z:-6,yaw:0};this.phase='free';this.time=0;this.captureTime=0;this.initialGap=0;this.intensity=0;this.contact=false;this.crawlDistance=0;this.random=seeded(826143);this.waypoint={x:2.25,z:-3.9};this.rest=0;}
 deactivate(){this.active=false;this.intensity=0;}
 relocate(x,z,seed){this.active=true;this.home={x,z};this.entity={x,z,yaw:0};this.phase='free';this.intensity=0;this.contact=false;this.crawlDistance=0;this.captureTime=0;this.initialGap=0;this.random=seeded(seed);this.waypoint={x:x+2.25,z:z+2.1};this.rest=0;}
 distance(){return this.active?Math.hypot(this.player.x-this.entity.x,this.player.z-this.entity.z):Infinity;}
 get psiloDose(){return this.distance()<=this.effectRadius?6:0;}
 gap(){const dx=this.player.x-this.entity.x,dz=this.player.z-this.entity.z,c=Math.cos(this.entity.yaw),s=Math.sin(this.entity.yaw);const x=c*dx-s*dz,z=s*dx+c*dz;return Math.hypot(Math.max(0,Math.abs(x)-this.halfWidth),Math.max(0,Math.abs(z)-this.halfDepth))-this.playerRadius;}
 proximity(){return this.lockIntensity*Math.pow(clamp((this.effectRadius-this.distance())/(this.effectRadius-this.triggerRadius),0,1),.85);}
 capture(){if(!this.active||this.phase!=='free')return;this.entity.yaw=Math.atan2(this.player.x-this.entity.x,this.player.z-this.entity.z);this.phase='captured';this.captureTime=this.time;this.initialGap=Math.max(.001,this.gap());this.intensity=this.lockIntensity;}
 move(dx,dz){
  if(this.phase!=='free'||!Number.isFinite(dx)||!Number.isFinite(dz))return false;
  if(!this.active){this.player.x+=dx;this.player.z+=dz;return true;}
  const px=this.player.x-this.entity.x,pz=this.player.z-this.entity.z;
  if(Math.hypot(px,pz)<=this.triggerRadius+1e-9){this.capture();return false;}
  const crossing=entryFraction(px,pz,dx,dz,this.triggerRadius),fraction=crossing===null?1:crossing,hit=crossing!==null;
  this.player.x+=dx*fraction;this.player.z+=dz*fraction;
  if(hit||this.distance()<=this.triggerRadius+1e-9)this.capture();
  else this.intensity=this.proximity();
  return true;
 }
 roam(dt){
  if(this.rest>0){this.rest=Math.max(0,this.rest-dt);return;}
  let dx=this.waypoint.x-this.entity.x,dz=this.waypoint.z-this.entity.z,d=Math.hypot(dx,dz);
  if(d<.04){this.waypoint={x:this.home.x+(this.random()-.5)*5.4,z:this.home.z+(this.random()-.5)*7};this.rest=.35+this.random()*1.2;return;}
  const pulse=.23+.77*Math.pow(.5+.5*Math.sin(this.time*2.4),2),amount=Math.min(d,this.roamSpeed*pulse*dt);
  dx=dx/d*amount;dz=dz/d*amount;
  const crossing=entryFraction(this.entity.x-this.player.x,this.entity.z-this.player.z,dx,dz,this.triggerRadius),fraction=crossing===null?1:crossing;
  this.entity.x+=dx*fraction;this.entity.z+=dz*fraction;this.crawlDistance+=amount*fraction;
  const desired=Math.atan2(dx,dz),turn=Math.atan2(Math.sin(desired-this.entity.yaw),Math.cos(desired-this.entity.yaw));this.entity.yaw+=clamp(turn,-dt*.8,dt*.8);
  if(crossing!==null)this.capture();
 }
 update(dt){
  if(!Number.isFinite(dt)||dt<=0||this.phase==='dead')return;
  this.time+=dt;
  if(!this.active)return;
  if(this.phase==='free'){
   if(this.distance()<=this.triggerRadius+1e-9)this.capture();
   else {this.roam(dt);if(this.phase==='free')this.intensity=this.proximity();}
   return;
  }
  const dx=this.player.x-this.entity.x,dz=this.player.z-this.entity.z,d=Math.hypot(dx,dz),gap=this.gap();
  const amount=Math.min(this.speed*dt,Math.max(0,gap));
  if(d>0){this.entity.x+=dx/d*amount;this.entity.z+=dz/d*amount;}
  this.crawlDistance+=amount;
  const remaining=this.gap();this.intensity=clamp(this.lockIntensity+(1-this.lockIntensity)*(1-remaining/this.initialGap),this.lockIntensity,1);
  if(remaining<=.002){this.phase='dead';this.contact=true;this.intensity=1;}
 }
 snapshot(){return {active:this.active,phase:this.phase,player:{...this.player},entity:{...this.entity},distance:this.distance(),gap:this.gap(),intensity:this.intensity,time:this.time,contact:this.contact,psiloDose:this.psiloDose,crawlDistance:this.crawlDistance};}
}
class Markov {
 constructor(corpora,random=Math.random){this.random=random;this.edges=new Map();this.starts=[];this.words=[];
  for(const text of Object.values(corpora)){
   for(const line of text.split(/[.!?\n]+/)){
    const w=(line.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g)||[]);if(w.length<3)continue;
    this.starts.push([w[0],w[1]]);this.words.push(...w);
    for(let i=0;i<w.length-2;i++){const key=w[i]+' '+w[i+1];if(!this.edges.has(key))this.edges.set(key,[]);this.edges.get(key).push(w[i+2]);}
   }
  }
 }
 pick(a){return a[Math.floor(this.random()*a.length)];}
 phrase(length=5){if(!this.starts.length)return '';const out=[...this.pick(this.starts)];while(out.length<length){const key=out.slice(-2).join(' '),next=this.edges.get(key);if(!next?.length)break;out.push(this.pick(next));}return out.slice(0,length).join(' ');}
}
function seeded(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
class DigitBag {constructor(random=Math.random){this.random=random;this.bag=[];} next(){if(!this.bag.length){this.bag=Array.from({length:10},(_,i)=>String(i));for(let i=9;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];}}return this.bag.pop();} string(n){return Array.from({length:n},()=>this.next()).join('');}}
const api={Encounter,Markov,seeded,DigitBag};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.NovaEncounter=api;
})(typeof window==='undefined'?globalThis:window);
