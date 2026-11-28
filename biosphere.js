/* Integrated from Biosphere Test 0.5 (43848613c92779f3dc8f080c106c63d2fe472d34).
   Main game owns controls and progression. Exterior shares its actual terrain;
   the original bounded room generator runs only while its backrooms are active. */
(()=>{'use strict';
window.NovaBiosphere={create({THREE:T,world,texture,terrain}){
 const W=window.BiosWorld,site=terrain.biosphereSite,scene=new T.Scene(),exterior=new T.Group(),camera=new T.PerspectiveCamera();
 exterior.name='Biosphere · Tokamak hall';exterior.position.set(site.x,terrain.height(site.x,site.z)+.035,site.z);exterior.rotation.y=Math.PI/2;world.add(exterior);
 const hemi=new T.HemisphereLight(0xd9e3cf,0x354531,.86),sun=new T.DirectionalLight(0xffe5b1,1.18);sun.position.set(-30,60,-24);scene.add(hemi,sun);
 let zone,zoneGroup,collision=[],clouds=[],pools=[],species=[],models,windTime={value:0},yaw=Math.PI,pitch=0;
 let px=0,pz=0,eye=1.68,cameraFloor=0,roomVersion=0,lastTile='',plantDirty=true,lastPlants=0,activePlants=0,nearPlants=0,effective='normal';
 let terrainCache=new Map(),terrainPending=new Set(),tiles=new Map(),pending=new Set(),worker=null,fallback=[],elapsed=0,transitionUntil=0;
 let prepared=false,active=false,suspended=null,facilityBoxes=[],exteriorPlantCount=0;
 const dummy=new T.Object3D(),textures={},materials={},temporaryTextures=[],tempGeometry=[];
 const maxPerSpecies=176,nearPerSpecies=12,TILE_RADIUS=3;
 const tasks=[['ivy','ivy-leaves.jpg'],['computerRack','mainframe/besm6-rack.jpg'],['computerConsole','mainframe/besm6-console.jpg'],['tokamak','tokamak/t15-coils.jpg'],['tokamakControl','tokamak/t15-controls-1989.jpg'],['concreteFacade','concrete/facade.jpg'],['concreteSpalled','concrete/spalled.jpg'],['reference','backroom-reference.jpg'],['cloud','valley-cloud.png'],['control','biosphere2/controls.jpg'],['glasshouse','biosphere2/biodome.jpg'],['desert','biosphere2/bioglas3.jpg'],['shell','bios/obsidian-bios-shell.jpg'],['floor','floor.jpg'],['ruin','ruin.jpg'],['rust','rust.webp'],['wood','wood.webp']];
 for(const [key,path]of tasks)textures[key]=texture('biosphere/'+path,true);
 for(const t of window.NOVA_BIOS_TAXA)textures[t.id]=texture('biosphere/plants/'+t.id+'.webp',true);
 const local=(x,z)=>({x:site.z-z,z:x-site.x});
 const toWorld=(x,z)=>({x:site.x+z,z:site.z-x});
 function updateCamera(){cameraFloor=zone?W.height(px,pz,zone):0;camera.position.set(px,cameraFloor+eye,pz);camera.rotation.set(pitch,yaw,0,'YXZ');}
function repeated(tex,n=1){const t=tex.clone();t.needsUpdate=true;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(n,n);return t;}
function photoCrop(tex,x,y,w,h){const c=document.createElement('canvas');c.width=c.height=512;const im=tex.image;c.getContext('2d').drawImage(im,x*im.width,y*im.height,w*im.width,h*im.height,0,0,512,512);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;}
function mat(key,color,map){materials[key]=new T.MeshLambertMaterial({color,map:map||null});return materials[key];}
function rustUV(g,u,v){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*u,uv.getY(i)*v);}
function initMaterials(){
 mat('computerRack',0xaeb5a4,photoCrop(textures.computerRack,.15,.09,.72,.62));mat('computerBlue',0xa0aba0,photoCrop(textures.computerRack,.07,.13,.04,.55));mat('computerConsole',0xb4b7a8,photoCrop(textures.computerConsole,.1,.36,.8,.29));
 for(const key of ['computerRack','computerBlue','computerConsole'])materials[key].name=key;
 const ivy=photoCrop(textures.ivy,.009,.01,.477,.454),ic=ivy.image.getContext('2d'),pixels=ic.getImageData(0,0,512,512);
 for(let i=0;i<pixels.data.length;i+=4){const d=pixels.data;d[i+3]=Math.round(255*Math.max(0,Math.min(1,(Math.max(d[i],d[i+1],d[i+2])-12)/15)));}
 ic.putImageData(pixels,0,0);ivy.needsUpdate=true;
 ivy.wrapS=ivy.wrapT=T.ClampToEdgeWrapping;ivy.minFilter=T.LinearMipmapLinearFilter;ivy.magFilter=T.LinearFilter;ivy.anisotropy=8;
 // Smooth alpha coverage softens leaf silhouettes on the antialiased canvas.
 materials.ivy=new T.MeshLambertMaterial({map:ivy,color:0xb7c59c,side:T.DoubleSide,alphaTest:.48,alphaToCoverage:true});materials.ivy.name='Photographic Hedera helix';
 materials.ivy.extensions={derivatives:true};
 materials.ivy.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`#ifdef ALPHATEST
 float leafEdge=max(fwidth(diffuseColor.a),.035);
 diffuseColor.a=smoothstep(ALPHATEST-leafEdge,ALPHATEST+leafEdge,diffuseColor.a);
 if(diffuseColor.a<=.001)discard;
 #endif`);};
 materials.ivy.customProgramCacheKey=()=> 'nova-ivy-coverage-v69';
 mat('tokamakSteel',0x8d8876,photoCrop(textures.tokamak,.4,.38,.09,.15));mat('tokamakPanel',0xa9b1a2,photoCrop(textures.tokamakControl,.015,.04,.16,.60));
 // Existing photographic flaking rust covers the exposed vessel, coils,
 // bands and supports. Retain only scattered remnants of the old metal.
 const corrosion=repeated(textures.rust);
 mat('tokamakRust',0xe0a175,corrosion);mat('tokamakBand',0xbe895a,corrosion);mat('tokamakBase',0xa68971,corrosion);
 for(const key of ['tokamakSteel','tokamakRust','tokamakBand','tokamakBase','tokamakPanel'])materials[key].name=key;
 mat('plaster',0xc2c1b9,repeated(textures.concreteFacade));mat('panel',0xaaa99f,repeated(textures.concreteSpalled));mat('steel',0x777c77,photoCrop(textures.control,.313,.48,.024,.35));mat('partition',0xffffff,photoCrop(textures.control,.325,.17,.465,.30));
 mat('foil',0xc5c9a4,photoCrop(textures.shell,.115,.48,.12,.27));mat('rust',0x947c62,repeated(textures.rust,1));mat('concrete',0xbdbcb4,repeated(textures.concreteFacade));mat('rock',0xa7a58c,photoCrop(textures.ruin,.5,.5,.49,.49));mat('mosswall',0x7a935b,repeated(textures.floor,2));
 mat('ground',0xffffff,photoCrop(textures.reference,.02,.76,.24,.20));materials.ground.vertexColors=true;materials.ground.map.wrapS=materials.ground.map.wrapT=T.MirroredRepeatWrapping;mat('path',0xb3b788,repeated(textures.floor,2));mat('wood',0xb3afa0,repeated(textures.wood,2));mat('dark',0x3b4835);mat('black',0x26362a);mat('light',0xe2e7ce);mat('clay',0x645b47);mat('water',0x33816c);materials.water.transparent=true;materials.water.opacity=.7;mat('glitch',0xe2e7d8);mat('pink',0xa575a7);materials.light.emissive=new T.Color(0x344a20);
 mat('glass',0xbcd1cd,photoCrop(textures.glasshouse,.125,.25,.445,.28));Object.assign(materials.glass,{transparent:true,opacity:.32,side:T.DoubleSide,depthWrite:false});mat('glazing',0xffffff,photoCrop(textures.desert,.77,.26,.21,.40));materials.glazing.side=T.DoubleSide;
 const wallSky=photoCrop(textures.reference,0,0,1,.36);wallSky.wrapS=T.MirroredRepeatWrapping;wallSky.wrapT=T.ClampToEdgeWrapping;
 materials.skywall=new T.MeshBasicMaterial({map:wallSky,side:T.DoubleSide,fog:false,toneMapped:false});materials.skywall.name='backroom-sky-wall';
 materials.ceiling=new T.MeshBasicMaterial({color:new T.Color(0x0261df).convertSRGBToLinear(),side:T.DoubleSide,fog:false,toneMapped:false});materials.ceiling.name='backroom-blue-ceiling';
 materials.tunnel=new T.MeshBasicMaterial({map:repeated(textures.concreteFacade),color:0x9a9c91,fog:false});materials.tread=new T.MeshBasicMaterial({map:repeated(textures.concreteSpalled),color:0xa0a89e,fog:false});
 materials.cloud=new T.MeshBasicMaterial({map:textures.cloud,transparent:true,depthWrite:false,side:T.DoubleSide,opacity:.94,fog:true});
 scene.background=materials.ceiling.color;
}

class Batch{
 constructor(group){this.group=group;this.byMat=new Map();}
 addGeo(g,m){if(g.index){const q=g.toNonIndexed();g.dispose();g=q;}if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!this.byMat.has(m))this.byMat.set(m,[]);this.byMat.get(m).push(g);}
 box(x,y,z,sx,sy,sz,m='concrete',rot=0,solid=false){const g=new T.BoxGeometry(sx,sy,sz);if(['concrete','mosswall','wood','rust','plaster','panel','rock','tunnel','tread','tokamakBase','tokamakRust'].includes(m)){const uv=g.attributes.uv,n=g.attributes.normal,span=m.startsWith('tokamak')?1.6:3.5;for(let i=0;i<uv.count;i++){const u=Math.abs(n.getX(i))>.5?sz:sx,v=Math.abs(n.getY(i))>.5?sz:sy;uv.setXY(i,uv.getX(i)*Math.max(.25,u/span),uv.getY(i)*Math.max(.25,v/span));}}g.rotateY(rot);g.translate(x,y,z);this.addGeo(g,materials[m]);if(solid)collision.push([x,z,sx,sz]);}
 tube(a,b,r,m='rust',sides=7){const v=new T.Vector3(...b).sub(new T.Vector3(...a)),g=new T.CylinderGeometry(r,r,v.length(),sides);if(m==='tokamakRust'||m==='tokamakBase')rustUV(g,Math.PI*2*r/1.6,v.length()/1.6);g.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize())));g.translate((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);this.addGeo(g,materials[m]);}
 finish(){for(const [m,gs]of this.byMat){const g=new T.BufferGeometry();for(const key of ['position','normal','uv']){const size=key==='uv'?2:3;const a=new Float32Array(gs.reduce((n,q)=>n+q.attributes[key].array.length,0));let off=0;for(const q of gs){a.set(q.attributes[key].array,off);off+=q.attributes[key].array.length;}g.setAttribute(key,new T.BufferAttribute(a,size));}g.computeBoundingSphere();gs.forEach(g=>g.dispose());const mesh=new T.Mesh(g,m);this.group.add(mesh);tempGeometry.push(g);}this.byMat.clear();}
}
function referencePanel(tex,x,y,z,w,h,rot=0){const g=new T.PlaneGeometry(w,h),m=new T.MeshLambertMaterial({map:tex,color:0xb3b9a0,side:T.DoubleSide}),p=new T.Mesh(g,m);p.position.set(x,y,z);p.rotation.y=rot;zoneGroup.add(p);tempGeometry.push(g);p.userData.disposeMaterial=true;}
function ground(w,d,x=0,z=0,terrain=false){const cached=terrain?terrainCache.get(zone.cx+','+zone.cz):null;if(cached){const g=new T.BufferGeometry();for(const key of ['position','normal','uv','color'])g.setAttribute(key,new T.BufferAttribute(cached[key],key==='uv'?2:3));g.setIndex(new T.BufferAttribute(cached.index,1));g.computeBoundingSphere();zoneGroup.add(new T.Mesh(g,materials.ground));tempGeometry.push(g);return;}const [gx,gz]=terrain?W.groundSegments(zone):[1,1],g=new T.PlaneGeometry(w,d,gx,gz);g.rotateX(-Math.PI/2);const uv=g.attributes.uv,pos=g.attributes.position,colors=new Float32Array(pos.count*3),color=new T.Color();for(let i=0;i<pos.count;i++){const xx=pos.getX(i)+x,zz=pos.getZ(i)+z,h=terrain?W.rawHeight(xx,zz,zone):0;pos.setY(i,h-.025);uv.setXY(i,xx/5,zz/5);color.setHSL(.225+.013*Math.sin(xx*.13+zz*.07),.50,.50+.075*Math.sin(xx*.08-zz*.045));colors[i*3]=color.r;colors[i*3+1]=color.g;colors[i*3+2]=color.b;}g.setAttribute('color',new T.BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingSphere();const mesh=new T.Mesh(g,materials.ground);mesh.position.set(x,0,z);if(zone.kind==='facility'){mesh.name='Biosphere interior floor';mesh.userData.footprint={x,z,w,d};}zoneGroup.add(mesh);tempGeometry.push(g);}
function glassQuad(b,a,c,d,e,mat='glass'){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([...a,...c,...d,...a,...d,...e],3));g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,0,1,1,0,1],2));g.computeVertexNormals();b.addGeo(g,materials[mat]);}

