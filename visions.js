// Render-only copies of the real models: no actors, colliders, targets or lights.
window.NovaVisions={create(THREE,{animals,npcs}){
 const group=new THREE.Group();group.name='Transient hallucinations';group.userData.hallucination=true;
 const random=window.NovaTerrain.rng(0x56495349);
 function copyModel(source){
  const root=source.clone(true),pairs=[],materials=new Map();
  function cloneMaterial(m){if(!materials.has(m)){const copy=m.clone();copy.onBeforeCompile=m.onBeforeCompile;copy.customProgramCacheKey=m.customProgramCacheKey;copy.transparent=true;copy.opacity=0;copy.depthWrite=false;materials.set(m,{material:copy,opacity:m.opacity});}return materials.get(m).material;}
  function visit(original,copy){
   pairs.push([original,copy]);copy.castShadow=false;copy.userData={hallucination:true};
   if(copy.isLight){copy.visible=false;return;}
   if(copy.material)copy.material=Array.isArray(original.material)?original.material.map(cloneMaterial):cloneMaterial(original.material);
   original.children.forEach((child,i)=>visit(child,copy.children[i]));
  }
  visit(source,root);
  function sync(){for(const [original,copy]of pairs){if(copy===root){copy.scale.copy(original.scale);continue;}copy.position.copy(original.position);copy.quaternion.copy(original.quaternion);copy.scale.copy(original.scale);copy.visible=!copy.isLight&&original.visible;copy.updateMatrix();}}
  return{group:root,materials:[...materials.values()].map(p=>p.material),fade(value){for(const p of materials.values())p.material.opacity=p.opacity*value;},sync};
 }
 const pool=[];
 function add(category,definition,index){
  const model=definition.create?.(),source=model?.group||definition.source,copy=copyModel(source);
  copy.group.name='Hallucination '+definition.type;copy.group.visible=false;group.add(copy.group);
  pool.push({...copy,category,type:definition.type,source,offset:definition.offset||0,pose:time=>{definition.animate?.(model,time);copy.sync();},age:0,life:0,wait:index*.65});
 }
 // Reuse the articulated wildlife factories and their original texture atlases.
 for(let i=0;i<8;i++)add('animal',animals[i%animals.length],i);
 npcs.forEach((definition,i)=>add('npc',definition,i));
 let zone=null,time=0,spawnIndex=0;
 function hide(p){p.group.visible=false;p.life=0;}
 function reset(){time=0;spawnIndex=0;for(const category of ['animal','npc'])pool.filter(p=>p.category===category).forEach((p,i)=>{hide(p);p.wait=i*.65;});zone=null;group.visible=false;}
 function update({dt,active,animalAmount=0,npcAmount=0,player,world,ground,blocked,zone:nextZone}){
  if(group.parent!==world){group.removeFromParent?.();if(group.parent)group.parent.remove(group);world.add(group);}
  if(zone!==nextZone){reset();zone=nextZone;}
  const amounts={animal:Math.max(0,Math.min(8,Math.floor(animalAmount))),npc:Math.max(0,Math.min(npcs.length,Math.floor(npcAmount)))};
  group.visible=active&&amounts.animal+amounts.npc>0;if(!group.visible){for(const p of pool)hide(p);return;}time+=dt;
  for(const category of ['animal','npc']){
   const candidates=pool.filter(p=>p.category===category);let count=0;
   for(const p of candidates){p.wait-=dt;if(p.life>0&&++count>amounts[category])hide(p);}
   count=candidates.filter(p=>p.life>0).length;
   const start=Math.floor(random()*candidates.length);
   for(let i=0;i<candidates.length&&count<amounts[category];i++){
    const p=candidates[(i+start)%candidates.length];if(p.life>0||p.wait>0)continue;
    for(let tries=0;tries<32;tries++){
     const a=player.yaw+(random()-.5)*2.5,d=nextZone==='world'?7+random()*10:3+random()*8,x=player.x-Math.sin(a)*d,z=player.z-Math.cos(a)*d;
     if(blocked(x,z))continue;
     p.x=x;p.z=z;p.group.position.set(x,ground(x,z)+p.offset,z);p.group.rotation.y=a+Math.PI*(random()-.5);p.age=0;p.life=10+random()*8;p.group.visible=true;spawnIndex++;count++;break;
    }
    if(p.life<=0)p.wait=.5;
   }
  }
  for(const [i,p]of pool.entries())if(p.life>0){
   p.age+=dt;p.pose(time+i*2);p.group.position.y=ground(p.x,p.z)+p.offset;
   p.fade(Math.max(0,Math.min(1,p.age/1.6,(p.life-p.age)/2.2))*.92);
   // Walking through an apparition does not dismiss it or touch a real actor.
   if(p.age>=p.life||Math.hypot(p.x-player.x,p.z-player.z)>45){hide(p);p.wait=1.5+random()*3;}
  }
 }
 return{group,pool,update,reset,get state(){const shown=group.visible?pool.filter(p=>p.group.visible):[];return{visible:shown.map(p=>p.type),animals:shown.filter(p=>p.category==='animal').map(p=>p.type),npcs:shown.filter(p=>p.category==='npc').map(p=>p.type),spawned:spawnIndex};}};
}};
