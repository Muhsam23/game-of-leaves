window.NovaPaeikeselinn={create({THREE,manager,worldScene,terrain,missingno,fade,images}){
 const names=Object.keys(NOVA_SB_ASSETS),loader=new THREE.ImageLoader(manager),cache=new Map();let suspended=null;let loaded=0,world=null,phase='outside',fallTime=0,fallBase=0,source=null,jumpQueued=false,nearest=null;
 for(const name of names)loader.load(NOVA_SB_ASSETS[name],im=>{images[name]=im;loaded++;},undefined,()=>{loaded++;});
 function texture(path,clamped=false){const name=path.replace(/^paeikeselinn\//,''),key=name+':'+clamped;if(cache.has(key))return cache.get(key);const t=new THREE.Texture(images[name]);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=clamped?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;t.anisotropy=2;t.needsUpdate=true;cache.set(key,t);return t;}
 const pop=new NovaCorruption.Population(),gate=terrain.paeikeselinnGate,group=new THREE.Group();group.name='Survey field 6,8 · red tape';worldScene.add(group);
 // Exact striped tape/stake canvas, dimensions and materials from the sandbox.
 function striped(w,h,vertical){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');for(let i=0;i<8;i++){g.fillStyle=i%2?'#e8e2d6':'#b8241c';g.fillRect(vertical?0:i*w/8,vertical?i*h/8:0,vertical?w:w/8,vertical?h/8:h);}const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.repeat.set(vertical?1:8,vertical?2:1);return t;}
 const tapeMat=new THREE.MeshLambertMaterial({map:striped(64,8,false)}),stakeMat=new THREE.MeshLambertMaterial({map:striped(8,64,true)}),box=new THREE.BoxGeometry(1,1,1);
 const h=gate.half,points=[];for(let side=0;side<4;side++)for(let i=0;i<4;i++){const t=i/4;points.push(side===0?[-h+2*h*t,-h]:side===1?[h,-h+2*h*t]:side===2?[h-2*h*t,h]:[-h,h-2*h*t]);}
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],ax=gate.x+a[0],az=gate.z+a[1],bx=gate.x+b[0],bz=gate.z+b[1],ay=terrain.height(ax,az),by=terrain.height(bx,bz);
  const stake=new THREE.Mesh(box,stakeMat);stake.position.set(ax,ay+.55,az);stake.scale.set(.06,1.1,.06);group.add(stake);
  const strip=new THREE.Mesh(box,tapeMat),v=new THREE.Vector3(bx-ax,by-ay,bz-az);strip.position.set((ax+bx)/2,(ay+by)/2+.95,(az+bz)/2);strip.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),v.clone().normalize());strip.scale.set(v.length(),.035,.008);group.add(strip);
 }
 function prepare(){if(loaded<names.length)return false;if(!world){world=NovaPaeikeselinnWorld.create({THREE,texture,images});world.prepare();}return true;}
 function clearPopulation(){for(const r of pop.records.values())missingno.disposeRecord(r);pop.records.clear();nearest=null;missingno.visual.reset();}
 function enterTown(player){
  world.enter(source);phase='town';Object.assign(player,{x:world.pl.x,z:world.pl.z,walkY:world.pl.y,yaw:0,pitch:0});
  clearPopulation();pop.reset(world.GW.seed,{x:world.pl.x,z:world.pl.z-14},world.P.mnEvery);updatePopulation(0,player,false);
 }
 function enter(player,snapshot,direct=false){if(!prepare())return false;source=snapshot;phase='fall';fallTime=0;fallBase=player.walkY;jumpQueued=false;if(direct){enterTown(player);fallTime=1.5;fade.style.opacity=0;}return true;}
 function updatePopulation(dt,player,enabled){
  const changes=pop.sync(player);for(const r of changes.removed)missingno.disposeRecord(r);
  const near=[];for(const r of pop.records.values()){
   if(Math.hypot(player.x-r.sim.entity.x,player.z-r.sim.entity.z)>145){if(r.visual)r.visual.ent.visible=false;continue;}
   near.push(missingno.updateRecord(r,dt,player,{scene:world.scene,blocked:(x,z)=>world.blocked(x,z,Math.max(0,world.surfaceAt(x,z))),ground:(x,z)=>Math.max(0,world.surfaceAt(x,z)),enabled}));
  }nearest=missingno.choose(near);
 }
 function move(dt,player,input){
  fallTime+=dt;
  if(phase==='fall'){player.walkY=fallBase-7.5*fallTime*fallTime;fade.style.opacity=Math.min(1,Math.max(0,(fallTime-.2)/.3));if(fallTime>=.8)enterTown(player);return 0;}
  fade.style.opacity=Math.max(0,1-(fallTime-.8)/.4);
  updatePopulation(dt,player,!input.spectator);
  const distance=world.move(dt,{...input,yaw:player.yaw,pitch:player.pitch,jump:jumpQueued,frozen:!input.spectator&&nearest?.sim.phase!=='free'&&!!nearest},(a,b)=>input.spectator?b:missingno.limit(a,b,nearest));jumpQueued=false;
  Object.assign(player,{x:world.pl.x,z:world.pl.z,walkY:world.pl.y});return distance;
 }
 function reset(){suspended=null;phase='outside';jumpQueued=false;fade.style.opacity=0;clearPopulation();world?.reset();}
 return{images,gate,group,prepare,enter,move,reset,clearInput(){jumpQueued=false;},
  suspend(player){if(phase!=='outside'){suspended={phase,player:{...player}};phase='outside';fade.style.opacity=0;}},
  resume(player){if(suspended){phase=suspended.phase;Object.assign(player,suspended.player);suspended=null;}},
  crossed(before,after){return !terrain.paeikeselinnReserved(before.x,before.z,0)&&terrain.paeikeselinnReserved(after.x,after.z,0);},
  jump(){if(phase==='town'&&world.pl.grounded&&nearest?.sim.phase!=='captured'){jumpQueued=true;return true;}return false;},
  update(dt,camera,cull=true){if(phase==='town')world.update(dt,camera,cull);},
  get scene(){return phase==='town'?world.scene:worldScene;},get world(){return world;},get active(){return phase!=='outside';},get inTown(){return phase==='town';},get selected(){return nearest;},
  get state(){return{active:phase!=='outside',phase,gate:{...gate},fallTime,world:world?.state||null,missingno:nearest?.sim.snapshot()||null};}
 };
}};