function damagedGlass(b,A,B,C,D,r){
 const chance=r();if(chance<.38)return; // Entirely lost panes.
 if(chance>.82){glassQuad(b,A,B,C,D);return;}
 const edge=[[0,0],[.5,0],[1,0],[1,.5],[1,1],[.5,1],[0,1],[0,.5]],cx=.38+r()*.24,cy=.35+r()*.3;
 const hole=edge.map(([u,v])=>{const f=.42+r()*.43;return[cx+(u-cx)*f,cy+(v-cy)*f];});
 const point=([u,v])=>A.map((a,k)=>a*(1-u)*(1-v)+B[k]*u*(1-v)+C[k]*u*v+D[k]*(1-u)*v);
 const pos=[],uv=[];for(let i=0;i<8;i++){if(r()<.15)continue;const j=(i+1)%8;for(const q of [edge[i],edge[j],hole[j],edge[i],hole[j],hole[i]]){pos.push(...point(q));uv.push(...q);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();b.addGeo(g,materials.glass);
}

function clearZone(){
 if(zoneGroup){zoneGroup.parent?.remove(zoneGroup);zoneGroup.traverse(o=>{if(o.userData.disposeMaterial)o.material.dispose();});}
 tempGeometry.splice(0).forEach(g=>g.dispose());temporaryTextures.splice(0).forEach(t=>t.dispose());collision=[];clouds=[];zoneGroup=new T.Group();scene.add(zoneGroup);roomVersion++;tiles.clear();pending.clear();fallback=[];lastTile='';plantDirty=true;for(const p of pools)for(const mesh of p.near.concat(p.far))mesh.count=0;
}
function stairConnection(b,ox=0,oy=0,oz=0){
 const S=W.stair,box=(x,y,z,w,h,d,m='tunnel',solid=false)=>b.box(x+ox,y+oy,z+oz,w,h,d,m,0,solid),tube=(a,c,r=.035)=>b.tube([a[0]+ox,a[1]+oy,a[2]+oz],[c[0]+ox,c[1]+oy,c[2]+oz],r,'rust');
 box(0,-.14,16,3.1,.28,4,'tread');
 for(let i=0;i<S.count;i++){const z=S.start+(i+.5)*S.tread,y=-(i+1)*S.rise;box(0,y-.13,z,3.1,.26,S.tread,'tread');box(0,y+.003,z-S.tread/2+.018,3.06,.006,.036,'tunnel');}
 // Solid landings and the two right-angle bends below the research hall.
 box(0,-S.depth-.15,29.35,3.1,.3,.3,'tread');box(3.2,-S.depth-.15,31,9.5,.3,3,'tread');box(6.4,-S.depth-.15,36.75,3.1,.3,8.5,'tread');
 for(const x of [-1.8,1.8])box(x,-.55,21.75,.5,7.9,15.5,'tunnel',true);
 box(-1.8,-S.depth+1.6,31,.5,3.2,3.5,'tunnel',true);
 box(1.4,-S.depth+1.6,32.75,6.4,3.2,.5,'tunnel',true);
 box(4.75,-S.depth+1.6,29.25,6.4,3.2,.5,'tunnel',true);
 for(const x of [4.6,8.2])box(x,-S.depth+1.6,36.85,.5,3.2,8.7,'tunnel',true);
 box(8.2,-S.depth+1.6,31,.5,3.2,3.5,'tunnel',true);
 box(0,3.25,16,4.1,.3,4.1,'tunnel');
 const roof=new T.BoxGeometry(4.1,.28,Math.hypot(S.count*S.tread,S.depth));roof.rotateX(Math.atan(S.rise/S.tread));roof.translate(ox,oy-S.depth/2+3.25,oz+S.start+S.count*S.tread/2);b.addGeo(roof,materials.tunnel);
 box(3.2,-S.depth+3.25,30.85,10.5,.3,3.3,'tunnel');box(6.4,-S.depth+3.25,36.85,4.1,.3,8.7,'tunnel');
 // Both handrails are physically attached to the stair treads.
 for(const x of [-1.35,1.35]){tube([x,1,17.8],[x,1-S.depth,29.4]);for(let i=0;i<=28;i+=4){const z=18+i*.4+.04,y=W.stairHeight(z);tube([x,y+.02,z],[x,1-S.depth*(z-17.8)/11.6,z],.04);box(x,y+.025,z,.14,.05,.14,'rust');}}
}
function buildFacility(){
 clearZone();zone={kind:'facility',seed:1991,w:82,d:66,biome:1,name:'Biosphere 2'};scene.fog=new T.Fog(0xaccbd0,90,500);hemi.intensity=.92;sun.intensity=1.1;
 // Photo soil ends inside each building. The forest retains its moss terrain.
 ground(28,28);ground(11.35,19.35,-22,0);ground(2.7,3,-15,0);ground(11.5,22,19.75,-1);ground(28,28,39.5,0);ground(28,30,39.5,29);
 const b=new Batch(zoneGroup),r=W.rng(1991);
 // Heavy weathered concrete frame, open portals and individually shattered glazing.
 for(let face=0;face<4;face++){
  const at=(u,y)=>face===0?[u,y,-14]:face===1?[u,y,14]:face===2?[-14,y,u]:[14,y,u];
  const box=(u,y,w,h,depth,m,solid=false)=>{const a=at(u,y);b.box(...a,face<2?w:depth,h,face<2?depth:w,m,0,solid);};
  for(const half of [-1,1])box(half*7.8,.45,12.4,.9,.7,'panel',true);
  for(const u of [-14,-10,-6,-2,2,6,10,14])box(u,2.75,.64,5.5,.84,'concrete',true);
  // Deep lintels over every empty entrance, with no door leaves or labels.
  box(0,4.72,28.6,.85,1.05,'panel');box(0,3.63,3.45,.92,.85,'concrete');
  for(let u=-13.9;u<13;u+=2){if(u>-2&&u<1.5)continue;box(u,2.53,.065,3.6,.09,'rust');
   for(let y=.96;y<4.1;y+=1.58)damagedGlass(b,at(u+.09,y),at(u+1.84,y),at(u+1.84,y+1.48),at(u+.09,y+1.48),r);
  }
  for(const half of [-1,1])box(half*7.8,2.52,12.4,.07,.09,'rust');
 }
 // The remaining sloping Biosphere roof is interrupted by large collapsed patches.
 const levels=[[14,5.2],[9.5,9],[9.5,9.8],[4,14],[3,14.8]];
 for(let level=0;level<levels.length-1;level++){
  const [lo,yl]=levels[level],[hi,yh]=levels[level+1],rows=Math.max(1,Math.ceil(Math.hypot(lo-hi,yh-yl)/1.8));
  for(let side=0;side<4;side++){
   const orient=(u,v,y)=>side===0?[u,y,v]:side===1?[-v,y,u]:side===2?[-u,y,-v]:[v,y,-u];
   for(let row=0;row<rows;row++){
    const f=row/rows,ff=(row+1)/rows,rr=lo+(hi-lo)*f,rr1=lo+(hi-lo)*ff,y0=yl+(yh-yl)*f,y1=yl+(yh-yl)*ff;
    for(let i=0;i<12;i++){
     const A=orient((i/12*2-1)*rr,rr,y0),B=orient(((i+1)/12*2-1)*rr,rr,y0),C=orient(((i+1)/12*2-1)*rr1,rr1,y1),D=orient((i/12*2-1)*rr1,rr1,y1);
     const collapsed=(side===2&&i>=7&&i<=10&&level<2)||(side===0&&i<3&&level===2);
     if(!collapsed){b.tube(A,D,.055,'steel');b.tube(A,B,.055,'rust');if(r()>.25)b.tube(A,C,.032,'steel');damagedGlass(b,A,B,C,D,r);}
     else if(row===0&&i%2===0){const bent=[D[0]+.35,D[1]-1.2,D[2]+.45];b.tube(A,bent,.055,'rust');}
    }
   }
  }
 }
 // Thick exposed ring beams and buttresses make the old research house brutalist.
 for(const z of [-9.5,9.5])b.box(0,9.35,z,19.7,.7,.7,'panel');
 for(const x of [-9.5,9.5])b.box(x,9.35,0,.7,.7,19.7,'panel');
 for(const x of [-10,10])for(const z of [-10,10])b.box(x,2.75,z,.95,5.5,.95,'concrete',0,true);
 // Rubble and exposed reinforcing bars are kept clear of the walking routes.
 for(let i=0;i<26;i++){
  const x=(r()<.5?-1:1)*(3.5+r()*9),z=(r()-.5)*23;
  b.box(x,.12+r()*.14,z,.35+r()*1.3,.25+r()*.35,.25+r()*.8,'panel',r()*3);
  if(i<14){b.tube([x,.06,z],[x+1+r()*2,.08+r()*.04,z+1],.065,'rust');const a=[x,.045,z],c=[x+.8,.06,z+.2],d=[x+.2,.05,z+.75];glassQuad(b,a,c,d,a);}
 }
 for(const x of [-8.5,8.5])for(const z of [-6,4]){b.box(x,.25,z,5.8,.5,5,'panel');b.box(x,.51,z,5.55,.04,4.7,'clay');b.tube([x-2.8,1.6,z-2.4],[x+2.8,1.6,z-2.4],.035,'rust');for(const dx of [-2.8,0,2.8]){b.tube([x+dx,.48,z-2.4],[x+dx,1.6,z-2.4],.045,'rust');b.box(x+dx,.52,z-2.4,.15,.04,.15,'rust');}}
 // Stepped, flat-roofed concrete habitation block with slit windows and broken parapets.
 b.box(-28,2.1,0,.65,4.2,20,'plaster',0,true);for(const half of [-1,1])b.box(-16,2.1,half*5.75,.65,4.2,8.5,'plaster',0,true);
 for(const z of [-10,10])b.box(-22,2.1,z,12,4.2,.65,'panel',0,true);
 // Several roof slabs are missing, leaving daylight and vegetation through real gaps.
 for(const z of [-7.1,0,7.1])b.box(-22,4.25,z,13.4,.65,5.1,'panel');
 for(const z of [-10.5,10.5]){b.box(-24.5,4.85,z,5.4,.6,.48,'concrete');b.box(-18.1,4.68,z,3.8,.25,.48,'panel');}
 b.box(-22,6.5,-1,7.8,3.8,7.8,'plaster');
 for(const z of [-5,3]){b.box(-22,8.4,z,8.5,.58,1.1,'panel');b.box(-22,9.48,z,8.5,.7,.9,'concrete');for(const x of [-25.65,-22,-18.35])b.box(x,8.98,z,.65,.6,.5,'concrete');damagedGlass(b,[-25.2,8.72,z],[-18.8,8.72,z],[-18.8,9.12,z],[-25.2,9.12,z],r);}
 for(const x of [-26, -18])b.box(x,8.9,-1,.8,1.9,8.8,'panel');
 b.box(-22.5,10,-1,8.2,.7,9.4,'panel');b.box(-23.5,10.8,2.8,3.7,.9,.38,'concrete');
 for(let i=0;i<9;i++){const x=-21.4+i*.36;b.tube([x,10,3.2],[x+.2,11.05-r()*.3,3.3],.026,'rust',5);}
 // Research annex: broad concrete walls, roof voids, remnants of the control interior.
 for(const z of [-12,10])b.box(19.75,1.9,z,11.5,3.8,.62,'plaster',0,true);
 // Existing annex opens directly into the new reactor hall.
 b.box(25.5,1.9,-5.8,.62,3.8,12.4,'panel',0,true);b.box(25.5,1.9,7.3,.62,3.8,5.4,'panel',0,true);b.box(25.5,3.55,2.5,.7,.5,4.2,'concrete');
 for(const z of [-8,1.2,8.5])b.box(19.7,3.96,z,12.3,.52,z===8.5?3.3:5.3,'panel');
 b.box(15.1,1.8,-1,2,3.6,.45,'plaster',0,true);b.box(23.1,1.8,-1,4.6,3.6,.45,'plaster',0,true);b.box(18.35,3.3,-1,4.5,.6,.5,'plaster');
 for(let i=0;i<5;i++){const z=-9+i*1.35;b.box(24.8,1,z,.7,2,1.15,'steel',0,true);b.box(24.42,1.3,z,.025,.8,.92,'partition');}
 b.box(20.8,.83,8.6,7.5,1.65,1,'plaster',0,true);b.box(20.8,1.68,8.6,7.6,.07,1.05,'rust');b.box(20.1,2.55,9.64,6.3,1,.1,'partition');b.box(20.7,.43,4.1,2.8,.16,1.8,'wood',0,true);for(const x of [19.5,21.9])for(const z of [3.4,4.8])b.box(x,.21,z,.08,.4,.08,'rust');
 // The old level passage is now a descending enclosed stairwell.
 stairConnection(b);buildTokamakHall(b);buildMainframeHall(b);
 b.finish();zone.boxes=collision;
 px=0;pz=-24;yaw=Math.PI;pitch=.04;updateCamera();queueTiles(true);
}

function buildTokamakHall(b){
 const cx=39.5,r=W.rng(670015),at=(a,d,y)=>[cx+Math.cos(a)*d,y,Math.sin(a)*d];
 // A 28 m hall, with 11 m high roof trusses and fractured clerestory glazing.
 for(const z of [-14,14]){
  if(z<0)b.box(cx,2,z,28,4,.65,'panel',0,true);
  else{for(const x of [31.75,47.25])b.box(x,2,z,12.5,4,.65,'panel',0,true);b.box(cx,4.3,z,3.5,.65,.8,'concrete');}
  b.box(cx,10.5,z,28,.7,.8,'concrete');
  for(let x=25.5;x<=53.5;x+=4){b.box(x,5.3,z,.75,10.6,.9,'concrete',0,true);if(x<53)damagedGlass(b,[x+.4,4.2,z],[x+3.6,4.2,z],[x+3.6,10.1,z],[x+.4,10.1,z],r);}
 }
 b.box(53.5,5.3,0,.7,10.6,28,'plaster',0,true);
 for(const z of [-13,12])b.box(25.5,5.3,z,.7,10.6,z<0?2:4,'plaster',0,true);
 b.box(25.5,7.3,-1,.7,6.8,22,'panel');
 for(let x=25.5;x<=53.5;x+=4){
  b.tube([x,10.8,-14],[x,12.6,0],.17,'steel');b.tube([x,12.6,0],[x,10.8,14],.17,'steel');b.tube([x,10.6,-14],[x,10.6,14],.11,'rust');
  for(let z=-14;z<14;z+=4){b.tube([x,10.6,z],[x,11.5,z+4],.06,'steel');if(x<53&&r()>.38){const y=z=>12.6-Math.abs(z)*1.8/14;damagedGlass(b,[x,y(z),z],[x+4,y(z),z],[x+4,y(z+4),z+4],[x,y(z+4),z+4],r);}}
 }
 // Weathered toroidal vacuum vessel and 24 separate vertical magnetic coils.
 const torus=(radius,tube,y,m,segments=64)=>{const g=new T.TorusGeometry(radius,tube,8,segments);if(m==='tokamakRust'||m==='tokamakBand')rustUV(g,Math.PI*2*radius/1.6,Math.PI*2*tube/1.6);g.rotateX(Math.PI/2);g.translate(cx,y,0);b.addGeo(g,materials[m]);};
 torus(4.1,1.25,4,'tokamakRust');
 for(let i=0;i<24;i++){
  const a=i*Math.PI/12,g=new T.TorusGeometry(2.3,.23,6,24),metal=[2,6,17].includes(i)?'tokamakSteel':Math.sin(a*1.7+.6)>.1?'tokamakRust':'tokamakBase';
  if(metal!=='tokamakSteel')rustUV(g,Math.PI*2*2.3*1.16/1.6,Math.PI*2*.23/1.6);
  g.scale(1,1.32,1);g.translate(4.1,4,0);g.rotateY(-a);g.translate(cx,0,0);b.addGeo(g,materials[metal]);
  const foot=at(a,5.7,.65);b.box(...foot,.65,1.3,.65,'tokamakBase');b.tube(at(a,5.7,1),at(a,5.7,2.4),.23,'tokamakBase');
  b.tube(at(a,1.1,7.7),at(a,4.7,6.9),.12,'tokamakRust');
  if(i%2===0){b.tube(at(a,5.4,3.7),at(a,7.4,3.7),.2,'tokamakRust');b.tube(at(a,7.4,3.7),at(a,7.4,.5),.13,'rust');}
 }
 torus(6.4,.22,2.05,'tokamakBand');torus(6.4,.22,5.85,'tokamakBand');torus(4.2,.17,7,'rust');
 b.tube([cx,.55,0],[cx,8.4,0],1.25,'tokamakRust',20);torus(1.32,.16,7.8,'tokamakBand',32);
 b.box(cx,.25,0,3,.5,3,'tokamakBase');
 // Conservative circular collision envelope includes low supports and pipework.
 for(let x=-7.4;x<7.4;x+=.8){const half=Math.sqrt(Math.max(0,7.4**2-Math.min(Math.abs(x),Math.abs(x+.8))**2));collision.push([cx+x+.4,0,.8,half*2]);}
 for(let i=0;i<5;i++){const z=-9.7+i*1.6;b.box(52.55,1.3,z,1.1,2.6,1.4,'tokamakBase',0,true);b.box(51.98,1.4,z,.025,2.15,1.23,'tokamakPanel');}
 // Ruptured cooling lines stay beside the wall, outside the circulation route.
 for(let i=0;i<3;i++){const z=12.6-i*.3;b.tube([28,.45,z],[50,.45,z],.09,'rust');b.tube([50,.45,z],[50,7+i,z],.09,'tokamakRust');}
}

function buildMainframeHall(b){
 const r=W.rng(680006);
 // A connected 28 x 30 m computer room, with a broken concrete roof.
 for(const x of [25.5,53.5])b.box(x,3.5,29,.7,7,30,'plaster',0,true);
 b.box(39.5,3.5,44,28,7,.7,'panel',0,true);
 for(const x of [25.5,32.5,39.5,46.5,53.5]){
  b.box(x,7.15,29,.5,.65,30,'concrete');
  for(const z of [17,24,31,38,43])if(r()>.35)b.box(x+1.6,7.35,z,2.65,.3,4.9,'panel');
 }
 for(const z of [14,24,34,44])b.box(39.5,7, z,28,.7,.6,'concrete');
 // One enormous installation made of three banks of BESM-6 cabinets.
 for(const x of [30.5,39.5,48.5])for(let i=0;i<5;i++){
  const z=24+i*3.25;
  b.box(x,1.95,z,2.2,3.9,3.05,'computerBlue',0,true);
  for(const side of [-1,1]){b.box(x+side*1.12,2.15,z,.04,3.25,2.85,'computerRack');b.box(x+side*1.3,.98,z,.36,.34,2.88,'computerConsole');}
  b.box(x,.16,z,2.35,.32,3.14,'rust');b.box(x,3.91,z,2.25,.1,3.1,'computerBlue');
 }
 // Deep, sloping operator desks and actual photographic Cyrillic controls.
 for(const x of [32.5,39.5,46.5]){
  b.box(x,.6,19,4.4,1.2,1.25,'computerBlue',0,true);
  const top=new T.BoxGeometry(4.4,.08,1.38);top.rotateX(-.17);top.translate(x,1.25,19);b.addGeo(top,materials.computerConsole);
  b.box(x,1.9,19.6,4.4,1.2,.23,'computerRack');
 }
 for(let i=0;i<4;i++)b.tube([27+i*.18,.12,21],[27+i*.18,.12,40],.06,'black');
}

function addMainframeVegetation(){
 const r=W.rng(68000699),instances=new Map();
 const add=(id,x,y,z,scale)=>{if(!instances.has(id))instances.set(id,[]);dummy.position.set(x,y,z);dummy.rotation.set(0,r()*6.28,0);dummy.scale.setScalar(scale);dummy.updateMatrix();instances.get(id).push(dummy.matrix.clone());};
 for(let i=0;i<300;i++){
  const x=26.2+r()*26.6,z=15+r()*28;
  // Leave the doorway, aisles and ends of the cabinet banks readable.
  if(z<22||z>39.5||Math.abs(x-35)<1.2||Math.abs(x-44)<1.2)continue;
  if([30.5,39.5,48.5].some(cx=>Math.abs(x-cx)<1.55))continue;
  add(i%3?10:8,x,.02,z,.65+r()*1.2);
 }
 // Unequal patches exploit different lids, leaving whole cabinets bare.
 for(const x of [30.5,39.5,48.5]){
  const hot=23+r()*13;
  for(let i=0;i<5;i++){
   const z=24+i*3.25,rich=Math.exp(-Math.pow((z-hot)/4.3,2));
   const count=r()<.22?0:1+Math.floor(r()*(1+rich*5));
   const patchX=(r()-.5)*1.35,patchZ=(r()-.5)*1.7;
   for(let j=0;j<count;j++)add(r()<.73?6:1,x+Math.max(-.94,Math.min(.94,patchX+(r()-.5)*.7)),3.96,z+Math.max(-1.35,Math.min(1.35,patchZ+(r()-.5)*1.15)),.38+r()*.93);
  }
 }
 for(const [x,z]of [[26.5,40],[52,40],[26.5,16]])add(1,x,0,z,2+r());
 for(const [id,matrices]of instances){for(const part of models.models.get(species[id].id).farParts){const mesh=new T.InstancedMesh(part.geometry,part.material,matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;mesh.name='Mainframe upright growth';exterior.add(mesh);}exteriorPlantCount+=matrices.length;}
}

function addClimbingIvy(){
 const matrices=[],colors=[],r=W.rng(690068),stems=new Batch(exterior),up=new T.Vector3(0,0,1),color=new T.Color();
 const leaf=(p,n,size,angle)=>{dummy.position.copy(p);dummy.quaternion.setFromUnitVectors(up,n);dummy.rotateZ(angle);dummy.rotateX((r()-.5)*.48);dummy.rotateY((r()-.5)*.35);dummy.scale.set(size*(.72+r()*.4),size,1);dummy.updateMatrix();matrices.push(dummy.matrix.clone());colors.push(color.setHSL(.23+r()*.035,.08+r()*.17,.67+r()*.25).clone());};
 function vine(points,normals,density=1){
  const phase=r()*6.28;
  for(let i=1;i<points.length;i++){
   const a=new T.Vector3(...points[i-1]),b=new T.Vector3(...points[i]),n=new T.Vector3(...normals[i]).normalize(),d=b.clone().sub(a),side=new T.Vector3().crossVectors(d,n).normalize();
   stems.tube(points[i-1],points[i],.009+.01*(1-i/points.length),'wood',4);
   const patch=.52+.48*Math.sin(phase+i*.53)**2,steps=Math.max(1,Math.ceil(d.length()/(.105+r()*.11)*density*patch));
   for(let j=0;j<steps;j++){
    if(r()<.12)continue;
    const sign=r()<.5?-1:1,p=a.clone().addScaledVector(d,(j+r())/steps).addScaledVector(side,sign*(.045+r()*.15)).addScaledVector(n,.032);
    leaf(p,n,(.19+r()*.29)*(.72+.28*Math.sin(phase+i*.23)**2),sign*(.25+r()*1.5));
    if(r()<.38*density){const q=p.clone().addScaledVector(side,-sign*(.12+r()*.12));leaf(q,n,.14+r()*.24,-sign*(.4+r()));}
   }
  }
 }
 const grow=(sample,lo,hi,density=1)=>{const points=[],normals=[],steps=Math.ceil((hi-lo)/.095);for(let j=0;j<=steps;j++){const q=sample(lo+(hi-lo)*j/steps);points.push(q.p);normals.push(q.n);}vine(points,normals,density);};
 // Clustered colonisation, with quiet sectors between tangled, branching nests.
 // The winding paths remain on the actual oval coils, not on a floating cage.
 const hotspots=[.37,2.85,4.32],richness=a=>Math.max(...hotspots.map(h=>Math.exp(-Math.pow(Math.atan2(Math.sin(a-h),Math.cos(a-h))/.55,2))));
 for(let i=0;i<24;i++){
  const a=i*Math.PI/12,rich=richness(a);if(r()>.17+.82*rich)continue;
  const c=Math.cos(a),s=Math.sin(a),phase=r()*6.28,tip=-.1+r()*1.63;
  const coil=(t,offset=0)=>{const wrap=.5*Math.sin(t*5.3+phase)+offset,rad=4.1+(2.3+.25*Math.cos(wrap))*Math.cos(t),side=.25*Math.sin(wrap);return{p:[39.5+c*rad-s*side,4+(2.3+.25*Math.cos(wrap))*1.32*Math.sin(t),s*rad+c*side],n:[c*Math.cos(t)*Math.cos(wrap)-s*Math.sin(wrap),Math.sin(t)*Math.cos(wrap)/1.32,s*Math.cos(t)*Math.cos(wrap)+c*Math.sin(wrap)]};};
  const root=coil(-.96);vine([[39.5+c*5.7,.02,s*5.7],[39.5+c*5.7,1.30,s*5.7],root.p],[[c,0,s],[c,0,s],root.n],1.4);
  grow(t=>coil(t),-.96,tip,1.65);
  const branches=1+Math.floor(r()*4*rich);
  for(let j=0;j<branches;j++){const start=-.8+r()*Math.max(.1,tip+.45),end=Math.min(1.6,start+.28+r()*.72),sign=r()<.5?-1:1;grow(t=>coil(t,sign*Math.min(1,(t-start)*5)),start,end,1.5);}
 }
 // Broken arcs instead of complete green rings. Shoots curl around the bands.
 for(const y of [2.05,5.85])for(let k=0;k<9;k++){
  const center=hotspots[Math.floor(r()*hotspots.length)]+(r()-.5)*.75,span=.2+r()*1.04,phase=r()*6.28;
  grow(t=>{const a=center+t/6.4,roll=.4+Math.sin(t*.8+phase)*.85,rad=6.4+.245*Math.cos(roll);return{p:[39.5+Math.cos(a)*rad,y+.245*Math.sin(roll),Math.sin(a)*rad],n:[Math.cos(a)*Math.cos(roll),Math.sin(roll),Math.sin(a)*Math.cos(roll)]};},-span*3.2,span*3.2,1.5);
 }
 // Asymmetric patches on cabinet faces: variable heights and branches, with
 // paths clamped inside each cabinet. Some shoots stop short of the lid.
 for(const x of [30.5,39.5,48.5]){
  const hot=23+r()*13;
  for(let cabinet=0;cabinet<5;cabinet++)for(const side of [-1,1]){
   const z=24+cabinet*3.25,rich=Math.exp(-Math.pow((z-hot)/5,2));if(r()<.15+.35*(1-rich))continue;
   const count=1+Math.floor(r()*(2+rich*4));
   for(let j=0;j<count;j++){
    const phase=r()*6.28,base=(r()-.5)*2.3,tip=r()<.37?1.1+r()*2.6:4.15+r()*1.65;
    const face=(t,drift=0)=>{const top=t>3.98,zz=z+Math.max(-1.42,Math.min(1.42,base+.21*Math.sin(t*1.7+phase)+.09*Math.sin(t*4.1+phase)+drift));return{p:[x+side*(top?1.16-(t-3.98):1.16),Math.min(t,3.98),zz],n:top?[0,1,0]:[side,0,0]};};
    grow(t=>face(t),.02,tip,1.45);
    if(r()<.8){const start=.5+r()*Math.min(2.6,tip-.8),end=Math.min(tip+.3,start+.7+r()*1.5),dir=r()<.5?-1:1;grow(t=>face(t,dir*Math.min(.7,(t-start)*.48)),start,end,1.2);}
   }
  }
 }
 stems.finish();const geometry=new T.PlaneGeometry(1,1),mesh=new T.InstancedMesh(geometry,materials.ivy,matrices.length);
 matrices.forEach((m,i)=>{mesh.setMatrixAt(i,m);mesh.setColorAt(i,colors[i]);});mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.frustumCulled=false;mesh.name='Rooted climbing ivy';mesh.userData.surfaceAttached=true;exterior.add(mesh);
}

function addTokamakVegetation(){
 const r=W.rng(67001599),bySpecies=new Map(),cx=39.5;
 const add=(id,x,y,z,s,rot=0)=>{if(!bySpecies.has(id))bySpecies.set(id,[]);dummy.position.set(x,y,z);dummy.rotation.set(0,rot,0);dummy.scale.set(s,s,s);dummy.updateMatrix();bySpecies.get(id).push(dummy.matrix.clone());};
 // Dense low photographic plants, with a readable loop around the machine.
 for(let i=0;i<720;i++){
  const x=26.3+r()*26.4,z=-13.2+r()*26.4,rad=Math.hypot(x-cx,z);
  if(rad>8.6&&rad<10.8||x<31&&Math.abs(z-2.5)<1.3)continue;
  if(rad<5.7)continue;
  const id=[10,10,6,8,1,12,9,15][Math.floor(r()*8)];add(id,x,.02,z,.65+r()*1.65,r()*6.28);
 }
 // Saplings exploit the roof gaps; roots and leaves cling to the machine plinth.
 for(const [x,z]of [[28,-11],[31,11.8],[48,11.8],[49,-11.5]])add(0,x,0,z,6.8+r()*2.5,r()*6.28);
 // Upright shrubs root on real support tops and upper steel bands.
 for(let i=0;i<24;i++){
  const a=i*Math.PI/12,rich=.5+.5*Math.sin(a*2.3+.7),count=r()<.28?0:1+Math.floor(r()*(1+rich*3));
  for(let j=0;j<count;j++)add(r()<.65?6:10,cx+Math.cos(a)*5.7+(r()-.5)*.44,1.30,Math.sin(a)*5.7+(r()-.5)*.44,.38+r()*.92,r()*6.28);
 }
 for(let cluster=0;cluster<5;cluster++){
  const a=r()*Math.PI*2,count=2+Math.floor(r()*4);
  for(let j=0;j<count;j++){const theta=a+(r()-.5)*.26,rad=6.4+(r()-.5)*.12,y=5.85+Math.sqrt(.22**2-(rad-6.4)**2);add(r()<.85?6:1,cx+Math.cos(theta)*rad,y,Math.sin(theta)*rad,.37+r()*.79,r()*6.28);}
 }
 let count=0;for(const [id,matrices]of bySpecies){const parts=models.models.get(species[id].id).farParts;for(const part of parts){const mesh=new T.InstancedMesh(part.geometry,part.material,matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;mesh.name='Tokamak overgrowth';exterior.add(mesh);}count+=matrices.length;}
 exteriorPlantCount+=count;
}

function skyWallWithOpening(b,axis,pos,length,h){
 const panel=(lo,hi,bottom,top)=>{const point=(u,y)=>axis==='x'?[u,y,pos]:[pos,y,u],A=point(lo,bottom),B=point(hi,bottom),C=point(hi,top),D=point(lo,top);
  const uv=(u,y)=>[(u+length/2)/(h*1.92),y/h],g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([...A,...B,...C,...A,...C,...D],3));g.setAttribute('uv',new T.Float32BufferAttribute([...uv(lo,bottom),...uv(hi,bottom),...uv(hi,top),...uv(lo,bottom),...uv(hi,top),...uv(lo,top)],2));g.computeVertexNormals();b.addGeo(g,materials.skywall);
  if(bottom===0)collision.push(axis==='x'?[(lo+hi)/2,pos,hi-lo,.72]:[pos,(lo+hi)/2,.72,hi-lo]);
 };
 panel(-length/2,-1.7,0,h);panel(1.7,length/2,0,h);panel(-1.7,1.7,3.2,h);
 // Sky-painted reveals close the thickness at both sides and above the opening.
 if(axis==='x'){for(const u of [-1.7,1.7])b.box(u,1.6,pos,.04,3.2,.74,'skywall');b.box(0,3.2,pos,3.4,.04,.74,'skywall');}
 else{for(const u of [-1.7,1.7])b.box(pos,1.6,u,.74,3.2,.04,'skywall');b.box(pos,3.2,0,.74,.04,3.4,'skywall');}
}
function buildRoom(cx,cz,entry=null){const arrivalYaw=yaw,arrivalPitch=pitch;clearZone();zone=W.room(cx,cz);const bio=W.biomes[zone.biome],b=new Batch(zoneGroup),w=zone.w,d=zone.d,r=W.rng(zone.seed);scene.fog=new T.Fog(0xa8cbd0,Math.min(160,Math.max(w,d)*.9),Math.max(260,Math.max(w,d)*1.3));hemi.intensity=.86;sun.intensity=1.18;
 ground(w,d,0,0,true);skyWallWithOpening(b,'x',-d/2,w,zone.height);skyWallWithOpening(b,'x',d/2,w,zone.height);skyWallWithOpening(b,'z',-w/2,d,zone.height);skyWallWithOpening(b,'z',w/2,d,zone.height);
 // A real uninterrupted ceiling closes every room; it is uniformly unlit blue.
 b.box(0,zone.height+.12,0,w+.8,.24,d+.8,'ceiling');
 // Open grassy corridors share the sky-painted walls and plain blue ceilings.
 for(const [dx,dz]of [[0,1],[0,-1],[1,0],[-1,0]]){const start=dx?w/2:d/2;if(W.entranceRoom(zone)&&dz===-1){stairConnection(b,-W.stair.exitX,W.stair.depth,-d/2-W.stair.exitZ);continue;}ground(dx?12:4.2,dz?12:4.2,dx*(start+6),dz*(start+6));for(const side of [-1,1])b.box(dx*(start+6.18)+(dz?side*1.9:0),2.1,dz*(start+6.18)+(dx?side*1.9:0),dx?11.64:.35,4.2,dz?11.64:.35,'skywall',0,true);b.box(dx*(start+6.18),4.2,dz*(start+6.18),dx?11.64:4.1,.2,dz?11.64:4.1,'ceiling');
 }

 if(zone.biome===2)b.box(w*.2,.035,d*.1,Math.min(12,w*.22),.04,Math.min(18,d*.2),'water');b.finish();
 const cloudWidth=Math.max(5,Math.min(88,Math.min(w,d)*.42));const cloudGeo=new T.PlaneGeometry(cloudWidth,cloudWidth*2/3),cloud=new T.Mesh(cloudGeo,materials.cloud);cloud.position.set(w*.075,cloudWidth*.36,Math.min(10,d*.08));cloud.renderOrder=20;zoneGroup.add(cloud);clouds.push(cloud);tempGeometry.push(cloudGeo);
 px=0;pz=-d/2+3;yaw=Math.PI;pitch=.06;if(entry==='south'){pz=-d/2-7;yaw=Math.PI;}if(entry==='north'){pz=d/2+7;yaw=0;}if(entry==='west'){px=-w/2-7;pz=0;yaw=-Math.PI/2;}if(entry==='east'){px=w/2+7;pz=0;yaw=Math.PI/2;}
 if(entry){yaw=arrivalYaw;pitch=arrivalPitch;}
 updateCamera();queueTiles(true);}

function initWorker(){try{const url=new URL('biosphere-worldgen.js',location.href).href;const code=(window.NOVA_BIOS_WORLDGEN_SOURCE||`importScripts(${JSON.stringify(url)});`)+`onmessage=e=>{const {a,tx,tz,version,key,type}=e.data;if(type==='terrain'){const g=BiosWorld.meshTerrain(a);postMessage({type,key,g},Object.values(g).map(a=>a.buffer));return;}const data=BiosWorld.tile(a,tx,tz);postMessage({data,key,version},[data.buffer]);};`;worker=new Worker(URL.createObjectURL(new Blob([code],{type:'text/javascript'})));worker.onmessage=e=>{if(e.data.type==='terrain'){terrainPending.delete(e.data.key);terrainCache.set(e.data.key,e.data.g);while(terrainCache.size>4)terrainCache.delete(terrainCache.keys().next().value);return;}acceptTile(e.data);};worker.onerror=()=>{worker.terminate();worker=null;terrainPending.clear();pending.clear();lastTile='';if(active)queueTiles(true);};}catch(e){worker=null;}}
function prefetchTerrain(cx,cz){const key=cx+','+cz;if(!worker||terrainCache.has(key)||terrainPending.has(key))return;terrainPending.add(key);worker.postMessage({type:'terrain',a:W.room(cx,cz),key});}
function anticipateRoom(){if(zone.kind==='facility'){if(pz>16)prefetchTerrain(0,0);return;}if(Math.abs(px)<3){if(pz>zone.d/2-15)prefetchTerrain(zone.cx,zone.cz+1);if(pz< -zone.d/2+15)prefetchTerrain(zone.cx,zone.cz-1);}if(Math.abs(pz)<3){if(px>zone.w/2-15)prefetchTerrain(zone.cx+1,zone.cz);if(px< -zone.w/2+15)prefetchTerrain(zone.cx-1,zone.cz);}}
function acceptTile({data,key,version}){if(version!==roomVersion)return;pending.delete(key);const [tx,tz]=key.split(',').map(Number);if(Math.abs(tx-Math.floor(px/16))>TILE_RADIUS||Math.abs(tz-Math.floor(pz/16))>TILE_RADIUS)return;tiles.set(key,data);plantDirty=true;}
function queueTiles(force=false){const tx=Math.floor(px/16),tz=Math.floor(pz/16),center=tx+','+tz;if(!force&&center===lastTile)return;lastTile=center;for(const key of tiles.keys()){const [x,z]=key.split(',').map(Number);if(Math.abs(x-tx)>TILE_RADIUS||Math.abs(z-tz)>TILE_RADIUS)tiles.delete(key);}const jobs=[];for(let x=tx-TILE_RADIUS;x<=tx+TILE_RADIUS;x++)for(let z=tz-TILE_RADIUS;z<=tz+TILE_RADIUS;z++){const key=x+','+z;if(tiles.has(key)||pending.has(key))continue;jobs.push({a:zone,tx:x,tz:z,version:roomVersion,key,dist:(x-tx)**2+(z-tz)**2});}jobs.sort((a,b)=>a.dist-b.dist);for(const job of jobs){pending.add(job.key);if(worker)worker.postMessage(job);else fallback.push(job);}plantDirty=true;}
function initFlora(){species=window.NOVA_BIOS_TAXA;models=PhotoFlora.createModels(T,species,textures,windTime);for(const sp of species){const model=models.models.get(sp.id),p={near:[],far:[],n:0,f:0};for(const [type,parts,cap]of [['near',model.parts,nearPerSpecies],['far',model.farParts,maxPerSpecies]]){for(const part of parts){const mesh=new T.InstancedMesh(part.geometry,part.material,cap);mesh.count=0;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;scene.add(mesh);p[type].push(mesh);}}pools.push(p);}}
function plantHeight(id,x,z){if(zone.kind==='facility'&&Math.abs(Math.abs(x)-8.5)<2.8&&(Math.abs(z+6)<2.4||Math.abs(z-4)<2.4))return .54;return W.height(x,z,zone);}
function refreshPlants(){let records=[];const backroom=zone.kind==='backroom',limit=backroom?(effective==='low'?420:700):(effective==='low'?1050:1700),nearLimit=backroom?(effective==='low'?40:64):(effective==='low'?56:112),range=effective==='low'?44:58;for(const data of tiles.values())for(let i=0;i<data.length;i+=6){const dist=(data[i+1]-px)**2+(data[i+2]-pz)**2;if(dist<range*range)records.push({data,i,dist});}if(false){const lilies=new Float32Array([16,-5.55,2.1,.9,0,0,16,-3.8,2.6,.8,1,0]);for(let i=0;i<lilies.length;i+=6)records.push({data:lilies,i,dist:(lilies[i+1]-px)**2+(lilies[i+2]-pz)**2});}records.sort((a,b)=>a.dist-b.dist);for(const p of pools){p.n=0;p.f=0;}let n=0,total=0,treeCount=0;for(const {data:a,i,dist}of records){if(total>=limit)break;const id=a[i],p=pools[id],tree=species[id].modelType.startsWith('tree_');if(tree&&treeCount>=(backroom?55:111))continue;const near=dist<100&&n<nearLimit&&p.n<nearPerSpecies;const type=near?'near':'far',count=near?p.n:p.f;if(count>=(near?nearPerSpecies:maxPerSpecies))continue;const glitch=a[i+5],x=a[i+1],z=a[i+2],baseY=plantHeight(id,x,z),sc=backroom?Math.min(a[i+3],Math.max(.1,zone.height-baseY-.8)/(glitch?1.65:1)):a[i+3];dummy.position.set(x,baseY+(glitch?.06:0),z);dummy.rotation.set(glitch?.08:0,a[i+4],glitch?.18:0);dummy.scale.set(sc*(glitch?.65:1),sc*(glitch?1.65:1),sc);dummy.updateMatrix();for(const mesh of p[type])mesh.setMatrixAt(count,dummy.matrix);if(near){p.n++;n++;}else p.f++;total++;if(tree)treeCount++;}
 for(const p of pools)for(const [type,count]of [['near',p.n],['far',p.f]])for(const m of p[type]){m.count=count;m.instanceMatrix.needsUpdate=true;}activePlants=total;nearPlants=n;plantDirty=false;}

 function prepare(){
  if(prepared)return;initMaterials();buildFacility();facilityBoxes=collision.map(b=>b.slice());
  zoneGroup.parent?.remove(zoneGroup);exterior.add(zoneGroup);tempGeometry.length=0;temporaryTextures.length=0;
  // Static exterior vegetation shares prototype models; no background tile updates outdoors.
  initFlora();const a=zone;for(let tx=-2;tx<=1;tx++)for(let tz=-2;tz<=2;tz++)tiles.set(tx+','+tz,W.tile(a,tx,tz));px=0;pz=0;refreshPlants();exteriorPlantCount=activePlants;
  for(const p of pools)for(const m of [...p.near,...p.far]){if(!m.count)continue;const copy=new T.InstancedMesh(m.geometry,m.material,m.count);copy.instanceMatrix.array.set(m.instanceMatrix.array.subarray(0,m.count*16));copy.instanceMatrix.needsUpdate=true;copy.frustumCulled=false;exterior.add(copy);m.count=0;}
  addTokamakVegetation();addMainframeVegetation();addClimbingIvy();tempGeometry.length=0;zone=null;zoneGroup=null;collision=[];tiles.clear();pending.clear();fallback=[];prepared=true;initWorker();
 }
 function worldBlocked(x,z,r=.29){if(!terrain.biosphereReserved(x,z,r))return false;const p=local(x,z);
  if(W.blocked(p.x,p.z,facilityBoxes,r))return true;
  // No entry into the buried connection from outside its stair opening.
  if(p.z>=14&&p.z<=41.4&&p.x>=-2.05-r&&p.x<=8.45+r){return !W.stairInside(p.x,p.z,r);}
  return false;
 }
 function worldHeight(x,z,fallback){const p=local(x,z);return W.stairInside(p.x,p.z,0)?exterior.position.y+W.stairHeight(p.z):fallback;}
 function syncPlayer(p){p.x=px;p.z=pz;p.walkY=W.height(px,pz,zone);p.yaw=yaw;p.pitch=pitch;}
 function enterFromWorld(p){if(!prepared||active)return false;const q=local(p.x,p.z);
  if(q.x<=3.2||q.x>=7.7||q.z<=29.5||q.z>=32.5)return false;
  yaw=p.yaw-Math.PI/2;pitch=p.pitch;buildRoom(0,0,'stairs');px=q.x-W.stair.exitX;pz=q.z-zone.d/2-W.stair.exitZ;
  active=true;transitionUntil=elapsed+.3;syncPlayer(p);return true;
 }
 // v106: arrive straight in a backroom room (a rare door elsewhere led here). entry: the side
 // the player comes from, as when walking over from the neighbouring room.
 function enterRoom(p,cx,cz,entry='south'){
  if(!prepared)prepare();if(active)return false;
  px=0;pz=0;yaw={south:Math.PI,north:0,west:-Math.PI/2,east:Math.PI/2}[entry]??Math.PI;pitch=0;
  buildRoom(cx,cz,entry);active=true;transitionUntil=elapsed+1;syncPlayer(p);return true;
 }
 function leaveAtStairs(p){const q=toWorld(px+W.stair.exitX,pz+zone.d/2+W.stair.exitZ);p.x=q.x;p.z=q.z;p.walkY=worldHeight(q.x,q.z,terrain.height(q.x,q.z));p.yaw=yaw+Math.PI/2;p.pitch=pitch;active=false;clearRoom();}
 function clearRoom(){if(zoneGroup){zoneGroup.parent?.remove(zoneGroup);zoneGroup.traverse(o=>{if(o.userData.disposeMaterial)o.material.dispose();});}zoneGroup=null;tempGeometry.splice(0).forEach(g=>g.dispose());temporaryTextures.splice(0).forEach(t=>t.dispose());zone=null;collision=[];clouds=[];tiles.clear();pending.clear();fallback=[];roomVersion++;for(const p of pools)for(const m of [...p.near,...p.far])m.count=0;}
 function canWalk(x,z){return !!zone&&W.insideRoom(x,z,zone,.29)&&!W.blocked(x,z,collision,.26);}
 function move(p,dt,{forward=0,right=0,run=false,factor=1}={}){
  if(!active)return 0;elapsed+=dt;px=p.x;pz=p.z;yaw=p.yaw;pitch=p.pitch;const bx=px,bz=pz,n=Math.max(1,Math.hypot(forward,right)),speed=(run?6.5:3.1)*factor;
  const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*right)*speed*dt/n,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*right)*speed*dt/n,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.16));
  for(let i=0;i<steps;i++){if(canWalk(px+dx/steps,pz))px+=dx/steps;if(canWalk(px,pz+dz/steps))pz+=dz/steps;}
  const distance=Math.hypot(px-bx,pz-bz);
  if(elapsed>transitionUntil){const a=zone;if(W.entranceRoom(a)&&px< -3.4&&pz< -a.d/2-8.5&&pz> -a.d/2-12){leaveAtStairs(p);return distance;}
   let change=null;if(pz>a.d/2+10.7)change=[a.cx,a.cz+1,'south'];else if(!W.entranceRoom(a)&&pz< -a.d/2-10.7)change=[a.cx,a.cz-1,'north'];else if(px>a.w/2+10.7)change=[a.cx+1,a.cz,'west'];else if(px< -a.w/2-10.7)change=[a.cx-1,a.cz,'east'];
   if(change){buildRoom(...change);transitionUntil=elapsed+1;}
  }
  syncPlayer(p);queueTiles();anticipateRoom();return distance;
 }
 function update(dt,p,eyeCamera,low=false){if(!prepared)return;windTime.value+=dt;exterior.visible=!active&&Math.hypot(p.x-site.x,p.z-site.z)<220;if(!active){const q=local(p.x,p.z);if(q.z>14&&q.z<30&&Math.abs(q.x)<3)prefetchTerrain(0,0);return;}
  if(effective!==(low?'low':'normal')){effective=low?'low':'normal';plantDirty=true;}
  for(const c of clouds)c.rotation.y=Math.atan2(eyeCamera.position.x-c.position.x,eyeCamera.position.z-c.position.z);
  const start=performance.now();while(fallback.length&&performance.now()-start<1.2){const j=fallback.shift();acceptTile({...j,data:W.tile(j.a,j.tx,j.tz)});}
  lastPlants+=dt;if(plantDirty&&lastPlants>.18){refreshPlants();lastPlants=0;}
 }
 function suspend(p){if(!active)return;suspended={...p};active=false;Object.assign(p,toWorld(0,-24),{walkY:exterior.position.y});}
 function resume(p){if(!suspended)return;Object.assign(p,suspended);suspended=null;active=true;}
 function reset(p){suspended=null;if(active&&p){const q=toWorld(0,-24);Object.assign(p,q,{walkY:exterior.position.y,yaw:Math.PI*1.5,pitch:0});}active=false;clearRoom();transitionUntil=0;}
 return{prepare,enterFromWorld,enterRoom,move,update,reset,suspend,resume,blocked:worldBlocked,walkHeight:worldHeight,local,toWorld,canWalk,scene,exterior,
  near:(x,z)=>terrain.biosphereReserved(x,z,5),get active(){return active;},get current(){return zone;},get state(){return{active,version:'0.5',x:site.x,z:site.z,room:zone?{cx:zone.cx,cz:zone.cz,w:zone.w,d:zone.d}:null,plants:active?activePlants:exteriorPlantCount,tiles:tiles.size,worker:!!worker,prepared};}};
}};
})();
