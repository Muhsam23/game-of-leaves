// Stable, independent encounters: 2.5 % per corridor and figure (v90: was 10 %, about 40 % per room).
(() => {
'use strict';
const KARIN_CHANCE=.08;
function plan(s){
 const N=window.NovaNightHouse,result=[];
 for(const port of s.ports)for(const kind of ['vermesser','karin']){
  const id=s.seed+':'+port.id+':'+kind,seed=N.hash('house-encounter-v65:'+id);
  // v101: the backroom Karin is met more often (8 %); the Vermesser stays at 2.5 %.
  if(window.NovaTerrain.rng(seed)()>=(kind==='karin'?KARIN_CHANCE:.025))continue;
  const side=kind==='karin'?.52:-.52;
  for(const distance of (kind==='karin'?[2.8,3.6,2,4.5]:[4.5,3.6,2.8,2])){
   const x=port.x-port.nx*distance+port.nz*side,z=port.z-port.nz*distance-port.nx*side,y=N.floorAt(s,x,z);
   if(y===null||Math.abs(y-port.y)>.2||N.blocked(s,x,z,.32))continue;
   result.push({id,seed,kind,corridor:port.id,x,z,y,yaw:Math.atan2(port.nx,port.nz)});break;
  }
 }
 return result;
}
// v93/v94: in the night backrooms the Vermesser is never still. Unhunted he walks the halls:
// from an opening into the room, a pause, then out through another opening into the next
// room. The moment he sees the player he screams and runs at him with his arms stretched
// out, only a little slower than a sprint. He never jumps: every room change is a real walk
// through an opening, mapped like the player's own step (also while out of sight).
// v94: on seeing the player he hesitates ten seconds, staring; then the scream and the hunt
// (a little slower than v93). The moment sight is lost he loses the player, but runs on
// in that direction (through the opening the player took) before he wanders again.
const STALK={sight:30,speed:5.6,turn:7,hesitate:2,doubt:1.5,catch:.85,blink:.4,searchRun:7,searchTime:16};
const ROAM={speed:1.6,turn:2.4,pause:[1,4],lead:.65};
function create(THREE,{vermesserSkin,karinTexture,onCatch,onScream,onAlert,speak,closeSpeech,isSpeechOpen}={}){
 const N=()=>window.NovaNightHouse,templates={},records=new Map(),views=new Set();let dialogueId=null,layouts=new WeakMap(),cursor=0,playerRoom=null,karinMet=null,karinGone=false;
 // v101: once the player has spoken with a backroom Karin, no Karin appears again; the one he
 // spoke with stays until he leaves her room.
 const hidden=r=>r.kind==='karin'&&(karinGone||(karinMet!==null&&r.id!==karinMet));
 function template(kind){return templates[kind]||(templates[kind]=kind==='karin'?window.NovaKarinModel.create(karinTexture):window.NovaVermesser.createModel(THREE,vermesserSkin));}
 function record(def){
  if(!records.has(def.id)){
   const r={...def,speed:0,angularVelocity:0,walk:0,time:0,phase:'roam',fx:0,mode:'idle'};
   if(r.kind==='vermesser'){r.brain=window.NovaFlyBrain.create(r.seed);r.brain.reset(r.yaw);r.controller=window.NovaVermesser.createController(r.brain,r.seed);r.rng=window.NovaTerrain.rng((r.seed^0x5a17e)>>>0);r.cameFrom=r.corridor;}
   records.set(def.id,r);
  }return records.get(def.id);
 }
 // Every figure belongs to exactly one room at a time (r.room); a walking Vermesser changes it.
 function actors(s){
  if(!layouts.has(s))layouts.set(s,plan(s).map(def=>{const r=record(def);if(r.room===undefined){r.room=s.seed;r.spec=s;}return r;}));
  const own=layouts.get(s).filter(r=>r.room===s.seed&&!hidden(r));
  for(const r of records.values())if(r.room===s.seed&&!own.includes(r)&&!hidden(r))own.push(r);
  return own;}
 const inRect=(q,x,z,pad=0)=>x>=q.x0-pad&&x<=q.x1+pad&&z>=q.z0-pad&&z<=q.z1+pad;
 // Where an opening leads (null: outside, roof or field, where he never goes).
 function neighbor(s,p){
  if(!s.path||p.id==='f')return null;
  if(p.id==='back'){if(!s.path.length)return null;const to=N().spec(s.houseSeed,s.path.slice(0,-1),s.toySeed||0);return{to,toPort:to.ports.find(q=>q.id===s.path.at(-1))};}
  if(p.id==='u'&&s.steps>=s.roofAt)return null;
  const to=N().spec(s.houseSeed,[...s.path,p.id],s.toySeed||0);return{to,toPort:to.ports[0]};
 }
 // The walkable line from the middle of a room out to one of its openings.
 function chain(s,p){
  const end={x:p.x,z:p.z};
  if(s.type==='apartment'){
   const hub={x:0,z:0};if(p.id==='back')return[hub,{x:0,z:s.rz-.6},end];if(p.id==='s')return[hub,{x:p.x,z:-s.rz+.6},end];
   const b=s.branches.find(q=>(q.side<0?'w':'e')===p.id);if(b)return[hub,{x:b.side*(s.rx-.6),z:b.z},{x:b.x,z:b.z},end];
   return[hub,end];
  }
  if(s.type==='stair'&&p.id!=='back'){const L=-s.rects[1].z0;return[{x:0,z:2},{x:0,z:-L-1.35},end];}
  return[{x:0,z:2},end];
 }
 function segment(r,a,b){const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((r.x-a.x)*dx+(r.z-a.z)*dz)/l));return Math.hypot(a.x+dx*t-r.x,a.z+dz*t-r.z);}
 // Waypoints from where he stands to just past `target` (or into the room when null).
 function route(s,r,target){
  let at=null;
  if(!(s.type==='apartment'&&inRect(s.rects[0],r.x,r.z,-.3)))for(const p of s.ports){const c=chain(s,p);for(let i=0;i<c.length-1;i++){const d=segment(r,c[i],c[i+1]);if(!at||d<at.d)at={p,c,i,d};}}
  let way;
  if(at&&target&&at.p.id===target.id)way=at.c.slice(at.i+1);
  else{way=at?at.c.slice(0,at.i+1).reverse():[];if(target)way.push(...chain(s,target).slice(1));else if(!way.length)way.push(chain(s,s.ports[0])[0]);}
  if(target)way[way.length-1]={x:target.x+target.nx*.45,z:target.z+target.nz*.45};
  return way;
 }
 function walkBlocked(s,r,x,z,open){
  const y=N().floorAt(s,x,z);if(y===null||Math.abs(y-r.y)>.23||N().blocked(s,x,z,.32))return true;
  // He comes right up to an opening, but only steps through the one he is heading for.
  return s.ports.some(p=>p!==open&&p.id!==r.cameFrom&&(x-p.x)*p.nx+(z-p.z)*p.nz>-.3&&Math.abs((x-p.x)*p.nz-(z-p.z)*p.nx)<1.7);
 }
 function clearPath(a,b,blocked){const d=Math.hypot(b.x-a.x,b.z-a.z),n=Math.ceil(d/.4);for(let i=1;i<=n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true;}
 // Walk towards a goal inside room s, around furniture when the direct line is blocked.
 function steer(s,r,goal,dt,{speed:top,turn,open=null}){
  const blocked=(x,z)=>walkBlocked(s,r,x,z,open),gd=Math.hypot(goal.x-r.x,goal.z-r.z);let aim=goal;
  if(gd>.35&&!clearPath(r,goal,blocked)){
   r.routeTime=(r.routeTime||0)-dt;if(!r.route||r.routeTime<=0){r.route=r.controller.findRoute(r,goal,blocked);r.routeTime=.8;}
   while(r.route.length&&Math.hypot(r.route[0].x-r.x,r.route[0].z-r.z)<.45)r.route.shift();if(r.route.length)aim=r.route[0];
  }else r.route=null;
  const gx=aim.x-r.x,gz=aim.z-r.z,want=Math.atan2(-gx,-gz),delta=Math.atan2(Math.sin(want-r.yaw),Math.cos(want-r.yaw));
  r.yaw+=delta*(1-Math.exp(-dt*turn));
  const speed=gd>.35?top*Math.max(.3,Math.cos(delta)):0;r.speed+=(speed-r.speed)*(1-Math.exp(-dt*3));
  const step=r.speed*dt,n=Math.max(1,Math.ceil(step/.15)),mx=-Math.sin(r.yaw)*step/n,mz=-Math.cos(r.yaw)*step/n,x0=r.x,z0=r.z;
  for(let i=0;i<n;i++){if(!blocked(r.x+mx,r.z+mz)){r.x+=mx;r.z+=mz;}else if(!blocked(r.x+mx,r.z))r.x+=mx;else if(!blocked(r.x,r.z+mz))r.z+=mz;else break;}
  r.walk+=Math.hypot(r.x-x0,r.z-z0);r.y=N().floorAt(s,r.x,r.z)??r.y;
  return Math.hypot(goal.x-r.x,goal.z-r.z);
 }
 // Follow r.way; true once he has stepped through `open`.
 function travel(r,dt,speed,turn,open){
  while(r.way.length>1&&Math.hypot(r.way[0].x-r.x,r.way[0].z-r.z)<.6)r.way.shift();
  const goal=r.way[0];if(!goal)return false;
  const before=Math.hypot(goal.x-r.x,goal.z-r.z),after=steer(r.spec,r,goal,dt,{speed,turn,open});
  r.stuck=after<before-dt*.15?0:(r.stuck||0)+dt;
  if(open&&(r.x-open.x)*open.nx+(r.z-open.z)*open.nz>0)return true;
  if(!open&&r.way.length===1&&after<.45)r.way.shift();
  return false;
 }
 // Step through an opening exactly like the player does: the same continuous mapping.
 function pass(r,port,link){
  const m=window.NovaHousePortals.map(port,link.toPort,{x:r.x,z:r.z,y:r.y,yaw:r.yaw});
  r.x=m.x;r.z=m.z;r.yaw=m.yaw;r.room=link.to.seed;r.spec=link.to;r.y=N().floorAt(link.to,r.x,r.z)??m.y;
  r.cameFrom=link.toPort.id;r.route=null;r.way=null;r.stuck=0;r.lastSeen=null;
 }
 function roomPoint(s,r){
  if(s.type!=='apartment')return null;const q=s.rects[0];
  for(let i=0;i<14;i++){const x=q.x0+1+r.rng()*(q.x1-q.x0-2),z=q.z0+1+r.rng()*(q.z1-q.z0-2);if(!walkBlocked(s,r,x,z,null))return{x,z};}
  return null;
 }
 // Unhunted: into the room, a pause, out through another opening, and on.
 function roam(r,dt){
  const s=r.spec;r.phase='roam';r.fx=0;
  let w=r.wander;
  if(!w){w=r.wander={stage:'in',wait:0};r.way=route(s,r,null);const p=roomPoint(s,r);if(p)r.way.push(p);r.stuck=0;}
  if(w.stage==='wait'){
   w.wait-=dt;r.speed*=Math.exp(-dt*4);r.yaw+=Math.sin(r.time*.37+r.seed%5)*dt*.35;
   if(w.wait>0)return;
   const options=s.ports.filter(p=>p.id!=='d'&&neighbor(s,p)),fresh=options.filter(p=>p.id!==r.cameFrom),pick=fresh.length?fresh:options;
   if(!pick.length){w.wait=ROAM.pause[1];return;}
   // Often he drifts towards the player's part of the house, so the halls never feel empty.
   const near=towards(s),lead=near&&r.rng()<ROAM.lead?options.find(p=>p.id===near):null;
   w.port=lead||pick[Math.floor(r.rng()*pick.length)];w.link=neighbor(s,w.port);w.stage='out';r.way=route(s,r,w.port);r.stuck=0;
  }
  if(travel(r,dt,ROAM.speed,ROAM.turn,w.stage==='out'?w.port:null)){pass(r,w.port,w.link);r.wander=null;return;}
  if(w.stage==='in'&&!r.way.length){w.stage='wait';w.wait=ROAM.pause[0]+r.rng()*(ROAM.pause[1]-ROAM.pause[0]);}
  if(r.stuck>5){r.wander=null;r.route=null;}
 }
 function towards(s){
  const q=playerRoom;if(!q||!q.path||q.houseSeed!==s.houseSeed||q.seed===s.seed)return null;
  let k=0;while(k<s.path.length&&k<q.path.length&&s.path[k]===q.path[k])k++;
  return s.path.length>k?'back':q.path[k];
 }
 // v97: the scream comes with the first sight; the hunt (silent) five seconds later.
 function cry(r,distance){r.lastCry=r.time;onScream?.(Math.max(.35,1-distance/40));}
 // Finding the player again while still running after him screams only if the last scream
 // (about 23 s long) is over; a flickering line of sight must not restart it.
 function startHunt(r,distance,player,scream=true){r.state='hunt';r.blind=0;r.search=null;r.wander=null;r.lastSeen={x:player.x,z:player.z};if(scream&&!(r.time-(r.lastCry??-1e9)<25))cry(r,distance);}
 // He stands and stares; if the player stays in sight for ten seconds, the hunt begins.
 function hesitate(r,dt,player,sees,distance){
  r.phase='warning';r.speed*=Math.exp(-dt*5);
  const want=Math.atan2(-(player.x-r.x),-(player.z-r.z)),delta=Math.atan2(Math.sin(want-r.yaw),Math.cos(want-r.yaw));r.yaw+=delta*(1-Math.exp(-dt*2));
  if(sees){r.hesitation+=dt;r.blind=0;}else r.blind+=dt;
  r.fx=Math.min(.5,r.hesitation/STALK.hesitate*.5);
  if(r.blind>STALK.doubt){r.state='roam';r.wander=null;return;}
  // v101: two seconds of staring, then the hunt starts together with the scream.
  if(r.hesitation>=STALK.hesitate)startHunt(r,distance,player);
 }
 function startSearch(r){
  const p=r.lastSeen||{x:r.x-Math.sin(r.yaw),z:r.z-Math.cos(r.yaw)},dx=p.x-r.x,dz=p.z-r.z,l=Math.hypot(dx,dz);
  r.state='search';r.search={point:p,dir:l>.2?{x:dx/l,z:dz/l}:{x:-Math.sin(r.yaw),z:-Math.cos(r.yaw)},run:0,stuck:0,time:0};
 }
 function hunt(s,r,dt,player,sees,distance){
  r.phase='stalk';
  if(sees){r.lastSeen={x:player.x,z:player.z};r.blind=0;if(distance<STALK.catch){onCatch?.();return true;}}
  else if((r.blind+=dt)>STALK.blink){startSearch(r);return false;}
  steer(s,r,sees?player:r.lastSeen,dt,{speed:STALK.speed,turn:STALK.turn});
  r.fx=sees?Math.max(.2,.64*(1-distance/40)):.15;
  return false;
 }
 // Lost: run on to where the player was and a little beyond, or through the opening he took.
 function search(r,dt){
  const S=r.search;S.time+=dt;r.phase='stalk';r.fx=.12;
  const end=()=>{r.state='roam';r.search=null;r.wander=null;};
  if(S.time>STALK.searchTime)return end();
  if(S.port){
   if(!r.way||r.wayFor!==S){r.way=route(r.spec,r,S.port);r.wayFor=S;r.stuck=0;}
   let through=travel(r,dt,STALK.speed,STALK.turn,S.port);
   if(!through&&r.stuck>4)return end();
   if(through){const t=S.link.toPort;pass(r,S.port,S.link);r.search={dir:{x:-t.nx,z:-t.nz},run:0,stuck:0,time:S.time};}
   return;
  }
  if(S.point){if(steer(r.spec,r,S.point,dt,{speed:STALK.speed,turn:STALK.turn})<.7)S.point=null;else return;}
  const x0=r.x,z0=r.z;steer(r.spec,r,{x:r.x+S.dir.x*2,z:r.z+S.dir.z*2},dt,{speed:STALK.speed,turn:STALK.turn});
  const moved=Math.hypot(r.x-x0,r.z-z0);S.run+=moved;S.stuck=moved<dt*.6?S.stuck+dt:0;
  if(S.run>STALK.searchRun||S.stuck>.8)end();
 }
 // The player crossed an opening. A hunter in that room (or one already running after him)
 // heads for the same opening; one who was only staring lets him go.
 function follow(from,port,to,toPort,player){
  if(karinMet!==null)karinGone=true;
  for(const r of records.values()){
   if(r.room!==from.seed||!toPort)continue;
   if(r.state==='hunt'||r.state==='search'){r.state='search';r.search={port,link:{to,toPort},time:0};r.way=null;}
   else if(r.state==='hesitate'){r.state='roam';r.wander=null;}
  }
 }
 function line(s,r,p){const d=Math.hypot(p.x-r.x,p.z-r.z),n=Math.max(1,Math.ceil(d/.35));
  if(Math.abs((p.walkY??r.y)-r.y)>1.55)return false;
  for(let i=1;i<n;i++){const t=i/n,x=r.x+(p.x-r.x)*t,z=r.z+(p.z-r.z)*t,y=N().floorAt(s,x,z);if(y===null||N().blocked(s,x,z,.05))return false;}return true;
 }
 function mount(s,parent){
  const root=new THREE.Group();root.name='Apartment corridor encounters';parent.add(root);const entries=new Map();
  function add(r){
   const source=template(r.kind),group=source.group.clone(true),pairs=[];
   function pair(a,b){if(a!==source.group)pairs.push([a,b]);b.userData={...b.userData,sharedRoom:true,houseEncounter:r.id};b.castShadow=false;a.children.forEach((o,i)=>pair(o,b.children[i]));}
   pair(source.group,group);group.name=r.kind==='karin'?'Karin':'Der Vermesser';root.add(group);entries.set(r.id,{r,source,group,pairs});
  }
  for(const r of actors(s))add(r);
  const view={s,root,get entries(){return[...entries.values()];},sync(){
   // A hunter may walk in (or out) while this room is shown.
   for(const r of actors(s))if(!entries.has(r.id))add(r);
   for(const {r,source,group,pairs}of entries.values()){
    group.visible=r.room===s.seed&&!hidden(r);if(!group.visible)continue;
    if(r.kind==='karin')window.NovaKarinModel.animate(source,r.mode==='walk'?r.walk/.72:r.time,r.mode);
    else source.pose(r.walk,r.speed,r.phase,r.time);
    for(const [a,b]of pairs){b.position.copy(a.position);b.quaternion.copy(a.quaternion);b.scale.copy(a.scale);}
    group.position.set(r.x,r.y+.005,r.z);group.rotation.y=r.yaw;
    // Fit the existing elongated model below the 2.5 m door lintels.
    if(r.kind==='vermesser'){const top=N().ceilingAt(s,r.x,r.z);group.scale.setScalar(Math.max(.3,Math.min(1,(Math.min(2.45,(top??r.y+2.6)-r.y)-.12)/source.height)));}
   }},dispose(){parent.remove(root);views.delete(view);}};
  view.sync();views.add(view);return view;
 }
 function close(){dialogueId=null;closeSpeech?.();}
 function update(s,dt,player,playing,flashlight){
  if(!playing)return;dt=Math.max(0,Math.min(dt,.05));playerRoom=s;
  const active=actors(s);if(dialogueId&&(!isSpeechOpen?.()||!active.some(r=>r.id===dialogueId&&Math.hypot(r.x-player.x,r.z-player.z)<6)))close();
  for(const r of active){r.time+=dt;
   if(r.kind==='vermesser'){
    r.spec=s;const distance=Math.hypot(r.x-player.x,r.z-player.z),sees=distance<STALK.sight&&line(s,r,player);
    if(r.state==='hunt'){if(hunt(s,r,dt,player,sees,distance))break;continue;}
    // Running on after a lost player: finding him again resumes the hunt at once.
    if(r.state==='search'){if(sees){startHunt(r,distance,player);hunt(s,r,dt,player,sees,distance);}else search(r,dt);continue;}
    if(r.state==='hesitate'){hesitate(r,dt,player,sees,distance);continue;}
    if(sees){r.state='hesitate';r.hesitation=0;r.blind=0;r.wander=null;onAlert?.();hesitate(r,dt,player,sees,distance);continue;}
    roam(r,dt);
   }else{
    const near=Math.hypot(r.x-player.x,r.z-player.z)<4&&line(s,r,player);r.mode=dialogueId===r.id?'talk':near?'listen':'idle';
    if(near){const goal=Math.atan2(player.x-r.x,player.z-r.z),delta=Math.atan2(Math.sin(goal-r.yaw),Math.cos(goal-r.yaw));r.yaw+=delta*(1-Math.exp(-dt*2.2));}
   }
  }
  // Everyone elsewhere keeps walking (a few per frame when there are many).
  const away=[...records.values()].filter(r=>r.kind==='vermesser'&&r.room!==s.seed&&r.spec);
  for(const r of away)r.lag=Math.min(1,(r.lag||0)+dt);
  const count=Math.min(away.length,6);
  for(let k=0;k<count;k++){const r=away[(cursor+k)%away.length];
   while(r.lag>1e-4){const h=Math.min(.05,r.lag);r.lag-=h;r.time+=h;
    if(r.state==='search')search(r,h);else{if(r.state&&r.state!=='roam'){r.state='roam';r.wander=null;}roam(r,h);}
    if(r.room===s.seed){r.lag=0;break;}}
  }
  cursor=away.length?(cursor+count)%away.length:0;
  for(const view of views)if(view.s.seed===s.seed)view.sync();
 }
 function target(s,eye,look){let best=null,distance=3.5;
  for(const r of actors(s)){if(r.kind!=='karin')continue;const dx=r.x-eye.x,dy=r.y+1.05-eye.y,dz=r.z-eye.z,d=Math.hypot(dx,dy,dz);
   if(d<distance&&d>.1&&(dx*look.x+dy*look.y+dz*look.z)/d>.85&&line(s,r,{x:eye.x,z:eye.z,walkY:eye.y-1.68})){best={kind:'karin',id:r.id,house:true};distance=d;}
  }return best;
 }
 function interact(obj){if(obj.kind!=='karin'||!records.has(obj.id))return false;dialogueId=obj.id;karinMet=obj.id;speak?.();return true;}
 // v101: how near a Vermesser is, for the forest-like static (same room only).
 // v102: also in the next room, measured through the opening between: he is mostly seen
 // through a doorway, and there the picture and the sound stayed clean.
 function presence(s,player){let best=null;
  const rate=(d,own)=>{const near=1-Math.min(1,Math.max(0,(d-4)/21)),fx=Math.max(own,.5*near*near*(3-2*near));if(!best||d<best.distance)best={distance:d,fx};};
  for(const r of actors(s))if(r.kind==='vermesser')rate(Math.hypot(r.x-player.x,r.z-player.z),r.fx||0);
  for(const p of s.ports){const link=neighbor(s,p);if(!link?.toPort)continue;
   for(const r of records.values())if(r.kind==='vermesser'&&r.room===link.to.seed)rate(Math.hypot(player.x-p.x,player.z-p.z)+Math.hypot(r.x-link.toPort.x,r.z-link.toPort.z),0);}
  return best;}
 function reset(){karinMet=null;karinGone=false;close();for(const view of [...views])view.dispose();records.clear();layouts=new WeakMap();}
 // v102: one copy of each figure, so their shaders can be compiled before the game starts
 // (night-house.js warmup) instead of in the frame they first appear.
 function samples(){return['karin','vermesser'].map(kind=>template(kind).group.clone(true));}
 return{mount,update,target,interact,presence,close,reset,follow,samples,snapshot:s=>s?actors(s).map(r=>({id:r.id,kind:r.kind,corridor:r.corridor,x:r.x,y:r.y,z:r.z,phase:r.phase,mode:r.mode})):[],get resources(){return{views:views.size,records:records.size,models:Object.keys(templates).length};}};
}
window.NovaHouseEncounters={plan,create};
})();
