/* Pool-room objects from real photographs. Original files and licenses are in
   POOL_PROPS_CREDITS.md. Texture pixels are unchanged; UVs select the objects. */
(() => {
'use strict';
const FILES=Object.freeze({ball:'pool-props/beach-ball.jpg',ring:'pool-props/swim-ring.jpg',armbands:'pool-props/swim-armbands.jpg'});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function random(seed){let x=Number(seed)>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function create(THREE,loadTexture){
 if(typeof loadTexture!=='function')throw new TypeError('NovaPoolProps requires a texture-loading callback');
 const materials=[],maps={};
 for(const [kind,path]of Object.entries(FILES)){
  const map=loadTexture(path);maps[kind]=map;
  // Retain the loader-owned texture: a clone made before the image has loaded
  // would not receive its decoded pixels. Only these three dedicated maps use
  // these settings, and the UVs already stay inside the photographed objects.
  map.wrapS=map.wrapT=THREE.ClampToEdgeWrapping;map.encoding=THREE.sRGBEncoding;
  map.anisotropy=Math.max(map.anisotropy||1,4);
  const m=new THREE.MeshPhongMaterial({map,color:0xe4e0d6,specular:0x383c3e,shininess:42});
  m.name='Pool photo: '+kind;m.userData.poolPhoto=kind;materials.push(m);
 }
 const [ballMaterial,ringMaterial,armMaterial]=materials;
 function remap(geometry,fn){
  const p=geometry.attributes.position,uv=geometry.attributes.uv;
  for(let i=0;i<p.count;i++){const v=fn(p.getX(i),p.getY(i),p.getZ(i));uv.setXY(i,v[0],v[1]);}
  uv.needsUpdate=true;return geometry;
 }
 function patch(geometry,u,v,w,h){
  const uv=geometry.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setXY(i,u+uv.getX(i)*w,1-v-uv.getY(i)*h);
  uv.needsUpdate=true;return geometry;
 }
 // The ball occupies a near-circular area in Norvy's photograph. Orthographic
 // projection to both hemispheres keeps every UV inside the plastic, with no
 // carpet border, and carries the photographed welds across a closed sphere.
 const ball=remap(new THREE.SphereGeometry(.20,24,14),(x,y)=>[.487+x/.20*.405,1-(.497-y/.20*.423)]);
 // A flattened torus with a genuine open center. The source ring is slightly
 // elliptical and off-center, so its inner and outer contours have independent
 // photographic coordinates. The annular UV mapping excludes the white table.
 const ring=new THREE.TorusGeometry(.33,.11,8,32);ring.rotateX(-Math.PI/2);ring.scale(1,.82,1);
 remap(ring,(x,y,z)=>{
  const a=Math.atan2(z,x),f=clamp((Math.hypot(x,z)-.22)/.22,0,1),c=Math.cos(a),s=Math.sin(a);
  const ui=.498+c*.122,uo=.494+c*.224,vi=.493+s*.210,vo=.507+s*.376;
  return[ui+(uo-ui)*f,1-vi-(vo-vi)*f];
 });
 // A closed, padded sleeve: round arm hole, squarish inflated outside, deep
 // double-wall profile. Open arm holes are geometry, never a painted dark disk.
 function sleeveGeometry(){
  const p=[],uv=[],idx=[],around=24,across=8;
  const signedPow=(n,e)=>Math.sign(n)*Math.pow(Math.abs(n),e);
  for(let i=0;i<=around;i++){
   const a=i/around*Math.PI*2,c=Math.cos(a),s=Math.sin(a);
   const ox=signedPow(c,.68)*.145,oy=signedPow(s,.68)*.135,ix=c*.044,iy=s*.052;
   for(let j=0;j<=across;j++){
    const b=j/across*Math.PI*2,t=(1+Math.cos(b))/2,x=ix+(ox-ix)*t,y=iy+(oy-iy)*t,z=Math.sin(b)*.09;
    p.push(x,y,z);
    // A quadrilateral inside the blue printed panel, excluding skin and water.
    const u=clamp((x/.145+1)/2,0,1),v=clamp((1-y/.135)/2,0,1);
    const topU=.235+u*.425,topV=.23+u*.21,bottomU=.275+u*.495,bottomV=.63+u*.13;
    uv.push(topU+(bottomU-topU)*v,1-topV-(bottomV-topV)*v);
    if(i<around&&j<across){const k=i*(across+1)+j,n=k+across+1;idx.push(k,n,k+1,n,n+1,k+1);}
   }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
 }
 const sleeve=sleeveGeometry();
 const ballValve=patch(new THREE.CylinderGeometry(.017,.022,.007,10),.58,.59,.05,.05);
 const ringValve=patch(new THREE.CylinderGeometry(.010,.015,.020,8),.479,.12,.015,.015);
 const armValve=patch(new THREE.CylinderGeometry(.008,.012,.017,8),.445,.22,.022,.028);
 const stopper=patch(new THREE.CylinderGeometry(.008,.008,.005,8),.448,.22,.018,.018);
 const valveDirection=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 // v102: createObject(kind,seed,{shared:true}) uses the one geometry for every prop and marks
 // it keepGeometry (the night-room cache then leaves it alone). Otherwise, as before:
 let cloneParts=true;
 function part(parent,geometry,material){
  // Room eviction disposes descendant geometries. Each object receives its own
  // clone; material and photo maps remain shared for the lifetime of the world.
  const m=new THREE.Mesh(cloneParts?geometry.clone():geometry,material);m.userData.poolPropPart=true;if(!cloneParts)m.userData.keepGeometry=true;parent.add(m);return m;
 }
 function valve(parent,geometry,material,x,y,z,nx,ny,nz){
  const m=part(parent,geometry,material);m.position.set(x,y,z);valveDirection.set(nx,ny,nz).normalize();m.quaternion.setFromUnitVectors(up,valveDirection);return m;
 }
 function exactBounds(group){
  const bounds=new THREE.Box3(),point=new THREE.Vector3();group.updateMatrixWorld(true);
  group.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);bounds.expandByPoint(point);}});return bounds;
 }
 function createObject(kind,seed=0,{shared=false}={}){
  if(!Object.prototype.hasOwnProperty.call(FILES,kind))throw new RangeError('Unknown pool prop: '+kind);
  const rand=random(seed),group=new THREE.Group(),model=new THREE.Group();group.add(model);group.name='Pool '+kind;
  let floatDepth;cloneParts=!shared;
  if(kind==='ball'){
   part(model,ball,ballMaterial);valveDirection.set(.37,-.34,.865).normalize();
   valve(model,ballValve,ballMaterial,valveDirection.x*.203,valveDirection.y*.203,valveDirection.z*.203,valveDirection.x,valveDirection.y,valveDirection.z);
   model.rotation.set(rand()*2.5,rand()*Math.PI*2,rand()*2.5);
   const scale=.76+rand()*.29;model.scale.setScalar(scale);floatDepth=.08*scale;
  }else if(kind==='ring'){
   part(model,ring,ringMaterial);valve(model,ringValve,ringMaterial,.312,.084,.045,0,1,0);
   model.rotation.y=rand()*Math.PI*2;const scale=.92+rand()*.13;model.scale.setScalar(scale);floatDepth=.045*scale;
  }else{
   for(let i=0;i<2;i++){
    const wing=new THREE.Group();model.add(wing);part(wing,sleeve,armMaterial);
    valve(wing,armValve,armMaterial,.119,.06,.033,.8,.35,.2);
    valve(wing,stopper,armMaterial,.129,.064,.036,.8,.35,.2);
    wing.position.set(i?.179:-.179,0,i?.065:-.035);wing.rotation.set(Math.PI/2+(rand()-.5)*.22,(rand()-.5)*.34,i?-.12:.23);
   }
   model.rotation.y=(rand()-.5)*.3;floatDepth=.035;
  }
  cloneParts=true;
  // Establish a true floor origin after deterministic rotations; callers can
  // place on tile at y=floor, or afloat at y=waterLevel-floatDepth.
  // A rotated sphere's axis-aligned geometry box is larger than the sphere.
  // Measure the actual vertices so random orientations never make it float.
  let bounds=exactBounds(group);model.position.y-=bounds.min.y;
  bounds=exactBounds(group);const size=bounds.getSize(new THREE.Vector3());
  group.userData.poolProp={kind,seed:Number(seed)>>>0,height:size.y,radius:Math.max(size.x,size.z)/2,floatDepth};
  return group;
 }
 return{createObject,materials,maps,files:FILES};
}
window.NovaPoolProps={create,files:FILES};
})();
