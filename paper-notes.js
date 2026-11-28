// v107: procedurally generated notes ("Zettel") from the Zettel test station (backroom-notes.js).
// About every fourth backroom room (factory, apartment, biosphere) gets one to three sheets on the
// floor, sometimes one pinned to a wall; the day apartments get a handful at game start. Each sheet
// is drawn from its own random number, with the settings the user chose in the test station: every
// kind at 3, chemistry and ageing at 0, interference at its maximum (2.5), paper and print mixed.
// E reads a sheet in a full-screen view (E, Esc or a click closes it).
(() => {
'use strict';
const OPTIONS={weights:{glyph:3,neural:3,stat:3,chem:0,xrow:3,glitch:3,error:3,ascii:3},glitch:2.5,age:0,paper:'auto',medium:'auto'};
const CHANCE=.25,SW=.29,SH=.40,TEX={w:448,h:640},READER={w:1152,h:1536};
function create(THREE,{random=Math.random,findWall=null,onOpen,onClose,document:doc=globalThis.document}={}){
 const NB=window.NovaBackroomNotes,rooms=new Map(),cache=new Map(),queue=[],stats={rolled:0,rooms:0,sheets:0,opened:0};
 const pinMat=new THREE.MeshBasicMaterial({color:0x2c2b28}),pinGeo=new THREE.SphereGeometry(.007,8,6),blank=new THREE.MeshLambertMaterial({color:0xcdc4a6,side:THREE.DoubleSide});
 const seed=()=>Math.floor(random()*4294967296)>>>0;
 // A walkable floor spot with a little room around it (the sheet must not slide under a wall).
 function floorSpot(place,near=null){
  for(let i=0;i<40;i++){
   const c=near||place.center,e=near?2.5:place.extent*.85,x=c.x+(random()*2-1)*e,z=c.z+(random()*2-1)*e;
   if(![[0,0],[.35,0],[-.35,0],[0,.35],[0,-.35]].every(([dx,dz])=>place.walkable(x+dx,z+dz)))continue;
   const y=place.floor(x,z);if(!Number.isFinite(y))continue;
   return{x,z,y,yaw:random()*Math.PI*2};
  }
  return null;
 }
 function makeSheets(place,{walls=true}={}){
  const list=[],n=random()<.55?1:random()<.6?2:3;let first=null;
  for(let i=0;i<n;i++){const p=floorSpot(place,first&&random()<.6?first:null);if(!p)continue;first=first||p;list.push({seed:seed(),...p,wall:false,curl:random()<.6?random()*.03:0,cx:random()<.5?-1:1,cz:random()<.5?-1:1});}
  if(walls&&findWall&&random()<.35){const w=findWall(place);if(w)list.push({seed:seed(),x:w.x,z:w.z,y:w.y+1.3+random()*.35,nx:w.nx,nz:w.nz,wall:true,tilt:(random()-.5)*.2,bulge:.004+random()*.01});}
  return list;
 }
 // Once per room and game: about every fourth room gets sheets. Returning keeps them.
 function room(key,place,opts){
  if(rooms.has(key))return rooms.get(key);stats.rolled++;
  const list=random()<CHANCE?makeSheets(place,opts):[];if(list.length){stats.rooms++;stats.sheets+=list.length;}
  rooms.set(key,list);return list;
 }
 // A fixed set (day apartments): placed by the caller.
 function fixed(key,list){rooms.set(key,list.map(p=>({seed:seed(),wall:false,curl:random()<.6?random()*.03:0,cx:random()<.5?-1:1,cz:random()<.5?-1:1,yaw:random()*Math.PI*2,...p})));stats.sheets+=list.length;return rooms.get(key);}
 function material(sheet){
  let m=cache.get(sheet.seed);if(m)return m;
  const c=doc.createElement('canvas');c.width=TEX.w;c.height=TEX.h;const tex=new THREE.CanvasTexture(c);tex.encoding=THREE.sRGBEncoding;tex.anisotropy=4;
  m={mat:new THREE.MeshLambertMaterial({map:tex,side:THREE.DoubleSide,alphaTest:.5}),tex,canvas:c,ready:false,seed:sheet.seed};
  cache.set(sheet.seed,m);queue.push(m);
  // Keep the last 40 sheets' textures; older ones are drawn again when needed.
  if(cache.size>40){for(const [k,v]of cache){if(v.users)continue;v.tex.dispose();v.mat.dispose();cache.delete(k);if(cache.size<=40)break;}}
  return m;
 }
 // Draw at most one sheet per frame so a room full of paper never stalls a step.
 function pump(){const m=queue.shift();if(!m||!cache.has(m.seed))return;NB.render(m.canvas,m.seed,OPTIONS);m.tex.needsUpdate=true;m.ready=true;}
 function mesh(sheet){
  const g=new THREE.Group(),m=material(sheet);let geo;
  if(sheet.wall){
   geo=new THREE.PlaneGeometry(SW,SH,3,4);const p=geo.attributes.position;
   for(let k=0;k<p.count;k++){const v=(SH/2-p.getY(k))/SH;p.setZ(k,v*v*sheet.bulge);}geo.computeVertexNormals();
   g.position.set(sheet.x+sheet.nx*.006,sheet.y,sheet.z+sheet.nz*.006);g.rotation.set(0,Math.atan2(sheet.nx,sheet.nz),sheet.tilt,'YXZ');
   const pin=new THREE.Mesh(pinGeo,pinMat);pin.position.set(0,SH/2-.02,.006);g.add(pin);
  }else{
   geo=new THREE.PlaneGeometry(SW,SH,3,4);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;
   for(let k=0;k<p.count;k++){const u=Math.max(0,p.getX(k)/(SW/2)*sheet.cx),v=Math.max(0,p.getZ(k)/(SH/2)*sheet.cz);p.setY(k,sheet.curl*u*u*v*v);}geo.computeVertexNormals();
   g.position.set(sheet.x,sheet.y+.012,sheet.z);g.rotation.y=sheet.yaw;
  }
  const paper=new THREE.Mesh(geo,m.mat);g.add(paper);g.userData={sheet,material:m};m.users=(m.users||0)+1;return g;
 }
 // Exactly one set of sheets on screen: the current room's (or the day apartments').
 const shown=new Map();
 function show(slot,list,scene,offset={x:0,z:0}){
  const cur=shown.get(slot);
  if(cur&&(cur.list!==list||cur.scene!==scene)){cur.scene.remove(cur.group);cur.group.traverse(o=>{if(o.geometry&&o.geometry!==pinGeo)o.geometry.dispose();if(o.userData.material)o.userData.material.users--;});shown.delete(slot);}
  if(!list||!list.length)return;
  let s=shown.get(slot);
  if(!s){const group=new THREE.Group();group.name='Zettel';for(const sheet of list)group.add(mesh(sheet));scene.add(group);s={list,scene,group,offset};shown.set(slot,s);}
  s.group.position.set(offset.x,0,offset.z);s.offset=offset;
 }
 function hide(slot){show(slot,null,null);}
 function setVisible(slot,on){const s=shown.get(slot);if(s)s.group.visible=on;}
 // Look at a sheet within 2.4 m: returns a target for game.js (kind 'paperNote').
 function target(eye,look,blocked=null){
  let best=null,score=Infinity;
  for(const s of shown.values()){if(!s.group.visible)continue;
   for(const g of s.group.children){const sh=g.userData.sheet,x=sh.x+s.offset.x,y=sh.wall?sh.y:sh.y+.02,z=sh.z+s.offset.z,dx=x-eye.x,dy=y-eye.y,dz=z-eye.z,d=Math.hypot(dx,dy,dz);
    if(d<.1||d>2.4)continue;const dot=(dx*look.x+dy*look.y+dz*look.z)/d;if(dot<.955)continue;if(blocked?.(x,y,z))continue;
    const c=d+(1-dot)*18;if(c<score){score=c;best={kind:'paperNote',sheet:sh,label:'Zettel'};}}}
  return best;
 }
 // Reader: the sheet drawn large, on its own layer above the game.
 let reader=null,openSeed=null;
 function ensureReader(){
  if(reader)return reader;
  const wrap=doc.createElement('div');wrap.id='paperReader';wrap.hidden=true;
  wrap.style.cssText='position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(6,6,5,.82)';
  const c=doc.createElement('canvas');c.width=READER.w;c.height=READER.h;c.style.cssText='height:min(calc(100vh - 80px),calc((100vw - 32px)*4/3));width:auto;aspect-ratio:3/4;filter:drop-shadow(0 14px 34px rgba(0,0,0,.55))';
  const hint=doc.createElement('div');hint.textContent='E · Esc · Klick: weglegen';hint.style.cssText='font:13px monospace;color:#c9c2a8;letter-spacing:.08em';
  wrap.append(c,hint);doc.body.appendChild(wrap);wrap.addEventListener('click',close);
  // Above the game's own key handling while the sheet is up.
  globalThis.addEventListener('keydown',ev=>{if(!openSeed&&openSeed!==0)return;ev.stopImmediatePropagation();ev.preventDefault();if(['KeyE','Escape','Space','Enter'].includes(ev.code))close();},true);
  reader={wrap,canvas:c};return reader;
 }
 function open(t){const r=ensureReader(),s=t.sheet||t;openSeed=s.seed;NB.render(r.canvas,s.seed,OPTIONS);r.wrap.hidden=false;stats.opened++;onOpen?.(s);return true;}
 function close(){if(openSeed===null)return;openSeed=null;if(reader)reader.wrap.hidden=true;onClose?.();}
 function reset(){for(const slot of [...shown.keys()])hide(slot);rooms.clear();queue.length=0;stats.rolled=stats.rooms=stats.sheets=stats.opened=0;close();}
 return{room,fixed,show,hide,setVisible,target,open,close,pump,reset,makeSheets,get isOpen(){return openSeed!==null;},get state(){return{...stats,shown:[...shown.values()].reduce((n,s)=>n+s.list.length,0),queue:queue.length,cached:cache.size};}};
}
window.NovaPaperNotes={create,OPTIONS,CHANCE};
})();
