// Independent, stable encounters in generated factory systems and roof cells.
window.NovaMissingNo=(()=>{
const hash=(text,seed)=>{let h=seed>>>0;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const factoryKey=t=>`${t.level}:${t.snapshot().upperSeed}:${t.preview().join('/')}`;
const roll=(key,seed,chance)=>NovaEncounter.seeded(hash(key,seed))()<chance;
function create({THREE,images,onCatch,onCapture,seed=(Math.random()*4294967296)>>>0}){
 const visual=NovaMissingNoVisual.create({THREE,images,corpora:window.NOVA_SB_CORPORA}),factory=new Map(),roofs=new Map();
 let selected=null,visible=[],runSeed=seed,currentZone='';
 function disposeRecord(r){if(r?.visual){visual.dispose(r.visual);r.visual=null;}}
 function record(x,z,key){const sim=new NovaEncounter.Encounter();sim.relocate(x,z,hash(key,runSeed));return{key,sim,visual:null,visibleToPlayer:false};}
 function sight(r,p,blocked,ground){
  const e=r.sim.entity;if(Math.abs(p.walkY-ground(e.x,e.z))>1.85)return false;
  const n=Math.ceil(Math.hypot(p.x-e.x,p.z-e.z)/.45);
  for(let i=1;i<n;i++)if(blocked(e.x+(p.x-e.x)*i/n,e.z+(p.z-e.z)*i/n,.1))return false;
  return true;
 }
 function updateRecord(r,dt,p,{scene,blocked,ground,localGround=ground,enabled=true}){
  if(!r.visual){r.visual=visual.create();scene.add(r.visual.ent);}
  r.visual.ent.visible=true;r.sim.player={x:p.x,z:p.z};
  r.visibleToPlayer=sight(r,p,blocked,ground);
  const before={...r.sim.entity},phase=r.sim.phase;
  r.sim.triggerRadius=r.visibleToPlayer?5:.001;
  if(enabled){r.sim.update(dt);
   if(blocked(r.sim.entity.x,r.sim.entity.z,1.05)||Math.abs(ground(r.sim.entity.x,r.sim.entity.z)-ground(before.x,before.z))>.32){Object.assign(r.sim.entity,before);r.sim.waypoint={x:r.sim.home.x,z:r.sim.home.z};}
   if(phase==='free'&&r.sim.phase==='captured')onCapture?.();
   if(phase!=='dead'&&r.sim.phase==='dead')onCatch?.();
  }
  visual.update(r.visual,r.sim,enabled?dt:0,localGround(r.sim.entity.x,r.sim.entity.z));return r;
 }
 function choose(records){return records.filter(r=>r.visibleToPlayer).sort((a,b)=>(a.sim.phase!=='free'?-1:0)-(b.sim.phase!=='free'?-1:0)||a.sim.distance()-b.sim.distance())[0]||null;}
 function visitFactory(travel,p){
  const key=factoryKey(travel);if(factory.has(key))return factory.get(key);
  const entry={key,rolled:roll('factory:'+key,runSeed,.10),record:null};factory.set(key,entry);
  if(!entry.rolled)return entry;
  const B=NovaBackrooms,origin=B.origin,candidates=[];
  for(const port of travel.current.ports){const d=B.dirs[port];for(const offset of [-3,-2,-5])candidates.push({x:origin.x+d[0]*(travel.current.half+offset),z:origin.z+d[1]*(travel.current.half+offset)});}
  for(let z=-travel.current.rz+3;z<travel.current.rz-2;z+=3)for(let x=-travel.current.rx+3;x<travel.current.rx-2;x+=3)candidates.push({x:origin.x+x,z:origin.z+z});
  const safe=candidates.filter(v=>Math.hypot(v.x-p.x,v.z-p.z)>=12&&!travel.entityBlocked(v.x,v.z,1.08));
  if(safe.length){const v=safe[hash(key,runSeed^91377)%safe.length];entry.record=record(v.x,v.z,key);}
  return entry;
 }
 function sync(dt,{travel,mazeScene,house,player:p,enabled,eligible=true}){
  for(const r of visible)if(r.visual)r.visual.ent.visible=false;visible=[];selected=null;
  // v88: the first factory level (the computer-factory backrooms themselves) stays free of MissingNo;
  // it remains in the levels reached by stairs and on the roofs.
  const zone=eligible&&travel.active&&travel.level!==0?'factory':eligible&&house.active&&house.mode==='roof'?'roof':'';
  if(zone!==currentZone){visual.reset();currentZone=zone;}
  if(zone==='factory'){
   const entry=visitFactory(travel,p);if(entry.record)visible.push(updateRecord(entry.record,dt,p,{scene:mazeScene,blocked:(x,z,r)=>Math.max(Math.abs(x-NovaBackrooms.origin.x),Math.abs(z-NovaBackrooms.origin.z))>travel.current.half-Math.max(.05,r)||travel.entityBlocked(x,z,r),ground:()=>NovaFactory.floor+travel.rise,localGround:()=>NovaFactory.floor,enabled}));
   // Retain encounter state on revisits; release distant canvas/GPU resources.
   for(const other of factory.values())if(other!==entry)disposeRecord(other.record);
  }else if(zone==='roof'){
   const cx=Math.floor(p.x/80),cz=Math.floor(p.z/80);
   for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){
    const x=cx+dx,z=cz+dz,key=x+','+z;
    if(!roofs.has(key)){
     let r=null;if(roll('roof:'+key,runSeed,.08)){
      const random=NovaEncounter.seeded(hash(key,runSeed^91737));
      for(let i=0;i<24;i++){const px=x*80+8+random()*64,pz=z*80+8+random()*64,y=house.roofHeight(px,pz);
       if(Math.hypot(px-p.x,pz-p.z)<14||house.roofBlocked(px,pz,2)||Math.max(...[[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>Math.abs(house.roofHeight(px+a,pz+b)-y)))>.4)continue;
       r=record(px,pz,'roof:'+key);break;
      }
     }roofs.set(key,{cx:x,cz:z,record:r});
    }
    const r=roofs.get(key).record;if(r)visible.push(updateRecord(r,dt,p,{scene:house.scene,blocked:house.roofBlocked,ground:house.roofHeight,enabled}));
   }
   for(const r of roofs.values())if(Math.abs(r.cx-cx)>2||Math.abs(r.cz-cz)>2)disposeRecord(r.record);
  }
  selected=choose(visible);return selected;
 }
 function limit(from,to,r=selected){
  if(!r||!r.visibleToPlayer)return to;
  const phase=r.sim.phase;r.sim.player={x:from.x,z:from.z};r.sim.move(to.x-from.x,to.z-from.z);
  if(phase==='free'&&r.sim.phase==='captured')onCapture?.();
  return{x:r.sim.player.x,z:r.sim.player.z};
 }
 function reset(seed=(Math.random()*4294967296)>>>0){for(const e of [...factory.values(),...roofs.values()])disposeRecord(e.record);factory.clear();roofs.clear();visible=[];selected=null;currentZone='';runSeed=seed;visual.reset();}
 return{visual,record,updateRecord,choose,disposeRecord,sync,limit,reset,visitFactory,
  get selected(){return selected;},get frozen(){return selected?.sim.phase==='captured'||selected?.sim.phase==='dead';},
  get state(){return{seed:runSeed,zone:currentZone,factoryVisited:factory.size,factoryRolled:[...factory.values()].filter(e=>e.rolled).length,factorySpawned:[...factory.values()].filter(e=>e.record).length,roofVisited:roofs.size,visible:visible.length,selected:selected?{key:selected.key,...selected.sim.snapshot()}:null};}
 };
}
return{create,factoryKey,roll};
})();
