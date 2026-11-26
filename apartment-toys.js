// Independent toy rolls, stable room revisits and five furnished daytime rooms.
(() => {
'use strict';
const definitions=[
 {kind:'blocks',chance:.48,radius:.72},
 {kind:'railway',chance:.34,radius:.24},
 {kind:'yula',chance:.40,radius:.14},
 {kind:'excavator',chance:.34,radius:.36},
 {kind:'clockwork',chance:.36,radius:.28},
 {kind:'nevalyashka',chance:.40,radius:.14}
];
function hash(text,seed=0){let h=(seed^0x544f5953)>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
const random=seed=>window.NovaTerrain.rng(seed);
const newSeed=()=>Math.floor(Math.random()*0x100000000)>>>0;
function roll(seed,key,playroom=true){
 // Each kind has its own random stream. No exclusive choice or shared room gate.
 return definitions.filter(d=>random(hash(key+':presence:'+d.kind,seed))()<d.chance*(playroom?1:.5)).map(d=>d.kind);
}
function spaces(seed,key,room,isBlocked,avoid=()=>false){
 const placed=[];
 for(const d of definitions){
  const r=random(hash(key+':position:'+d.kind,seed)),margin=d.radius+.4;
  for(let attempt=0;attempt<150;attempt++){
   const x=room.x0+margin+r()*(room.x1-room.x0-2*margin),z=room.z0+margin+r()*(room.z1-room.z0-2*margin);
   if(avoid(x,z,d.radius)||isBlocked(x,z,d.radius+.12)||placed.some(p=>Math.hypot(x-p.x,z-p.z)<d.radius+p.radius+.22))continue;
   placed.push({kind:d.kind,radius:d.radius,x,z,y:room.y||0,yaw:r()*Math.PI*2,seed:hash(key+':object:'+d.kind,seed),room:room.id});break;
  }
 }
 // Reserve positions for absent kinds too: one roll never displaces another toy.
 return placed;
}
function night(s,seed=0,isBlocked=()=>false){
 if(s.type!=='apartment')return[];
 const rooms=[{id:'main',x0:-s.rx,x1:s.rx,z0:-s.rz,z1:s.rz,kind:s.theme===4?'playroom':'furnished'},...s.rooms],out=[];
 for(const room of rooms){
  if(room.kind==='pool')continue;
  const key=s.seed+':'+room.id,chosen=new Set(roll(seed,key,room.kind==='playroom'));
  const avoid=(x,z,radius)=>room.id==='main'?(Math.abs(x)<1.55+radius||Math.abs(z)<1.55+radius):Math.abs(x-room.door.x)<1.25+radius;
  const slots=spaces(seed,key,room,(x,z,r)=>isBlocked(s,x,z,r)||(s.gardens||[]).some(p=>Math.hypot(x-p.x,z-p.z)<r+(p.tree?.65:.45)),avoid);
  out.push(...slots.filter(p=>chosen.has(p.kind)).map(p=>{
   const cx=room.id==='main'?0:(room.x0+room.x1)/2,cz=room.id==='main'?0:(room.z0+room.z1)/2;
   const w=room.id==='main'?Math.min(8,s.rx*1.55):Math.min(8,room.x1-room.x0-3),d=room.id==='main'?Math.min(8,s.rz*1.55):Math.min(8,room.z1-room.z0-3);
   const onCarpet=room.kind==='playroom'&&Math.abs(p.x-cx)<w/2&&Math.abs(p.z-cz)<d/2;
   return{...p,y:onCarpet?.029:.002};
  }));
 }
 return out;
}
function daytime(S,seed,exclusions=[]){
 const r=random(hash('day-rooms',seed)),candidates=[...S.apartments],rooms=[],records=[],used=new Set();
 for(let i=candidates.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
 for(const a of candidates){
  const core=S.cores[a.core],side=Math.sign(a.x-core.x),end=Math.sign(a.z-S.housing.z);
  // The living-room floor, away from the bathroom, kitchen and door approach.
  const xs=[core.x+side*6.5,core.x+side*13.5],zs=[S.housing.z+end*3.3,S.housing.z+end*9.25];
  const room={id:a.number,x0:Math.min(...xs),x1:Math.max(...xs),z0:Math.min(...zs),z1:Math.max(...zs),y:a.y+.008};
  const slots=spaces(seed,'day:'+a.number,room,(x,z,radius)=>S.blocked(x,z,a.y,radius),(x,z,radius)=>exclusions.some(p=>p.room===a.number&&Math.hypot(p.x-x,p.z-z)<radius+.35));
  if(slots.length!==definitions.length)continue;
  let chosen;
  for(let attempt=0;attempt<100;attempt++){
   const draw=roll(seed,'day:'+a.number+':'+attempt),signature=draw.join(',');
   if(draw.length<2||draw.length>5||used.has(signature))continue;
   chosen=new Set(draw);used.add(signature);break;
  }
  if(!chosen)continue;
  records.push(...slots.filter(p=>chosen.has(p.kind)));rooms.push(a.number);
  if(rooms.length===5)break;
 }
 return{rooms,records};
}
function create(THREE,models,woodTexture){
 const root=new THREE.Group();root.name='Day apartment toys';let seed=newSeed(),layout={rooms:[],records:[]};
 const blockMaterials=[0x9d483d,0x547a87,0xb89759,0x608061].map(color=>new THREE.MeshLambertMaterial({color,map:woodTexture}));
 // shared (v102, night backrooms): one block geometry and the toy templates' own geometry for
 // every room, marked keepGeometry so the room cache never disposes it.
 let sharedBlock=null;
 function object(p,shared=false){
  let toy;
  if(p.kind==='blocks'){
   toy=new THREE.Group();toy.name='Wooden building blocks';const r=random(p.seed);
   for(let i=0;i<9;i++){
    const block=new THREE.Mesh(shared?(sharedBlock||(sharedBlock=new THREE.BoxGeometry(.24,.3,.24))):new THREE.BoxGeometry(.24,.3,.24),blockMaterials[i%4]);if(shared)block.userData.keepGeometry=true;
    block.position.set((i%3-1)*.36+(r()-.5)*.05,.15,(Math.floor(i/3)-1)*.36+(r()-.5)*.05);block.rotation.y=(r()-.5)*.5;block.castShadow=block.receiveShadow=true;toy.add(block);
   }
  }else toy=models.createObject(p.kind,{shared});
  toy.userData.apartmentToy={...toy.userData.apartmentToy,kind:p.kind,room:p.room,seed:p.seed};toy.position.set(p.x,p.y,p.z);toy.rotation.y=p.yaw;return toy;
 }
 function addTo(group,records,{shared=false}={}){for(const p of records)group.add(object(p,shared));}
 function resetDay(S,exclusions=[]){
  root.traverse(o=>o.geometry?.dispose());root.clear();seed=newSeed();layout=daytime(S,seed,exclusions);addTo(root,layout.records);
 }
 return{root,addTo,resetDay,get seed(){return seed;},get state(){return{seed,rooms:[...layout.rooms],toys:layout.records.map(p=>({...p}))};},materials:[...blockMaterials,...models.materials]};
}
window.NovaApartmentToys={definitions,roll,night,daytime,create};
})();
