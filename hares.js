/* NovaHares: independent herbivores; +Y up, metres, heading -Z.
   Routine and threat drives steer the existing NovaFlyBrain sensorimotor ring.
   This is a game controller, not a fitted biological neural model. */
(function(root){
'use strict';
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const rng=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const HOMES=[[-1,0],[12,-7],[-13,-9],[6,15],[-17,14]];
function create(T,scene,texture,env){
 const animals=[];let elapsed=0;
 const homes=env.homes||HOMES.map(([x,z])=>({x,z})),within=env.within||((x,z)=>Math.hypot(x,z)<38),boundaryRadius=env.boundaryRadius??33;
 const blocked=(x,z)=>env.blocked(x,z,.23);
 function lineClear(a,b){const d=Math.hypot(a.x-b.x,a.z-b.z);for(let s=.5;s<d;s+=.5){const t=s/d;if(env.occluded?env.occluded(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t):blocked(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false;}return true;}
 function chooseGoal(a,local=false){for(let k=0;k<36;k++){const theta=a.random()*TAU,r=(local?1:2)+a.random()*(local?2.5:7);const center=local||k>=18?a:a.home;const g={x:center.x+Math.sin(theta)*r,z:center.z+Math.cos(theta)*r};if(!blocked(g.x,g.z)&&within(g.x,g.z)&&lineClear(a,g))return g;}return{x:a.x,z:a.z};}
 function setState(a,state,duration){a.state=state;a.timer=duration;a.stateAge=0;}
 function reset(){elapsed=0;animals.forEach((a,i)=>{a.random=rng(4201+i*1759);a.home={...homes[i]};Object.assign(a,{...a.home,yaw:i*1.24+.65,speed:0,angularVelocity:0,walked:0,gait:0,age:i*4.73,stateAge:0,threat:null,fear:0,calm:0,senseTimer:0,stuck:0,alive:true,consumed:0,perceived:0});a.brain.reset(a.yaw);setState(a,i===1?'hop':i===2?'rest':'graze',4+i*1.7);a.goal=chooseGoal(a);a.model.group.visible=true;a.model.group.scale.setScalar(a.scale);a.model.group.rotation.set(0,0,0);pose(a,0);});}
 for(let i=0;i<5;i++){const model=root.Wildlife.createAnimal('hare',texture);model.mat.color.setHex([0xffffff,0xe4dfd6,0xf1ede3,0xded7ce,0xf3f1e7][i]);const scale=[1,.97,1.04,.92,1.01][i];model.group.scale.setScalar(scale);scene.add(model.group);animals.push({id:'hare-'+i,kind:'hare',model,scale,brain:root.NovaFlyBrain.create(4201+i*1759)});}
 function sense(a,offset){let n=0;for(const d of [.55,1.2,2])if(blocked(a.x-Math.sin(a.yaw+offset)*d,a.z-Math.cos(a.yaw+offset)*d)){n=1-d*.22;break;}return n;}
 function update(dt,player,options={}){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.05);elapsed+=dt;
  const threats=[...((!options.ignorePlayer&&player)?[{...player,kind:'player'}]:[]),...(options.predators||[])];
  for(const a of animals){if(!a.alive)continue;a.age+=dt;a.stateAge+=dt;a.timer-=dt;a.senseTimer-=dt;
   if(a.senseTimer<=0){a.senseTimer=.10+a.random()*.06;let nearest=null,score=0;
    for(const t of threats){const d=Math.hypot(t.x-a.x,t.z-a.z),visible=d<19&&lineClear(a,t),noise=t.kind!=='player'?18:t.crouch?2:(t.speed||0)>3.2?15:(t.speed||0)>.1?6:0;
     const audible=d<noise,flight=d<(t.kind!=='player'?13:t.crouch?3.1:(t.speed||0)>3.2?10:5.5);let s=(visible||audible)?(t.kind!=='player'||flight?3:d<10?2:1):0;
     if(s>score||s===score&&s>0&&t.kind!=='player'&&(nearest?.kind==='player'||d<Math.hypot(nearest.x-a.x,nearest.z-a.z))){score=s;nearest=t;}}
    a.perceived=score;if(nearest)a.threat={x:nearest.x,z:nearest.z};
    if(score===3&&a.state!=='flee'){setState(a,'flee',5+a.random()*3);a.calm=0;}
    else if(score===2&&a.state!=='flee'&&a.state!=='freeze')setState(a,'freeze',1.2+a.random());
    else if(score===1&&!['flee','freeze','alert'].includes(a.state))setState(a,'alert',1.5+a.random()*2);
   }
   if(a.state==='flee'){
    if(a.perceived>=2)a.calm=0;else a.calm+=dt;
    if(a.timer<=0&&a.calm>2.2)setState(a,'alert',2+a.random()*2);
   }else if(a.timer<=0){
    if(a.state==='freeze')setState(a,a.perceived>=2?'flee':'alert',a.perceived>=2?5:2);
    else if(a.state==='alert'){if(a.perceived>0)a.timer=1.5;else setState(a,'graze',5+a.random()*7);}
    else if(a.state==='hop'){setState(a,a.random()<.2?'rest':'graze',5+a.random()*9);}
    else{a.goal=chooseGoal(a);setState(a,'hop',4+a.random()*8);}
   }
   let front=sense(a,0),left=sense(a,-.65),right=sense(a,.65);
   const neural=a.brain.update(dt,{x:a.x,z:a.z,yaw:a.yaw,angularVelocity:a.angularVelocity,ignorePlayer:true,playerSideLeft:0,playerSideRight:0,obstacleFront:front,obstacleLeft:left,obstacleRight:right});
   let wanted=0,turn=0;
   if(a.state==='hop'||a.state==='flee'){
    let dx,dz;
    if(a.state==='flee'&&a.threat){dx=a.x-a.threat.x;dz=a.z-a.threat.z;const wave=Math.sin(a.walked*.72+a.id.length)*.34,base=Math.atan2(dx,dz);dx=Math.sin(base+wave);dz=Math.cos(base+wave);wanted=6.5+a.scale;}
    else {dx=a.goal.x-a.x;dz=a.goal.z-a.z;wanted=1.25+(neural.forward||0)*.35;if(Math.hypot(dx,dz)<.6){setState(a,'graze',4+a.random()*10);wanted=0;}}
    for(const b of animals){if(a===b||!b.alive)continue;const sx=a.x-b.x,sz=a.z-b.z,d=Math.hypot(sx,sz);if(d<1.35&&d>.001){dx+=sx/d*(1.35-d)*1.4;dz+=sz/d*(1.35-d)*1.4;}}
    // Soft boundary turns before collision, rather than a visible wrap/teleport.
    const r=Math.hypot(a.x,a.z);if(r>boundaryRadius){dx-=a.x/r*(r-boundaryRadius)*1.8;dz-=a.z/r*(r-boundaryRadius)*1.8;}
    const delta=wrap(Math.atan2(-dx,-dz)-a.yaw);turn=clamp(delta*(a.state==='flee'?5:3)+neural.turn*.38,-4.5,4.5);wanted*=Math.max(.08,Math.cos(delta));
    if(front>.1){turn+=(left>right?1:-1)*2.8;wanted*=.2;}
   }
   const oldYaw=a.yaw;a.yaw=wrap(a.yaw+turn*dt);a.angularVelocity=wrap(a.yaw-oldYaw)/dt;
   a.speed+=(wanted-a.speed)*(1-Math.exp(-dt*(wanted===0?15:6)));
   if(!['hop','flee'].includes(a.state)&&a.speed<.06)a.speed=0;
   const dx=-Math.sin(a.yaw)*a.speed*dt,dz=-Math.cos(a.yaw)*a.speed*dt,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));let moved=0;
   for(let s=0;s<steps;s++){const x=a.x+dx/steps,z=a.z+dz/steps;if(!blocked(x,z)){moved+=Math.hypot(x-a.x,z-a.z);a.x=x;a.z=z;}else{a.speed=0;break;}}
   if(wanted>.2&&moved<.001)a.stuck+=dt;else a.stuck=0;
   if(a.stuck>.7){a.goal=chooseGoal(a,true);a.yaw=wrap(a.yaw+.8);a.stuck=0;}
   a.walked+=moved;a.gait+=moved/(a.state==='flee'?1.7:.58);pose(a,dt);
  }
 }
 function pose(a,dt){
  const m=a.model,t=a.age,moving=a.speed>.06,p=a.gait*TAU,phase=a.gait%1;
  const air=moving?Math.max(0,Math.sin((phase-.12)/.72*Math.PI))*(phase>.12&&phase<.84?1:0):0;
  const bob=air*(a.state==='flee'?.19:.07),low=a.state==='freeze'?-.055:a.state==='rest'?-.027:0;
  m.rig.position.y=bob+low;m.rig.rotation.z=moving?Math.sin(p)*.06:0;
  m.bones.neck_pose.rotation.z=a.state==='graze'?-1.15+Math.sin(t*3.3)*.025:a.state==='freeze'?-.18:0;
  m.bones.head.rotation.set(0,Math.sin(t*.65)*.07,(a.state==='graze'?-.22+Math.sin(t*5)*.025:a.state==='freeze'?-.22:a.state==='alert'?.14:0));
  m.bones.tail.rotation.y=Math.sin(t)*.045;
  for(const s of [-1,1]){const e=m.bones['ear_'+s];e.rotation.x=s*.11+Math.sin(t*1.7+s*3)*.035;e.rotation.z=a.state==='flee'?.95:a.state==='rest'?.35:a.state==='freeze'?.55:Math.sin(t*.8+s)*.07;}
  for(const l of m.legs){
   const ph=p+(l.rear?Math.PI:0),stride=(a.state==='flee'?.105:.063),lift=moving?Math.max(0,Math.sin(ph))*.064:0;
   const tx=l.fx+(moving?Math.cos(ph)*stride:0),ty=l.fy+lift-(air<.15?bob+low:0);
   const dx=tx-l.hx,dy=ty-l.hy,d=clamp(Math.hypot(dx,dy),Math.abs(l.L1-l.L2)+.0001,l.L1+l.L2-.0001);
   const angle=Math.atan2(dy,dx),offset=Math.acos(clamp((l.L1*l.L1+d*d-l.L2*l.L2)/(2*l.L1*d),-1,1)),cross=(l.fx-l.hx)*(l.ky-l.hy)-(l.fy-l.hy)*l.kx;
   const aa=angle+(cross>=0?1:-1)*offset,kx=Math.cos(aa)*l.L1,ky=Math.sin(aa)*l.L1,bb=Math.atan2(dy-ky,dx-kx);
   l.upper.rotation.z=aa-l.a1;l.lower.rotation.z=bb-l.a2-l.upper.rotation.z;l.foot.rotation.z=-(l.upper.rotation.z+l.lower.rotation.z);
  }
  m.group.position.set(a.x,env.ground(a.x,a.z),a.z);m.group.rotation.y=a.yaw+Math.PI/2;
 }
 function capture(id){const a=animals.find(v=>v.id===id&&v.alive);if(!a)return null;a.alive=false;a.speed=0;a.state='caught';a.consumed=0;pose(a,0);a.model.group.rotation.z=Math.PI/2;a.model.group.position.y=env.ground(a.x,a.z)+.18;return a;}
 function consume(id,progress){const a=animals.find(a=>a.id===id);if(!a||a.alive)return false;a.consumed=Math.max(a.consumed,clamp(progress,0,1));a.state=a.consumed>=1?'eaten':'being-eaten';a.model.group.scale.setScalar(a.scale*(1-a.consumed*.78));a.model.group.visible=a.consumed<1;return true;}
 reset();return{animals,update,reset,capture,consume,getState:()=>animals.map(a=>({id:a.id,x:a.x,z:a.z,yaw:a.yaw,speed:a.speed,state:a.state,alive:a.alive,walked:a.walked,brain:a.brain.getState().arousal}))};
}
root.NovaHares={create,HOMES};
})(typeof window==='undefined'?globalThis:window);
