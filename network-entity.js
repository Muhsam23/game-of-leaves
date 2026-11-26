/* Nova Network Entity v3. Standalone Three.js r128 component. Units: metres. */
(function(root){
'use strict';
const V=THREE.Vector3,up=new V(0,1,0),temp=new V(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const CONFIG=Object.freeze({lightRange:18,lightHalfAngle:.30,exposureSeconds:1.15,unfoldSeconds:1.75,dropSeconds:1.05,huntSpeed:5.65,walkSpeed:3.0,runSpeed:6.7,catchRadius:1.05,loseSightSeconds:7,searchSeconds:5});
const NODES=[[-2.35,1.12,.12,.33],[-.88,1.63,-.28,.30],[.65,1.85,.12,.37],[2.10,1.19,-.17,.31],[-1.60,.02,.45,.39],[-.22,.46,.08,.43],[1.14,.19,.62,.33],[2.64,-.22,-.06,.30],[-2.48,-1.04,-.14,.29],[-.96,-1.18,.21,.34],[.53,-.93,.34,.39],[1.75,-1.36,.02,.28],[.15,-2.06,-.10,.30]];
const EDGES=[[0,1],[0,4],[0,8],[1,2],[1,4],[1,5],[2,3],[2,5],[2,6],[3,6],[3,7],[4,5],[4,8],[4,9],[5,6],[5,9],[5,10],[6,7],[6,10],[6,11],[7,11],[8,9],[9,10],[9,12],[10,11],[10,12],[11,12]];
const LIMBS=[{node:0,x:-3.7,z:.7,phase:0},{node:3,x:3.6,z:.4,phase:.5},{node:8,x:-3.25,z:2.6,phase:.5},{node:7,x:3.6,z:2.2,phase:0},{node:9,x:-2.5,z:-2.4,phase:0},{node:11,x:2.6,z:-2.65,phase:.5}];
// Relative to the nest: three tension points on each of two separate tree trunks.
const ANCHORS=[{node:0,p:[-4.10,2.13,-.30]},{node:4,p:[-4.06,.38,-.29]},{node:8,p:[-4.05,-1.75,-.27]},{node:3,p:[4.12,2.18,-.24]},{node:7,p:[4.08,.10,-.23]},{node:11,p:[4.06,-1.83,-.22]}];
function sinewGeometry(startRadius,endRadius,sides=6){
 const g=new THREE.CylinderGeometry(endRadius,startRadius,1,sides,9),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),angle=Math.atan2(z,x),fiber=1+.12*Math.sin(angle*3+y*18)+.05*Math.cos(angle*5-y*35);p.setXYZ(i,x*fiber,y,z*fiber);}
 const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();return flat;
}
function bone(m,a,b,width=1){m.position.copy(a).add(b).multiplyScalar(.5);temp.subVectors(b,a);const len=temp.length();m.scale.set(width,len,width);if(len>.0001)m.quaternion.setFromUnitVectors(up,temp.multiplyScalar(1/len));}
// Project the supplied photograph onto a closed, faceted head, following its silhouette.
// Back UVs sample only the forehead skin; the background and photographed neck stay outside.
function photoHeadGeometry(back=false){
 const outline=[[385,122],[470,144],[553,192],[626,282],[663,389],[689,507],[680,594],[649,668],[606,709],[550,711],[490,680],[425,660],[367,640],[315,654],[230,648],[143,614],[90,552],[93,442],[137,343],[174,264],[210,202],[269,153],[329,126]];
 const rings=[.001,.24,.48,.70,.86,1],vertices=[],uvs=[],indices=[],n=outline.length,cx=378,cy=424;
 for(const r of rings)for(const [bx,by]of outline){const px=cx+(bx-cx)*r,py=cy+(by-cy)*r;vertices.push((px-cx)/270,(cy-py)/290,(back?-.59:.79)*Math.sqrt(Math.max(0,1-r*r)));uvs.push(back?(245+(px-cx)*.17)/744:px/744,back?1-(260+(py-cy)*.14)/830:1-py/830);}
 for(let ring=0;ring<rings.length-1;ring++)for(let j=0;j<n;j++){const a=ring*n+j,b=ring*n+(j+1)%n,c=a+n,d=b+n;indices.push(...(back?[a,c,b,b,c,d]:[a,b,c,b,d,c]));}
 for(let j=1;j<n-1;j++)indices.push(...(back?[0,j,j+1]:[0,j+1,j]));
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();return flat;
}
class NetworkEntity{
 constructor({scene,faceTexture,tendonTexture=null,home=new V(0,5.8,0),onState=()=>{},canSee=()=>true,moveOnGround=null,groundHeight=()=>0,homeYaw=0,anchorPoints=null,span=8.2}){
  this.scene=scene;this.groundHeight=groundHeight;this.homeYaw=homeYaw;this.home=home.clone();this.onState=onState;this.canSee=canSee;this.moveOnGround=moveOnGround;this.group=new THREE.Group();this.group.name='NovaNetworkEntity';this.group.scale.x=span/8.2;scene.add(this.group);this.clock=0;this.positions=NODES.map(()=>new V());this.heads=[];this.links=[];this.legs=[];this.anchors=[];
  const black=new THREE.MeshLambertMaterial({color:tendonTexture?0x999999:0x020202,map:tendonTexture});
  // No specular reflection. Bound diffuse brightness so even the torch leaves the tissue black.
  black.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );','outgoingLight = outgoingLight / (vec3(1.0) + outgoingLight / 0.022);\ngl_FragColor = vec4( outgoingLight, diffuseColor.a );');};
  black.customProgramCacheKey=()=> 'nova-black-sinew-v2';this.connectionMaterial=black;
  const face=new THREE.MeshLambertMaterial({map:faceTexture||null,color:0xffffff});
  // Cover the photograph's original eye highlights as well as the added eye meshes.
  // The mask follows the same photo UVs at every viewing angle and stays black in fog.
  if(faceTexture){face.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec2 eyePixel = vec2(vUv.x * 744.0, (1.0-vUv.y) * 830.0);
   float eyeMask = smoothstep(0.90,1.0,length((eyePixel-vec2(300.0,410.0))/vec2(31.0,32.0)))
                 * smoothstep(0.90,1.0,length((eyePixel-vec2(569.0,551.0))/vec2(34.0,35.0)));
   diffuseColor.rgb *= eyeMask;`).replace('#include <fog_fragment>','#include <fog_fragment>\ngl_FragColor.rgb *= eyeMask;');};face.customProgramCacheKey=()=> 'nova-black-photo-eyes-v47';}
  const skin=new THREE.MeshLambertMaterial({map:faceTexture||null,color:0x84917a});
  const eye=new THREE.MeshBasicMaterial({color:0x000000,toneMapped:false,fog:false});this.eyeMat=eye;
  const frontGeo=photoHeadGeometry(),backGeo=photoHeadGeometry(true),eyeGeo=new THREE.SphereGeometry(1,10,6);
  const eyeCounts=[2,3,4,2,5,3,2,4,3,5,2,4,3];
  // First two sockets match the photograph. Additional eyes sit asymmetrically on the skin.
  const eyePixels=[[300,410,25,29],[569,551,27,32],[404,283,24,30],[509,381,21,27],[370,555,24,29]];
  const ray=new THREE.Raycaster(),forward=new V(0,0,1);
  for(let i=0;i<NODES.length;i++){
   const h=new THREE.Group(),radius=NODES[i][3];h.name='PhotoHead'+i;h.userData.eyeCount=eyeCounts[i];h.userData.faceSource='user-photo';
   const front=new THREE.Mesh(frontGeo,face),back=new THREE.Mesh(backGeo,skin);front.name='PhotoFace';back.name='PhotoSkin';front.castShadow=front.receiveShadow=back.castShadow=back.receiveShadow=true;h.add(front,back);front.updateMatrixWorld(true);
   for(let j=0;j<eyeCounts[i];j++){
    const [px,py,rx,ry]=eyePixels[j],x=(px-378)/270,y=(424-py)/290;
    ray.set(new V(x,y,3),new V(0,0,-1));const hit=ray.intersectObject(front)[0];
    if(!hit)throw new Error('Eye placement missed photograph surface');
    const e=new THREE.Mesh(eyeGeo,eye);e.name='BlackEye';e.position.copy(hit.point).addScaledVector(hit.face.normal,.009);e.quaternion.setFromUnitVectors(forward,hit.face.normal);e.scale.set(rx/270,ry/290,.024);h.add(e);
   }
   h.scale.set(radius*(i%4===1?-1:1),radius,radius);this.group.add(h);this.heads.push(h);
  }
  // Tapered, irregular six-sided sinew, with lengthwise low-resolution fiber texture.
  const linkGeo=sinewGeometry(.025,.105);const otherGeo=sinewGeometry(.105,.025);
  for(const [a,b]of EDGES){const m1=new THREE.Mesh(linkGeo,black),m2=new THREE.Mesh(otherGeo,black);m1.castShadow=m2.castShadow=true;this.group.add(m1,m2);this.links.push({a,b,m1,m2,mid:new V()});}
  for(const spec of LIMBS){const upper=new THREE.Mesh(sinewGeometry(.045,.095),black),lower=new THREE.Mesh(sinewGeometry(.002,.085,5),black);upper.castShadow=lower.castShadow=true;this.group.add(upper,lower);this.legs.push({...spec,upper,lower,foot:new V(),start:new V(),goal:new V(),knee:new V(),p:1,ready:false});}
  for(const spec of ANCHORS){const m=new THREE.Mesh(sinewGeometry(.036,.068,5),black);m.castShadow=true;scene.add(m);this.anchors.push({node:spec.node,mesh:m,top:anchorPoints?anchorPoints[this.anchors.length].clone():new V(...spec.p).add(home),release:0});}
  this.reset();
 }
 change(state){if(this.state===state)return;this.state=state;this.stateTime=0;this.onState(state);}
 reset(){this.state='nest';this.stateTime=0;this.exposure=0;this.speed=0;this.gait=0;this.unseen=0;this.group.position.copy(this.home);this.group.rotation.set(0,this.homeYaw,0);this.lastSeen=new V(0,1.7,12);this.legs.forEach(l=>{l.ready=false;l.p=1;});this.pose(0);this.onState('nest');}
 illuminated(lamp){if(!lamp?.on)return false;for(let i=0;i<this.positions.length;i++){const p=this.positions[i].clone().applyMatrix4(this.group.matrixWorld),d=p.distanceTo(lamp.position);if(d>CONFIG.lightRange||d<.001)continue;temp.subVectors(p,lamp.position).normalize();if(temp.dot(lamp.direction)>Math.cos(CONFIG.lightHalfAngle)&&this.canSee(lamp.position,p))return true;}return false;}
 update(dt,{player,flashlight,canCatch=true}){
  dt=clamp(dt,0,.05);this.clock+=dt;this.stateTime+=dt;this.group.updateMatrixWorld(true);this.lit=this.illuminated(flashlight);
  if(this.state==='nest'||this.state==='alert'){
   const near=Math.hypot(player.x-this.home.x,player.z-this.home.z)<2.15;
   this.exposure=clamp(this.exposure+dt*(this.lit?1:-.85),0,CONFIG.exposureSeconds);
   if(near||this.exposure>=CONFIG.exposureSeconds){this.lastSeen.copy(player);this.change('unfold');}else if(this.exposure>.12&&this.state==='nest')this.change('alert');else if(this.exposure===0&&this.state==='alert')this.change('nest');
  }else if(this.state==='unfold'){if(this.stateTime>CONFIG.unfoldSeconds)this.change('drop');}
  else if(this.state==='drop'){
   const t=clamp(this.stateTime/CONFIG.dropSeconds,0,1),ease=t*t;this.group.position.y=this.home.y+(this.groundHeight(this.home.x,this.home.z)+2.48-this.home.y)*ease;
   if(t===1){this.legs.forEach(l=>l.ready=false);this.change('hunt');}
  }else if(this.state==='hunt'||this.state==='search'||this.state==='return'){
   const center=this.group.position,dist=Math.hypot(player.x-center.x,player.z-center.z),eye=center.clone().add(new V(0,.3,0));
   const visible=dist<33&&this.canSee(eye,player);
   if(visible&&this.state!=='return'){this.lastSeen.copy(player);this.unseen=0;if(this.state==='search')this.change('hunt');}else this.unseen+=dt;
   if(this.state==='hunt'&&this.unseen>CONFIG.loseSightSeconds)this.change('search');
   if(this.state==='search'&&this.stateTime>CONFIG.searchSeconds)this.change('return');
   const target=this.state==='return'?this.home:this.lastSeen,dx=target.x-center.x,dz=target.z-center.z,len=Math.hypot(dx,dz);
   const desired=this.state==='hunt'?CONFIG.huntSpeed:this.state==='search'?1.3:3.4;
   this.speed+=(len>.6?desired-this.speed:-this.speed)*Math.min(1,dt*3.5);
   if(len>.5){const yaw=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(yaw-this.group.rotation.y),Math.cos(yaw-this.group.rotation.y));this.group.rotation.y+=delta*Math.min(1,dt*4);const step={x:dx/len*this.speed*dt,z:dz/len*this.speed*dt};if(this.moveOnGround)this.moveOnGround(center,step,this);else{center.x+=step.x;center.z+=step.z;}}
   this.gait+=dt*this.speed*.29;center.y=this.groundHeight(center.x,center.z)+2.48+Math.sin(this.gait*Math.PI*4)*.12;
   if(canCatch&&this.state==='hunt'&&dist<CONFIG.catchRadius&&Math.abs(player.y-this.groundHeight(center.x,center.z)-1.68)<1.5&&this.canSee(eye,player))this.change('caught');
   if(this.state==='return'&&len<.75)this.change('climb');
  }else if(this.state==='climb'){const t=clamp(this.stateTime/2.2,0,1);this.group.position.lerp(this.home,dt*2);const base=this.groundHeight(this.home.x,this.home.z)+2.48;this.group.position.y=base+(this.home.y-base)*t;this.group.rotation.y+=(this.homeYaw-this.group.rotation.y)*Math.min(1,dt*3);if(t===1)this.reset();}
  this.pose(dt);
 }
 pose(dt){
  const active=['hunt','search','return','caught'].includes(this.state),unfold=this.state==='unfold'?clamp(this.stateTime/CONFIG.unfoldSeconds,0,1):this.state==='drop'||active?1:0;
  const hanging=!active&&this.state!=='drop';const shake=this.state==='alert'?this.exposure*.03:this.state==='unfold'?.025:0;
  for(let i=0;i<NODES.length;i++){
   const [x,y,z]=NODES[i],p=this.positions[i];p.set(x*(1+unfold*.12),y*(active?.68:1-unfold*.08),z+unfold*Math.sin(i*2.1)*.42);
   p.x+=Math.sin(this.clock*.48+i*.4)*.045+Math.sin(this.clock*35+i)*shake;
   p.y+=Math.sin(this.clock*.65+i*.9)*.065+(active?Math.sin(this.gait*6+i)*.035:0);
   this.heads[i].position.copy(p);this.heads[i].rotation.set(Math.sin(this.clock*.5+i)*.11,(i%3-1)*.14+Math.sin(this.clock*.6+i)*.1,(i%2?-.15:.12)+Math.sin(this.clock*.8+i)*.05);
  }
  for(const l of this.links){const a=this.positions[l.a],b=this.positions[l.b];l.mid.copy(a).lerp(b,.48);bone(l.m1,a,l.mid);bone(l.m2,l.mid,b);}
  this.group.updateMatrixWorld(true);
  for(const l of this.legs){
   const a=this.positions[l.node],side=Math.sign(l.x),knee=l.knee;
   if(!active){
    const tip=new V(l.x*(.87+unfold*.12),-2.0-Math.abs(l.z)*.40-unfold*.35,l.z*(.35+unfold*.6));knee.set(l.x*.79,a.y+side*.22+unfold*.2,l.z*.34);bone(l.upper,a,knee);bone(l.lower,tip,knee);
   }else{
    const ideal=new V(l.x,-this.group.position.y+.045,l.z+.48).applyMatrix4(this.group.matrixWorld);ideal.y=this.groundHeight(ideal.x,ideal.z)+.045;
    if(!l.ready){l.foot.copy(ideal);l.ready=true;}
    const phase=(this.gait+l.phase)%1;
    if(phase<.44&&l.p>=1&&this.speed>.1){l.start.copy(l.foot);l.goal.copy(ideal);l.p=0;}
    if(l.p<1){l.p=Math.min(1,l.p+dt*Math.max(1.8,this.speed*.78));l.foot.lerpVectors(l.start,l.goal,l.p);l.foot.y=this.groundHeight(l.foot.x,l.foot.z)+.045+Math.sin(l.p*Math.PI)*.7;}
    if(l.foot.distanceTo(ideal)>2.0)l.foot.lerp(ideal,.4);
    const foot=this.group.worldToLocal(l.foot.clone());knee.set(l.x*.78,a.y*.35+.4,l.z*.67);bone(l.upper,a,knee);bone(l.lower,foot,knee);
   }
  }
  for(let i=0;i<this.anchors.length;i++){const a=this.anchors[i];
   const released=this.state==='unfold'&&unfold>(.50+i*.066);
   a.mesh.visible=hanging&&this.state!=='climb'&&!released;
   if(a.mesh.visible){const p=this.positions[a.node].clone().applyMatrix4(this.group.matrixWorld);bone(a.mesh,p,a.top);}
  }
  // Eye sockets remain matte black in every state, including in the flashlight beam.
 }
 snapshot(){return{state:this.state,exposure:+this.exposure.toFixed(2),lit:this.lit,position:this.group.position.toArray(),speed:+this.speed.toFixed(2),heads:NODES.length,connections:EDGES.length};}
 dispose(){this.group.traverse(o=>{if(o.isMesh)o.geometry.dispose();});const mats=new Set();this.group.traverse(o=>{if(o.isMesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));});mats.forEach(m=>m.dispose());this.anchors.forEach(a=>{a.mesh.geometry.dispose();this.scene.remove(a.mesh);});this.scene.remove(this.group);}
}
root.NovaNetwork={NetworkEntity,CONFIG,NODES,EDGES,ANCHORS};
})(typeof window!=='undefined'?window:globalThis);
