// A grounded electronics works. Only the inner test corridor breaks its rules.
(() => {
'use strict';
const T=window.NovaTerrain,base=T.ruins[0].y,floor=base+.12;
const passage={doorX:-101,thresholdX:-91,switchX:-91.18,z:210,width:4,height:6};
const bounds={x0:-175,x1:-81,z0:178,z1:224},pieces=[],plants=[],vines=[];
const random=T.rng(20001986),range=(a,b)=>a+(b-a)*random();
function box(out,x,y,z,sx,sy,sz,cell=0,color=null,solid=true){
 const p={x,y:base+y,z,sx,sy,sz,cell,geo:'box',t:1,solid,factory:true};
 if(color!==null){p.surface='plain';p.color=color;}
 out.push(p);return p;
}
const b=(...a)=>box(pieces,...a);
function rail(x0,z0,x1,z1,y,h,th=.38,cell=0){
 const n=Math.ceil(Math.hypot(x1-x0,z1-z0)/3),dx=(x1-x0)/n,dz=(z1-z0)/n;
 for(let i=0;i<n;i++)b(x0+(i+.5)*dx,y+h/2,z0+(i+.5)*dz,Math.abs(dx)||th,h,Math.abs(dz)||th,cell);
}
function facade(x0,z0,x1,z1,door=false){
 const len=Math.hypot(x1-x0,z1-z0),n=Math.ceil(len/4.8),dx=(x1-x0)/n,dz=(z1-z0)/n;
 for(let i=0;i<n;i++){
  const x=x0+(i+.5)*dx,z=z0+(i+.5)*dz;
  // Reserve the entrance all the way down to its floor.
  if(!(door&&x>-151&&x<-139))rail(x0+i*dx,z0+i*dz,x0+(i+1)*dx,z0+(i+1)*dz,0,1.55);
  for(const [y,h]of [[3.05,1.55],[6.1,.55],[8.25,.5]])rail(x0+i*dx,z0+i*dz,x0+(i+1)*dx,z0+(i+1)*dz,y,h);
 }
 for(let i=0;i<=n;i++){
  const x=x0+i*dx,z=z0+i*dz;
  if(door&&x>-148&&x<-142)continue;
  b(x,4.375,z,.5,8.75,.5);
  // Rusted metal window mullions are attached to the masonry bands.
  if(i<n)for(const y of [2.3,5.35,7.45]){
   if(door&&y<3&&x+dx*.5>-151&&x+dx*.5<-139)continue;
   b(x+dx*.5,y,z+dz*.5,.06,y>7?1.6:1.5,.06,2,null,false);
  }
 }
}
// Slabs, columns and beams meet exactly, with several open roof courtyards.
b(-128,-.12,201,94,.48,46,0); // walkable top at +.12
facade(-175,224,-81,224,true);facade(-175,178,-81,178);
facade(-175,178,-175,224);facade(-81,178,-81,224);
// The six metre entry sits within a larger damaged opening.
b(-149.1,1.58,224,.7,3.16,.7);b(-140.9,1.58,224,.7,3.16,.7);
b(-145,3.15,224,8.9,.42,.7);
for(const x of [-150,-128,-105])for(const z of [178,200,224])b(x,4.2,z,.6,8.4,.6);
for(const z of [178,200,224])rail(-175,z,-81,z,8.1,.55,.6);
for(const x of [-175,-150,-128,-105,-81])rail(x,178,x,224,8.1,.55,.6);
for(const [x,z,w,d]of [[-162.5,211.5,25,25],[-145,189,10,22],[-122.5,201,35,46],[-93,211.5,24,25],[-93,180,24,4]])b(x,8.6,z,w,.3,d);
// A low test corridor runs under the tall factory hall.
b(-149,2.1,191.5,.4,4.2,27);b(-141,2.1,191.5,.4,4.2,27);
b(-145,4.2,191.5,8.4,.25,27);
// The old straight test corridor now remains an ordinary part of the factory.
// Two connected assembly rooms, yellowed partitions and a clear cross aisle.
// Computer-room partitions meet the six-metre passage at the same top elevation.
function computerWall(x,z,w,d){return b(x,.12+passage.height/2,z,w,passage.height,d,0,0xa3a68d);}
for(const [x,z,w]of [[-160,207,18],[-119,202,36],[-119,215,36]]){
 if(x===-119)computerWall(x,z,w,.24);else b(x,1.85,z,w,3.7,.24,0,0xa3a68d);
 b(x,.58,z+.14,w,1.1,.04,0,0x536958,false);
}
// A break in each transverse partition leaves a broad walkable doorway.
for(const x of [-137,-101]){
 computerWall(x,205,.24,6);
 computerWall(x,213.5,.24,3);
}
// A ten-metre enclosed passage leaves the computer room through its right wall.
// These pieces supply collision; their identical unlit meshes are shared across the seam.
const vestibulePieces=[];
function vestibule(x,y,z,w,h,d,color=null){const p=b(x,y+.12,z,w,h,d,0,color);p.vestibule=true;vestibulePieces.push(p);}
const mid=(passage.doorX+passage.thresholdX)/2,length=passage.thresholdX-passage.doorX;
vestibule(mid,-.13,passage.z,length,.26,4.4);
vestibule(mid,passage.height+.12,passage.z,length,.24,4.4);
for(const side of [-1,1]){
 vestibule(mid,passage.height/2,passage.z+side*2.2,length,passage.height,.25);
 vestibule(mid,.7,passage.z+side*2.055,length,1.3,.035,0x394333);
}
for(const x of [-100.8,-97,-93.2]){
 for(const side of [-1,1])vestibule(x,(passage.height-.2)/2,passage.z+side*1.93,.14,passage.height-.2,.12,0x424738);
 vestibule(x,passage.height-.2,passage.z,.14,.14,3.98,0x424738);
 vestibule(x+.6,passage.height-.08,passage.z,1.25,.035,.28,0x677b64);
}
// Weathered exterior service stack on an actual plinth.
b(-86,1,184,4.2,2,4.2,1);
for(let i=0;i<7;i++)b(-86,3+i*1.7,184,2.7-i*.12,2,2.7-i*.12,1);
// The former document desk has been removed; the delivery canopy remains.
for(const x of [-151,-139]){b(x,1.65,229,.25,3.3,.25,2);rail(x,224,x,229,3.25,.2,.25,2);}
b(-145,3.5,226.5,12.6,.3,5.6);

// Shared equipment recipe makes the deliberate repeated rooms exactly alike.
function workstation(out,x,z,variant=0){
 const put=(...args)=>box(out,...args),cream=0xa4a18a,dark=0x262f2c;
 put(x,.94,z,1.9,.12,.92,0,0x888b74);
 for(const dx of [-.8,.8])for(const dz of [-.33,.33])put(x+dx,.48,z+dz,.09,.86,.09,2);
 put(x,1.10,z-.1,.72,.18,.55,0,cream);
 put(x,1.47,z-.19,.84,.64,.6,0,cream);
 put(x,1.49,z+.118,.64,.43,.022,0,dark,false);
 put(x,1.46,z+.133,.54,.31,.012,0,variant?0x5f8064:0x76938b,false);
 put(x,1.016,z+.30,.68,.035,.22,0,0xbbb79d,false);
 for(let i=0;i<5;i++)put(x-.24+i*.12,1.04,z+.30,.035,.012,.12,0,0x505749,false);
 put(x+.63,1.01,z,.32,.025,.49,0,0x3a6243,false);
 for(let i=0;i<3;i++)put(x+.63,1.04,z-.15+i*.15,.17,.03,.075,0,0x232a27,false);
}
for(const x of [-168,-164,-160,-156])for(const z of [212,216]){
 if((x===-168&&z===216)||(x===-160&&z===212))continue;
 workstation(pieces,x,z);
}
for(const x of [-132,-127,-122,-117,-112,-107])for(const z of [204,213])workstation(pieces,x,z,1);
// Equipment racks: boards and chips, not anonymous concrete blocks.
for(const x of [-171,-167,-163,-132,-126,-120,-114]){
 const z=x<-150?183:182;
 b(x,1.32,z,1.65,2.4,.65,0,0x636c61);
 for(let i=0;i<5;i++){
  b(x,.44+i*.4,z+.342,1.35,.26,.028,0,0x3d6149,false);
  for(let j=0;j<4;j++)b(x-.48+j*.32,.44+i*.4,z+.37,.18,.16,.03,0,0x272f2a,false);
 }
}
function corridorModule(out,z){
 for(const x of [-148.5,-141.5])box(out,x,1.85,z,.26,3.46,.32,2);
 box(out,-145,3.57,z,7.26,.18,.32,2);
 workstation(out,-147.25,z-3,1);
 // The same rust patch and green lower wall panel recur in every module.
 box(out,-141.216,1.18,z-3,.02,2.05,3.3,0,0x536758,false);
 box(out,-148.784,1.38,z-6,.02,1.1,1.7,2,null,false);
 box(out,-145,4.048,z-3,1.5,.045,.24,0,0xb9c5a2,false);
}
for(const z of [201,191,181])corridorModule(pieces,z);
// Rooted saplings in roof openings, shrubs on supported roof slabs, ferns in cracks.
for(const [id,x,z,h,support]of [
 ['betula-pendula',-163,191,6.1,'courtyard'],['sorbus-aucuparia',-156,185,4.4,'courtyard'],
 ['betula-pendula',-94,191,6.8,'courtyard'],['salix-caprea',-100,185,4.5,'courtyard'],
 ['sorbus-aucuparia',-132,218,3.4,'roof'],['betula-pendula',-166,213,3.6,'roof'],
 ['dryopteris-carthusiana',-142.3,197,.9,'floor'],['dryopteris-carthusiana',-142.3,187,.9,'floor'],
 ['dryopteris-carthusiana',-150.7,219,1.1,'floor'],['dryopteris-carthusiana',-139,218,1.3,'floor']])
 plants.push({id,x,z,scale:h,y:base+(support==='roof'?8.75:.12),support:'factory-'+support});
for(let i=0;i<100;i++){
 const x=range(-174,-82),z=range(179,223),roof=i<35;
 if(roof&&((x<-150&&z<199)||(x>-105&&z<199)||(Math.abs(x+145)<5)))continue;
 if(!roof&&!plantArea(x,z))continue;
 plants.push({id:i%3?'dryopteris-carthusiana':'calamagrostis-epigejos',x,z,scale:range(.9,1.65),y:base+(roof?8.75:.12),support:roof?'factory-roof':'factory-floor'});
}
// Continuous climbing foliage follows facades, never hangs unsupported in air.
function climb(x,z,yaw,maxH){
 const width=range(.85,1.55),height=range(2.5,maxH),lean=range(-.4,.4);
 for(let y=.45;y<height;y+=.67){
  const along=Math.sin(y*1.9+x)*.27+lean*y*.11;
  vines.push({x:x+Math.cos(yaw)*along,y:base+y,z:z-Math.sin(yaw)*along,yaw,width:width*range(.8,1.2),height:1.6});
 }
}
for(let x=-174;x<-82;x+=1.45){
 if(Math.abs(x+145)>4.8)climb(x,224.29,0,9.9);
 if(random()>.22)climb(x,177.7,Math.PI,9.3);
}
for(let z=179;z<224;z+=1.5){climb(-175.29,z,-Math.PI/2,9.7);if(random()>.2)climb(-80.71,z,Math.PI/2,9.4);}
for(const x of [-150,-128,-105])for(const z of [200,224])climb(x,z+.34,0,8.6);
function contains(x,z){return x>bounds.x0&&x<bounds.x1&&z>bounds.z0&&z<bounds.z1;}
function aisle(x,z){return (Math.abs(x+145)<3.4&&z>178&&z<240)||(x>-173&&x<-83&&Math.abs(z-209.5)<1.4);}
function plantArea(x,z){
 if(aisle(x,z))return false;
 if(!contains(x,z))return true;
 return (x<-151&&z<198)||(x>-104&&z<198)||(z>220&&Math.abs(x+145)>6);
}
function createTraversal(){return window.NovaBackrooms.createTraversal();}

function pieceGeometry(THREE,p){
 const counts=[p.sx,p.sy,p.sz].map(v=>Math.max(1,Math.ceil(v/2.5)));
 const g=new THREE.BoxGeometry(p.sx,p.sy,p.sz,...(p.surface?[1,1,1]:counts)).toNonIndexed();
 if(p.surface)return g;
 const uv=g.attributes.uv;
 // Repeat the atlas cell per panel, rather than stretching a single photograph
 // over a ninety-metre floor or corridor. Separate triangle UVs avoid atlas bleed.
 for(const group of g.groups){
  const axis=Math.floor(group.materialIndex/2),nu=counts[axis===0?2:0],nv=counts[axis===1?2:1];
  for(let i=group.start;i<group.start+group.count;i+=3){
   const u0=Math.floor((uv.getX(i)+uv.getX(i+1)+uv.getX(i+2))*nu/3+1e-5),v0=Math.floor((uv.getY(i)+uv.getY(i+1)+uv.getY(i+2))*nv/3+1e-5);
   for(let j=i;j<i+3;j++)uv.setXY(j,((p.cell%2)+.03+(uv.getX(j)*nu-u0)*.94)/2,((1-Math.floor(p.cell/2))+.03+(uv.getY(j)*nv-v0)*.94)/2);
  }
 }
 return g;
}

function createVisuals(THREE,scene,textures,floraModels,travel){
 const group=new THREE.Group();group.name='Factory climbing foliage';scene.add(group);
 const leafMat=new THREE.MeshLambertMaterial({map:textures.birch,color:0x73865c,side:THREE.DoubleSide,alphaTest:.4});
 const leafGeo=new THREE.PlaneGeometry(1,1),ivy=new THREE.InstancedMesh(leafGeo,leafMat,vines.length),dummy=new THREE.Object3D();
 for(let i=0;i<vines.length;i++){const v=vines[i];dummy.position.set(v.x,v.y,v.z);dummy.rotation.set(0,v.yaw,Math.sin(i)*.2);dummy.scale.set(v.width,v.height,1);dummy.updateMatrix();ivy.setMatrixAt(i,dummy.matrix);}
 ivy.instanceMatrix.needsUpdate=true;ivy.frustumCulled=false;group.add(ivy);
 // Local geometry corruption, kept separate from the actual wall collision.
 const faults=new THREE.Group();faults.name='Factory local geometry faults';scene.add(faults);
 const ghostMat=new THREE.MeshLambertMaterial({color:0x7f9280}),lampMat=new THREE.MeshBasicMaterial({color:0xa7b99a}),wrongMats=[
  new THREE.MeshLambertMaterial({map:textures.bark,color:0x929b7c}),
  new THREE.MeshLambertMaterial({map:textures.rust,color:0x787e68}),
  new THREE.MeshLambertMaterial({map:textures.floor,color:0xa9b695})
 ];
 function mesh(parent,x,y,z,w,h,d,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,base+y,z);parent.add(m);return m;}
 const ghosts=[],patches=[],lights=[];
 for(const z of [219,211,201,191,181]){
  const g=new THREE.Group();faults.add(g);
  for(const x of [-148.5,-141.5])mesh(g,x,1.85,z,.20,3.46,.22,ghostMat);
  mesh(g,-145,3.57,z,7.2,.14,.22,ghostMat);ghosts.push(g);
  const lamp=mesh(faults,-145,z>205?3.24:4.015,z,1.35,.035,.21,lampMat);lights.push(lamp);
 }
 for(const z of [198,194,188,184]){
  const m=mesh(faults,-141.205,1.8,z,.028,1.9,1.7,wrongMats[0]);patches.push(m);
 }
 const terminalMat=new THREE.MeshBasicMaterial({color:0x9bc9a0});
 for(const z of [198,188,178])mesh(faults,-147.25,1.48,z+.15,.43,.025,.012,terminalMat);
 const maze=window.NovaBackrooms.createVisuals(THREE,textures,travel,floraModels),beyond=maze.scene;
 const target=new THREE.WebGLRenderTarget(512,320,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:true});target.texture.encoding=THREE.sRGBEncoding;
 scene.add(maze.vestibule.clone(true));
 const portal=new THREE.Mesh(new THREE.PlaneGeometry(passage.width,passage.height),maze.portalMaterial(target.texture));portal.position.set(passage.thresholdX-.002,floor+passage.height/2,passage.z);portal.rotation.y=-Math.PI/2;portal.visible=false;scene.add(portal);
 const outsideCamera=new THREE.PerspectiveCamera();
 let time=0,lastWidth=512,lastHeight=320;
 const drawSize=new THREE.Vector2();
 function update(renderer,camera,state,dt,playing){
  if(playing)time+=dt;
  const strength=state.strength,active=state.inside;
  maze.update(camera,dt,playing);faults.visible=active&&!travel.active;portal.visible=active&&!travel.active&&camera.position.x<passage.thresholdX+.05;
  // Brief, asynchronous faults on individual objects; no full-screen flash.
  const pulse=(i)=>{const t=time+i*1.37,cycle=4.9+i*.43;return t%cycle<.12+strength*.09;};
  for(let i=0;i<ghosts.length;i++){
   const g=ghosts[i],local=strength*(.3+i*.22);
   g.visible=active&&local>.08&&(i<2||local>.45||pulse(i));
   g.position.set(.05+local*(pulse(i)?.38:.12),pulse(i)?.07:0,-.08-local*.28);
  }
  for(let i=0;i<patches.length;i++){
   const p=patches[i];p.visible=state.core&&strength>.38&&(strength>.8||pulse(i+2));
   p.material=wrongMats[(Math.floor(time*.7)+i)%wrongMats.length];
   p.scale.z=pulse(i)?1.38:1;
  }
  for(let i=0;i<lights.length;i++)lights[i].visible=!(strength>.2&&pulse(i+6));
  terminalMat.color.setHex(strength>.6&&pulse(3)?0x263929:0x9bc9a0);
  const size=renderer.getDrawingBufferSize(drawSize),near=Math.abs(camera.position.x-passage.thresholdX)<12&&Math.abs(camera.position.z-passage.z)<7;
  const w=near?size.x:Math.min(768,size.x),h=Math.max(128,Math.round(w*size.y/size.x));
  if(w!==lastWidth||h!==lastHeight){target.setSize(w,h);maze.returnTarget.setSize(w,h);lastWidth=w;lastHeight=h;}
  const previous=renderer.getRenderTarget(),returnVisible=maze.returnPortal.visible;
  if(travel.active&&maze.currentWindow){
   const w=maze.currentWindow;outsideCamera.copy(camera);outsideCamera.position.add(new THREE.Vector3(w.anchor.x-w.position.x,w.anchor.y-w.position.y-travel.rise,w.anchor.z-w.position.z));outsideCamera.updateMatrixWorld(true);
   maze.outsideTarget.setSize(Math.min(768,size.x),Math.max(128,Math.round(Math.min(768,size.x)*size.y/size.x)));
   portal.visible=false;renderer.setRenderTarget(maze.outsideTarget);renderer.render(scene,outsideCamera);
  }
  // The return view is needed only inside the root, and refreshes before its first frame.
  if(travel.active&&travel.level===0&&travel.current.depth===0){portal.visible=false;renderer.setRenderTarget(maze.returnTarget);renderer.render(scene,camera);portal.visible=active&&!travel.active&&camera.position.x<passage.thresholdX+.05;}
  if(portal.visible){maze.returnPortal.visible=true;renderer.setRenderTarget(target);renderer.render(beyond,camera);maze.returnPortal.visible=returnVisible;}
  renderer.setRenderTarget(previous);
 }
 return{update,group,faults,portal,beyond,target,maze,get time(){return time;}};
}
window.NovaFactory={passage,vestibulePieces,bounds,base,floor,pieces,plants,vines,contains,aisle,plantArea,createTraversal,pieceGeometry,createVisuals};
})();
