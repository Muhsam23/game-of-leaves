// Night-only residents, using the approved entity studies and shared navigation.
(() => {
'use strict';
function create({THREE,scene,population,ground,blocked,textures,settlements,landmarks}){
 const T=window.NovaTerrain,V=THREE.Vector3,pond=T.ponds[1];
 const safe=(x,z)=>!blocked(x,z)&&[[.48,0],[-.48,0],[0,.48],[0,-.48]].every(([dx,dz])=>!blocked(x+dx,z+dz));
 const trees=population.trees.filter(t=>t.h>10&&t.x>pond.x+pond.rx+16&&t.x<T.riverB(t.z)-23&&Math.abs(t.z-pond.z)<65);
 let pair=null,best=Infinity;
 for(let i=0;i<trees.length;i++)for(let j=i+1;j<trees.length;j++){
  const a=trees[i],b=trees[j],span=Math.hypot(a.x-b.x,a.z-b.z),x=(a.x+b.x)/2,z=(a.z+b.z)/2;
  if(span<7.4||span>10||!safe(x,z)||Math.abs(a.y-b.y)>1.8)continue;
  const score=Math.abs(span-8.2)*8+Math.hypot(x-(pond.x+T.riverB(pond.z))/2,z-pond.z);
  if(score<best){best=score;pair={a,b,x,z,span};}
 }
 if(!pair)throw Error('No suitable pair of existing trees between the eastern pond and river.');
 const home=new V(pair.x,Math.max(pair.a.y,pair.b.y)+5.8,pair.z),yaw=Math.atan2(-(pair.b.z-pair.a.z),pair.b.x-pair.a.x);
 const axis=new V(pair.b.x-pair.a.x,0,pair.b.z-pair.a.z).normalize();
 const anchors=window.NovaNetwork.ANCHORS.map((a,i)=>{
  const tree=i<3?pair.a:pair.b,side=i<3?1:-1;
  return new V(tree.x,home.y+a.p[1],tree.z).addScaledVector(axis,side*(tree.r||.2));
 });
 const navigator=window.NovaVermesser.createController(null,0x4e455457);let route=[],routeTime=0;
 function sight(a,b){
  const length=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(length/.45));
  for(let i=1;i<n;i++){const f=i/n,x=a.x+(b.x-a.x)*f,z=a.z+(b.z-a.z)*f,y=a.y+(b.y-a.y)*f;
   if(blocked(x,z,y-.85)||ground(x,z)>y-.12)return false;
  }
  return true;
 }
 function networkStep(pos,step,entity){
  const target=entity.state==='return'?home:entity.lastSeen;routeTime-=.05;let aim=target;
  const clear=sight(new V(pos.x,ground(pos.x,pos.z)+1,pos.z),new V(target.x,ground(target.x,target.z)+1,target.z));
  if(!clear){if(routeTime<=0){route=navigator.findRoute(pos,target,(x,z)=>!safe(x,z));routeTime=.7;}
   while(route.length&&Math.hypot(route[0].x-pos.x,route[0].z-pos.z)<.35)route.shift();aim=route[0];
  }else route=[];
  if(!aim)return;
  const dx=aim.x-pos.x,dz=aim.z-pos.z,len=Math.hypot(dx,dz),distance=Math.min(len,Math.hypot(step.x,step.z)),n=Math.max(1,Math.ceil(distance/.09));
  for(let i=0;i<n;i++){const x=pos.x+dx/Math.max(len,.001)*distance/n,z=pos.z+dz/Math.max(len,.001)*distance/n;if(safe(x,z)){pos.x=x;pos.z=z;}else{routeTime=0;break;}}
 }
 const network=new window.NovaNetwork.NetworkEntity({scene,faceTexture:textures.networkFace,tendonTexture:textures.networkSinew,home,homeYaw:yaw,anchorPoints:anchors,span:pair.span,groundHeight:ground,canSee:sight,moveOnGround:networkStep});
 function openPoint(x,z){for(let r=0;r<28;r+=1)for(let i=0;i<24;i++){const a=i*Math.PI/12,px=x+Math.sin(a)*r,pz=z+Math.cos(a)*r;if(safe(px,pz))return{x:px,z:pz};}throw Error('No safe night entity starting point.');}
 const wispHome=openPoint(settlements.mill.x-25,settlements.mill.z+30);
 const wisp=new window.NovaWisp({scene,faceTexture:textures.wispFace,position:new V(wispHome.x,ground(wispHome.x,wispHome.z)+1.6,wispHome.z)});
 const brain=window.NovaFlyBrain.create(0x4952524c),controller=window.NovaVermesser.createController(brain,0x4952524c);
 const actor={...wispHome,yaw:0,speed:0,angularVelocity:0,walk:0},direction=new V(),eye=new V();let encounter={phase:'roam',fx:0},started=false,active=false,threatDistance=Infinity;
 const headling=window.NovaKopffuessler.create(THREE,scene,scene,textures.kopffuesslerFace);
 function wispBlocked(x,z){return !safe(x,z)||(encounter.phase==='roam'&&Math.hypot(x-wispHome.x,z-wispHome.z)>36);}
 function sense(angle){let v=0;for(const [d,w]of [[1.2,.45],[3.1,1]])if(wispBlocked(actor.x-Math.sin(actor.yaw+angle)*d,actor.z-Math.cos(actor.yaw+angle)*d))v=Math.max(v,w);return v;}
 function visible(on){network.group.visible=wisp.group.visible=on;if(on)network.pose(0);else for(const a of network.anchors)a.mesh.visible=false;headling.root.visible=on&&headling.state.active;}
 function reset(){started=active=false;route=[];routeTime=0;network.reset();controller.reset();brain.reset();Object.assign(actor,wispHome,{yaw:0,speed:0,angularVelocity:0,walk:0});encounter={phase:'roam',fx:0};wisp.reset();headling.reset();visible(false);}
 function update(dt,{night,playing,mazeActive,spectator,player,camera,flashlight,onCatch,wildlife}){
  active=night&&!mazeActive;
  if(night&&!started){started=true;headling.patrol(landmarks.tower,ground,(x,z)=>!safe(x,z));}
  visible(active);if(!active)return;
  const moving=playing;
  if(moving){
   eye.set(player.x,player.walkY+1.68,player.z);camera.getWorldDirection(direction);
   network.update(dt,{player:spectator?new V(1e6,1e6,1e6):eye,flashlight:{on:!spectator&&flashlight.owned&&flashlight.on,position:camera.position,direction},canCatch:!spectator});
   if(!spectator&&network.state==='caught')onCatch('Das Netzwerk hat dich erreicht.');
   const dx=player.x-actor.x,dz=player.z-actor.z,rel=Math.atan2(Math.sin(Math.atan2(-dx,-dz)-actor.yaw),Math.cos(Math.atan2(-dx,-dz)-actor.yaw));
   encounter=controller.update(actor,dt,{player,ignorePlayer:true,blocked:wispBlocked,ground:ground(actor.x,actor.z),lineOfSight:()=>sight(new V(actor.x,ground(actor.x,actor.z)+1.6,actor.z),eye),brainInput:{ignorePlayer:true,x:actor.x,z:actor.z,yaw:actor.yaw,angularVelocity:actor.angularVelocity,playerX:player.x,playerZ:player.z,playerSideLeft:rel<0?Math.min(1,Math.abs(Math.sin(rel))+.25):0,playerSideRight:rel>=0?Math.min(1,Math.abs(Math.sin(rel))+.25):0,obstacleFront:sense(0),obstacleLeft:sense(-.55),obstacleRight:sense(.55)}});
   headling.update(dt,player,{playing:true,mazeActive:false,travel:{level:0,rise:0},worldBlocked:(x,z)=>!safe(x,z),worldGround:ground,onCatch,wildlife,ignorePlayer:spectator});
  }
  wisp.home.set(actor.x,ground(actor.x,actor.z)+1.6,actor.z);wisp.update(moving?dt:0,camera);threatDistance=network.group.position.distanceTo(camera.position);
 }
 function cameraPose(id){if(!active)return null;const obj=id==='network'?network.group:id==='wisp'?wisp.group:headling.root,p=obj.position;return{x:p.x,z:p.z,y:p.y,yaw:obj.rotation.y,height:id==='network'?0:id==='wisp'?0:1.6,distance:id==='network'?10:id==='wisp'?3:5,zone:'world'};}
 reset();
 return{update,reset,cameraPose,network,wisp,headling,actor,get distance(){return active?threatDistance:Infinity;},get fx(){return active?Math.max(encounter.fx||0,network.state==='hunt'?.3:0):0;},get state(){return{active,started,network:network.snapshot(),nest:{x:home.x,y:home.y,z:home.z,trees:[{x:pair.a.x,z:pair.a.z},{x:pair.b.x,z:pair.b.z}]},wisp:{...wisp.getState(),encounter:{...encounter}},headling:headling.state};}};
}
window.NovaNightEntities={create};
})();
