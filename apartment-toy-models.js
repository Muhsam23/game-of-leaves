/* Approved Spielzeuglabor v2 models, source commit
   95f9db685f9faa1506762db095ac855b68452a55. Shapes, photo UVs and meter scale
   are preserved; static parts are batched in toy-local coordinates only.
   See TOY_CREDITS.md for sources and unchanged texture hashes. */
(() => {
'use strict';
const CATALOG=Object.freeze([{"id":"railway","name":"Leningrader Tischbahn","width":0.2549999952316284,"height":0.0779999998807907,"depth":0.22050000113248824,"triangles":1574,"source":"https://www.elcoleccionistaeclectico.com/en/leningrad-metal-zavod-soviet-railroad-railway-station-train-set-wind-up-p23054"},{"id":"yula","name":"Blechkreisel","width":0.1876000016927719,"height":0.225,"depth":0.1876000016927719,"triangles":1920,"source":"https://www.ebay.com/itm/325796152411"},{"id":"excavator","name":"Raupenbagger","width":0.1340000033378601,"height":0.3019999996572733,"depth":0.40349999898672106,"triangles":3314,"source":"https://www.1stdibs.com/furniture/more-furniture-collectibles/collectibles-curiosities/toys-dolls/ussr-construction-excavator-toy-pressed-steel-1970/id-f_23748122/"},{"id":"clockwork","name":"Aufziehlokomotive","width":0.41399999947845934,"height":0.15350000575184822,"depth":0.15839999989047648,"triangles":12370,"source":"https://www.litfund.ru/auction/496/297/"},{"id":"nevalyashka","name":"Nevaljaschka","width":0.154,"height":0.2499999986588955,"depth":0.132,"triangles":3136,"source":"https://www.ebay.com/itm/358366337530"}].map(Object.freeze));
function buildFigure(THREE,id,material){
 const root=new THREE.Group();root.name=id;
 const mat=(tex,color=0xffffff,roughness=.67,metalness=0)=>material(id,tex,color,roughness,metalness,'solid-');
 function mesh(geo,m,x,y,z,parent=root,name='') {const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;o.name=name;parent.add(o);return o;}
 function ball(m,x,y,z,rx,ry,rz,parent=root,name=''){const o=mesh(new THREE.SphereGeometry(1,Math.max(rx,ry,rz)<.005?8:Math.max(rx,ry,rz)<.025?16:24,Math.max(rx,ry,rz)<.005?6:Math.max(rx,ry,rz)<.025?10:16),m,x,y,z,parent,name);o.scale.set(rx,ry,rz);return o;}
 function box(m,x,y,z,w,h,d,parent=root,name=''){return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent,name);}
 function cylinder(m,x,y,z,rt,rb,h,parent=root,name='',segments=24){return mesh(new THREE.CylinderGeometry(rt,rb,h,segments),m,x,y,z,parent,name);}
 function torus(m,x,y,z,r,t,parent=root,rotX=0,name=''){const o=mesh(new THREE.TorusGeometry(r,t,6,32),m,x,y,z,parent,name);o.rotation.x=rotX;return o;}
 function cap(m,x,y,z,rx,ry,depth,parent=root,name='',concave=false){
  const p=[],n=[],uv=[],idx=[],rings=8,seg=40;
  for(let j=0;j<=rings;j++)for(let i=0;i<=seg;i++){
   const r=j/rings,a=i/seg*Math.PI*2,px=r*Math.cos(a),py=r*Math.sin(a);
   const zz=concave?depth*(r*r*.75+.25):depth*Math.sqrt(Math.max(0,1-r*r));
   p.push(px*rx,py*ry,zz);uv.push((px*.98+1)/2,(py*.98+1)/2);
   if(j<rings&&i<seg){const k=j*(seg+1)+i;idx.push(k,k+seg+1,k+1,k+1,k+seg+1,k+seg+2);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  return mesh(g,m,x,y,z,parent,name);
 }
 function photoHead(parent,x,y,z,rx,ry,rz,body,face,name='head'){
  const g=new THREE.Group();g.name=name;g.position.set(x,y,z);parent.add(g);
  ball(body,0,0,-.0002,rx*.995,ry*.995,rz*.995,g,'back');cap(face,0,0,0,rx,ry,rz,g,'photo-face');return g;
 }
 if(id==='nevalyashka'){
  const red=mat('red-plastic',0xe7d4bc,.48),white=mat('ivory-plastic',0xe3d7bd,.49),face=mat('doll-face',0xf7efdc,.54),seam=mat(null,0x7e2d22,.72);
  ball(red,0,.076,0,.070,.076,.066);
  const collar=cylinder(red,0,.135,0,.038,.048,.029);photoHead(root,0,.19,.003,.056,.060,.043,red,face);
  ball(white,-.054,.142,.026,.023,.023,.022);ball(white,.054,.142,.026,.023,.023,.022);
  const line=torus(seam,0,.055,0,.067,.00065,root,Math.PI/2);line.scale.y=.941;
  root.userData.pivotY=.035;
 }
 if(id==='yula'){
  const paint=mat('top-rings',0xd7c8ae,.47,.35),metal=mat('top-metal',0xaaa58f,.52,.66),handle=mat('top-handle',0xdcbfb0,.7);
  const body=new THREE.Group();body.name='spin-body';root.add(body);
  const profile=[[0,.010],[.018,.014],[.052,.025],[.087,.045],[.093,.051],[.091,.063],[.08,.08],[.062,.101],[.042,.126],[.023,.145],[.017,.15]];
  const g=new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),48);
  // Map bottom of the photographed radial strip to the broad rim, centre to neck.
  const uv=g.attributes.uv, pos=g.attributes.position;
  for(let i=0;i<uv.count;i++){const yy=pos.getY(i);uv.setY(i,Math.max(0,Math.min(1,(yy-.052)/.098)));}
  mesh(g,paint,0,0,0,body);torus(metal,0,.052,0,.092,.0018,body,Math.PI/2);
  cylinder(metal,0,.009,0,.007,.002,.018,body);cylinder(metal,0,.168,0,.003,.003,.045,root,'pump-shaft');
  const grip=new THREE.Group();grip.name='pump-grip';root.add(grip);cylinder(handle,0,.199,0,.018,.009,.025,grip);ball(handle,0,.214,0,.019,.011,.019,grip);
 }
 root.updateMatrixWorld(true);const pre=new THREE.Box3().setFromObject(root);root.children.forEach(o=>o.position.y-=pre.min.y);root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root);root.userData.bounds={min:b.min.toArray(),max:b.max.toArray()};root.userData.triangles=0;root.traverse(o=>{if(o.isMesh)root.userData.triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;});
 return root;
}
function buildMechanical(T,id,material){
 const root=new T.Group();root.name=id;let wheelNo=0;
 const group=(name,parent=root,x=0,y=0,z=0)=>{let g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;};
 const mat=(tex,color=0xffffff,rough=.64,metal=0)=>material(id,tex,color,rough,metal,'paint-');
 const black=mat(null,0x080a08,.9),glass=mat(null,0x101d1e,.25,.12),chrome=mat('top-metal',0xcac9be,.4,.56),darkmetal=mat(null,0x252822,.7,.4),red=mat(null,0x872c1c,.58);
 function mesh(g,m,x=0,y=0,z=0,p=root,name=''){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.name=name;o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
 const box=(m,x,y,z,w,h,d,p=root,name='')=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p,name);
 const ball=(m,x,y,z,rx,ry,rz,p=root)=>{let o=mesh(new T.SphereGeometry(1,16,10),m,x,y,z,p);o.scale.set(rx,ry,rz);return o;};
 const cyl=(m,x,y,z,r,h,p=root,name='',r2=r,seg=20)=>mesh(new T.CylinderGeometry(r,r2,h,seg),m,x,y,z,p,name);
 function torus(m,x,y,z,r,t,p=root,rx=0){let o=mesh(new T.TorusGeometry(r,t,5,32),m,x,y,z,p);o.rotation.x=rx;return o;}
 function bar(m,a,b,r=.0015,p=root){let A=new T.Vector3(...a),B=new T.Vector3(...b),v=B.clone().sub(A);let o=cyl(m,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,v.length(),p,'',r,8);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
 function quad(m,points,p=root){let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();m.side=T.DoubleSide;return mesh(g,m,0,0,0,p);}
 function front(m,x,y,z,w,h,p=root){return quad(m,[[x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z]],p);}
 function top(m,x,y,z,w,d,p=root){return quad(m,[[x-w/2,y,z+d/2],[x+w/2,y,z+d/2],[x+w/2,y,z-d/2],[x-w/2,y,z-d/2]],p);}
 function wheel(x,y,z,r,width,p=root,hub=chrome,spokes=false){let g=group('wheel-'+wheelNo++,p,x,y,z);let w=cyl(black,0,0,0,r,width,g);w.rotation.z=Math.PI/2;for(const s of [-1,1]){let h=cyl(hub,s*(width/2+.0003),0,0,r*.71,.001,g);h.rotation.z=Math.PI/2;if(spokes){for(let j=0;j<8;j++){let a=j*Math.PI/4;bar(hub,[s*(width/2+.001),Math.sin(a)*r*.17,Math.cos(a)*r*.17],[s*(width/2+.001),Math.sin(a)*r*.85,Math.cos(a)*r*.85],r*.07,g);}}}return g;}
 function axles(p,w,zs,y,r,width=.008,hub=chrome,spokes=false){zs.forEach(z=>{bar(darkmetal,[-w/2,y,z],[w/2,y,z],r*.13,p);for(let s of [-1,1])wheel(s*w/2,y,z,r,width,p,hub,spokes);});}
 function prism(m,points,width,p=root,bevel=.0005){let shape=new T.Shape();points.forEach(([z,y],i)=>i?shape.lineTo(-z,y):shape.moveTo(-z,y));shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:width,bevelEnabled:bevel>0,bevelSegments:1,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:8});geo.rotateY(Math.PI/2);geo.translate(-width/2,0,0);return mesh(geo,m,0,0,0,p);}
 if(id==='clockwork'){
  let p=group('locomotive');p.rotation.y=-Math.PI/2;const green=mat('steam-green'),blk=mat('steam-black');box(blk,0,.051,.016,.075,.009,.235,p);let boiler=cyl(green,0,.096,.06,.040,.158,p);boiler.rotation.x=Math.PI/2;let frontG=cyl(blk,0,.096,.147,.042,.027,p);frontG.rotation.x=Math.PI/2;front(mat('steam-face'),0,.098,.162,.073,.078,p);
  for(let z of [.002,.055,.104])torus(chrome,0,.096,z,.0405,.001,p);
  cyl(blk,0,.142,.105,.013,.023,p);cyl(green,0,.141,.010,.015,.012,p);box(green,0,.093,-.05,.078,.089,.055,p);box(green,0,.140,-.05,.092,.006,.075,p);
  for(let s of [-1,1])for(let z of [-.068,-.041])front(glass,0,0,0,.01,.01,group('window',p,s*.040,.104,z)).rotation.y=s*Math.PI/2;
  axles(p,.071,[-.003,.072],.035,.035,.013,red,true);axles(p,.068,[.130],.02,.02,.01,red);
  for(const s of [-1,1]){const rod=group('connecting-rod-'+s,p,s*.046,.035,0);bar(chrome,[0,-.008,-.003],[0,-.008,.072],.0024,rod);bar(chrome,[s*.002,.073,-.04],[s*.002,.073,.126],.0011,p);}
  for(let s of [-1,1]){let b=cyl(chrome,s*.027,.033,.165,.009,.008,p);b.rotation.x=Math.PI/2;}
  const tender=group('tender',p,0,0,-.185);box(blk,0,.035,0,.074,.009,.119,tender);box(green,0,.066,0,.071,.059,.115,tender);box(black,0,.097,0,.058,.004,.098,tender);axles(tender,.067,[-.039,.039],.021,.021,.009);
  for(let i=0;i<20;i++)ball(black,Math.sin(i*4.5)*.026,.100+Math.sin(i)*.002,Math.cos(i*2.3)*.04,.006,.004,.007,tender);
  const key=group('winding-key',root,.01,.003,.1);bar(chrome,[-.015,0,0],[.030,0,0],.003,key);torus(chrome,.033,0,0,.008,.002,key,Math.PI/2);
 }
 if(id==='railway'){
  const yellow=mat(null,0xbab469,.8),green=mat(null,0x366348,.8);box(yellow,0,.011,0,.255,.022,.140);top(mat('railway-board'),0,.0224,0,.252,.137);front(mat('railway-front'),0,.011,.071,.253,.021);
  for(let s of [-1,1]){const station=group('station-'+s,root,s*.102,.022,0);box(yellow,0,.014,0,.026,.028,.029,station);box(green,0,.011,.015,.017,.022,.001,station);prism(mat('station-red'),[[-.017,.028],[0,.037],[.017,.028]],.032,station);box(yellow,s*.011,.031,0,.012,.021,.018,station);for(const side of [-1,1]){const loop=torus(mat(null,0xcec49a,.75),s*.065,.024,0,.050,.0022,root,Math.PI/2);loop.scale.y=.87;break;}
   const train=group('tiny-train-'+s,root,s*.065,.026,0);train.userData.loop=s;for(let j=0;j<4;j++){let carriage=group('tiny-car-'+j,train,0,0,j*.017);let paint=mat(null,s<0?0x922b1d:0x224354,.65);box(paint,0,.005,0,.009,.009,.015,carriage);box(yellow,0,.010,0,.009,.002,.015,carriage);for(let side of [-1,1])for(let k=-1;k<=1;k++)box(glass,side*.0046,.006,k*.004,.0003,.003,.002,carriage);}}
  const center=group('central-station',root,0,.022,0);box(yellow,0,.018,0,.040,.036,.040,center);let roof=cyl(mat('station-red'),0,.045,0,0,.022,center,'',.036,4);roof.rotation.y=Math.PI/4;
  const carton=group('railway-carton',root,0,0,-.117);box(yellow,0,.029,0,.25,.058,.065,carton);front(mat('railway-box'),0,.030,.033,.25,.056,carton);
 }
 if(id==='excavator'){
  const blue=mat('excavator-blue',0xd9e6dd,.65,.1);const chassis=group('tracks');box(blue,0,.025,0,.09,.025,.143,chassis);
  for(let s of [-1,1]){box(black,s*.054,.022,0,.023,.029,.155,chassis);for(let i=0;i<15;i++){let z=-.077+i*.011;box(darkmetal,s*.054,.037,z,.026,.003,.005,chassis);}for(let z of [-.058,-.029,0,.029,.058])wheel(s*.06,.020,z,.018,.011,chassis,darkmetal);}
  const body=group('excavator-upper',root,0,.042,0);cyl(chrome,0,0,0,.035,.012,body);box(blue,0,.014,0,.104,.023,.118,body);box(blue,-.019,.059,-.018,.057,.074,.073,body);box(blue,-.019,.098,-.018,.065,.004,.080,body);front(glass,-.019,.072,.020,.043,.034,body);box(black,-.048,.071,-.026,.001,.031,.030,body);for(let i=0;i<4;i++)box(darkmetal,.019,.039,-.050-i*.007,.033,.002,.002,body);
  const arm=group('excavator-arm',body,.020,.023,.018);for(let s of [-1,1])bar(blue,[s*.009,0,0],[s*.009,.225,.18],.008,arm);const boomEnd=[0,.225,.18];let pulley=cyl(red,0,.225,.18,.014,.022,arm);pulley.rotation.z=Math.PI/2;
  const fore=group('bucket-arm',arm,0,.122,.101);bar(blue,[0,0,0],[0,.023,.160],.007,fore);bar(darkmetal,boomEnd,[0,.145,.261],.0008,arm);bar(darkmetal,[0,.08,-.014],boomEnd,.0008,arm);
  const bucket=group('bucket',fore,0,.023,.16);box(red,0,-.014,.014,.053,.004,.041,bucket);box(red,0,.001,-.006,.053,.030,.004,bucket);for(let s of [-1,1])prism(red,[[-.006,-.013],[-.006,.024],[.035,-.013]],.003,group('bucket-cheek',bucket,s*.027,0,0),0);for(let i=-2;i<=2;i++)box(darkmetal,i*.010,-.014,.039,.005,.003,.012,bucket);
 }
 // Merge static mesh batches within each group; retain all articulated group pivots.
 function optimize(parent){parent.children.filter(o=>o.isGroup).forEach(optimize);const buckets=new Map();parent.children.filter(o=>o.isMesh).forEach(o=>{const arr=buckets.get(o.material)||[];arr.push(o);buckets.set(o.material,arr);});for(const [m,list]of buckets){if(list.length<2)continue;const ps=[],ns=[],us=[],ix=[];let count=0;for(const o of list){o.updateMatrix();let g=o.geometry.clone().applyMatrix4(o.matrix);ps.push(...g.attributes.position.array);ns.push(...g.attributes.normal.array);us.push(...g.attributes.uv.array);let inds=g.index?g.index.array:Uint32Array.from({length:g.attributes.position.count},(_,i)=>i);for(const a of inds)ix.push(count+a);count+=g.attributes.position.count;parent.remove(o);g.dispose();o.geometry.dispose();}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.setAttribute('normal',new T.Float32BufferAttribute(ns,3));g.setAttribute('uv',new T.Float32BufferAttribute(us,2));g.setIndex(ix);mesh(g,m,0,0,0,parent,'material-batch');}}
 optimize(root);root.updateMatrixWorld(true);let bounds=new T.Box3().setFromObject(root);root.children.forEach(o=>o.position.y-=bounds.min.y);root.updateMatrixWorld(true);bounds.setFromObject(root);root.userData.bounds={min:bounds.min.toArray(),max:bounds.max.toArray()};root.userData.triangles=0;root.traverse(o=>{if(o.isMesh)root.userData.triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;});return root;
}
function create(THREE,loadTexture){
 if(typeof loadTexture!=='function')throw new TypeError('NovaApartmentToyModels requires a texture-loading callback');
 const materials=[],maps={},materialCache=new Map(),templates=new Map();
 function material(kind,tex,color,roughness,metalness,prefix){
  const key=[kind,tex,color,roughness,metalness].join('/');
  if(materialCache.has(key))return materialCache.get(key);
  let map=null;
  if(tex){
   if(!maps[tex]){
    // Keep the loader-owned map so asynchronously decoded images remain live.
    map=loadTexture('apartment-toys/'+tex+'.jpg');
    map.name=tex;map.encoding=THREE.sRGBEncoding;
    map.wrapS=map.wrapT=THREE.ClampToEdgeWrapping;
    map.anisotropy=Math.max(map.anisotropy||1,4);
    map.userData={...map.userData,file:'assets/apartment-toys/'+tex+'.jpg'};
    maps[tex]=map;
   }
   map=maps[tex];
  }
  const m=new THREE.MeshStandardMaterial({map,color,roughness,metalness});
  m.name=tex||prefix+color.toString(16);
  m.userData={photo:!!tex,originalColor:color,originalRoughness:roughness,apartmentToy:kind};
  materialCache.set(key,m);materials.push(m);return m;
 }
 function batchLocal(model,meta){
  // A train at rest uses the same pose as animate(model,0,false) in the lab.
  if(meta.id==='railway')for(const s of [-1,1]){
   const train=model.getObjectByName('tiny-train-'+s);
   for(let j=0;j<4;j++){
    const car=train.getObjectByName('tiny-car-'+j),angle=-j*.34;
    car.position.set(Math.cos(angle)*.05,0,Math.sin(angle)*.0435);car.rotation.y=-angle;
   }
  }
  model.updateMatrixWorld(true);
  const buckets=new Map();
  model.traverse(o=>{
   if(!o.isMesh)return;
   const transformed=o.geometry.clone().applyMatrix4(o.matrixWorld);
   const parts=buckets.get(o.material)||[];parts.push(transformed);buckets.set(o.material,parts);
  });
  const root=new THREE.Group();root.name='Apartment toy: '+meta.id;
  for(const [m,parts]of buckets){
   const positions=[],normals=[],uvs=[],indices=[];let count=0;
   for(const g of parts){
    positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);uvs.push(...g.attributes.uv.array);
    if(g.index)for(const i of g.index.array)indices.push(count+i);
    else for(let i=0;i<g.attributes.position.count;i++)indices.push(count+i);
    count+=g.attributes.position.count;g.dispose();
   }
   const geometry=new THREE.BufferGeometry();
   geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
   geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
   geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);
   geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const mesh=new THREE.Mesh(geometry,m);mesh.name=meta.id+': '+m.name;
   mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.apartmentToyPart=true;root.add(mesh);
  }
  model.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
  root.updateMatrixWorld(true);
  const b=new THREE.Box3().setFromObject(root),size=b.getSize(new THREE.Vector3());
  root.userData={toyId:meta.id,units:'metres',source:meta.source,triangles:meta.triangles,
   apartmentToy:{kind:meta.id,width:size.x,height:size.y,depth:size.z,
    radius:Math.hypot(Math.max(Math.abs(b.min.x),Math.abs(b.max.x)),Math.max(Math.abs(b.min.z),Math.abs(b.max.z)))},
   bounds:{min:b.min.toArray(),max:b.max.toArray()}};
  return root;
 }
 // Build once: the host can register every shared material before first use.
 for(const meta of CATALOG){
  const model=['nevalyashka','yula'].includes(meta.id)?buildFigure(THREE,meta.id,material):buildMechanical(THREE,meta.id,material);
  templates.set(meta.id,batchLocal(model,meta));
 }
 const usedMaterials=new Set();
 for(const template of templates.values())for(const part of template.children)usedMaterials.add(part.material);
 for(let i=materials.length-1;i>=0;i--)if(!usedMaterials.has(materials[i])){materials[i].dispose();materials.splice(i,1);}
 // shared (v102, night backrooms): the instance uses the template's geometry itself and is
 // marked keepGeometry, so the room cache leaves it alone. Every backroom toy used to be its
 // own copy on the GPU (up to eight buffers each, in every cached room).
 function createObject(kind,{shared=false}={}){
  const template=templates.get(kind);
  if(!template)throw new RangeError('Unknown apartment toy: '+kind);
  const object=template.clone(true);
  // Room-cache eviction may dispose geometry; never share it between instances.
  object.traverse(o=>{if(!o.isMesh)return;if(shared)o.userData={...o.userData,keepGeometry:true};else o.geometry=o.geometry.clone();});
  return object;
 }
 return{createObject,materials,maps,catalog:CATALOG};
}
window.NovaApartmentToyModels={create,catalog:CATALOG};
})();
