// v106: rare doors in the backrooms. A newly entered room gets one by true chance
// (crypto.getRandomValues, never a seed: the same room can have one in one game and none in the
// next). The door sits flush in a solid wall. When the player comes near it swings open; only
// then is it decided, again by true chance, where its passage leads: to the forest or to one of
// the other backrooms. Behind the leaf a corridor runs off towards that place's light.
// game.js does the actual travel (window.NovaBackroomDoors).
(() => {
'use strict';
const CHANCE={factory:.05,apartment:.05,biosphere:.12};
// Where a passage can lead, as seen from each backroom (the own one is never offered).
const DESTINATIONS={factory:['forest','apartment','biosphere'],apartment:['forest','factory','biosphere'],biosphere:['forest','factory','apartment']};
const DOOR={width:.92,height:2.08,openAt:3.2,enterDepth:.62,enterSide:.42};
// True randomness where the browser offers it; Math.random only as a last resort.
function trueRandom(){
 const c=globalThis.crypto;
 if(c?.getRandomValues){const a=new Uint32Array(1);c.getRandomValues(a);return a[0]/4294967296;}
 return Math.random();
}
// The forest gets half of the passages, the two other backrooms a quarter each.
function pickDestination(from,random=trueRandom){
 const list=DESTINATIONS[from]||DESTINATIONS.factory,r=random();
 return r<.5?'forest':r<.75?list[1]:list[2];
}
// Corridor views painted once per destination: walls run to a lit end in that place's colour.
const LOOKS={
 forest:{wall:'#1d2418',floor:'#141a10',end:'#9fb98a',glow:'rgba(190,220,160,.9)',trees:true},
 factory:{wall:'#2a3128',floor:'#1a2019',end:'#9da995',glow:'rgba(186,194,161,.85)'},
 apartment:{wall:'#5b5131',floor:'#3a3320',end:'#e6d48c',glow:'rgba(255,240,170,.9)'},
 biosphere:{wall:'#21334a',floor:'#24301f',end:'#2f7be8',glow:'rgba(150,200,255,.9)'},
 closed:{wall:'#050505',floor:'#030303',end:'#090909',glow:'rgba(0,0,0,0)'}
};
function create(THREE,{random=trueRandom,document:doc=globalThis.document}={}){
 const rooms=new Map(),textures={},stats={rolled:0,doors:0,opened:0};
 const frameMat=new THREE.MeshLambertMaterial({color:0x3b3127}),leafMat=new THREE.MeshLambertMaterial({color:0xcfc6ad}),knobMat=new THREE.MeshLambertMaterial({color:0x8b7a4c});
 function corridorTexture(kind){
  if(textures[kind])return textures[kind];const L=LOOKS[kind],c=doc.createElement('canvas');c.width=128;c.height=256;const g=c.getContext('2d');
  const w=128,h=256,ex0=w*.38,ex1=w*.62,ey0=h*.36,ey1=h*.6;
  g.fillStyle=L.wall;g.fillRect(0,0,w,h);
  g.fillStyle=L.floor;g.beginPath?.();g.moveTo?.(0,h);g.lineTo?.(w,h);g.lineTo?.(ex1,ey1);g.lineTo?.(ex0,ey1);g.closePath?.();g.fill?.();
  g.fillStyle='rgba(0,0,0,.45)';g.beginPath?.();g.moveTo?.(0,0);g.lineTo?.(w,0);g.lineTo?.(ex1,ey0);g.lineTo?.(ex0,ey0);g.closePath?.();g.fill?.();
  // Receding frames make the length readable.
  g.strokeStyle='rgba(0,0,0,.35)';for(let i=1;i<6;i++){const t=1-Math.pow(.62,i),x0=ex0*t,x1=w-(w-ex1)*t,y0=ey0*t,y1=h-(h-ey1)*t;g.strokeRect?.(x0,y0,x1-x0,y1-y0);}
  if(g.createRadialGradient){const glow=g.createRadialGradient(w/2,(ey0+ey1)/2,2,w/2,(ey0+ey1)/2,w*.6);glow.addColorStop(0,L.glow);glow.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=glow;g.fillRect(0,0,w,h);}
  g.fillStyle=L.end;g.fillRect(ex0,ey0,ex1-ex0,ey1-ey0);
  if(L.trees){g.fillStyle='#2a3322';for(let i=0;i<5;i++){const x=ex0+3+i*(ex1-ex0-6)/4;g.fillRect(x,ey0,1.5+(i%2),ey1-ey0);}}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;textures[kind]=t;return t;
 }
 const corridorMats={};
 const corridorMat=kind=>corridorMats[kind]||(corridorMats[kind]=new THREE.MeshBasicMaterial({map:corridorTexture(kind),fog:false}));
 function model(){
  const group=new THREE.Group();group.name='Seltene Tür';
  const W=DOOR.width,H=DOOR.height,box=(w,h,d,m)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
  const corridor=new THREE.Mesh(new THREE.PlaneGeometry(W,H),corridorMat('closed'));corridor.position.set(0,H/2,.004);group.add(corridor);
  for(const s of [-1,1]){const post=box(.09,H+.09,.08,frameMat);post.position.set(s*(W/2+.045),(H+.09)/2,.04);group.add(post);}
  const head=box(W+.18,.09,.08,frameMat);head.position.set(0,H+.045,.04);group.add(head);
  // The leaf hangs on the left post and swings into the room.
  const hinge=new THREE.Group();hinge.position.set(-W/2,0,.03);group.add(hinge);
  const leaf=box(W-.02,H-.02,.045,leafMat);leaf.position.set(W/2,H/2,0);hinge.add(leaf);
  const knob=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),knobMat);knob.position.set(W-.12,1.02,.05);hinge.add(knob);
  return{group,hinge,corridor};
 }
 // Find a stretch of solid wall: free floor in front, wall behind (and still wall 1.5 m deeper,
 // so neither an opening nor a thin piece of furniture), room to swing the leaf.
 function findSpot({walkable,center,extent,floor,ceiling,avoid=null,dirs=[[1,0],[-1,0],[0,1],[0,-1]],rng=random}){
  for(let attempt=0;attempt<48;attempt++){
   const [dx,dz]=dirs[Math.floor(rng()*dirs.length)],tx=-dz,tz=dx,u=(rng()*2-1)*extent*.8;
   let sx=center.x+tx*u,sz=center.z+tz*u;if(!walkable(sx,sz))continue;
   let free=0,wall=null;for(let d=.1;d<extent*2+30;d+=.1){if(!walkable(sx+dx*d,sz+dz*d)){wall=d;break;}free=d;}
   if(wall===null)continue;
   let a=free,b=wall;for(let i=0;i<8;i++){const m=(a+b)/2;if(walkable(sx+dx*m,sz+dz*m))a=m;else b=m;}
   const wx=sx+dx*b,wz=sz+dz*b,nx=-dx,nz=-dz;let ok=true;
   for(const side of [-.62,-.31,0,.31,.62]){
    const px=wx+tx*side,pz=wz+tz*side;
    if(!walkable(px+nx*.35,pz+nz*.35)||!walkable(px+nx*1,pz+nz*1)||walkable(px-nx*.08,pz-nz*.08)||walkable(px-nx*1.5,pz-nz*1.5)){ok=false;break;}
   }
   if(!ok)continue;
   const y=floor(wx+nx*.4,wz+nz*.4);if(!Number.isFinite(y))continue;
   if(ceiling){const top=ceiling(wx+nx*.4,wz+nz*.4);if(Number.isFinite(top)&&top-y<DOOR.height+.15)continue;}
   const spot={x:wx,z:wz,y,nx,nz,tx,tz};if(avoid?.(spot))continue;
   return spot;
  }
  return null;
 }
 // Once per room and game: roll, then place. The room keeps its answer when the player returns.
 function room(key,context,placeArgs){
  if(rooms.has(key))return rooms.get(key);
  stats.rolled++;let door=null;
  if(random()<(CHANCE[context]??0)){const spot=findSpot(placeArgs);if(spot){door={key,context,spot,open:0,destination:null,view:null};stats.doors++;}}
  rooms.set(key,door);return door;
 }
 let shown=null;
 // Keep exactly one door model in the scene: the current room's, or none.
 function show(door,scene,offset={x:0,z:0}){
  if(shown&&(shown.door!==door||shown.scene!==scene)){shown.scene.remove(shown.view.group);shown=null;}
  if(!door)return;
  if(!shown){door.view=door.view||model();scene.add(door.view.group);shown={door,scene,view:door.view};}
  const s=door.spot,g=door.view.group;g.position.set(offset.x+s.x+s.nx*.006,s.y,offset.z+s.z+s.nz*.006);g.rotation.y=Math.atan2(s.nx,s.nz);
 }
 function hide(){if(shown){shown.scene.remove(shown.view.group);shown=null;}}
 // Player in the door's own coordinates (same space as the spot). Returns 'enter' once he steps
 // into the open doorway.
 function update(door,dt,player,playing){
  if(!door)return null;const s=door.spot,dx=player.x-s.x,dz=player.z-s.z,depth=dx*s.nx+dz*s.nz,side=dx*s.tx+dz*s.tz;
  const near=playing&&depth>0&&depth<DOOR.openAt&&Math.abs(side)<DOOR.openAt;
  if(near&&!door.destination){door.destination=pickDestination(door.context,random);stats.opened++;if(door.view)door.view.corridor.material=corridorMat(door.destination);}
  door.open=Math.max(0,Math.min(1,door.open+(near?1:-.6)*dt*1.25));
  if(door.view){const e=door.open*door.open*(3-2*door.open);door.view.hinge.rotation.y=-e*1.72;}
  if(door.view&&door.destination&&door.view.corridor.material!==corridorMat(door.destination))door.view.corridor.material=corridorMat(door.destination);
  if(playing&&door.destination&&door.open>.8&&depth<DOOR.enterDepth&&depth>-.2&&Math.abs(side)<DOOR.enterSide)return'enter';
  return null;
 }
 function reset(){hide();rooms.clear();stats.rolled=stats.doors=stats.opened=0;}
 // Debug: force a door into the given room now.
 function force(key,context,placeArgs,destination=null){const spot=findSpot(placeArgs);if(!spot)return null;const door={key,context,spot,open:0,destination,view:null};rooms.set(key,door);stats.doors++;return door;}
 return{room,show,hide,update,reset,force,findSpot,get state(){return{...stats,rooms:rooms.size,shown:shown?{key:shown.door.key,destination:shown.door.destination,open:shown.door.open}:null};}};
}
window.NovaBackroomDoors={create,trueRandom,pickDestination,CHANCE,DESTINATIONS,DOOR};
})();
