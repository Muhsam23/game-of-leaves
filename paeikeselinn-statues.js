/* Monumental corruptions of the original NPCs. Static scenery, never live enemies. */
(function(root){
'use strict';
const hash=(x,z,s)=>root.NovaCorruption.hash(x,z,s),cache=new Map();
function plan(cx,cz,seed){
 const key=cx+','+cz+','+seed;if(cache.has(key))return cache.get(key);
 const h=hash(cx,cz,seed^91827),first=cx===0&&cz===0;let p=null;
 if(first||h%100<43){const corner=(h>>>7)%4;
  p={cx,cz,x:cx*48+(first?16:corner%2?40:8),z:cz*48+(first?9:corner<2?8:40),radius:6.1,
   variant:first?12:(h>>>12)%16,height:first?32:18+(h>>>17)%27,yaw:first?.55:(h%628)/100};
 }
 cache.set(key,p);if(cache.size>180)cache.delete(cache.keys().next().value);return p;
}
function nearby(x,z,seed,pad=0){const out=[],cx=Math.floor(x/48),cz=Math.floor(z/48);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const p=plan(cx+a,cz+b,seed);if(p&&Math.hypot(x-p.x,z-p.z)<p.radius+pad)out.push(p);}return out;}
function create(T,catalogue,texture,shared,materials){
 const sources=new Map(catalogue.models.map(m=>[m.id,m])),mats=new Map(),variants=[];
 for(const m of sources.values())for(const p of m.parts)if(!mats.has(p.texture)){
  const mat=new T.MeshLambertMaterial({map:p.texture?texture(p.texture):null,vertexColors:true,side:T.DoubleSide,color:0xffffff});
  mat.name='Statue · '+(p.texture||'eye sockets');mats.set(p.texture,mat);materials.push(mat);
 }
 function bounds(parts){const b=new T.Box3();for(const p of parts)for(let i=0;i<p.position.length;i+=3)b.expandByPoint(new T.Vector3(...p.position.slice(i,i+3)));return b;}
 function graft(id,role,at,size,angles=[0,0,0],component){
  const parts=sources.get(id).parts.filter(p=>p.role===role&&(!component||p.component===component));
  const box=bounds(parts),mid=box.getCenter(new T.Vector3()),scale=size/(box.max.y-box.min.y||1),rotation=new T.Quaternion().setFromEuler(new T.Euler(...angles));
  return parts.map(p=>({...p,source:id,position:p.position.map((v,i)=>v)})).map(p=>{
   for(let i=0;i<p.position.length;i+=3){const v=new T.Vector3(...p.position.slice(i,i+3)).sub(mid).multiplyScalar(scale).applyQuaternion(rotation).add(new T.Vector3(...at));p.position.splice(i,3,...v.toArray());}return p;
  });
 }
 const ids=['vermesser','ina','kopf','network'];
 function recipe(index){
  if(index<12){const id=ids[index%4];return{parts:sources.get(id).parts.map(p=>({...p,source:id})),style:Math.floor(index/4),species:[id]};}
  const body=sources.get('vermesser').parts.filter(p=>p.role!=='head').map(p=>({...p,source:'vermesser'}));
  if(index===12)return{style:1,species:['vermesser','kopf','ina'],parts:[...body,...graft('kopf','head',[0,.98,.03],.30,[.2,.1,-.5]),...graft('ina','arm',[.19,.60,0],.56,[.1,.3,2.0],'arm1'),...graft('ina','head',[-.09,.60,.02],.19,[0,1.1,1.8])]};
  if(index===13){const parts=sources.get('ina').parts.filter(p=>p.role!=='head').map(p=>({...p,source:'ina'}));return{style:2,species:['ina','network','kopf'],parts:[...parts,...graft('network','head',[0,.94,0],.25,[0,0,.4],'head5'),...graft('kopf','leg',[0,.20,0],.52,[0,.5,0]),...graft('network','head',[.20,.85,.02],.20,[0,-.8,-.7],'head1')]};}
  if(index===14)return{style:1,species:['kopf','vermesser','network'],parts:[...sources.get('kopf').parts.map(p=>({...p,source:'kopf'})),...graft('vermesser','arm',[-.17,.6,0],.78,[0,.7,2.1],'arm0'),...graft('vermesser','arm',[.18,.6,0],.78,[0,-.7,-2.1],'arm1'),...graft('network','head',[0,1.12,0],.25,[0,.7,Math.PI],'head3')]};
  return{style:2,species:['network','ina','vermesser'],parts:[...sources.get('network').parts.filter(p=>p.role!=='head').map(p=>({...p,source:'network'})),...graft('ina','head',[-.23,.83,0],.28,[0,.2,-.7]),...graft('ina','head',[.22,.66,0],.30,[0,-.6,1.8]),...graft('vermesser','head',[0,.9,.02],.43,[.2,0,.5])]};
 }
 for(let index=0;index<16;index++){
  const {parts,style,species}=recipe(index),arrays=new Map();
  function addTriangle(part,positions,uvs,tint=1){let a=arrays.get(part.texture);if(!a){a={p:[],u:[],c:[]};arrays.set(part.texture,a);}a.p.push(...positions);a.u.push(...uvs);for(let i=0;i<3;i++)a.c.push(...part.color.map(v=>v*tint));}
  for(const part of parts)for(let i=0;i<part.position.length;i+=9){
   const centerY=(part.position[i+1]+part.position[i+4]+part.position[i+7])/3,band=Math.floor(centerY*23),h=hash(band,index,8927),points=[];
   for(let j=0;j<9;j+=3){let [x,y,z]=part.position.slice(i+j,i+j+3);
    // Keep feet grounded, progressively twist and fold the upper silhouette.
    const t=Math.max(0,y-.13),angle=style===1?t*(index<12?7.8:3.8):style===0?t*.5:0,c=Math.cos(angle),s=Math.sin(angle);
    const xx=x*c-z*s,zz=x*s+z*c;x=xx;z=zz;
    if(style===1){x+=Math.sin(t*5.1)*t*.17;z+=Math.sin(t*3.3)*t*.10;}
    if(style===2&&y>.10){x+=((h%11)-5)*.013;z+=(((h>>>6)%7)-3)*.009;y+=band%7===0?.026:0;}
    points.push(x,y,z);
   }
   const uv=part.uv.slice(i/3*2,i/3*2+6);addTriangle(part,points,uv);
   // Detached memory slices echo actual triangles, with stable depth offsets.
   if(style===2&&band%6===2){const copy=points.map((v,k)=>v+(k%3===0?.044:k%3===2?.023:0));addTriangle(part,copy,uv,.70);}
  }
  const full=new T.Box3();for(const a of arrays.values())for(let i=0;i<a.p.length;i+=3)full.expandByPoint(new T.Vector3(...a.p.slice(i,i+3)));
  const height=full.max.y-full.min.y,mid=full.getCenter(new T.Vector3()),meshes=[];
  for(const [key,a]of arrays){for(let i=0;i<a.p.length;i+=3){a.p[i]=(a.p[i]-mid.x)/height;a.p[i+1]=(a.p[i+1]-full.min.y)/height;a.p[i+2]=(a.p[i+2]-mid.z)/height;}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(a.p,3));g.setAttribute('uv',new T.Float32BufferAttribute(a.u,2));g.setAttribute('color',new T.Float32BufferAttribute(a.c,3));g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();shared.add(g);meshes.push({geometry:g,material:mats.get(key)});
  }
  let radius=0;for(const m of meshes){const a=m.geometry.attributes.position;for(let i=0;i<a.count;i++)radius=Math.max(radius,Math.hypot(a.getX(i),a.getZ(i)));}
  variants.push({index,style,species,meshes,radius});
 }
 function populate(p,group,text,solids){
  if(!p)return null;const v=variants[p.variant],g=new T.Group();g.name='NPC statue · '+v.species.join(' / ');g.position.set(p.x,.008,p.z);g.rotation.y=p.yaw;
  const width=Math.min(p.height,5.7/v.radius);g.scale.set(width,p.height,width);group.add(g);
  for(const {geometry,material}of v.meshes){const m=new T.Mesh(geometry,material);m.userData.novaPatternKind='surface';g.add(m);}
  // Corrupted slab, low enough to step onto. Keep wide gaps between giant feet.
  text.box(p.x,-.10,p.z,2.4,.216,2.4,[0,0,.5,.5],3,1);
  g.updateMatrixWorld(true);const occupied=new Map(),point=new T.Vector3();
  for(const mesh of g.children){const a=mesh.geometry.attributes.position;for(let i=0;i<a.count;i+=3){const b=new T.Box3();for(let j=0;j<3;j++)b.expandByPoint(point.fromBufferAttribute(a,i+j).applyMatrix4(mesh.matrixWorld));
    if(b.min.y>1.8||b.max.y<.2)continue;
    for(let x=Math.floor(b.min.x/.6);x<=Math.floor(b.max.x/.6);x++)for(let z=Math.floor(b.min.z/.6);z<=Math.floor(b.max.z/.6);z++)occupied.set(x+','+z,{x0:x*.6,x1:(x+1)*.6,z0:z*.6,z1:(z+1)*.6});
   }}
  solids.push(...occupied.values());return{...p,species:v.species,style:v.style,group:g};
 }
 return{variants,populate};
}
root.NovaStatues={plan,nearby,create};
})(typeof window==='undefined'?globalThis:window);
