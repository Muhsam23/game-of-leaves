// Shared geometry and walking surfaces for the coastal lighthouse and forest remnants.
(() => {
'use strict';
const T=window.NovaTerrain,L=window.NovaLandmarks,TAU=Math.PI*2;
const lighthouse={x:340,z:T.shore(340)+26,radius:4,inner:3.45,platformRadius:4.9,height:18,steps:96,turns:3};
const H=lighthouse;H.base=T.height(H.x,H.z)+.12;H.rise=H.height/H.steps;H.angle=TAU*H.turns/H.steps;
H.start={x:H.x,z:H.z+11,yaw:0,pitch:.07};
const random=T.rng(16052000),pipes=[];let barrel;
for(let i=0;i<3000&&pipes.length<6;i++){
 const x=-440+random()*880,z=115+random()*370,e=T.env(x,z);
 if(e.h<1||e.d<145||e.wet>.48||e.path<9||e.pool<2.8||e.rt<2.2||T.inRuin(x,z,30)||Math.hypot(x-L.tower.x,z-L.tower.z)<65||L.blocked(x,z,4)||pipes.some(p=>Math.hypot(x-p.x,z-p.z)<95))continue;
 // Keep the rim supported on reasonably level ground.
 if([0,1,2,3].some(a=>Math.abs(T.height(x+Math.sin(a*Math.PI/2),z+Math.cos(a*Math.PI/2))-e.h)>.17))continue;
 pipes.push({x,z,y:e.h,yaw:random()*TAU,radius:.84,depth:3.2});
}
if(pipes.length!==6)throw new Error('Forest remnants need six clear locations.');
barrel={...pipes.pop(),radius:.43};
function near(x,z,pad=0){return Math.hypot(x-H.x,z-H.z)<H.platformRadius+pad;}
function reserved(x,z,pad=0){return near(x,z,5+pad)||[...pipes,barrel].some(p=>Math.hypot(x-p.x,z-p.z)<p.radius+1.2+pad);}
const angleAt=(x,z)=>(Math.atan2(x-H.x,z-H.z)+TAU)%TAU;
function platformAt(r,a){return r>=1.32&&r<=4.58&&!(r<3.35&&a>TAU-Math.PI&&a<TAU-.20);}
// Resolve the nearest reachable turn, never a different floor above the player.
function walkHeight(x,z,previous=L.walkHeight(x,z)){
 if(!near(x,z,6))return L.walkHeight(x,z);
 const dx=x-H.x,dz=z-H.z,r=Math.hypot(dx,dz),a=angleAt(x,z),rel=previous-H.base,candidates=[];
 if(r>4.3){
  let ground=L.walkHeight(x,z);
  if(Math.abs(dx)<1.05&&dz>3.3&&dz<9)ground=T.height(x,z)+(H.base-T.height(x,z))*(1-T.smooth(4.3,9,dz));
  candidates.push(ground);
 }else if(r>3.13||r<1.32||rel<.1)candidates.push(H.base);
 if(r>=1.32&&r<=3.13){
  for(let turn=0;turn<H.turns;turn++){
   const index=Math.min(H.steps-1,Math.floor((a+turn*TAU)/H.angle));
   candidates.push(H.base+(index+1)*H.rise);
  }
 }
 if(platformAt(r,a))candidates.push(H.base+H.height);
 const reachable=candidates.filter(y=>Math.abs(y-previous)<=.285);
 if(!reachable.length)return null;
 reachable.sort((a,b)=>Math.abs(a-previous)-Math.abs(b-previous));
 // At the foot of the stairs, step onto the first tread instead of staying below it.
 if(rel<.3&&r>=1.32&&r<=3.13&&a<H.angle*1.001)return H.base+H.rise;
 return reachable[0];
}
function blocked(x,z,foot=L.walkHeight(x,z)){
 if(pipes.some(p=>Math.hypot(x-p.x,z-p.z)<p.radius+.28)||Math.hypot(x-barrel.x,z-barrel.z)<barrel.radius+.3)return true;
 if(!near(x,z,6))return false;
 const dx=x-H.x,dz=z-H.z,r=Math.hypot(dx,dz),rel=foot-H.base;
 if(rel>H.height-.3){
  if(r>4.58||r<1.32)return true;
  return walkHeight(x,z,foot)===null;
 }
 // The only ground-level opening faces inland. Windows are not entrances.
 if(r>3.12&&r<4.3&&!(Math.abs(dx)<.72&&dz>0&&rel<.5))return true;
 if(r<1.32)return true;
 if(rel>.35&&r>3.13)return true;
 return walkHeight(x,z,foot)===null;
}
function createVisuals(THREE,scene,textures,models){
 const group=new THREE.Group();group.name='Overgrown coastal lighthouse and forest remnants';scene.add(group);
 const concrete=new THREE.MeshLambertMaterial({map:textures.ruin,color:0xb5b4a2,side:THREE.DoubleSide});
 const inner=new THREE.MeshLambertMaterial({map:textures.ruin,color:0x454b40,side:THREE.BackSide});
 const rust=new THREE.MeshLambertMaterial({map:textures.rust,color:0x8a6546,side:THREE.DoubleSide});
 const dark=new THREE.MeshLambertMaterial({color:0x070c09}),moss=new THREE.MeshLambertMaterial({map:textures.moss,color:0x627347,side:THREE.DoubleSide});
 const wood=new THREE.MeshLambertMaterial({color:0x4d4937}),glass=new THREE.MeshLambertMaterial({color:0x627f79,transparent:true,opacity:.34,side:THREE.DoubleSide});
 const pools=new Map(),details=[];
 function flush(name,position,range){const part=new THREE.Group();part.name=name;group.add(part);details.push({part,x:position.x,z:position.z,range});
 for(const [mat,list]of pools){const g=new THREE.BufferGeometry();for(const name of ['position','normal','uv']){const size=name==='uv'?2:3,values=new Float32Array(list.reduce((n,a)=>n+a.attributes[name].array.length,0));let offset=0;for(const a of list){values.set(a.attributes[name].array,offset);offset+=a.attributes[name].array.length;}g.setAttribute(name,new THREE.BufferAttribute(values,size));}if(mat.vertexColors)g.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1),3));g.computeBoundingSphere();const mesh=new THREE.Mesh(g,mat);mesh.castShadow=true;mesh.receiveShadow=true;part.add(mesh);list.forEach(g=>g.dispose());}
 pools.clear();return part;}
 function add(g,mat,x=0,y=0,z=0){g.translate(x,y,z);if((mat===concrete||mat===inner)&&g.type!=='BufferGeometry'&&g.attributes.uv){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,.03+uv.getX(i)*.44,.53+uv.getY(i)*.44);}const a=g.index?g.toNonIndexed():g;if(g!==a)g.dispose();if(!a.attributes.normal)a.computeVertexNormals();if(!a.attributes.uv)a.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(a.attributes.position.count*2),2));if(!pools.has(mat))pools.set(mat,[]);pools.get(mat).push(a);}
 function beam(a,b,r,mat=rust){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),v=end.clone().sub(start),g=new THREE.CylinderGeometry(r,r,v.length(),6);g.applyMatrix4(new THREE.Matrix4().compose(start.add(end).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()),new THREE.Vector3(1,1,1)));add(g,mat);}
 function ring(r0,r1,y0,y1,a0=0,a1=TAU,mat=concrete,ox=H.x,oz=H.z){
  const p=[],uv=[],n=Math.max(1,Math.ceil((a1-a0)/(TAU/96))),point=(r,y,a)=>[ox+Math.sin(a)*r,y,oz+Math.cos(a)*r];
  function quad(a,b,c,d){const corners=[[.03,.53],[.47,.53],[.47,.97],[.03,.53],[.47,.97],[.03,.97]];for(const [i,v]of [a,b,c,a,c,d].entries()){p.push(...v);uv.push(...(mat===concrete?corners[i]:[v[0]*.32,v[1]*.32+v[2]*.13]));}}
  for(let i=0;i<n;i++){const a=a0+(a1-a0)*i/n,b=a0+(a1-a0)*(i+1)/n;
   quad(point(r0,y1,a),point(r1,y1,a),point(r1,y1,b),point(r0,y1,b));
   quad(point(r1,y0,a),point(r1,y0,b),point(r1,y1,b),point(r1,y1,a));
   quad(point(r0,y0,b),point(r0,y0,a),point(r0,y1,a),point(r0,y1,b));
   quad(point(r0,y0,b),point(r1,y0,b),point(r1,y0,a),point(r0,y0,a));
  }
  for(const a of [a0,a1])quad(point(r0,y0,a),point(r1,y0,a),point(r1,y1,a),point(r0,y1,a));
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();add(g,mat);
 }
 // Hollow concrete shafts: real open rims, dark inside walls, and a bottom below soil.
 for(const p of pipes){
  ring(.65,.84,p.y-3.2,p.y+.23,0,TAU,concrete,p.x,p.z);
  add(new THREE.CylinderGeometry(.646,.646,3.15,28,1,true),inner,p.x,p.y-1.36,p.z);
  const bottom=new THREE.CircleGeometry(.65,28);bottom.rotateX(-Math.PI/2);add(bottom,dark,p.x,p.y-3.17,p.z);
  ring(.84,.92,p.y-.05,p.y+.055,.4,4.7,moss,p.x,p.z);
  flush('Concrete shaft',p,110);
 }
 // A single additional closed steel drum, including its lid, sealed bungs and rolled hoops.
 add(new THREE.CylinderGeometry(.43,.43,1.12,24),rust,barrel.x,barrel.y+.56,barrel.z);
 for(const y of [.035,.32,.83,1.10])ring(.422,.453,barrel.y+y,barrel.y+y+.035,0,TAU,rust,barrel.x,barrel.z);
 for(const [x,z,r]of [[.18,.1,.06],[-.17,-.12,.027]])add(new THREE.CylinderGeometry(r,r,.026,12),rust,barrel.x+x,barrel.y+1.13,barrel.z+z);
 flush('Closed rusty forest barrel',barrel,100);
 // Foundation and a gently sloped approach keep the doorway connected to the terrain.
 ring(0,4.28,H.base-.65,H.base);
 const ramp=new THREE.BufferGeometry(),p=[];for(const [x,z]of [[-1.03,4.1],[1.03,4.1],[-1.03,9],[1.03,9]])p.push(H.x+x,z<5?H.base:T.height(H.x+x,H.z+z)+.01,H.z+z);
 ramp.setAttribute('position',new THREE.Float32BufferAttribute(p,3));ramp.setIndex([0,2,1,1,2,3]);ramp.computeVertexNormals();add(ramp,concrete);
 // Weathered circular walls, one doorway and narrow staggered windows.
 for(let row=0;row<12;row++)for(let seg=0;seg<48;seg++){
  const a=(seg+.5)*TAU/48,door=Math.min(a,TAU-a)<.27&&row<2;
  const window=(row===3||row===6||row===9)&&[6,18,30,42].includes(seg);
  if(!door&&!window)ring(3.47,3.94,H.base+row*1.5,H.base+(row+1)*1.5,seg*TAU/48,(seg+1)*TAU/48);
 }
 add(new THREE.CylinderGeometry(.94,1.02,H.height,24),concrete,H.x,H.base+H.height/2,H.z);
 for(let i=0;i<H.steps;i++){
  const y=H.base+(i+1)*H.rise,a=i*H.angle,b=(i+1)*H.angle;
  ring(1.05,3.42,y-.14,y,a,b,rust);
  for(const r of [1.10,3.28]){
   if(r>3&&(i===0||i>=94))continue; // clear radial entrances at the foot and landing
   const point=(angle,height)=>[H.x+Math.sin(angle)*r,height,H.z+Math.cos(angle)*r];
   beam(point(a,y+1.04),point(b,y+H.rise+1.04),.033);
   if(i%2===0)beam(point(a,y),point(a,y+1.04),.026);
  }
 }
 // Outer viewing ring and inner deck; the last half-turn remains an open stairwell.
 ring(3.35,4.9,H.base+18-.23,H.base+18);
 ring(1.05,3.35,H.base+18-.23,H.base+18,0,TAU-Math.PI);
 ring(1.05,3.35,H.base+18-.23,H.base+18,TAU-.20,TAU);
 for(let i=0;i<64;i++){
  const a=i*TAU/64,b=(i+1)*TAU/64,point=(t,y)=>[H.x+Math.sin(t)*4.76,y,H.z+Math.cos(t)*4.76];
  beam(point(a,H.base+18),point(a,H.base+19.15),.035);
  for(const h of [.55,1.15])beam(point(a,H.base+18+h),point(b,H.base+18+h),.04);
 }
 // Small abandoned lantern above the deck, with tarnished panes and a rusty cap.
 add(new THREE.CylinderGeometry(1.15,1.15,.8,16),concrete,H.x,H.base+18.4,H.z);
 add(new THREE.CylinderGeometry(1.12,1.12,1.65,16,1,true),glass,H.x,H.base+19.62,H.z);
 for(let i=0;i<8;i++){const a=i*TAU/8;beam([H.x+Math.sin(a)*1.14,H.base+18.8,H.z+Math.cos(a)*1.14],[H.x+Math.sin(a)*1.14,H.base+20.5,H.z+Math.cos(a)*1.14],.045);}
 add(new THREE.ConeGeometry(1.65,.78,24),rust,H.x,H.base+20.85,H.z);
 add(new THREE.CylinderGeometry(.19,.29,.55,12),rust,H.x,H.base+19.6,H.z);
 // Dense ivy ribbons with five-lobed leaves, woody runners and hanging balcony growth.
 const rng=T.rng(161618),shape=new THREE.Shape(),outline=[[0,.9],[-.21,.43],[-.66,.57],[-.44,.12],[-.84,-.12],[-.4,-.3],[-.36,-.68],[0,-.47],[.36,-.68],[.4,-.3],[.84,-.12],[.44,.12],[.66,.57],[.21,.43]];
 outline.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const leafGeo=new THREE.ShapeGeometry(shape),leafMat=new THREE.MeshLambertMaterial({map:textures.moss,color:0x8d9c65,side:THREE.DoubleSide});
 const leaves=[],dummy=new THREE.Object3D();
 for(let vine=0;vine<65;vine++){
  const a0=rng()*TAU,height=10+rng()*7.9,phase=rng()*TAU;
  let previous;
  for(let y=.1;y<height;y+=.23){
   const a=a0+Math.sin(y*.43+phase)*.10+Math.sin(y*1.4+phase)*.026,r=3.97+.035*Math.sin(y*1.7),x=H.x+Math.sin(a)*r,z=H.z+Math.cos(a)*r;
   if(y<2.8&&Math.abs(x-H.x)<1.25&&z>H.z)continue;
   const p=[x,H.base+y,z];if(previous)beam(previous,p,.022,wood);previous=p;
   for(let k=0;k<5;k++){const aa=a+(rng()-.5)*.24,rr=r+.05+rng()*.16;leaves.push({x:H.x+Math.sin(aa)*rr,y:H.base+y+(rng()-.5)*.4,z:H.z+Math.cos(aa)*rr,a:aa,s:.16+rng()*.16,rot:(rng()-.5)*1.8});}
  }
 }
 for(let i=0;i<370;i++){const a=rng()*TAU,y=H.base+18.7-rng()*2.5;if(a<.4||a>TAU-.3)continue;leaves.push({x:H.x+Math.sin(a)*4.9,y,z:H.z+Math.cos(a)*4.9,a,s:.2+rng()*.16,rot:rng()*2});}
 const ivy=new THREE.InstancedMesh(leafGeo,leafMat,leaves.length);ivy.name='Ivy leaves';leafGeo.boundingSphere=new THREE.Sphere(new THREE.Vector3(H.x,H.base+9,H.z),14);leaves.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(.12,p.a,p.rot);dummy.scale.setScalar(p.s);dummy.updateMatrix();ivy.setMatrixAt(i,dummy.matrix);});ivy.receiveShadow=true;group.add(ivy);
 // Bracken and tall grasses cluster against the base, leaving the entrance open.
 for(let i=0;i<45;i++){
  const a=.4+rng()*(TAU-.8),r=4.25+rng()*1.1,x=H.x+Math.sin(a)*r,z=H.z+Math.cos(a)*r,model=models.get(i%3?'dryopteris-carthusiana':'calamagrostis-epigejos');
  if(!model)continue;const scale=.65+rng()*.7,matrix=new THREE.Matrix4().compose(new THREE.Vector3(x,T.height(x,z),z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),a),new THREE.Vector3(scale,scale,scale));
  for(const p of model.parts)add(p.geometry.clone().applyMatrix4(matrix),p.material);
 }
 const towerPart=flush('Lighthouse',H,450);towerPart.add(ivy);
 group.update=(x,z)=>{for(const p of details)p.part.visible=Math.hypot(x-p.x,z-p.z)<p.range;};
 return group;
}
window.NovaCoast={lighthouse,pipes,barrel,near,reserved,walkHeight,blocked,createVisuals};
})();
