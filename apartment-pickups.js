// Two randomly selected living rooms, each with three independent floor pickups.
(() => {
'use strict';
const definitions=[
 {id:'soviet_pipe',model:'pipe',de:'Holzpfeife',description:'Eine abgegriffene Holzpfeife mit dunklem Mundstück und rußigem Pfeifenkopf.'},
 {id:'soviet_matches',model:'matches',de:'Streichhölzer',description:'Eine vergilbte Streichholzschachtel mit Sputnik-Etikett und abgenutzten Reibflächen.'},
 {id:'soviet_tobacco',model:'tin',de:'Tabakdose Рейд',description:'Eine alte Tabakdose mit verrosteten Kanten und verblichenem Lack.'}
];
function create(THREE,scene,S,textures,occluders){
 const factory=window.SovietProps.createFactory(THREE,textures),root=new THREE.Group();root.name='Apartment floor finds';scene.add(root);
 const items=new Map(),records=[],ray=new THREE.Raycaster(),v=new THREE.Vector3();let selected=[];
 // Bake the closed study models once. Hidden match/tobacco interiors need no draw calls.
 function bake(def){
  const source=factory[def.model]().root;
  for(const name of ['Sliding inner tray','Loose tobacco strands','Tobacco bed','Striker pressed pattern']){const hidden=[];source.traverse(o=>{if(o.name===name)hidden.push(o);});for(const o of hidden){o.parent.remove(o);o.traverse(n=>n.geometry?.dispose());}}
  source.updateMatrixWorld(true);const buckets=new Map();
  source.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrixWorld),m=o.material;
   if(!buckets.has(m))buckets.set(m,{position:[],normal:[],uv:[],color:[]});const b=buckets.get(m),count=g.attributes.position.count;
   for(const k of ['position','normal'])b[k].push(...g.attributes[k].array);
   b.uv.push(...(g.attributes.uv?.array||new Float32Array(count*2)));
   const c=g.attributes.color;for(let i=0;i<count;i++)b.color.push(c?c.getX(i):1,c?c.getY(i):1,c?c.getZ(i):1,c&&c.itemSize===4?c.getW(i):1);g.dispose();
  });
  const result=new THREE.Group();for(const [m,b]of buckets){const g=new THREE.BufferGeometry();for(const k of ['position','normal','uv','color'])g.setAttribute(k,new THREE.Float32BufferAttribute(b[k],k==='uv'?2:k==='color'?4:3));g.computeBoundingSphere();const mesh=new THREE.Mesh(g,m);mesh.castShadow=mesh.receiveShadow=true;result.add(mesh);}
  source.traverse(o=>o.geometry?.dispose());return result;
 }
 const templates=new Map(definitions.map(d=>[d.id,bake(d)]));
 function layout(a){
  const side=Math.sign(a.x-S.cores[a.core].x),end=Math.sign(a.z-S.housing.z),cx=S.cores[a.core].x;
  for(const along of [8.3,9.4,7.2,10.3])for(const depth of [7.8,8.6,5.0,4.6]){
   const p={x:cx+side*along,z:S.housing.z+end*depth};
   const places=[{x:p.x-.26,z:p.z-.16},{x:p.x+.18,z:p.z-.12},{x:p.x+.03,z:p.z+.24}];
   if(places.every(q=>!S.blocked(q.x,q.z,a.y,.28)))return places;
  }return null;
 }
 function reset(){
  items.clear();records.length=0;root.clear();const candidates=S.apartments.map(a=>({a,places:layout(a)})).filter(c=>c.places);
  for(let i=candidates.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
  selected=candidates.slice(0,2).map(c=>c.a.number);
  for(const {a,places}of candidates.slice(0,2))for(const [i,def]of definitions.entries()){
   const mesh=templates.get(def.id).clone(true),p=places[i];mesh.scale.setScalar(1.4);mesh.rotation.y=Math.random()*Math.PI*2;if(def.model==='pipe')mesh.rotation.z=Math.PI/2;
   mesh.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(mesh);mesh.position.set(p.x,a.y+.008-bounds.min.y,p.z);root.add(mesh);mesh.updateMatrixWorld(true);
   const center=new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3());records.push({...def,kind:'apartmentPickup',uid:'apartment-'+a.number+'-'+def.id,room:a.number,x:center.x,y:center.y,z:center.z,floor:a.y,mesh,collected:false});
  }
 }
 function target(eye,look,player){
  if(!S.nearHousing(player.x,player.z))return null;let best=null,score=Infinity;
  for(const r of records){if(r.collected||Math.abs(player.walkY-r.floor)>.4)continue;v.set(r.x-eye.x,r.y-eye.y,r.z-eye.z);const d=v.length(),dot=v.dot(look)/d,miss=d*Math.sqrt(Math.max(0,1-dot*dot));if(d>2.7||dot<.97||miss>.13)continue;
   ray.set(eye,v.clone().normalize());ray.far=d-.06;if(ray.intersectObjects(occluders.children,true).length)continue;
   if(miss<score){score=miss;best=r;}
  }return best;
 }
 function collect(record){const r=records.find(r=>r.uid===record?.uid);if(!r||r.collected)return false;r.collected=true;r.mesh.visible=false;items.set(r.id,(items.get(r.id)||0)+1);return true;}
 reset();return{root,items,records,target,collect,reset,definitions,get state(){return{rooms:[...selected],items:Object.fromEntries(items),remaining:records.filter(r=>!r.collected).length};}};
}
window.NovaApartmentPickups={create,definitions};
})();
