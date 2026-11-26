// The ashen four-legged head creature, adapted from the isolated NPC study.
(() => {
'use strict';
function create(THREE,world,maze,faceTexture){
 faceTexture.magFilter=THREE.NearestFilter;
 const skin=new THREE.MeshLambertMaterial({map:faceTexture,color:0xd4d3cb}),face=new THREE.MeshLambertMaterial({map:faceTexture,color:0xd4d3cb});
 const root=new THREE.Group(),headPivot=new THREE.Group();root.name='Kopffuessler';root.add(headPivot);
 const geo=new THREE.SphereGeometry(1,20,14).toNonIndexed(),pos=geo.attributes.position,uv=geo.attributes.uv;geo.clearGroups();
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),front=Math.max(0,z),nose=Math.exp(-((x+.055)**2/.028+(y+.10)**2/.085))*.18*front;
  pos.setXYZ(i,x*.72*(1+.06*Math.sin(y*5)),y*.87,z*.64+nose);uv.setXY(i,.5+x*.48,.5+y*.48);
 }
 for(let i=0;i<pos.count;i+=3)geo.addGroup(i,3,(pos.getZ(i)+pos.getZ(i+1)+pos.getZ(i+2))/3>.015?0:1);
 geo.computeVertexNormals();const head=new THREE.Mesh(geo,[face,skin]);head.castShadow=true;headPivot.add(head);
 const up=new THREE.Vector3(0,1,0),limbs=[];
 for(const side of [-1,1])for(const end of [-1,1]){
  const upper=new THREE.Mesh(new THREE.CylinderGeometry(.075,.13,1,5),skin),lower=new THREE.Mesh(new THREE.CylinderGeometry(.004,.076,1,5),skin),joint=new THREE.Mesh(new THREE.IcosahedronGeometry(.11,0),skin);for(const m of [upper,lower,joint]){const uv=m.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,.29+uv.getX(i)*.22,.76+uv.getY(i)*.15);}root.add(upper,lower,joint);limbs.push({side,end,upper,lower,joint});
 }
 root.visible=false;world.add(root);
 let active=false,zone='world',warning=0,chasing=false,roomKey='',lastRevision=-1,time=0,speed=0,x=0,z=0,yaw=0;
 const predator=window.NovaPredator?.create(window.NovaVermesser.createController(null,0x48554e54),window.NovaTerrain.rng(0x48554e54));
 const v1=new THREE.Vector3(),v2=new THREE.Vector3();
 const navigator=window.NovaVermesser.createController(null,0x4b4f5046),visited=new Set();let route=[],routeTime=0,level=0,patrolHome=null,patrolTarget=null,patrolLastSeen=null,patrolClock=0,patrolLost=0;const patrolRandom=window.NovaTerrain.rng(0x4e494748);
 function clearLine(a,b,blocked){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.16));for(let i=1;i<=n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true;}
 function deactivate(){active=false;chasing=false;root.visible=false;speed=0;route=[];routeTime=0;}

 function bone(mesh,a,b){mesh.position.copy(a).add(b).multiplyScalar(.5);v1.copy(b).sub(a);mesh.scale.set(1,v1.length(),1);mesh.quaternion.setFromUnitVectors(up,v1.normalize());}
 function pose(dt){time+=dt;const gait=time*(speed>.2?speed/1.44:.24),s=Math.sin(gait*6.28);headPivot.position.set(s*.025,1.63+(speed>.2?Math.sin(gait*12.56)*.045:0),.02);
  headPivot.rotation.z=Math.cos(gait*6.28)*.045;headPivot.rotation.x=0;
  const eating=patrolHome&&predator?.state.phase==='eat';if(eating){headPivot.position.y=.76+Math.sin(time*14)*.065;headPivot.position.z=.56;headPivot.rotation.x=.42+Math.sin(time*7)*.09;}
  for(let i=0;i<limbs.length;i++){const l=limbs[i],stride=speed>.2?Math.sin(gait*6.28+(i%2?Math.PI:0))*.24:0;
   const hip=new THREE.Vector3(l.side*.47,eating?.87:1.43,l.end*.27),knee=new THREE.Vector3(l.side*1,1.05+Math.max(0,stride)*.25,l.end*.61),foot=new THREE.Vector3(l.side*.88,.02+Math.max(0,stride),l.end*.72+stride);
   bone(l.upper,hip,knee);bone(l.lower,knee,foot);l.joint.position.copy(knee);
  }
 }
 function relocate(scene){if(root.parent!==scene){root.parent?.remove(root);scene.add(root);}}
 function reset(){patrolHome=patrolTarget=patrolLastSeen=null;patrolClock=patrolLost=0;deactivate();warning=0;roomKey='';lastRevision=-1;visited.clear();}
 function spawn(nextZone,px,pz,ground,blocked,distance=12,alert=true,scene=nextZone==='maze'?maze:world){
  patrolHome=patrolTarget=patrolLastSeen=null;relocate(scene);zone=nextZone;let found=false;
  for(let i=0;i<48;i++){const a=i/48*Math.PI*2,d=distance+(i%4)*1.5,xx=px+Math.sin(a)*d,zz=pz+Math.cos(a)*d;if(!blocked(xx,zz)){x=xx;z=zz;found=true;break;}}
  if(!found){deactivate();return false;}
  root.position.set(x,ground(x,z),z);yaw=Math.atan2(px-x,pz-z);root.rotation.y=yaw;root.visible=true;active=true;chasing=alert;warning=0;speed=0;route=[];routeTime=0;return true;
 }
 function patrol(home,ground,blocked){
  if(!spawn('world',home.x,home.z,ground,blocked,18,false,world))return false;
  patrolHome={...home};predator?.reset({x,z,yaw});patrolClock=patrolLost=0;return true;
 }
 function update(dt,player,options){const {playing,mazeActive,travel,worldBlocked,mazeBlocked,worldGround,mazeGround,onCatch}=options,nextZone=mazeActive?'maze':'world',blocked=nextZone==='maze'?mazeBlocked:worldBlocked,ground=nextZone==='maze'?mazeGround:worldGround;
  if(mazeActive&&travel.level!==0&&playing){
   const state=travel.snapshot(),key=travel.level+':'+state.upperSeed+':'+state.path.join('/');
   if(travel.revision!==lastRevision){
    if(active&&(zone!=='maze'||roomKey!==key))deactivate();
    if(!visited.has(key)){visited.add(key);if(travel.current.headling){spawn('maze',player.x,player.z,ground,blocked,9,false,maze);roomKey=key;level=travel.level;}}
    lastRevision=travel.revision;
   }
  }else if(active&&zone==='maze'&&(!mazeActive||travel.level!==level))deactivate();
  if(!active||!playing||zone!==nextZone)return;
  if(patrolHome&&predator){const s=predator.update(dt,player,{blocked,ground,wildlife:options.wildlife,ignorePlayer:options.ignorePlayer,onCatch});({x,z,yaw,speed}=s);chasing=s.phase==='hunt-player';root.position.set(x,ground(x,z),z);root.rotation.y=yaw;pose(dt);return;}
  const dx=player.x-x,dz=player.z-z,d=Math.hypot(dx,dz);
  if(patrolHome){
   const seen=d<=4&&Math.abs(player.walkY-ground(x,z))<1.5&&clearLine({x,z},player,blocked);
   if(seen){chasing=true;patrolLost=0;patrolLastSeen={x:player.x,z:player.z};}else if(chasing){patrolLost+=dt;if(patrolLost>3){chasing=false;patrolTarget=patrolLastSeen=null;patrolClock=0;route=[];}}
   if(!chasing){patrolClock-=dt;
    if(!patrolTarget||Math.hypot(patrolTarget.x-x,patrolTarget.z-z)<.8||patrolClock<=0){
     patrolTarget=null;patrolClock=18+patrolRandom()*16;
     // A random walk from the current position, with no return radius around the station.
     for(let i=0;i<24;i++){const a=patrolRandom()*Math.PI*2,r=8+patrolRandom()*20,px=x+Math.sin(a)*r,pz=z+Math.cos(a)*r;if(!blocked(px,pz)){patrolTarget={x:px,z:pz};route=[];routeTime=0;break;}}
    }
   }
  }else if(!chasing){warning+=dt;if(warning>=10)chasing=true;}
  if((chasing||patrolTarget)&&d>.01){
   const target=chasing?(patrolHome?patrolLastSeen:{x:player.x,z:player.z}):patrolTarget;routeTime-=dt;let aim=target;
   if(!clearLine({x,z},target,blocked)){
    if(routeTime<=0){route=navigator.findRoute({x,z},target,blocked);routeTime=.7;}
    while(route.length&&Math.hypot(route[0].x-x,route[0].z-z)<.25)route.shift();
    aim=route.find(p=>clearLine({x,z},p,blocked))||null;
   }else route=[];
   const before={x,z};
   if(aim){const ax=aim.x-x,az=aim.z-z,ad=Math.hypot(ax,az),step=Math.min(ad,(chasing?6.9:1.15)*dt),n=Math.max(1,Math.ceil(step/.09));
    for(let i=0;i<n;i++){const xx=x+ax/Math.max(ad,.001)*step/n,zz=z+az/Math.max(ad,.001)*step/n;if(!blocked(xx,zz)){x=xx;z=zz;}else{routeTime=0;break;}}
    yaw=Math.atan2(ax,az);
   }
   speed=Math.hypot(x-before.x,z-before.z)/Math.max(dt,.001);
   const foot=ground(x,z)+(zone==='maze'?travel.rise:0);
   if(chasing&&d<.88&&Math.abs(player.walkY-foot)<1.2&&clearLine({x,z},player,blocked)){onCatch('Der Kopffüßler hat dich erreicht.');return;}
  }else speed=0;
  root.position.set(x,ground(x,z),z);root.rotation.y=yaw;pose(dt);
 }
 pose(0);
 return{root,spawn,patrol,update,reset,get state(){return{...(patrolHome?predator?.state:{}),patrol:!!patrolHome,active,zone,chasing,warning:Math.max(0,10-warning),x,z,yaw,speed,level,routePoints:route.length,iterations:visited.size};}};
}
window.NovaKopffuessler={create};
})();
