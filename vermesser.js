// An elongated articulated silhouette. The inherited fly controller still drives ordinary wandering.
(() => {
'use strict';
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function createModel(THREE,skin=null){
 const group=new THREE.Group();group.name='Der Vermesser';
 if(skin){skin.magFilter=THREE.NearestFilter;skin.minFilter=THREE.NearestMipmapNearestFilter;skin.anisotropy=1;skin.encoding=THREE.sRGBEncoding;}
 const black=new THREE.MeshLambertMaterial({map:skin,color:skin?0xffffff:0x080909,side:THREE.DoubleSide});
 if(skin)black.color.setRGB(2.5,2.5,2.5); // Lift only the very dark albedo into a readable charcoal range.
 const clothUV=[0,.02,1,.735],headUV=[.03,.77,.97,.98];
 const section=[[-1,-.55],[-.62,-1],[.62,-1],[1,-.55],[.86,1],[-.86,1]];
 const headSection=[[-1,-.62],[-.62,-1],[.62,-1],[1,-.62],[1,.62],[.62,1],[-.62,1],[-1,.62]];
 // Hand-painted albedo on a small, faceted mesh. No new movement or encounter logic.
 function surface(rings,shape=section,uvRect=clothUV,closed=true,caps=true){
  const positions=[],uvs=[],n=shape.length,count=closed?n:n-1;
  const point=(r,j)=>{const a=rings[r],v=shape[j%n];return[a[1]+v[0]*a[3],a[0],a[2]+v[1]*a[4]];};
  function triangle(a,b,c){for(const [r,j]of [a,b,c]){positions.push(...point(r,j));uvs.push(uvRect[0]+(uvRect[2]-uvRect[0])*j/n,uvRect[1]+(uvRect[3]-uvRect[1])*r/(rings.length-1));}}
  for(let r=0;r<rings.length-1;r++)for(let j=0;j<count;j++){triangle([r,j],[r+1,j],[r,j+1]);triangle([r,j+1],[r+1,j],[r+1,j+1]);}
  if(caps)for(let j=1;j<n-1;j++){triangle([0,0],[0,j],[0,j+1]);triangle([rings.length-1,0],[rings.length-1,j+1],[rings.length-1,j]);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();return g;
 }
 function mesh(parent,g,x=0,y=0,z=0){const m=new THREE.Mesh(g,black);m.position.set(x,y,z);parent.add(m);return m;}
 function link(parent,length,r0,r1){return mesh(parent,surface([[-length,0,0,r1,r1*.78],[0,0,0,r0,r0*.78]]));}
 function point(parent,length,radius,y){
  const g=new THREE.ConeGeometry(radius,length,6,1).toNonIndexed();
  g.rotateX(Math.PI);g.translate(0,-length/2,0);g.scale(1,1,.78);
  const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,.08+uv.getX(i)*.40,.02+uv.getY(i)*.40);
  g.computeVertexNormals();return mesh(parent,g,0,y,0);
 }
 const hips=new THREE.Group();hips.position.y=2.36;group.add(hips);
 const torso=mesh(hips,surface([[-.10,0,0,.185,.105],[.55,-.025,0,.185,.105],[1.34,-.035,.008,.265,.13],[1.53,-.035,.008,.30,.115]]));
 const neck=mesh(hips,surface([[-.17,0,0,.065,.06],[.17,0,0,.055,.055]]),-.056,1.65,.025);neck.rotation.z=.08;
 const head=new THREE.Group();head.position.set(-.074,1.96,.03);head.rotation.z=-.105;hips.add(head);
 // A long bevelled head with an unreadable face, rather than a smooth oval or mask.
 mesh(head,surface([[-.24,.008,-.005,.108,.085],[-.10,0,0,.142,.113],[.27,-.012,.003,.144,.118],[.38,-.018,.008,.085,.071]],headSection,headUV));
 const arms=[],legs=[];
 function coatTail(pivot,side){
  const cross=[[.008,-.13],[.19,-.14],[.245,-.04],[.20,.13],[.008,.11]],positions=[],uvs=[];
  const levels=[.15,-.72,-1.42],widths=[.86,.92,.88],rag=[.10,-.07,-.01,-.13,.20];
  const point=(r,j)=>[side*(cross[j][0]*widths[r]-.095),levels[r]+(r===2?rag[j]+(side<0?.06:0):0),cross[j][1]];
  for(let r=0;r<2;r++)for(let j=0;j<4;j++)for(const [a,b]of [[r,j],[r+1,j],[r,j+1],[r,j+1],[r+1,j],[r+1,j+1]]){positions.push(...point(a,b));uvs.push(.06+b*.22,.02+(2-a)*.35);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();mesh(pivot,g);
 }
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.315-.035,1.45,0);arm.rotation.z=side*.034;hips.add(arm);link(arm,1.43,.056,.034);
  const elbow=new THREE.Group();elbow.position.y=-1.43;elbow.rotation.x=-.06;arm.add(elbow);link(elbow,1.00,.035,.026);
  // A single downward point ends just below the knee in the resting pose.
  const hand=point(elbow,.36,.030,-1.00);hand.name='Hand point';
  arms.push({pivot:arm,elbow,hand});
  const hip=new THREE.Group();hip.position.set(side*.095,0,0);hips.add(hip);link(hip,1.13,.064,.036);coatTail(hip,side);
  const knee=new THREE.Group();knee.position.y=-1.13;hip.add(knee);link(knee,.88,.036,.031);
  const foot=point(knee,.33,.031,-.88);foot.name='Foot point';
  legs.push({pivot:hip,knee});
 }
 function pose(distance,speed,phase,time){
  // 'stalk' (night backrooms only): a long running stride with both arms stretched out.
  const reach=phase==='stalk',amount=reach?Math.min(.62,Math.abs(speed)*.27):Math.min(.57,Math.abs(speed)*.10),s=Math.sin(distance*(reach?1.7:2.05));
  hips.position.y=2.36+Math.abs(s)*(reach?.05:.024);hips.rotation.x=reach?-.16:phase==='hunt'?-.07:Math.sin(time*.27)*.01;
  for(let i=0;i<2;i++){const swing=s*(i?1:-1);legs[i].pivot.rotation.x=swing*amount;legs[i].knee.rotation.x=Math.max(0,-swing)*amount*.54;
   if(reach){arms[i].pivot.rotation.x=1.3+swing*amount*.12+Math.sin(time*2.3+i*1.9)*.05;arms[i].elbow.rotation.x=.14+Math.sin(time*3.1+i)*.06;continue;}
   arms[i].pivot.rotation.x=-swing*amount*.39+Math.sin(time*.55+i*2)*.025;arms[i].elbow.rotation.x=-.06-Math.max(0,swing)*amount*.13;}
  head.rotation.z=-.105+(phase==='warning'?Math.sin(time*.38)*.08:Math.sin(time*.19)*.015);
 }
 return{group,hips,head,arms,legs,pose,height:4.76};
}
function createController(brain,seed=0x17002000){
 const random=window.NovaTerrain.rng(seed);let phase='roam',warning=0,decisionAt=14+random()*4,lost=0,cooldown=0,fx=0,route=[],routeTime=0,time=0;
 function reset(){phase='roam';warning=lost=cooldown=fx=routeTime=0;route=[];decisionAt=14+random()*4;time=0;}
 function clearLine(a,b,blocked){const distance=Math.hypot(b.x-a.x,b.z-a.z),n=Math.ceil(distance/.45);for(let i=1;i<=n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true;}
 // A bounded local grid is used only when pursuit's direct line is obstructed.
 function findRoute(from,to,blocked){
  const cell=1.15,pad=13,x0=Math.min(from.x,to.x)-pad,z0=Math.min(from.z,to.z)-pad,w=Math.ceil((Math.abs(to.x-from.x)+pad*2)/cell)+1,h=Math.ceil((Math.abs(to.z-from.z)+pad*2)/cell)+1;
  if(w*h>18000)return[];
  const point=(x,z)=>({x:x0+x*cell,z:z0+z*cell}),key=(x,z)=>z*w+x,cache=new Map();
  const free=(x,z)=>{if(x<0||z<0||x>=w||z>=h)return false;const k=key(x,z);if(!cache.has(k)){const p=point(x,z);cache.set(k,!blocked(p.x,p.z));}return cache.get(k);};
  const sx=Math.round((from.x-x0)/cell),sz=Math.round((from.z-z0)/cell),tx=Math.round((to.x-x0)/cell),tz=Math.round((to.z-z0)/cell);
  if(!free(tx,tz))return[];
  const start=key(sx,sz),goal=key(tx,tz),open=[{x:sx,z:sz,k:start,g:0,f:0}],seen=new Map([[start,{g:0,parent:null,x:sx,z:sz}]]),closed=new Set();let count=0;
  while(open.length&&count++<3500){let best=0;for(let i=1;i<open.length;i++)if(open[i].f<open[best].f)best=i;const current=open.splice(best,1)[0];if(closed.has(current.k))continue;closed.add(current.k);
   if(current.k===goal){const path=[];let node=seen.get(goal);while(node.parent!==null){path.push(point(node.x,node.z));node=seen.get(node.parent);}return path.reverse();}
   for(const [dx,dz]of [[0,-1],[1,0],[0,1],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=current.x+dx,z=current.z+dz,k=key(x,z);if(!free(x,z)||closed.has(k)||dx&&dz&&(!free(x,current.z)||!free(current.x,z)))continue;const g=current.g+Math.hypot(dx,dz);if(g>=(seen.get(k)?.g??Infinity))continue;seen.set(k,{g,parent:current.k,x,z});open.push({x,z,k,g,f:g+Math.hypot(tx-x,tz-z)});}
  }
  return[];
 }
 function update(v,dt,input){
  time+=dt;const {player,blocked,ignorePlayer=false}=input,dx=player.x-v.x,dz=player.z-v.z,distance=Math.hypot(dx,dz),bearing=Math.atan2(-dx,-dz),vertical=Math.abs((player.walkY??0)-input.ground),seen=!ignorePlayer&&vertical<3.8&&distance<70&&input.lineOfSight();
 const close=seen&&distance<38;
 // A visible torch draws a slow approach. Existing pursuit remains dangerous;
 // at close range the normal warning starts again instead of the light acting as protection.
 const lampSeen=seen&&distance<=30&&input.flashlight?.owned&&input.flashlight.on;
 if(phase!=='hunt'&&!ignorePlayer){
  if(lampSeen&&distance>7){if(phase!=='curious'){phase='curious';warning=lost=0;route=[];routeTime=0;}}
  else if(phase==='curious'){phase='roam';warning=lost=0;route=[];}
 }
  if(ignorePlayer){phase='roam';warning=lost=0;fx=0;route=[];}
  if(cooldown>0)cooldown-=dt;
  if(phase==='roam'&&close&&cooldown<=0){phase='warning';warning=0;decisionAt=14+random()*4;}
  if(phase==='warning'){
   if(seen&&distance<47){warning+=dt;lost=0;}else{lost+=dt;warning=Math.max(0,warning-dt*.35);}
   if(lost>5||distance>64){phase='roam';warning=0;cooldown=8;}
   else if(warning>=decisionAt&&distance<38){if(distance<17||random()<.8){phase='hunt';lost=0;routeTime=0;}else{decisionAt+=7;}}
  }
  if(phase==='hunt'){if(seen)lost=0;else lost+=dt;if(lost>16||distance>110){phase='roam';warning=0;cooldown=18;route=[];}}
  let turn=0,wanted=0;
  if(phase==='roam'){
   const out=brain.update(dt,input.brainInput);v.brainOut=out;turn=out.turn*(.82+out.arousal*.52);wanted=out.forward*(1+out.arousal*.18);
  }else if(phase==='warning'){turn=clamp(wrap(bearing-v.yaw)*1.2,-.65,.65);wanted=0;}
  else{
   const target={x:player.x,z:player.z};routeTime-=dt;
   let aim=target;
   if(!clearLine(v,target,blocked)){
    if(routeTime<=0){route=findRoute(v,target,blocked);routeTime=.85;}
    while(route.length&&Math.hypot(route[0].x-v.x,route[0].z-v.z)<.4)route.shift();
    if(route.length)aim=route[0];else aim=null;
   }else route=[];
   if(aim){const a=Math.atan2(v.x-aim.x,v.z-aim.z),delta=wrap(a-v.yaw);turn=clamp(delta*(phase==='curious'?2:7),-5,5);wanted=(phase==='curious'?1.15:11.2)*Math.max(.3,Math.cos(delta));}
  }
  const oldYaw=v.yaw;v.yaw=wrap(v.yaw+turn*dt);v.angularVelocity=wrap(v.yaw-oldYaw)/Math.max(dt,.001);
  v.speed+=(wanted-v.speed)*(1-Math.exp(-dt*(phase==='hunt'?7:3.5)));
  const dxMove=-Math.sin(v.yaw)*v.speed*dt,dzMove=-Math.cos(v.yaw)*v.speed*dt,steps=Math.max(1,Math.ceil(Math.hypot(dxMove,dzMove)/.13));let moved=0;
  for(let i=0;i<steps;i++){const beforeX=v.x,beforeZ=v.z,x=v.x+dxMove/steps,z=v.z+dzMove/steps;if(!blocked(x,z)){v.x=x;v.z=z;}else if(phase==='hunt'||phase==='curious'){if(!blocked(x,v.z))v.x=x;if(!blocked(v.x,z))v.z=z;}else{v.speed=Math.min(v.speed,0);v.yaw+=dt*1.7;}moved+=Math.hypot(v.x-beforeX,v.z-beforeZ);}
  v.walk+=moved;
  const proximity=clamp((42-distance)/35),warningFx=phase==='warning'?.13+clamp(warning/decisionAt)*.43:phase==='hunt'?.64:0,targetFx=ignorePlayer?0:Math.max(seen?proximity*.28:0,warningFx);
  fx+=(targetFx-fx)*(1-Math.exp(-dt*2));
  const contact=!ignorePlayer&&vertical<1.55&&Math.hypot(player.x-v.x,player.z-v.z)<.94&&input.lineOfSight();
  return{phase,warning,decisionAt,lost,fx,caught:contact,time,distance,speed:v.speed};
 }
 return{update,reset,findRoute,getState:()=>({phase,warning,decisionAt,lost,fx,time})};
}
window.NovaVermesser={createModel,createController};
})();
