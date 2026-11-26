// Night architecture with distance-driven analogue degradation. Stable portal graphs and streamed hills.
(() => {
'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),CELL=80,HALF=1.35;
// Median RGB of the clear dark-blue sky in the supplied second reference.
const ROOF_SKY=0x1d439b,towerRadius=t=>clamp(t.h*.093,1.55,2.1);
function hash(text,seed=0x4e484f55){let h=seed>>>0;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function random(seed){return window.NovaTerrain.rng(seed);}
function rect(x0,x1,z0,z1,y=0,extra={}){return{x0,x1,z0,z1,y,...extra};}
function contains(r,x,z,pad=0){return x>=r.x0-pad&&x<=r.x1+pad&&z>=r.z0-pad&&z<=r.z1+pad;}
// v91: layouts are pure functions of (seed, path, toy seed) and never changed afterwards;
// a small memo keeps room changes from recomputing the same neighbourhood again and again.
const specMemo=new Map();
function spec(seed,path=[],toySeed=0){
 const k=seed+'|'+path.join('/')+'|'+toySeed;let s=specMemo.get(k);
 if(!s){s=buildSpec(seed,path,toySeed);specMemo.set(k,s);if(specMemo.size>500)specMemo.delete(specMemo.keys().next().value);}
 return s;
}
function buildSpec(seed,path=[],toySeed=0){
 const key=hash(path.join('/'),seed),r=random(key),steps=path.filter(p=>p==='s').length,stair=path.at(-1)==='s',descent=path.at(-1)==='d';
 const s={seed:key,houseSeed:seed,toySeed,path:[...path],steps,roofAt:10+hash('roof',seed)%6,type:stair?'stair':'apartment',height:2.9+r()*1.2,rects:[],ports:[],windows:[],furniture:[],theme:Math.floor(r()*6),cutsX:[],cutsZ:[],branches:[],rooms:[],pools:[],radios:[]};
 const port=(id,x,z,nx,nz,y=0)=>s.ports.push({id,x,z,nx,nz,y,width:HALF*2});
 if(descent){
  // v90: a very long straight flight down. Its last opening leads to the field.
  const length=DESCENT.length,drop=DESCENT.drop,count=Math.ceil(drop/.17);
  s.type='descent';s.height=3.4;s.rise=-drop;s.length=length;
  s.rects.push(rect(-HALF,HALF,0,7));port('back',0,4,0,1);
  s.rects.push(rect(-HALF,HALF,-length,0,0,{axis:'z',from:0,to:-length,rise:-drop,count}));
  s.rects.push(rect(-HALF,HALF,-length-9,-length,-drop));port('f',0,-length-6,0,-1,-drop);
  for(let i=0;i<=count;i++)s.cutsZ.push(-length*i/count);
 }else if(stair){
  const length=6+r()*5,second=5+r()*5,rise=3.5+r()*2,half=rise/2,sign=r()<.5?-1:1,n1=Math.ceil(half/.17),n2=Math.ceil(half/.17);
  s.height=3.2;s.rise=rise;s.length=length+second;
  s.rects.push(rect(-HALF,HALF,0,7));port('back',0,4,0,1);
  s.rects.push(rect(-HALF,HALF,-length,0,0,{axis:'z',from:0,to:-length,rise:half,count:n1}));
  s.rects.push(rect(-HALF,HALF,-length-HALF*2,-length,half));
  const a=sign*HALF,b=sign*(HALF+second);
  s.rects.push(rect(Math.min(a,b),Math.max(a,b),-length-HALF*2,-length,half,{axis:'x',from:a,to:b,rise:half,count:n2}));
  const end=sign*(HALF+second+4);s.rects.push(rect(Math.min(b,end+sign*3),Math.max(b,end+sign*3),-length-HALF*2,-length,rise));
  port('u',end,-length-HALF,sign,0,rise);
  for(let i=0;i<=n1;i++)s.cutsZ.push(-length*i/n1);
  for(let i=0;i<=n2;i++)s.cutsX.push(a+(b-a)*i/n2);
 }else{
  s.rx=4.6+r()*6.4;s.rz=4+r()*5.8;s.height=2.8+r()*1.4;
  s.rects.push(rect(-s.rx,s.rx,-s.rz,s.rz));
  // Parent hall plus two independently sized, bent onward corridors.
  s.rects.push(rect(-HALF,HALF,s.rz,s.rz+9));port('back',0,s.rz+6,0,1);
  // v90: corridor lengths from a separate stream: mostly as before, sometimes long, rarely very long.
  const cl=random(hash('corridor-length-v90',key)),longer=()=>{const u=cl();return u<.55?1:u<.82?1.6+cl()*1.6:u<.95?3.2+cl()*2.8:6+cl()*4;};
  for(const side of [-1,1]){
   const length=Math.min(110,(4+r()*14)*longer()),turn=Math.min(110,(4+r()*9)*longer()),z=(r()-.5)*s.rz*.65,x=side*(s.rx+length),end=z-turn;
   s.rects.push(rect(Math.min(side*s.rx,x+side*HALF),Math.max(side*s.rx,x+side*HALF),z-HALF,z+HALF));
   s.branches.push({side,x,z});s.rects.push(rect(x-HALF,x+HALF,end-3,z+HALF));port(side<0?'w':'e',x,end,0,-1);
  }
  const upLength=Math.min(110,(4+r()*7)*longer()),offset=r()*s.rx*.45;
  s.rects.push(rect(offset-HALF,offset+HALF,-s.rz-upLength-3,-s.rz));port('s',offset,-s.rz-upLength,0,-1);
  const add=(x,z,w,d,h,material,y=h/2,solid=true)=>s.furniture.push({x,z,w,d,h,material,y,solid});
  // Leave the central cross and all four door approaches clear in every seed.
  const x=-s.rx+2.15,z=-s.rz+2.05;
  if(s.theme===0||s.theme===1){
   add(x,z,2,3,.35,'wood');add(x,z,1.9,2.9,.22,'cloth',.46);add(x,z-1.48,2.1,.16,1.1,'wood');
   add(s.rx-1.3,-s.rz+1.3,1.3,.7,1.9,'wood');
  }else if(s.theme===2){
   add(x,z,3,.9,.6,'cloth');add(x,z-.43,3,.2,1.2,'cloth');add(x,z+1.35,1.3,.85,.08,'wood',.6);add(x,z+1.35,.55,.45,.55,'wood',.28);
  }else if(s.theme===3){
   add(x,z,3.2,.9,.9,'paint');add(x,z,3.25,.94,.06,'white',.93);add(x-.8,z,.65,.65,.025,'black',.98);add(x+.8,z,.8,.58,.02,'metal',.98);
   add(s.rx-1.8,s.rz-2,1.8,1.1,.09,'wood',.77);for(const a of [-.68,.68])for(const b of [-.4,.4])add(s.rx-1.8+a,s.rz-2+b,.08,.08,.74,'wood',.37);
  }else if(s.theme===4){
   // Preserve the old layout stream; toys now roll independently below.
   for(let i=0;i<9;i++)r();
   add(s.rx-1.4,s.rz-1.3,1.6,.45,.7,'toy1');
  }
  s.windows=[{id:'forest',x:-s.rx+1.55,z:s.rz,nx:0,nz:1,bottom:.92,top:2.48,width:2.65},{id:'courtyard',x:-s.rx+1.6,z:-s.rz,nx:0,nz:-1,bottom:.92,top:2.48,width:2.6}];
  // v91: about one apartment in ten has the long stairs. They begin as a stairwell in the
  // floor: in wide rooms in front of the far wall, otherwise in a small chamber off a long
  // corridor, reached through an opening in the corridor wall (placed in corridorDescent).
  const dr=random(hash('descent-v91',key));s.descentRoll=dr()<DESCENT.chance?dr():null;
  if(s.descentRoll!==null&&s.descentRoll<.8&&s.rz>=4.3){
   // Clear of the window, the onward hall and both side-hall mouths.
   const sPort=s.ports.find(p=>p.id==='s'),zTop=-s.rz+3.3,fits=x=>s.branches.every(b=>b.z-HALF>zTop+.6||Math.abs(x-b.side*s.rx)>HALF+2.2);
   const ranges=[[-s.rx+4.4,sPort.x-3.1],[sPort.x+3.1,s.rx-2.1]].filter(([a,b])=>b-a>.2);
   const options=[];for(const [a,b]of ranges)for(let i=0;i<=8;i++){const x=a+(b-a)*i/8;if(fits(x))options.push(x);}
   if(options.length){const cx=options[Math.floor(dr()*options.length)];
    addStairwell(s,cx,zTop,-s.rz,-1);
    s.furniture=s.furniture.filter(f=>!(Math.abs(f.x-cx)<HALF+1.1+f.w/2&&f.z-f.d/2<zTop+1.6));
    railing(s,cx,zTop,-s.rz);}
  }
 }
 if(!stair&&!descent){furnishRooms(s);extraRooms(s);decorateRooms(s);growRooms(s);corridorDescent(s);clearStairwell(s);s.blindArches=blindArches(s,key);}
 s.toys=window.NovaApartmentToys?.night(s,toySeed,blocked)||[];
 return s;
}
// v90: extra side rooms along long corridors, each behind an arched passage. They are
// placed only where their whole footprint (plus a margin) is still empty space.
function extraRooms(s){
 const r=random(hash('extra-rooms-v90',s.seed)),S=window.NovaSettlements;let n=0;
 const empty=(x0,x1,z0,z1)=>{for(let x=x0-1;x<=x1+1;x+=.9)for(let z=z0-1;z<=z1+1;z+=.9)if(floorAt(s,x,z)!==null)return false;return true;};
 const passageFree=(x,z0,z1)=>{for(let u=-1.2;u<=1.2;u+=.3)for(let z=z0;z<z1-.08;z+=.3)if(floorAt(s,x+u,z)!==null)return false;return true;};
 for(const b of s.branches){
  const len=Math.abs(b.x)-s.rx;if(len<14)continue;const count=Math.min(4,Math.floor(len/13));
  for(let i=0;i<count;i++){
   const doorX=b.side*(s.rx+(i+.5+r()*.6-.3+.2)*len/count),w=8+r()*9,d=7+r()*9,z1=b.z-HALF-2.6,z0=z1-d;
   const x0=doorX-w/2,x1=x0+w;
   if(Math.abs(doorX)>Math.abs(b.x)-2.6||!empty(x0,x1,z0,z1)||!passageFree(doorX,z1,b.z-HALF))continue;
   const kind=r()<.55?'furnished':'hall',room={id:'xroom-'+(n++),kind,x0,x1,z0,z1,height:3+r()*1.6,door:{x:doorX,z:z1,hallZ:b.z-HALF,nx:0,nz:1,width:1.9}};
   s.rooms.push(room);s.rects.push(rect(doorX-.95,doorX+.95,z1,b.z-HALF,0,{roomId:room.id+'-door'}));s.rects.push(rect(x0,x1,z0,z1,0,{height:room.height,roomId:room.id}));
   if(kind==='furnished'&&S?.furniturePieces){s.furniture.push(...S.furniturePieces('bed',x0+2.1,z0+2.1));if(r()<.7)s.furniture.push(...S.furniturePieces('sofa',x1-2.1,z0+2.5));}
  }
 }
}
// v90: curved openings. A doorway is decided once for the pair of rooms it joins.
const DESCENT={chance:.096,length:62,drop:27};
// v91: a stairwell sunk into the floor. Steps (0.17 m) run from zTop toward wallZ, pass
// under that wall into a short tunnel and end on a landing with the 'd' opening, which
// leads on to the long flight (spec type 'descent'). The stair rectangle comes first in
// s.rects, so floorAt prefers it over the room floor it is cut into.
function addStairwell(s,cx,zTop,wallZ,dir){
 const inLen=Math.abs(wallZ-zTop),len=inLen+2.4,count=Math.round(len/.3),drop=count*.17,zEnd=wallZ+dir*2.4,zLand=zEnd+dir*5;
 s.rects.unshift(rect(cx-HALF,cx+HALF,Math.min(zTop,zEnd),Math.max(zTop,zEnd),0,{axis:'z',from:zTop,to:zEnd,rise:-drop,count,stairwell:true}));
 s.rects.push(rect(cx-HALF,cx+HALF,Math.min(zEnd,zLand),Math.max(zEnd,zLand),-drop));
 for(let i=0;i<=count;i++)s.cutsZ.push(zTop+(zEnd-zTop)*i/count);
 s.ports.push({id:'d',x:cx,z:zEnd+dir*2,nx:0,nz:dir,y:-drop,width:HALF*2});
 s.descent={x:cx,z:zTop,wallZ,dir,drop};
}
// Metal railings along both long sides of the opening (no wood in the backrooms).
function railing(s,cx,zTop,wallZ){
 const z=(zTop+wallZ)/2,len=Math.abs(zTop-wallZ);
 for(const side of [-1,1]){const x=cx+side*(HALF+.05);
  s.furniture.push({x,z,w:.05,d:len,h:.05,material:'metal',y:.95,solid:true},{x,z,w:.04,d:len,h:.04,material:'metal',y:.5,solid:false});
  for(let i=0;i<=Math.ceil(len/1.2);i++)s.furniture.push({x,z:zTop+(wallZ-zTop)*Math.min(1,i/Math.ceil(len/1.2)*.98),w:.05,h:.95,d:.05,material:'metal',y:.475,solid:false});}
}
// Narrow rooms (or a wide room without space) put the stairs in a chamber off a corridor.
function corridorDescent(s){
 if(s.descentRoll==null||s.ports.some(p=>p.id==='d'))return;
 const r=random(hash('descent-corridor-v91',s.seed));
 const empty=(x0,x1,z0,z1)=>{for(let x=x0-.8;x<=x1+.8+1e-9;x+=.45)for(let z=z0-.8;z<=z1+.8+1e-9;z+=.45)if(floorAt(s,x,z)!==null)return false;return true;};
 const branches=[...s.branches];if(r()<.5)branches.reverse();
 for(const b of branches){
  const len=Math.abs(b.x)-s.rx;if(len<9)continue;
  for(let t=0;t<5;t++){
   const doorX=b.side*(s.rx+(.3+r()*.45)*len),w=4.6,d=5.4;
   for(const dir of r()<.5?[-1,1]:[1,-1]){
    const hallZ=b.z+dir*HALF,z1=hallZ+dir*2.6,zFar=z1+dir*d,zTop=z1+dir*1.3,zLand=zFar+dir*7.4;
    if(!empty(doorX-w/2,doorX+w/2,Math.min(z1,zFar),Math.max(z1,zFar))||!empty(doorX-HALF,doorX+HALF,Math.min(zFar,zLand),Math.max(zFar,zLand)))continue;
    let ok=true;for(let u=-1.2;u<=1.2&&ok;u+=.3)for(let q=.08;q<2.6&&ok;q+=.3)if(floorAt(s,doorX+u,hallZ+dir*q)!==null)ok=false;
    if(!ok)continue;
    const room={id:'stairs-0',kind:'stairwell',x0:doorX-w/2,x1:doorX+w/2,z0:Math.min(z1,zFar),z1:Math.max(z1,zFar),height:3.3,door:{x:doorX,z:z1,hallZ,nx:0,nz:1,width:1.9}};
    s.rooms.push(room);s.rects.push(rect(doorX-.95,doorX+.95,Math.min(z1,hallZ),Math.max(z1,hallZ),0,{roomId:room.id+'-door'}));s.rects.push(rect(room.x0,room.x1,room.z0,room.z1,0,{height:room.height,roomId:room.id}));
    addStairwell(s,doorX,zTop,zFar,dir);railing(s,doorX,zTop,zFar);return;
   }
  }
 }
}
// Nothing may stand, grow or hang in the stairwell or in front of it.
function clearStairwell(s){
 const d=s.descent;if(!d)return;
 const z0=Math.min(d.z-d.dir*1.6,d.wallZ),z1=Math.max(d.z-d.dir*1.6,d.wallZ),inside=(x,z,m=0)=>Math.abs(x-d.x)<HALF+.9+m&&z>z0-m&&z<z1+m;
 s.furniture=s.furniture.filter(f=>f.material==='metal'&&Math.abs(Math.abs(f.x-d.x)-HALF-.05)<.01||!inside(f.x,f.z,Math.max(f.w,f.d)/2));
 s.radios=s.radios.filter(r=>!inside(r.x,r.z,.4));s.gardens=(s.gardens||[]).filter(p=>!inside(p.x,p.z,.6));s.poolProps=(s.poolProps||[]).filter(p=>!inside(p.x,p.z,.6));
 s.paintings=(s.paintings||[]).filter(p=>!inside(p.x,p.z,p.w/2+.3));
}
function archKey(s,p){return p.id==='back'?s.path.join('/'):[...s.path,p.id].join('/');}
function arched(s,p){if(p.id==='f'||(p.id==='back'&&!s.path.length))return false;if(p.id==='d'||(p.id==='back'&&s.path.at(-1)==='d'))return true;return hash('arch-v90:'+archKey(s,p),s.houseSeed)%100<15;}
// Low arches on solid main-room walls: open, but the passage behind is unreachable and dark.
function blindArches(s,key){
 const r=random(hash('blind-arch-v90',key)),v=random(hash('blind-arch-shape-v91',key)),out=[],want=r()<.42?(r()<.35?2:1):0,clear=(a,b,d)=>Math.abs(a-b)>d;
 for(let i=0;i<want*6&&out.length<want;i++){
  const wall=Math.floor(r()*4);let x,z,nx=0,nz=0;
  if(wall<2){nz=wall?1:-1;z=-nz*s.rz;x=-s.rx+4+r()*(2*s.rx-5.8);
   if(nz===-1&&!clear(x,0,2.7))continue;
   if(!s.ports.every(p=>p.nx!==0||p.nz!==-nz||clear(x,p.x,2.9)))continue;}
  else{nx=wall===2?1:-1;x=-nx*s.rx;z=-s.rz+1.7+r()*(2*s.rz-3.4);const b=s.branches.find(b=>b.side===-nx);if(b&&!clear(z,b.z,2.8))continue;}
  if(out.some(a=>Math.hypot(a.x-x,a.z-z)<3))continue;
  // v91: low arches vary in width and height, but always stay well below head height.
  const width=.8+v()*.9,crown=.95+v()*.5,spring=Math.max(.3,crown-width*.42),hw=width/2,tx=nz,tz=-nx;
  const clearAt=(d,u0,u1)=>{for(let u=u0;u<=u1+1e-9;u+=.3)if(floorAt(s,x-nx*d+tx*u,z-nz*d+tz*u)!==null)return false;return floorAt(s,x-nx*d+tx*u1,z-nz*d+tz*u1)===null;};
  // The passage runs outward (up to 7 m) until it would come near any walkable space.
  let depth=0;for(let d=.3;d<=7.2;d+=.3){if(clearAt(d,-hw-.45,hw+.45))depth=d;else break;}
  if(depth<1.2)continue;
  // Sometimes the passage opens into a dark room instead of a long hall.
  let room=null;
  if(depth>=3.6&&v()<.45){const w=2.6+v()*1.8,d=Math.min(depth-1,2.4+v()*2.4),off=(v()-.5)*.8;let ok=true;
   for(let q=.6;q<=.6+d+.35&&ok;q+=.3)ok=clearAt(q,off-w/2-.35,off+w/2+.35);if(ok)room={w,d,off};}
  const a={x,z,nx,nz,width,spring,crown,depth:room?.6+room.d:depth,room},fp=blindFootprint(a);
  if(out.some(b=>{const o=blindFootprint(b);return fp.x0<o.x1&&o.x0<fp.x1&&fp.z0<o.z1&&o.z0<fp.z1;}))continue;
  out.push(a);
  // Cell cuts at the arch edges let the wall builder leave exactly this span open.
  if(nx)s.cutsZ.push(z-hw,z+hw);else s.cutsX.push(x-hw,x+hw);
 }
 return out;
}
function blindFootprint(a){
 const tx=a.nz,tz=-a.nx,u0=a.room?Math.min(-a.width/2,a.room.off-a.room.w/2):-a.width/2,u1=a.room?Math.max(a.width/2,a.room.off+a.room.w/2):a.width/2,xs=[],zs=[];
 for(const d of [0,a.depth+.2])for(const u of [u0-.2,u1+.2]){xs.push(a.x-a.nx*d+tx*u);zs.push(a.z-a.nz*d+tz*u);}
 return{x0:Math.min(...xs),x1:Math.max(...xs),z0:Math.min(...zs),z1:Math.max(...zs)};
}
// Side rooms branch through real doorways off both bent halls. Their own seeded
// stream leaves the established staircase graph and roof threshold unchanged.
function furnishRooms(s){
 const r=random(hash('side-rooms',s.seed)),S=window.NovaSettlements;
 function addFurniture(kind,x,z,yaw=0){if(S?.furniturePieces)s.furniture.push(...S.furniturePieces(kind,x,z,yaw));}
 function addRadio(x,z,room,end=-1){
  const yaw=end===1?Math.PI:0;addFurniture('sideboard',x,z,yaw);addFurniture('radio',x,z,yaw);
  s.radios.push({id:'night-radio-'+s.seed+'-'+s.radios.length,kind:'radio',number:s.radios.length+1,x,y:1.095,z,end,floor:0,on:false,station:0,room});
 }
 for(const [i,b]of s.branches.entries()){
  const roll=r(),kind=roll<.22?'pool':roll<.39?'hall':roll<.56?'playroom':'furnished';
  const huge=kind==='hall'||kind==='pool'&&r()<.36,w=huge?35+r()*60:9+r()*11,d=huge?30+r()*52:9+r()*13;
  const branch=Math.abs(b.x)-.2,doorX=b.side*branch,z0=b.z+HALF+3.2;
  const x0=b.side>0?doorX-1.4:doorX-w+1.4,x1=x0+w,z1=z0+d;
  const room={id:'room-'+i,kind,x0,x1,z0,z1,height:huge?7+r()*9:3.2+r()*1.5,door:{x:doorX,z:z0,hallZ:b.z+HALF,nx:0,nz:1,width:1.9}};
  s.rooms.push(room);
  s.rects.push(rect(doorX-.95,doorX+.95,b.z+HALF,z0,0,{roomId:room.id+'-door'}));
  s.rects.push(rect(x0,x1,z0,z1,0,{height:room.height,roomId:room.id}));
  if(kind==='pool'){
   const count=huge?2+Math.floor(r()*3):Math.min(w,d)>15?1+Math.floor(r()*2):1,columns=count>2?2:1,rows=Math.ceil(count/columns),cellW=(w-5)/columns,cellD=(d-5)/rows;
   for(let k=0;k<count;k++){
    const col=k%columns,row=Math.floor(k/columns),pw=Math.max(3,(cellW-2)*(.68+r()*.3)),pd=Math.max(3,(cellD-2)*(.68+r()*.3)),cx=x0+2.5+(col+.5)*cellW,cz=z0+2.5+(row+.5)*cellD;
    const pool={x0:cx-pw/2,x1:cx+pw/2,z0:cz-pd/2,z1:cz+pd/2,depth:.65+r()*.7,steps:8,stairs:Math.min(2.2,pd*.48),room:room.id};
    s.pools.push(pool);s.cutsX.push(pool.x0,pool.x1);s.cutsZ.push(pool.z0,pool.z1);
    for(let j=1;j<=pool.steps;j++)s.cutsZ.push(pool.z0+pool.stairs*j/pool.steps);
   }
  }else if(kind==='furnished'){
   addFurniture('bed',x0+2.1,z1-2.1);addFurniture('kitchen',(x0+x1)/2,z0+.9,Math.PI);
   if(r()<.8)addFurniture('sofa',x1-2.1,z1-2.5);if(r()<.7)addFurniture('table',(x0+x1)/2,z1-3.4);
   if(r()<.32){addFurniture('bath',x1-1.5,z0+3.2);addFurniture('toilet',x1-1.4,z0+5.2);}
  }else if(kind==='playroom'){
   addFurniture('bed',x1-1.5,z1-2.3);addFurniture('sideboard',(x0+x1)/2,z0+.8,Math.PI);
  }
  // A radio is always reachable from the dry walkway and never fills a door.
  if(r()<.24)addRadio((x0+x1)/2,z1-1,room.id);
 }
 if(r()<.18&&s.theme===5)addRadio(s.rx-1.9,-s.rz+1.1,'main',1);
}
// A separate random stream leaves the existing topology/furniture unchanged.
function decorateRooms(s){
 const r=random(hash('carpets-and-paintings-v63',s.seed));s.carpetMain=s.theme!==4&&r()<.25;s.paintings=[];
 const rooms=[{id:'main',x0:-s.rx,x1:s.rx,z0:-s.rz,z1:s.rz,height:s.height},...s.rooms];
 for(const room of rooms){
  if(room.id!=='main')room.carpet=room.kind!=='pool'&&r()<.34;
  if(room.kind==='pool'||r()>.32)continue;
  const side=r()<.5?-1:1,x=side<0?room.x0:room.x1,z=room.id==='main'?s.rz*.72:(room.z0+room.z1)/2;
  // Hang only on an actual solid wall, away from windows, doors and portal joins.
  if(floorAt(s,x+side*.2,z)!==null)continue;
  const w=Math.min((.9+r()*.65)*16/9,2*Math.min(z-room.z0,room.z1-z)-.4),h=w*9/16;
  if(w<1||[-.5,0,.5].some(t=>floorAt(s,x+side*.2,z+w*t)!==null))continue;
  s.paintings.push({room:room.id,x:x-side*.10,z,y:Math.min(room.height-h/2-.3,1.6+h*.12),w,h,yaw:side<0?Math.PI/2:-Math.PI/2});
 }
}
// Independent seeds keep the established rooms, radios and stair graph intact.
function growRooms(s){
 const r=random(hash('indoor-growth-v75',s.seed));s.gardens=[];s.poolProps=[];
 for(const room of s.rooms){
  if(room.kind==='pool'){
   if(r()>.58)continue;
   for(const pool of s.pools.filter(p=>p.room===room.id)){
    const count=3+Math.floor(r()*6),placed=[];
    for(let i=0;i<count;i++){
     const kind=i===0?'ring':i===1?'armbands':'ball',radius=kind==='ring'?.6:kind==='armbands'?.4:.24;
     for(let attempt=0;attempt<24;attempt++){
      const x=pool.x0+radius+r()*Math.max(0,pool.x1-pool.x0-radius*2),z=pool.z0+pool.stairs+.25+r()*Math.max(0,pool.z1-pool.z0-pool.stairs-radius-.25);
      if(z+radius>pool.z1||placed.some(p=>Math.hypot(p.x-x,p.z-z)<p.radius+radius+.12))continue;
      const prop={room:room.id,kind,x,z,radius,y:-.12,yaw:r()*Math.PI*2,seed:Math.floor(r()*0xffffffff),water:true};s.poolProps.push(prop);placed.push(prop);break;
     }
    }
   }
   continue;
  }
  if(r()>.46)continue;
  const tree=r()<.24,count=2+Math.floor(r()*4),treeId=r()<.55?'betula-pendula':'sorbus-aucuparia';
  let centre=null;
  for(let attempt=0;attempt<50;attempt++){
   const x=room.x0+2+r()*(room.x1-room.x0-4),z=room.z0+2+r()*(room.z1-room.z0-4);
   if(Math.abs(x-room.door.x)<1.8||blocked(s,x,z,1.2))continue;
   centre={x,z};break;
  }
  if(!centre)continue;
  for(let i=0;i<count+(tree?1:0);i++){
   const isTree=tree&&i===0,a=r()*Math.PI*2,d=isTree?0:.45+r()*1.35,x=centre.x+Math.sin(a)*d,z=centre.z+Math.cos(a)*d;
   if(x<room.x0+1||x>room.x1-1||z<room.z0+1||z>room.z1-1||Math.abs(x-room.door.x)<1.45||blocked(s,x,z,isTree?.55:.4))continue;
   const height=isTree?Math.min(room.height-.6,2.5+r()*1.2):.55+r()*.55;
   s.gardens.push({room:room.id,id:isTree?treeId:'vaccinium-myrtillus',x,z,y:floorAt(s,x,z),height,yaw:r()*Math.PI*2,tree:isTree,radius:isTree?.14:0});
  }
 }
}
function degradation(distance){return 1-Math.exp(-Math.max(0,distance-45)/650);}
function poolDepth(pool,z){return pool.depth*Math.ceil(clamp((z-pool.z0)/pool.stairs,0,1)*pool.steps-1e-8)/pool.steps;}
function ceilingAt(s,x,z){let height=null;for(const r of s.rects)if(contains(r,x,z))height=Math.max(height??-Infinity,heightIn(r,x,z)+(r.height||s.height));return height;}

function heightIn(r,x,z){if(!r.axis)return r.y;const f=clamp(((r.axis==='x'?x:z)-r.from)/(r.to-r.from),0,1);return r.y+Math.ceil(f*r.count-1e-8)/r.count*r.rise;}
function floorAt(s,x,z){for(const r of s.rects)if(contains(r,x,z)){const pool=s.pools?.find(p=>contains(p,x,z));return pool?-poolDepth(pool,z):heightIn(r,x,z);}return null;}
function blocked(s,x,z,radius=.27){
 for(const [dx,dz]of [[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]])if(floorAt(s,x+dx,z+dz)===null)return true;
 if((s.gardens||[]).some(p=>p.tree&&Math.hypot(x-p.x,z-p.z)<radius+p.radius))return true;
 return s.furniture.some(f=>{if(!f.solid)return false;const c=Math.cos(f.ry||0),sn=Math.sin(f.ry||0),dx=x-f.x,dz=z-f.z;return Math.abs(dx*c-dz*sn)<f.w/2+radius&&Math.abs(dx*sn+dz*c)<f.d/2+radius;});
}
// Conservative horizontal visibility through the union of room rectangles.
// Visibility changes only on a ray through a rectangle corner. Test each such
// interval across the opening, so even a thin visible slit is retained. Height
// is deliberately ignored here: stairs/windows can only add work, never vanish.
function openingVisible(s,from,width,eye,entry){
 // Include the maximum breathing-shader displacement in the visible volume.
 const pad=.12,tx=from.nz,tz=-from.nx,half=width/2+pad,candidates=[-half,half];
 const dx=from.x-eye.x,dz=from.z-eye.z,plane=dx*from.nx+dz*from.nz;
 function clearAt(offset){
  const vx=dx+tx*offset,vz=dz+tz*offset;let start=0;
  if(entry){const side=(eye.x-entry.x)*entry.nx+(eye.z-entry.z)*entry.nz;
   if(side>.001){const speed=vx*entry.nx+vz*entry.nz;if(speed>=0)return false;start=-side/speed;if(start>1)return false;
    if(Math.abs((eye.x+vx*start-entry.x)*entry.nz-(eye.z+vz*start-entry.z)*entry.nx)>HALF+pad)return false;
   }
  }
  const spans=[];
  for(const r of s.rects){let lo=start,hi=1;
   for(const [p,v,a,b]of [[eye.x,vx,r.x0-pad,r.x1+pad],[eye.z,vz,r.z0-pad,r.z1+pad]]){
    if(Math.abs(v)<1e-9){if(p<a||p>b){hi=-1;break;}}
    else{const a0=(a-p)/v,b0=(b-p)/v;lo=Math.max(lo,Math.min(a0,b0));hi=Math.min(hi,Math.max(a0,b0));}
   }
   if(hi>=lo)spans.push([lo,hi]);
  }
  spans.sort((a,b)=>a[0]-b[0]);let reached=start;
  for(const [lo,hi]of spans){if(lo>reached+1e-7)return false;reached=Math.max(reached,hi);if(reached>=1-1e-7)return true;}return false;
 }
 if(clearAt(0))return true;
 const corners=s.rects.flatMap(r=>[[r.x0-pad,r.z0-pad],[r.x0-pad,r.z1+pad],[r.x1+pad,r.z0-pad],[r.x1+pad,r.z1+pad]]);
 if(entry)for(const side of [-1,1])corners.push([entry.x+entry.nz*(HALF+pad)*side,entry.z-entry.nx*(HALF+pad)*side]);
 for(const [x,z]of corners){
  const vx=x-eye.x,vz=z-eye.z,den=vx*from.nx+vz*from.nz;if(Math.abs(den)<1e-9)continue;
  const scale=plane/den;if(scale<1-1e-6)continue;
  const offset=(eye.x+vx*scale-from.x)*tx+(eye.z+vz*scale-from.z)*tz;
  if(offset>-half&&offset<half)candidates.push(offset);
 }
 candidates.sort((a,b)=>a-b);
 for(let i=1;i<candidates.length;i++)if(clearAt((candidates[i-1]+candidates[i])/2))return true;
 return false;
}
const naturalHeight=(x,z)=>5.4*Math.sin(x*.024)*Math.cos(z*.027)+2.6*Math.sin((x+z)*.038)+.55*Math.cos(z*.061-x*.012);
function chunk(seed,cx,cz){
 const rng=random(hash(cx+','+cz,seed)),houses=[],towers=[],x=cx*CELL,z=cz*CELL;
 for(let i=0;i<3;i++){
  const hx=x+(i===0?17:i===1?58:38)+(rng()-.5)*10,hz=z+(i===0?18:i===1?51:70)+(rng()-.5)*8;
  houses.push({id:cx+','+cz+':'+i,x:hx,z:hz,w:7+rng()*3,d:7+rng()*3,h:6.6+rng()*1.5,enterable:rng()<.64,color:Math.floor(rng()*3),seed:hash('home'+i,hash(cx+','+cz,seed)),y:naturalHeight(hx,hz)});
 }
 if(cx===0&&cz===0){Object.assign(houses[0],{id:'arrival',x:0,z:0,w:8,d:8,h:7.2,y:naturalHeight(0,0),enterable:true});towers.push({x:22,z:-31,h:19,y:naturalHeight(22,-31)});}
 if(rng()<.38)towers.push({x:x+12+rng()*53,z:z+12+rng()*53,h:15+rng()*8,y:0});
 for(const t of towers)t.y=naturalHeight(t.x,t.z);
 return{cx,cz,houses,towers};
}

// v91: the photo tiles are now seamless and flat (house-photo-materials.js). Mixing offset
// copies made soft blotches that read as tiles; only a slow, non-repeating brightness drift
// (two octaves of world-space value noise) is left, so long walls do not look stamped.
const NOTILE_GLSL=`
float novaVN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 float a=fract(sin(dot(i,vec2(127.1,311.7)))*43758.5453),b=fract(sin(dot(i+vec2(1.,0.),vec2(127.1,311.7)))*43758.5453);
 float c=fract(sin(dot(i+vec2(0.,1.),vec2(127.1,311.7)))*43758.5453),d=fract(sin(dot(i+vec2(1.,1.),vec2(127.1,311.7)))*43758.5453);
 return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
// v92: stochastic tiling. Irregular patches of the surface read the photo tile with
// their own random offset and blend softly into each other (after Inigo Quilez's
// "texture repetition"), so stains and marks no longer line up into a grid.
vec4 novaNoTile(sampler2D map,vec2 uv){
 float l=novaVN(uv*.27+vec2(4.7,1.3))*6.+novaVN(uv*.71+vec2(9.2,3.8))*2.,ia=floor(l),f=fract(l);
 vec2 oa=sin(vec2(3.,7.)*ia)*vec2(1.7,2.3),ob=sin(vec2(3.,7.)*(ia+1.))*vec2(1.7,2.3);
#if __VERSION__ >= 300
 vec2 dx=dFdx(uv),dy=dFdy(uv);vec4 a=textureGrad(map,uv+oa,dx,dy),b=textureGrad(map,uv+ob,dx,dy);
#else
 vec4 a=texture2D(map,uv+oa),b=texture2D(map,uv+ob);
#endif
 vec3 d=a.rgb-b.rgb;return mix(a,b,smoothstep(.2,.8,f-.1*(d.r+d.g+d.b)));}`;
function noTile(material,name){
 const before=material.onBeforeCompile;
 material.onBeforeCompile=function(shader,renderer){before?.call(this,shader,renderer);
  shader.fragmentShader=NOTILE_GLSL+'\n'+shader.fragmentShader.replace('#include <map_fragment>','#ifdef USE_MAP\n vec4 texelColor=novaNoTile(map,vUv);texelColor=mapTexelToLinear(texelColor);diffuseColor*=texelColor;\n diffuseColor.rgb*=.95+.07*novaVN(vUv*.13+3.1)+.035*novaVN(vUv*.47+8.3);\n#endif');};
 // v102: the shader is the same for every surface (only the carpets add their weave), so
 // they share one program instead of compiling one per material name.
 material.customProgramCacheKey=()=>'nova-notile-v92-'+(material.userData.carpet?'carpet':'plain');
}
function create({THREE,textures,settlements,onExit,onEyeRoom,outsideView,furnitureMaterials={},encounters=null,floraModels=null,poolProps=null,toys=null}){
 const scene=new THREE.Scene(),inside=new THREE.Group(),outside=new THREE.Group();scene.add(inside,outside);
 const ambient=new THREE.HemisphereLight(0xe7e9dd,0x565d41,.85),sun=new THREE.DirectionalLight(0xfff4d2,.4);sun.position.set(-45,95,30);scene.add(ambient,sun);
 // v102: three.js compiles one shader program per material and per combination of lights,
 // fog and clipping planes; on a weak GPU each takes 0.25–0.5 s. Views through an opening
 // are drawn with one clipping plane and had only a hemisphere light, so everything was
 // compiled once for the doorway view and again for the room itself. Now the room is drawn
 // with one plane too (it cuts nothing) and every preview carries the room's weak sun:
 // one program serves both, and warmup() can compile all of them before the game starts.
 const NO_CLIP=[new THREE.Plane(new THREE.Vector3(0,-1,0),1e6)];let heldPlanes=null;
 scene.onBeforeRender=renderer=>{if(!renderer.clippingPlanes.length){heldPlanes=renderer.clippingPlanes;renderer.clippingPlanes=NO_CLIP;}};
 scene.onAfterRender=renderer=>{if(heldPlanes){renderer.clippingPlanes=heldPlanes;heldPlanes=null;}};
 const roomSun=(intensity=.10)=>{const light=new THREE.DirectionalLight(0xfff4d2,intensity);light.position.copy(sun.position);return light;};
 const mats={},mat=(name,color,map)=>mats[name]=new THREE.MeshLambertMaterial({color,...(map?{map}:{})});
 mat('wall',0xd1ccae);mat('floor',0x777369,textures.ruin);mat('ceiling',0xd5d0bd);mat('wood',0x665140,textures.wood);mat('cloth',0x697366);mat('paint',0xafa887);mat('white',0xe7e5d3);mat('metal',0x767d79);mat('black',0x252c2b);
 for(const [i,c]of [0x9d483d,0x547a87,0xb89759,0x608061].entries())mat('toy'+i,c);
 for(const [i,c]of [0xe8e2ac,0xe7e5ce,0xdbddbd].entries())mat('house'+i,c);
 mat('roof',0x624a49);mat('window',0x476169);mat('grass',0x678b43);mat('path',0xc8c3a2);
 mats.light=new THREE.MeshBasicMaterial({color:0xf4edce});
 // Retain the loader-owned texture. Cloning before load loses the decoded image.
 mat('carpet',0xffffff,textures.roadCarpet);
 for(const [i,color]of [0x746953,0x675b54,0x616955].entries()){
  const m=mat('fittedCarpet'+i,color,textures.floor);m.userData.carpet=true;
  m.onBeforeCompile=shader=>{shader.vertexShader='varying vec2 carpetUV;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncarpetUV=uv;');shader.fragmentShader='varying vec2 carpetUV;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat weave=.9+.1*sin(carpetUV.x*155.)*sin(carpetUV.y*170.);float wear=.86+.14*sin(carpetUV.x*.8+sin(carpetUV.y*1.3));diffuseColor.rgb*=weave*wear;');};
 }
 mat('forestPainting',0xffffff,textures.apartmentPainting);
 mats.facade=new THREE.MeshBasicMaterial({color:0xffffff});mat('door',0xaaa58c);mats.ceilingLight=new THREE.MeshBasicMaterial({color:0xffffff});
 mats.void=new THREE.MeshBasicMaterial({color:0x000000,fog:false,toneMapped:false});
 for(const [key,value]of Object.entries(furnitureMaterials))mats['day_'+key]=value.clone();
 mats.radioOn=new THREE.MeshBasicMaterial({color:0xf0b65c});mats.radioOff=new THREE.MeshBasicMaterial({color:0x28271d});
 mat('tile',0xb5d5ce);
 mats.tile.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec2 tileUV;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntileUV=uv;');
  shader.fragmentShader='varying vec2 tileUV;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nvec2 cell=fract(tileUV);float grout=step(.025,cell.x)*step(.025,cell.y);diffuseColor.rgb*=mix(.61,1.0,grout);');
 };
 mats.water=new THREE.MeshPhongMaterial({color:0x3d929b,transparent:true,opacity:.52,depthWrite:false,shininess:80,side:THREE.DoubleSide});mats.water.userData.time={value:0};
 mats.water.onBeforeCompile=shader=>{shader.uniforms.poolTime=mats.water.userData.time;shader.vertexShader='varying vec3 poolPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npoolPosition=position;');shader.fragmentShader='uniform float poolTime;varying vec3 poolPosition;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat ripple=sin(poolPosition.x*2.7+poolTime*.5+sin(poolPosition.z*1.6-poolTime*.3));diffuseColor.rgb*=.92+.12*ripple;');};
 mat('blindPanel',0xcfc8a4);mat('darkHall',0x3a3727);mat('darkFloor',0x2b281c);
 for(const [name,color]of [['shadeWall',0xf4f0d8],['shadeFloor',0xfff6dc],['shadeCeil',0xffffff]])mats[name]=new THREE.MeshLambertMaterial({color,vertexColors:true,side:THREE.DoubleSide});
 for(const name of ['wall','floor','ceiling','darkHall','darkFloor','fittedCarpet0','fittedCarpet1','fittedCarpet2','shadeWall','shadeFloor','shadeCeil'])if(mats[name])noTile(mats[name],name);
 mat('towerBrick',0xb5b3a8);mat('towerHead',0xbab8ab);mat('towerWindow',0xffffff);mat('towerRim',0x63605a);
 let photoTiles=null;
 function ensurePhotos(){if(photoTiles||!textures.dreamPhoto?.image||!textures.corridorPhoto?.image)return photoTiles;
  photoTiles=window.NovaHousePhotos.get(THREE,textures);
  for(const [m,t]of [['wall','wallpaper'],['ceiling','ceiling'],['door','door'],['roof','roof'],['grass','grass'],['facade','facade'],['ceilingLight','ceilingLight'],['towerBrick','towerBrick'],['towerHead','towerHead'],['towerWindow','towerWindow']]){mats[m].map=photoTiles[t];mats[m].color.setHex(m==='wall'?0xf4f0d8:0xffffff);mats[m].needsUpdate=true;}
  for(let i=0;i<3;i++){mats['house'+i].map=photoTiles.siding;mats['house'+i].color.setHex(0xffffff);mats['house'+i].needsUpdate=true;}
  // v90: Backrooms carpet everywhere a plain floor was; fitted carpets keep slight tints.
  mats.floor.map=photoTiles.backroomCarpet;mats.floor.color.setHex(0xfff6dc);mats.floor.needsUpdate=true;
  for(const [i,c]of [0xf2e3bb,0xe8dcb6,0xf6ebc6].entries()){mats['fittedCarpet'+i].map=photoTiles.backroomCarpet;mats['fittedCarpet'+i].color.setHex(c);mats['fittedCarpet'+i].needsUpdate=true;}
  mats.darkHall.map=photoTiles.wallpaper;mats.darkHall.needsUpdate=true;mats.darkFloor.map=photoTiles.backroomCarpet;mats.darkFloor.needsUpdate=true;
  mats.blindPanel.map=photoTiles.wallpaper;mats.blindPanel.color.setHex(0xcfc8a4);mats.blindPanel.needsUpdate=true;
  for(const [m,t]of [['shadeWall','wallpaper'],['shadeFloor','backroomCarpet'],['shadeCeil','ceiling']]){mats[m].map=photoTiles[t];mats[m].needsUpdate=true;}
  return photoTiles;
 }
 const portals=[],portalRooms=[],adjacent=[],entrances=[],radioLamps=new Set();const entranceGroup=new THREE.Group();entranceGroup.name='Lit apartment entrances';outsideView?.scene.add(entranceGroup);const radioStates=new Map(),roomCache=new Map();let windowCount=0;
 function clearPortals(){adjacent.length=0;for(const p of portals)p.dispose();portals.length=0;for(const sc of portalRooms)disposePreview(sc);portalRooms.length=0;windowCount=0;}

 let active=false,mode='interior',rootSeed=0x504c4154,path=[],rootReturn=null,worldReturn=null,current=null,revision=0,roofSeed=0x44524541,walkedInside=0;
 const horizon=new THREE.Group();outside.add(horizon);
 const chunks=new Map(),data=new Map(),doorLinks=new Map();let roofReturn=null;
 function box(group,x,y,z,w,h,d,material,ry=0){
  const geo=unitBox(w,h,d);
  if(WORLD_UV.has(material)){
   // World-space UVs written straight into the array (same mapping as before).
   const v=geo.attributes.position.array,n=geo.attributes.normal.array,uv=geo.attributes.uv.array,ceiling=material==='ceiling',tile=material==='tile',carpet=carpetLike(material);
   const hs=ceiling?1.2:tile?.3:carpet?1.7:2,vs=tile?.3:2.1,ys=tile?.3:2.7;
   for(let i=0,j=0;i<v.length;i+=3,j+=2){const horizontal=Math.abs(n[i+1])>.5,along=Math.abs(n[i])>.5?v[i+2]+z:v[i]+x;
    uv[j]=horizontal?(v[i]+x)/hs:along/vs;uv[j+1]=horizontal?(v[i+2]+z)/hs:(v[i+1]+y)/ys;}
  }
  if(accum&&group===accum.group){
   // Inside roomMesh: write the piece straight into per-material buffers (no Object3D).
   const P=geo.attributes.position.array,N=geo.attributes.normal.array,c=Math.cos(ry),sn=Math.sin(ry);
   for(let i=0;i<P.length;i+=3){const px=P[i],pz=P[i+2],nx=N[i],nz=N[i+2];P[i]=x+px*c+pz*sn;P[i+1]+=y;P[i+2]=z-px*sn+pz*c;N[i]=nx*c+nz*sn;N[i+2]=-nx*sn+nz*c;}
   emit(material,P,N,geo.attributes.uv.array);geo.dispose();return {name:'',userData:{},rotation:{},position:{}};
  }
  const m=new THREE.Mesh(geo,mats[material]);m.position.set(x,y,z);m.rotation.y=ry;group.add(m);return m;}
 let accum=null;
 function emit(material,P,N,U){let b=accum.buckets.get(material);if(!b)accum.buckets.set(material,b={P:[],N:[],U:[],C:null,n:0});b.P.push(P);b.N.push(N);b.U.push(U);b.n+=P.length/3;
  if(mats[material]?.vertexColors){const C=new Float32Array(P.length);for(let i=0;i<P.length;i+=3)C[i]=C[i+1]=C[i+2]=accum.shade?accum.shade(P[i],P[i+1],P[i+2]):1;(b.C||(b.C=[])).push(C);}}
 function flushAccum(){
  const {group,buckets}=accum;accum=null;
  for(const [material,b]of buckets){const P=new Float32Array(b.n*3),N=new Float32Array(b.n*3),U=new Float32Array(b.n*2);let k=0;
   const C=b.C?new Float32Array(b.n*3):null;
   for(let i=0;i<b.P.length;i++){P.set(b.P[i],k*3);N.set(b.N[i],k*3);U.set(b.U[i],k*2);if(C)C.set(b.C[i],k*3);k+=b.P[i].length/3;}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));g.setAttribute('uv',new THREE.BufferAttribute(U,2));if(C)g.setAttribute('color',new THREE.BufferAttribute(C,3));group.add(new THREE.Mesh(g,mats[material]));}
 }
 // v90: room building is on the walking path. A unit box template (non-indexed) is
 // scaled per piece; merging below transforms rigid pieces without three.js overhead.
 let boxTemplate=null;
 function unitBox(w,h,d){
  if(!boxTemplate){const t=new THREE.BoxGeometry(1,1,1).toNonIndexed();boxTemplate={p:t.attributes.position.array,n:t.attributes.normal.array,u:t.attributes.uv.array};t.dispose();}
  const p=new Float32Array(boxTemplate.p.length);for(let i=0;i<p.length;i+=3){p[i]=boxTemplate.p[i]*w;p[i+1]=boxTemplate.p[i+1]*h;p[i+2]=boxTemplate.p[i+2]*d;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('normal',new THREE.BufferAttribute(boxTemplate.n.slice(),3));g.setAttribute('uv',new THREE.BufferAttribute(boxTemplate.u.slice(),2));return g;
 }
 const WORLD_UV=new Set(['floor','blindPanel','darkHall','darkFloor','wall','ceiling','house0','house1','house2','roof','tile','fittedCarpet0','fittedCarpet1','fittedCarpet2']);
 function carpetLike(m){return m==='floor'||m==='darkFloor'||m.startsWith('fittedCarpet');}
 // Arch pieces are built in the opening's local frame (u across, v up) and placed
 // on the wall plane. Wallpaper UVs follow the same 2.1 m x 2.7 m tiling as walls.
 const archCache=new Map();
 function archPiece(group,shape,depth,material,c,y,key){
  let base=key&&archCache.get(key);
  if(!base){const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:18});g.translate(0,0,-depth/2);const t=g.index?g.toNonIndexed():g;
   base={p:t.attributes.position.array.slice(),n:t.attributes.normal.array.slice()};g.dispose();if(key)archCache.set(key,base);}
  const a=Math.atan2(c.nx,c.nz),cs=Math.cos(a),sn=Math.sin(a),p=new Float32Array(base.p.length),n=new Float32Array(base.n.length),uv=new Float32Array(base.p.length/3*2),tx=c.nz,tz=-c.nx;
  for(let i=0,j=0;i<p.length;i+=3,j+=2){const lx=base.p[i],ly=base.p[i+1],lz=base.p[i+2],X=c.x+lx*cs+lz*sn,Y=y+ly,Z=c.z-lx*sn+lz*cs;p[i]=X;p[i+1]=Y;p[i+2]=Z;
   const nx=base.n[i],nz=base.n[i+2];n[i]=nx*cs+nz*sn;n[i+1]=base.n[i+1];n[i+2]=-nx*sn+nz*cs;uv[j]=(X*tx+Z*tz)/2.1;uv[j+1]=Y/2.7;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('normal',new THREE.BufferAttribute(n,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  return mesh(group,g,material);
 }
 // A real doorway: two plastered pillars with a curved head narrow the opening a little,
 // so the arch reads clearly even where the doorway is as wide as its corridor.
 function archedOpening(group,p,y,top){
  // v91: the plaster reaches the ceiling; no open gap above the curve.
  const W=p.width/2,w=W-.17,spring=1.95,crown=2.45,h=Math.max(2.5,top-y);
  const left=new THREE.Shape();left.moveTo(-W,0);left.lineTo(-w,0);left.lineTo(-w,spring);left.absellipse(0,spring,w,crown-spring,Math.PI,Math.PI/2,true);left.lineTo(0,h);left.lineTo(-W,h);left.lineTo(-W,0);
  const right=new THREE.Shape();right.moveTo(W,0);right.lineTo(W,h);right.lineTo(0,h);right.lineTo(0,crown);right.absellipse(0,spring,w,crown-spring,Math.PI/2,0,true);right.lineTo(w,0);right.lineTo(W,0);
  const key=':'+W.toFixed(3)+':'+h.toFixed(2);archPiece(group,left,.13,'wall',p,y,'L'+key);archPiece(group,right,.13,'wall',p,y,'R'+key);
 }
 // v91: a low arch opens onto a hall that grows ever darker, or onto a dark room. Its
 // surfaces carry per-vertex shade (exponential falloff with distance from the arch), so
 // there is no black wall right behind the opening. Nothing walkable exists beyond the
 // wall plane, so it can be seen but never entered.
 function shadePanel(material,o,A,B,na,nb,normal){
  const P=[],N=[],U=[],ceilingLike=normal[1]<-.5,floorLike=normal[1]>.5;
  const at=(i,j)=>[o[0]+A[0]*i/na+B[0]*j/nb,o[1]+A[1]*i/na+B[1]*j/nb,o[2]+A[2]*i/na+B[2]*j/nb];
  const uv=p=>floorLike?[p[0]/1.7,p[2]/1.7]:ceilingLike?[p[0]/1.2,p[2]/1.2]:[(Math.abs(normal[0])>.5?p[2]:p[0])/2.1,p[1]/2.7];
  for(let i=0;i<na;i++)for(let j=0;j<nb;j++)for(const [a,b]of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]]){const p=at(i+a,j+b),t=uv(p);P.push(...p);N.push(...normal);U.push(...t);}
  emit(material,new Float32Array(P),new Float32Array(N),new Float32Array(U));
 }
 function blindPassage(group,a,y,top){
  const W=a.width/2,w=W-.1,h=top-y,sp=a.spring,cr=a.crown;
  const left=new THREE.Shape();left.moveTo(-W,0);left.lineTo(-w,0);left.lineTo(-w,sp);left.absellipse(0,sp,w,cr-sp,Math.PI,Math.PI/2,true);left.lineTo(0,h);left.lineTo(-W,h);left.lineTo(-W,0);
  const right=new THREE.Shape();right.moveTo(W,0);right.lineTo(W,h);right.lineTo(0,h);right.lineTo(0,cr);right.absellipse(0,sp,w,cr-sp,Math.PI/2,0,true);right.lineTo(w,0);right.lineTo(W,0);
  const key=':low:'+W.toFixed(3)+':'+h.toFixed(2)+':'+sp.toFixed(3)+':'+cr.toFixed(3);archPiece(group,left,.13,'wall',a,y,'L'+key);archPiece(group,right,.13,'wall',a,y,'R'+key);
  const ox=-a.nx,oz=-a.nz,tx=a.nz,tz=-a.nx,D=a.depth,H=cr+.3,room=a.room;
  const L=(d,u,v)=>[a.x+ox*d+tx*u,y+v,a.z+oz*d+tz*u],V=(d,u,v)=>[ox*d+tx*u,v,oz*d+tz*u];
  const steps=len=>Math.max(1,Math.ceil(len/.45));
  accum.shade=(X,Y,Z)=>{const d=Math.max(0,(X-a.x)*ox+(Z-a.z)*oz-.1),u=(X-a.x)*tx+(Z-a.z)*tz;return .58*Math.exp(-d/(room?1.6:1.35))*(room?Math.exp(-Math.max(0,Math.abs(u)-w)/2.4):1)+.004;};
  const hall=(d0,d1,height)=>{const len=d1-d0,n=steps(len);
   const f0=d0<.1?-.07:d0;shadePanel('shadeFloor',L(f0,-w,0),V(d1-f0,0,0),V(0,2*w,0),n,1,[0,1,0]);
   shadePanel('shadeCeil',L(d0,-w,height),V(len,0,0),V(0,2*w,0),n,1,[0,-1,0]);
   for(const side of [-1,1])shadePanel('shadeWall',L(d0,side*w,0),V(len,0,0),V(0,0,height),n,1,[-side*tx,0,-side*tz]);};
  if(!room){
   hall(.065,D,H);shadePanel('shadeWall',L(D,-w,0),V(0,2*w,0),V(0,0,H),1,1,[a.nx,0,a.nz]);
  }else{
   const d0=.6,d1=.6+room.d,u0=room.off-room.w/2,u1=room.off+room.w/2,RH=2.35,nd=steps(room.d),nu=steps(room.w);
   hall(.065,d0,H);
   shadePanel('shadeFloor',L(d0,u0,0),V(room.d,0,0),V(0,room.w,0),nd,nu,[0,1,0]);
   shadePanel('shadeCeil',L(d0,u0,RH),V(room.d,0,0),V(0,room.w,0),nd,nu,[0,-1,0]);
   shadePanel('shadeWall',L(d1,u0,0),V(0,room.w,0),V(0,0,RH),nu,2,[a.nx,0,a.nz]);
   shadePanel('shadeWall',L(d0,u0,0),V(room.d,0,0),V(0,0,RH),nd,2,[tx,0,tz]);
   shadePanel('shadeWall',L(d0,u1,0),V(room.d,0,0),V(0,0,RH),nd,2,[-tx,0,-tz]);
   // The wall the hall comes through: both sides of the passage and the part above it.
   shadePanel('shadeWall',L(d0,u0,0),V(0,-w-u0,0),V(0,0,RH),steps(-w-u0),2,[-a.nx,0,-a.nz]);
   shadePanel('shadeWall',L(d0,w,0),V(0,u1-w,0),V(0,0,RH),steps(u1-w),2,[-a.nx,0,-a.nz]);
   shadePanel('shadeWall',L(d0,-w,H),V(0,2*w,0),V(0,0,RH-H),1,1,[-a.nx,0,-a.nz]);
   // A wardrobe and a bed frame, barely readable in the dark.
   const c=L(d1-.35,room.off+room.w*.18,.95);box(group,c[0],c[1],c[2],a.nx?.6:1.1,1.9,a.nx?1.1:.6,'shadeWall');
   const b=L(d0+room.d*.55,u0+.6,.25);box(group,b[0],b[1],b[2],a.nx?1.9:1,.5,a.nx?1:1.9,'shadeWall');
  }
  accum.shade=null;
 }
 function mesh(group,geo,material){
  if(accum&&group===accum.group&&mats[material]){let g=geo.index?geo.toNonIndexed():geo;if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!g.attributes.normal)g.computeVertexNormals();
   emit(material,g.attributes.position.array,g.attributes.normal.array,g.attributes.uv.array);return {name:'',userData:{},rotation:{},position:{}};}
  const m=new THREE.Mesh(geo,mats[material]);group.add(m);return m;}
 function clear(group){group.userData.encounterView?.dispose();delete group.userData.encounterView;const cached=roomCache.get(group.userData.roomCacheKey);if(cached)cached.refs--;delete group.userData.roomCacheKey;for(const o of [...group.children]){o.traverse(n=>{radioLamps.delete(n);if(!n.userData.sharedRoom&&!n.userData.keepGeometry)n.geometry?.dispose();if(n.isInstancedMesh)n.dispose?.();if(n.userData.ownMaterial)n.material.dispose();});group.remove(o);}}
 // Merge static pieces by material: streamed neighborhoods keep their draw count bounded.
 function batch(group){
  group.updateMatrixWorld(true);const buckets=new Map();
  // Gather pieces per material, then fill one typed array per attribute. Rigid pieces
  // (rotation + translation) are transformed inline; anything else uses three.js.
  for(const o of group.children){if(!o.isMesh)continue;let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry;
   const s=o.scale,rigid=Math.abs(s.x-1)+Math.abs(s.y-1)+Math.abs(s.z-1)<1e-6;if(!rigid){g=(g===o.geometry?g.clone():g).applyMatrix4(o.matrix);}
   const b=buckets.get(o.material)||{list:[],count:0};b.list.push({g,m:rigid?o.matrix:null,own:g!==o.geometry});b.count+=g.attributes.position.count;buckets.set(o.material,b);o.userData.ownMaterial=false;}
  const merged=[];
  for(const [material,b]of buckets){const P=new Float32Array(b.count*3),N=new Float32Array(b.count*3),U=new Float32Array(b.count*2),C=material.vertexColors?new Float32Array(b.count*3).fill(1):null;let k=0;
   for(const {g,m,own}of b.list){const p=g.attributes.position.array,n=g.attributes.normal.array,u=g.attributes.uv?.array,c=p.length/3;if(C&&g.attributes.color)C.set(g.attributes.color.array,k*3);
    if(m){const e=m.elements;for(let i=0;i<c;i++){const x=p[i*3],y=p[i*3+1],z=p[i*3+2],a=n[i*3],bb=n[i*3+1],cc=n[i*3+2],o3=(k+i)*3;
      P[o3]=e[0]*x+e[4]*y+e[8]*z+e[12];P[o3+1]=e[1]*x+e[5]*y+e[9]*z+e[13];P[o3+2]=e[2]*x+e[6]*y+e[10]*z+e[14];
      N[o3]=e[0]*a+e[4]*bb+e[8]*cc;N[o3+1]=e[1]*a+e[5]*bb+e[9]*cc;N[o3+2]=e[2]*a+e[6]*bb+e[10]*cc;}}
    else{P.set(p,k*3);N.set(n,k*3);}
    if(u)U.set(u,k*2);k+=c;if(own)g.dispose();}
   merged.push([material,P,N,U,C]);}
  clear(group);for(const [material,P,N,U,C]of merged){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));g.setAttribute('uv',new THREE.BufferAttribute(U,2));if(C)g.setAttribute('color',new THREE.BufferAttribute(C,3));g.computeBoundingBox();g.boundingSphere=g.boundingBox.getBoundingSphere(new THREE.Sphere());const mesh=new THREE.Mesh(g,material);mesh.userData.ownMaterial=!Object.values(mats).includes(material);group.add(mesh);}
 }
 // v91: rooms are built by a resumable generator. Called directly it runs to the end;
 // the prefetcher below runs it a few milliseconds per frame, ahead of the player.
 function roomMesh(s,group=inside,openPorts=s.ports.map(p=>p.id)){
  const key=s.seed+':'+openPorts.join(',');if(prefetch.job?.key===key)finishPrefetch();
  const saved=accum;try{const it=roomMeshSteps(s,group,openPorts);while(!it.next().done);}finally{accum=saved;}
 }
 function* roomMeshSteps(s,group,openPorts){
  clear(group);
  const cacheKey=s.seed+':'+openPorts.join(','),cached=roomCache.get(cacheKey);
  if(cached){for(const child of cached.group.children){const clone=child.clone(true);group.add(clone);clone.traverse(o=>{if(o.userData.radioId){radioLamps.add(o);setRadioLamp(o);}});}cached.refs++;group.userData.roomCacheKey=cacheKey;return;}
  // Clip only the final corridor rectangle at each opening. Collision continues
  // a little farther so walking can cross the exact shared portal plane.
  const renderRects=s.rects.map(r=>({...r}));
  for(const p of s.ports.filter(p=>openPorts.includes(p.id))){const r=[...renderRects].reverse().find(r=>contains(r,p.x+p.nx*.01,p.z+p.nz*.01));if(!r)continue;if(p.nx>0)r.x1=p.x;else if(p.nx<0)r.x0=p.x;else if(p.nz>0)r.z1=p.z;else r.z0=p.z;}
  const renderSpec={...s,rects:renderRects},archDone=new Set();
  const acc={group,buckets:new Map(),shade:null};accum=acc;let work=0;

  const xs=[...new Set([...renderRects.flatMap(r=>[r.x0,r.x1]),...s.cutsX,...s.windows.filter(w=>w.nz).flatMap(w=>[w.x-w.width/2,w.x+w.width/2])])].sort((a,b)=>a-b),zs=[...new Set([...renderRects.flatMap(r=>[r.z0,r.z1]),...s.cutsZ,...s.windows.filter(w=>w.nx).flatMap(w=>[w.z-w.width/2,w.z+w.width/2])])].sort((a,b)=>a-b);
  // v90: each rectangle walks only the grid lines inside it; a cell belongs to the first
  // rectangle containing its centre (as floorAt decides). Same cells, far fewer tests.
  const slabs=[];
  for(const owner of renderRects){const cx=xs.filter(v=>v>=owner.x0-1e-9&&v<=owner.x1+1e-9),cz=zs.filter(v=>v>=owner.z0-1e-9&&v<=owner.z1+1e-9);
  for(let i=0;i<cx.length-1;i++)for(let j=0;j<cz.length-1;j++){
   if(++work%28===0){yield;accum=acc;}
   const x=(cx[i]+cx[i+1])/2,z=(cz[j]+cz[j+1])/2,w=cx[i+1]-cx[i],d=cz[j+1]-cz[j];if(w<1e-6||d<1e-6||renderRects.find(r=>contains(r,x,z))!==owner)continue;const y=floorAt(renderSpec,x,z);if(y===null)continue;
   const top=ceilingAt(renderSpec,x,z),poolRoom=s.rooms.find(r=>r.kind==='pool'&&contains(r,x,z));
   const carpetRoom=s.rooms.find(r=>r.carpet&&contains(r,x,z)),mainCarpet=s.carpetMain&&Math.abs(x)<=s.rx&&Math.abs(z)<=s.rz;
   slabs.push([x-w/2,x+w/2,z-d/2,z+d/2,y-.08,poolRoom?'tile':carpetRoom||mainCarpet?'fittedCarpet'+s.theme%3:'floor'],[x-w/2,x+w/2,z-d/2,z+d/2,top+.08,'ceiling']);
   for(const [nx,nz,l]of [[1,0,d],[-1,0,d],[0,1,w],[0,-1,w]]){
    const ex=x+nx*w/2,ez=z+nz*d/2,neighbor=floorAt(renderSpec,ex+nx*.0001,ez+nz*.0001);
    if(neighbor===null){
     const aperture=s.ports.find(p=>openPorts.includes(p.id)&&Math.abs((ex-p.x)*p.nx+(ez-p.z)*p.nz)<.001&&Math.abs((ex-p.x)*p.nz-(ez-p.z)*p.nx)<HALF+.01);
     if(aperture){const curved=arched(s,aperture);if(!curved&&top-y>2.5)box(group,ex,(top+y+2.5)/2,ez,nx?.13:l,top-y-2.5,nz?.13:l,'wall');if(!archDone.has(aperture.id)&&curved){archDone.add(aperture.id);archedOpening(group,aperture,floorAt(renderSpec,aperture.x-aperture.nx*.05,aperture.z-aperture.nz*.05)??y,top);}continue;}
     const low=(s.blindArches||[]).find(b=>b.nx===-nx&&b.nz===-nz&&Math.abs((ex-b.x)*nx+(ez-b.z)*nz)<.001&&Math.abs((ex-b.x)*nz-(ez-b.z)*nx)<b.width/2-.001);
     if(low){const k='low:'+low.x+':'+low.z;if(!archDone.has(k)){archDone.add(k);blindPassage(group,low,floorAt(renderSpec,low.x+low.nx*.3,low.z+low.nz*.3)??y,top);}continue;}
     const win=s.windows.find(p=>Math.abs((ex-p.x)*p.nx+(ez-p.z)*p.nz)<.001&&Math.abs((ex-p.x)*p.nz-(ez-p.z)*p.nx)<p.width/2+.001);
     if(win){box(group,ex,y+win.bottom/2,ez,nx?.13:l,win.bottom,nz?.13:l,'wall');box(group,ex,y+(s.height+win.top)/2,ez,nx?.13:l,s.height-win.top,nz?.13:l,'wall');}
     else box(group,ex,(top+y)/2,ez,nx?.13:l,top-y,nz?.13:l,poolRoom?'tile':'wall');
    }
    else{if(y>neighbor+.001)box(group,ex,(y+neighbor)/2,ez,nx?.015:l,y-neighbor,nz?.015:l,poolRoom?'tile':y-neighbor>.4?'wall':'floor');const otherTop=ceilingAt(renderSpec,ex+nx*.0001,ez+nz*.0001);if(top>otherTop+.001)box(group,ex,(top+otherTop)/2,ez,nx?.13:l,top-otherTop,nz?.13:l,poolRoom?'tile':'wall');}
   }
  }
  }
  yield;accum=acc;
  // Floor and ceiling cells of equal height and material merge into strips along x
  // (world-space UVs keep every texture where it was), then along z.
  {const key=c=>c[2]+'|'+c[3]+'|'+c[4].toFixed(4)+'|'+c[5],rows=new Map();
   for(const c of slabs){const k=key(c);if(!rows.has(k))rows.set(k,[]);rows.get(k).push(c);}
   const strips=[];for(const list of rows.values()){list.sort((a,b)=>a[0]-b[0]);let cur=null;for(const c of list){if(cur&&Math.abs(cur[1]-c[0])<1e-6)cur[1]=c[1];else{cur=[...c];strips.push(cur);}}}
   const cols=new Map();for(const c of strips){const k=c[0]+'|'+c[1]+'|'+c[4].toFixed(4)+'|'+c[5];if(!cols.has(k))cols.set(k,[]);cols.get(k).push(c);}
   for(const list of cols.values()){list.sort((a,b)=>a[2]-b[2]);let cur=null;const out=[];for(const c of list){if(cur&&Math.abs(cur[3]-c[2])<1e-6)cur[3]=c[3];else{cur=[...c];out.push(cur);}}
    for(const [x0,x1,z0,z1,yy,m]of out)box(group,(x0+x1)/2,yy,(z0+z1)/2,x1-x0,.16,z1-z0,m);}}
  yield;accum=acc;
  for(const f of s.furniture){if(f.hidden)continue;if(f.template){const g=window.NovaSettlements.pieceGeometry(THREE,f);g.rotateX(f.rx||0);g.rotateY(f.ry||0);g.translate(f.x,f.y,f.z);mesh(group,g,f.material);}else box(group,f.x,f.y,f.z,f.w,f.h,f.d,f.material);}
  if(s.type==='apartment'){
   for(const x of [-s.rx*.55,s.rx*.55]){box(group,x,s.height-.055,0,1.9,.055,.14,'metal');box(group,x,s.height-.09,0,1.7,.035,.095,'light');}
   if(s.theme===4&&s.path.length){const carpet=box(group,0,.018,0,Math.min(8,s.rx*1.55),.02,Math.min(8,s.rz*1.55),'carpet');carpet.name='Original road play carpet';}
   for(const win of s.windows){const tx=win.nz,tz=-win.nx,c=(win.bottom+win.top)/2;
    for(const y of [win.bottom,win.top])box(group,win.x-win.nx*.09,y,win.z-win.nz*.09,win.nx?.2:win.width+.15,.08,win.nz?.2:win.width+.15,'white');
    box(group,win.x-win.nx*.09,c,win.z-win.nz*.09,win.nx?.17:.055,win.top-win.bottom,win.nz?.17:.055,'white');
   }
  }else{
   for(const r of s.rects){const x=(r.x0+r.x1)/2,z=(r.z0+r.z1)/2,y=heightIn(r,x,z);box(group,x,y+s.height-.075,z,.13,.06,1.2,'light');}
  }
  // Ceiling panels and the fluorescent fixture photographed in the second reference.
  for(const r of s.rects){const alongX=r.x1-r.x0>r.z1-r.z0,length=alongX?r.x1-r.x0:r.z1-r.z0,count=Math.max(1,Math.floor(length/4.8));
   for(let i=0;i<count;i++){const x=alongX?r.x0+(i+.5)*(r.x1-r.x0)/count:(r.x0+r.x1)/2,z=alongX?(r.z0+r.z1)/2:r.z0+(i+.5)*(r.z1-r.z0)/count,y=ceilingAt(s,x,z);
    box(group,x,y-.09,z,alongX?1.7:.7,.04,alongX?.7:1.7,'ceilingLight');}
  }
  for(const room of s.rooms){
   // v91: about a third of the room entrances are round arches (both ends of the short
   // passage); the rest are plain openings with a plastered lintel.
   const door=room.door,doorTop=s.height,curved=hash('room-door-v91:'+room.id,s.seed)%100<30;
   for(const z of [door.z,door.hallZ??door.z])if(curved)archedOpening(group,{x:door.x,z,nx:0,nz:1,width:door.width},0,doorTop);else if(doorTop>2.3)box(group,door.x,(2.3+doorTop)/2,z,door.width,doorTop-2.3,.13,'wall');
   if(room.kind==='playroom'){
    const cx=(room.x0+room.x1)/2,cz=(room.z0+room.z1)/2;box(group,cx,.018,cz,Math.min(8,room.x1-room.x0-3),.02,Math.min(8,room.z1-room.z0-3),'carpet');
   }
  }
  for(const pool of s.pools){
   const x=(pool.x0+pool.x1)/2,z=(pool.z0+pool.z1)/2,w=pool.x1-pool.x0,d=pool.z1-pool.z0;
   const g=new THREE.PlaneGeometry(w,d,1,1);g.rotateX(-Math.PI/2);g.translate(x,-.12,z);mesh(group,g,'water');
   for(const side of [-1,1])box(group,x+side*(w/2+.12),.015,z,.24,.07,d+.48,'white');box(group,x,.015,pool.z1+.12,w,.07,.24,'white');
  }
  for(const p of s.paintings||[]){
   const g=new THREE.PlaneGeometry(p.w,p.h);
   g.rotateY(p.yaw);g.translate(p.x,p.y,p.z);mesh(group,g,'forestPainting');
   const nx=Math.sin(p.yaw),nz=Math.cos(p.yaw),tx=Math.cos(p.yaw),tz=-Math.sin(p.yaw);
   box(group,p.x-nx*.025,p.y,p.z-nz*.025,p.w+.09,p.h+.09,.035,'wood',p.yaw);
   for(const side of [-1,1]){
    box(group,p.x+tx*side*(p.w/2+.025),p.y,p.z+tz*side*(p.w/2+.025),.05,p.h+.1,.045,'wood',p.yaw);
    box(group,p.x,p.y+side*(p.h/2+.025),p.z,p.w,.05,.045,'wood',p.yaw);
   }
  }
  yield;accum=acc;
  flushAccum();yield;batch(group);yield;
  // Local-coordinate instances anchor breathing at each root. They must never
  // pass through the architectural batching step above.
  for(const id of new Set((s.gardens||[]).map(p=>p.id))){
   const model=floraModels?.get(id);if(!model)continue;
   const records=s.gardens.filter(p=>p.id===id),bounds=new THREE.Box3();
   for(const part of model.parts){part.geometry.computeBoundingBox();bounds.union(part.geometry.boundingBox);}
   const dummy=new THREE.Object3D(),modelHeight=Math.max(.01,bounds.max.y);
   for(const part of model.parts){
    // v102: the plant model's own geometry (it is on the GPU already, from the forest), not a
    // copy per room; keepGeometry keeps the room cache from disposing it.
    const plant=new THREE.InstancedMesh(part.geometry,part.material,records.length);plant.name='Flora: '+id;plant.userData.indoorGarden=true;plant.userData.keepGeometry=true;plant.frustumCulled=false;
    for(const [i,p]of records.entries()){dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.yaw,0);dummy.scale.setScalar(p.height/modelHeight);dummy.updateMatrix();plant.setMatrixAt(i,dummy.matrix);}
    plant.instanceMatrix.needsUpdate=true;group.add(plant);
   }
  }
  if(poolProps)for(const p of s.poolProps||[]){
   const prop=poolProps.createObject(p.kind,p.seed,{shared:true});prop.position.set(p.x,p.y-(prop.userData.poolProp?.floatDepth||0),p.z);prop.rotation.y=p.yaw;group.add(prop);
  }
  toys?.addTo(group,s.toys||[],{shared:true});
  const lamps=new THREE.Group();lamps.name='Night radio indicators';group.add(lamps);
  for(const r of s.radios){const lamp=box(lamps,r.x-r.end*.34,r.y+.092,r.z+r.end*.195,.038,.028,.018,'radioOff');lamp.userData.radioId=r.id;radioLamps.add(lamp);setRadioLamp(lamp);}
  group.traverse(o=>{if(o.geometry)o.userData.sharedRoom=true;});roomCache.set(cacheKey,{group:group.clone(true),refs:1});group.userData.roomCacheKey=cacheKey;fresh.push(cacheKey);
  for(const [key,entry]of roomCache){if(roomCache.size<=CACHE_ROOMS)break;if(entry.refs>0)continue;disposeRoom(entry.group);roomCache.delete(key);}
 }
 // v102: plants, toys and pool things share one geometry between all rooms (keepGeometry);
 // only what was built for this room is freed.
 function disposeRoom(group){group.traverse(o=>{if(!o.userData.keepGeometry)o.geometry?.dispose();if(o.isInstancedMesh)o.dispose?.();});}
 // ---------------------------------------------------------------- v91 prefetch
 // Rooms around the player (and around a lit entrance being approached) are built into
 // the room cache a few milliseconds per frame, nearest first, so crossing a doorway
 // only clones finished geometry.
 const prefetch={queue:[],job:null,houses:new Set(),keys:new Set()};let loadingUntil=0;
 const nowMs=()=>typeof performance!=='undefined'?performance.now():Date.now();
 function loading(){return active&&mode==='interior'&&nowMs()<loadingUntil;}
 // depth: how many doorways from the player (v102, for urgency()).
 function want(s,depth=RING){const key=s.seed+':'+s.ports.map(p=>p.id).join(',');
  if(prefetch.job?.key===key){prefetch.job.depth=Math.min(prefetch.job.depth,depth);return;}
  if(roomCache.has(key)||prefetch.keys.has(key))return;prefetch.keys.add(key);prefetch.queue.push({key,s,depth});}
 function around(seed,p){const s=spec(seed,p,toys?.seed||0),out=[];
  for(const q of s.ports){if(q.id==='f'||(q.id==='u'&&s.steps>=s.roofAt))continue;if(q.id==='back'){if(p.length)out.push({port:q,path:p.slice(0,-1)});}else out.push({port:q,path:[...p,q.id]});}
  return{s,out};}
 // v97: every room within RING doorways, nearest first (breadth-first through the graph).
 const RING=3,NEAR=2,CACHE_ROOMS=80;
 function ring(seed,p,depth){
  const seen=new Set([p.join('/')]),out=[],queue=[{path:p,d:0}];
  for(let i=0;i<queue.length;i++){const {path:q,d}=queue[i],a=around(seed,q);out.push({s:a.s,d});if(d>=depth)continue;
   for(const n of a.out){const k=n.path.join('/');if(seen.has(k))continue;seen.add(k);queue.push({path:n.path,d:d+1});}}
  return out;
 }
 function ringSpecs(seed,p,depth){return ring(seed,p,depth).map(e=>e.s);}
 function queueAround(seed,p){
  // Fresh priorities for the new position: this room, its neighbours, theirs, and one more ring.
  prefetch.queue.length=0;prefetch.keys.clear();if(prefetch.job)prefetch.job.depth=RING+1;const rooms=ring(seed,p,RING);
  // v102: cached rooms that are still wanted move to the young end of the cache, the nearest
  // last. The cache used to throw out its oldest room, even the one next door.
  for(let i=rooms.length-1;i>=0;i--){const key=roomKey(rooms[i].s),cached=roomCache.get(key);if(cached){roomCache.delete(key);roomCache.set(key,cached);}}
  for(const {s,d}of rooms)want(s,d);
 }
 // v97: the backrooms load as a level. On entering, a loading screen stays up until every
 // room within RING doorways is built, uploaded to the GPU and every opening's preview
 // exists; then nothing is built in a frame the player sees except, in the background,
 // rooms further away.
 // v102: only on entering. Inside, the background builder works harder the nearer the
 // missing room is (urgency()); a doorway whose room is not ready shows haze for a moment.
 const fresh=[],level={active:false,total:1,settle:0};
 let uploadKit=null;
 // Draws a new room once, 4×4 pixels, so its geometry is on the GPU before it is seen.
 // v102: with the lights, fog and clipping of a real view, so this never compiles a shader
 // that the game does not use (it used to compile every material a second time, 0.3 s each).
 function kit(){
  if(!uploadKit){const target=new THREE.WebGLRenderTarget(4,4),cam=new THREE.OrthographicCamera(-160,160,160,-160,-400,400),sc=new THREE.Scene();target.texture.encoding=THREE.sRGBEncoding;
   sc.name='Backroom GPU upload';cam.position.set(0,120,0);cam.lookAt(0,0,0);cam.updateMatrixWorld(true);sc.fog=new THREE.FogExp2(0x858577,.012);sc.add(new THREE.HemisphereLight(0xe7e9dd,0x565d41,.95),roomSun());uploadKit={target,cam,sc,pixel:new Uint8Array(4)};}
  return uploadKit;
 }
 function upload(renderer,key){
  const entry=roomCache.get(key);if(!entry||!renderer)return;
  const {target,cam,sc}=kit(),previous=renderer.getRenderTarget(),planes=renderer.clippingPlanes;sc.add(entry.group);
  try{renderer.clippingPlanes=NO_CLIP;renderer.setRenderTarget(target);renderer.render(sc,cam);}finally{sc.remove(entry.group);renderer.setRenderTarget(previous);renderer.clippingPlanes=planes;}
 }
 // How many doorways away the nearest room still to be built is (RING+1: none nearby).
 function urgency(){let d=prefetch.job?prefetch.job.depth:RING+1;for(const q of prefetch.queue)if(q.depth<d)d=q.depth;return d;}
 function remaining(){return prefetch.queue.length+(prefetch.job?1:0)+fresh.length;}
 function beginLevel(){level.active=true;level.settle=0;level.total=Math.max(1,remaining());}
 function levelStep(renderer){
  pumpPrefetch(30);level.total=Math.max(level.total,remaining());
  if(prefetch.queue.length||prefetch.job)return;
  for(let n=0;n<4&&fresh.length;n++)upload(renderer,fresh.shift());
  if(fresh.length)return;
  for(const p of portals)if(p.prepare())return;
  // A few complete frames with every preview drawn (render targets allocated) before play.
  // v102: each of them waits for the GPU (reading one pixel back does that). The screen used
  // to clear while the GPU was still working through the uploads: a stall of up to a second
  // in the first moment of play.
  renderer?.getContext?.()?.finish();if(renderer?.readRenderTargetPixels){const {target,pixel}=kit();renderer.readRenderTargetPixels(target,0,0,1,1,pixel);}
  if(++level.settle>=3)level.active=false;
 }
 function nearMissing(){return ringSpecs(rootSeed,path,NEAR).some(s=>!roomReady(s));}
 function roomKey(s){return s.seed+':'+s.ports.map(p=>p.id).join(',');}
 function roomReady(s){return roomCache.has(roomKey(s));}
 // A preview that wants an unbuilt room moves it to the front of the queue (and shows haze
 // for those few frames) instead of building it on the spot.
 function hurry(s){const key=roomKey(s);if(prefetch.job?.key===key||roomCache.has(key))return;const i=prefetch.queue.findIndex(q=>q.key===key);
  if(i>=0){const [q]=prefetch.queue.splice(i,1);q.depth=1;prefetch.queue.unshift(q);}else{prefetch.keys.add(key);prefetch.queue.unshift({key,s,depth:1});}}
 function finishPrefetch(){const job=prefetch.job;if(!job)return;prefetch.job=null;const saved=accum;try{accum=job.acc;while(!job.it.next().done);}finally{accum=saved;}clear(job.group);}
 function pumpPrefetch(ms){
  const t0=nowMs(),saved=accum;
  try{
   while(nowMs()-t0<ms){
    if(!prefetch.job){const next=prefetch.queue.shift();if(!next)break;prefetch.keys.delete(next.key);if(roomCache.has(next.key))continue;
     const group=new THREE.Group();prefetch.job={...next,group,it:roomMeshSteps(next.s,group,next.s.ports.map(p=>p.id)),acc:null};}
    const job=prefetch.job;accum=job.acc;const step=job.it.next();job.acc=accum;
    if(step.done){prefetch.job=null;clear(job.group);}
   }
  }finally{accum=saved;}
 }
 // Compile every apartment material for the lighting the game really uses (plain room,
 // room with the torch, portal previews) while the loading screen is still up.
 function warmup(queue,eye,torch,patch){
  ensurePhotos();ensureEffects();
  const seed=hash(settlements.cores[0]?.x??0,0x504c4154),s=spec(seed,[],toys?.seed||0),sample=new THREE.Group(),all=new THREE.Group();
  roomMesh(s,sample);const tiny=new THREE.BoxGeometry(.01,.01,.01);
  for(const m of Object.values(mats))if(m&&m.isMaterial){const o=new THREE.Mesh(tiny,m);o.position.set(0,1,0);all.add(o);}
  // v102: one of everything else a room can hold. Their shaders were compiled the moment
  // they first came into view (plants, toys, pool things, Karin, the Vermesser), each a
  // freeze of 0.3–2.5 s on a weak GPU.
  const identity=new THREE.Matrix4();
  for(const id of ['vaccinium-myrtillus','betula-pendula','sorbus-aucuparia'])for(const part of floraModels?.get(id)?.parts||[]){
   const plant=new THREE.InstancedMesh(part.geometry,part.material,1);plant.name='Flora: '+id;plant.setMatrixAt(0,identity);plant.frustumCulled=false;all.add(plant);}
  if(poolProps)for(const kind of Object.keys(poolProps.files||{}))all.add(poolProps.createObject(kind,1));
  if(toys)toys.addTo(all,(window.NovaApartmentToys?.definitions||[]).map((d,i)=>({kind:d.kind,x:i*.6,y:0,z:1,yaw:0,seed:1,room:'main'})));
  for(const figure of encounters?.samples?.()||[])all.add(figure);
  sample.add(all);scene.add(sample);
  // The mushroom effect (psilocybin.js) patches every material of a world the first time it
  // draws it, which changes the material's program: do that now, or the programs compiled
  // here are thrown away in the first frame of play.
  patch?.(sample);
  const was={inside:inside.visible,outside:outside.visible,field:field.visible,fog:scene.fog,ambient:ambient.intensity,sun:sun.intensity};
  // The lights, fog and clipping of the game itself (rebuild(), scene.onBeforeRender). v91
  // compiled without fog and without the clipping plane of the doorway views, so none of
  // its programs matched and everything was compiled again in play.
  queue.draw(()=>{inside.visible=outside.visible=field.visible=false;scene.fog=new THREE.FogExp2(0x858577,.012);ambient.intensity=.95;sun.intensity=.10;});
  queue.visit(scene,eye,[sample],{compile:false});
  if(torch)queue.draw(()=>{torch.userData.warmParent=torch.parent;torch.userData.warmIntensity=torch.intensity;torch.userData.warmVisible=torch.visible;scene.add(torch);scene.add(torch.target);torch.intensity=3.4;torch.visible=true;});
  if(torch)queue.visit(scene,eye,[sample],{compile:false});
  if(torch)queue.draw(()=>{scene.remove(torch);scene.remove(torch.target);torch.userData.warmParent?.add(torch);torch.userData.warmParent?.add(torch.target);torch.intensity=torch.userData.warmIntensity;torch.visible=torch.userData.warmVisible;});
  // Doorway views, the courtyard and the GPU upload use the same programs now: no pass of their
  // own. The forest through the house door or a window needs none either: those views use an
  // oblique near plane instead of a clipping plane (house-portals.js) and the world's programs.
  queue.draw(()=>{scene.remove(sample);sample.remove(all);clear(sample);tiny.dispose();Object.assign(inside,{visible:was.inside});outside.visible=was.outside;field.visible=was.field;scene.fog=was.fog;ambient.intensity=was.ambient;sun.intensity=was.sun;});
 }
 let sharedCourtyard=null;
 function courtyard(){
  const sc=new THREE.Scene(),g=new THREE.Group();sc.add(g);sc.background=new THREE.Color(0x17242c);sc.fog=new THREE.FogExp2(0x263238,.035);sc.add(new THREE.HemisphereLight(0xc6d1d2,0x424436,.65),roomSun(0)/* v102: dark, only so the shaders are the rooms' */);
  box(g,0,-1.1,-7,18,.3,18,'floor');
  for(const side of [-1,1])box(g,side*8,6,-7,.35,18,18,'wall');box(g,0,6,-16,16,18,.35,'wall');
  // v92: no wood any more (window frames, planters, posts); plain windows in plaster.
  for(let level=-1;level<4;level++)for(const x of [-5,-1.7,1.7,5]){
   box(g,x,level*3.2+1.5,-15.79,1.5,1.5,.05,(level+Math.round(x))%4===0?'light':'window');box(g,x,level*3.2+1.5,-15.75,.065,1.5,.06,'white');
   for(const side of [-1,1])box(g,side*7.79,level*3.2+1.5,x-7,.05,1.5,1.5,'window');
  }
  box(g,5,5,-15.6,.15,18,.15,'metal');batch(g);return sc;
 }
 // Each preview carries the next set of views as well. Previously these
 // openings were just holes revealing the scene's flat gray background.
 function disposePreview(sc){sc.userData.disposePortalViews?.();for(const g of sc.children)if(g.isGroup)clear(g);}
 function interiorPortal(group,from,to,destination,s,entry,options={}){
  return window.NovaHousePortals.create(THREE,group,from,to,destination,{...options,isVisible:camera=>openingVisible(s,from,options.width||HALF*2,camera.position,entry)});
 }
 function windowView(group,w,s,owned,seed,entry){
  const from={...w,y:w.bottom},to={x:0,z:0,y:w.bottom,nx:0,nz:1};let sc;
  if(w.id==='forest'&&outsideView&&worldReturn){sc=outsideView.scene;Object.assign(to,{x:worldReturn.x-5,z:settlements.housing.z-10.25,y:settlements.housing.y+(s.steps%3)*3.2+w.bottom});}
  // v90: every courtyard looks the same; one shared scene serves all windows.
  else sc=()=>sharedCourtyard||(sharedCourtyard=courtyard());
  const world=sc===outsideView?.scene;
  return interiorPortal(group,from,to,sc,s,entry,{height:w.top-w.bottom,width:w.width,smooth:!world,oblique:world,beforeRender:world?()=>outsideView.beforeRender?.():undefined,afterRender:world?()=>outsideView.afterRender?.():undefined});
 }
 function roofDoor(){const h=rootReturn?.type==='roof'?rootReturn.house:getChunk(0,0).houses[0];return{x:h.x,z:h.z+h.d/2-2.85,y:h.y,nx:0,nz:-1};}
 function roofView(group,from,s,entry){
  const to=roofDoor();stream(to.x,to.z);let saved;
  return interiorPortal(group,from,to,scene,s,entry,{beforeRender(){saved={inside:inside.visible,outside:outside.visible,background:scene.background,fog:scene.fog,ambient:ambient.intensity,sun:sun.intensity};inside.visible=false;outside.visible=true;scene.background=new THREE.Color(ROOF_SKY);scene.fog=new THREE.FogExp2(ROOF_SKY,.0038);ambient.intensity=.82;sun.intensity=.4;},afterRender(){inside.visible=saved.inside;outside.visible=saved.outside;scene.background=saved.background;scene.fog=saved.fog;ambient.intensity=saved.ambient;sun.intensity=saved.sun;}});
 }
 function roomScene(s,entry,track=true,depth=0,seed=rootSeed){
  const sc=new THREE.Scene(),g=new THREE.Group(),views=[],owned=[];sc.add(g);sc.background=new THREE.Color(0x393a2c);sc.fog=new THREE.FogExp2(0x858577,.012);sc.add(new THREE.HemisphereLight(0xe7e9dd,0x565d41,.95),roomSun());
  // Two connected rooms are visible ahead. At the distant bound only the
  // incoming opening is cut; the other halls retain their textured end walls.
  // This bounds the graph without ever exposing an unrendered void.
  roomMesh(s,g);
  // v91: farther previews share the full cached room; their onward openings get a plain cap.
  if(depth>=1)for(const p of s.ports){if(p.id===entry)continue;const y=floorAt(s,p.x-p.nx*.1,p.z-p.nz*.1)??p.y,top=ceilingAt(s,p.x-p.nx*.1,p.z-p.nz*.1)??y+s.height;const cap=box(g,p.x+p.nx*.07,(y+top)/2,p.z+p.nz*.07,p.nx?.1:HALF*2+.3,top-y,p.nz?.1:HALF*2+.3,'wall');cap.name='Closed onward opening';}
  if(encounters)g.userData.encounterView=encounters.mount(s,g);
  const incoming=s.ports.find(p=>p.id===entry);
  for(const w of s.windows)views.push(windowView(g,w,s,owned,seed,incoming));
  if(depth<1)for(const p of s.ports){
    if(p.id===entry)continue;
    if(p.id==='u'&&s.steps>=s.roofAt){views.push(roofView(g,p,s,incoming));continue;}
    if(p.id==='f'){views.push(fieldView(g,p,s,incoming));continue;}
    let nextPath,nextEntry;
    if(p.id==='back'){if(!s.path.length){if(rootReturn?.type==='roof')views.push(roofView(g,p,s,incoming));else if(outsideView&&worldReturn)views.push(interiorPortal(g,p,worldDestination(),outsideView.scene,s,incoming,{oblique:true,beforeRender:()=>outsideView.beforeRender?.(),afterRender:()=>outsideView.afterRender?.()}));continue;}nextPath=s.path.slice(0,-1);nextEntry=s.path.at(-1);}else{nextPath=[...s.path,p.id];nextEntry='back';}
    const ns=spec(seed,nextPath,toys?.seed||0),np=ns.ports.find(v=>v.id===nextEntry);
    views.push(interiorPortal(g,p,np,()=>{const next=roomScene(ns,nextEntry,false,depth+1,seed);owned.push(next);return next;},s,incoming,{cheap:()=>roomReady(ns),urgent:()=>hurry(ns)}));
   }
  sc.userData.renderPortalViews=(renderer,camera,rect)=>{
   g.userData.encounterView?.sync();
   for(const view of views)view.render(renderer,camera,rect);
  };
  sc.userData.prepareViews=()=>{for(const view of views)if(view.prepare?.())return true;return false;};
  sc.userData.disposePortalViews=()=>{for(const view of views)view.dispose();for(const child of owned)disposePreview(child);views.length=owned.length=0;};
  if(track)portalRooms.push(sc);return sc;
 }
 function worldDestination(){return{x:worldReturn.x,z:worldReturn.z+1.4,y:worldReturn.walkY,nx:0,nz:1};}
 // entering: the player arrives from outside (world, roof, field, debug jump). Only then may
 // the loading screen come up (v102); a doorway inside the backrooms never shows one.
 function rebuild(entering=false){
  encounters?.close();ensurePhotos();clearPortals();current=spec(rootSeed,path,toys?.seed||0);revision++;roomMesh(current);
  if(encounters)inside.userData.encounterView=encounters.mount(current,inside);
  for(const p of current.ports){
   let nextPath,entry;
   if(p.id==='back'){
    if(!path.length){if(rootReturn?.type==='roof')portals.push(roofView(inside,p,current));else if(rootReturn?.type==='world'&&outsideView)portals.push(interiorPortal(inside,p,worldDestination(),outsideView.scene,current,null,{oblique:true,beforeRender:()=>outsideView.beforeRender?.(),afterRender:()=>outsideView.afterRender?.()}));continue;}
    nextPath=path.slice(0,-1);entry=path.at(-1);
   }else{if(p.id==='u'&&current.steps>=current.roofAt){portals.push(roofView(inside,p,current));continue;}if(p.id==='f'){portals.push(fieldView(inside,p,current));continue;}nextPath=[...path,p.id];entry='back';}
   const ns=spec(rootSeed,nextPath,toys?.seed||0),np=ns.ports.find(v=>v.id===entry);
   // v102: smooth (multisampled, full width) like the courtyard windows since v92. The view into
   // the next room was drawn at 900 pixels without anti-aliasing and stretched: the Vermesser,
   // all thin limbs, is mostly seen through a doorway and came out jagged.
   portals.push(interiorPortal(inside,p,np,()=>roomScene(ns,entry),current,undefined,{smooth:1280/* v102: a width cap; four samples at 1600 would be 50 MB per doorway */,cheap:()=>roomReady(ns),urgent:()=>hurry(ns)}));adjacent.push({from:p,to:np,spec:ns});
  }
  for(const w of current.windows){portals.push(windowView(inside,w,current,portalRooms,rootSeed));windowCount++;}
  queueAround(rootSeed,path);if(entering&&nearMissing())beginLevel();
  inside.visible=true;outside.visible=false;field.visible=false;scene.background=new THREE.Color(0x6b706c);scene.fog=new THREE.FogExp2(0x858577,.012);ambient.intensity=.95;sun.intensity=.10;
 }
 function graph(){return{seed:rootSeed,path:[...path],rootReturn:rootReturn?structuredCopy(rootReturn):null};}
 function structuredCopy(o){return JSON.parse(JSON.stringify(o));}
 function placeAt(p,port){p.x=port.x-port.nx*.65;p.z=port.z-port.nz*.65;p.walkY=port.y;p.yaw=Math.atan2(port.nx,port.nz);p.pitch=0;}
 function enter(player,saved,seed=0x504c4154){
  worldReturn={...saved};rootReturn={type:'world',player:{...saved}};rootSeed=seed;path=[];doorLinks.clear();active=true;mode='interior';loadingUntil=nowMs()+700;rebuild(true);placeAt(player,current.ports[0]);return true;
 }
 function enterFromWorld(player,before,night){
  if(active||!night)return false;
  for(const core of settlements.cores){const z=core.z-10.4;
   if(before.z<=z&&player.z>z&&Math.abs(player.x-core.x)<1.19&&Math.abs(player.walkY-core.base)<.75){
    const original={...player};enter(player,{...player,x:core.x,z:z-1.4,walkY:core.base,yaw:0,pitch:0},hash(core.x,0x504c4154));
    Object.assign(player,original);transfer(player,{x:core.x,z,y:core.base,nx:0,nz:1},current.ports[0]);return true;
   }
  }return false;
 }
 function getChunk(cx,cz){const key=cx+','+cz;if(!data.has(key))data.set(key,chunk(roofSeed,cx,cz));return data.get(key);}
 function nearby(x,z){const cx=Math.floor(x/CELL),cz=Math.floor(z/CELL),a=[];for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)a.push(getChunk(cx+dx,cz+dz));return a;}
 function roofHeight(x,z){let y=naturalHeight(x,z);for(const c of nearby(x,z)){for(const h of c.houses){const d=Math.max(Math.abs(x-h.x)-h.w/2,Math.abs(z-h.z)-h.d/2),a=clamp(1-d/4,0,1);y+=(h.y-y)*a*a*(3-2*a);}for(const t of c.towers){const a=clamp(1-(Math.hypot(x-t.x,z-t.z)-towerRadius(t)-.3)/3,0,1);y+=(t.y-y)*a*a*(3-2*a);}}return y;}
 function roofBlocked(x,z,radius=.27){
  for(const c of nearby(x,z)){
   for(const h of c.houses)if(Math.abs(x-h.x)<h.w/2+radius&&Math.abs(z-h.z)<h.d/2+radius){
    // Enterable front doors remain open right through the transition plane.
    if(h.enterable&&Math.abs(x-h.x)<1.125-radius&&z>h.z+h.d/2-3.3)continue;return true;
   }
   for(const t of c.towers)if(Math.hypot(x-t.x,z-t.z)<towerRadius(t)+.18+radius)return true;
  }return false;
 }
 function eyeKind(h){return h.seed%2?'field':'lane';}
 function photoWall(group,h,x,y,z,w,height){
  const m=box(group,x,y,z,w,height,.16,'facade'),p=m.geometry.attributes.position,u=m.geometry.attributes.uv;
  for(let i=0;i<p.count;i++)u.setXY(i,(p.getX(i)+x-(h.x-h.w/2))/h.w,(p.getY(i)+y-h.y)/h.h);
 }
 function houseMesh(group,h){
  const x=h.x,y=h.y,z=h.z,front=z+h.d/2,paint='house'+h.color;
  box(group,x,y-.1,z,h.w+.25,.2,h.d+.25,'white');
  box(group,x,y+h.h/2,z-h.d/2,h.w,h.h,.16,paint);
  for(const side of [-1,1])box(group,x+side*h.w/2,y+h.h/2,z,.16,h.h,h.d,paint);
  // Preserve the whole photographed facade, with a real 2.25 x 3.4 m door cut out.
  for(const side of [-1,1])photoWall(group,h,x+side*(h.w/4+.5625),y+h.h/2,front,h.w/2-1.125,h.h);
  photoWall(group,h,x,y+(h.h+3.4)/2,front,2.25,h.h-3.4);
  for(const side of [-1,1])box(group,x+side*1.19,y+1.74,front+.08,.13,3.48,.18,'white');box(group,x,y+3.48,front+.08,2.52,.16,.18,'white');
  if(h.enterable){
   const dark=h.id!=='arrival';
   // A proper three-metre vestibule uses exactly the eye-room doorway dimensions.
   box(group,x,y-.04,front-1.5,2.25,.08,3,dark?'void':'floor');box(group,x,y+3.45,front-1.5,2.25,.1,3,dark?'void':'ceiling');
   for(const side of [-1,1])box(group,x+side*1.19,y+1.7,front-1.5,.13,3.4,3,dark?'void':'wall');
   const material=dark?mats.void:new THREE.MeshBasicMaterial({map:textures.corridorPhoto||null,color:0xffffff}),plane=new THREE.Mesh(new THREE.PlaneGeometry(2.25,3.4),material);
   plane.position.set(x,y+1.7,front-2.88);plane.name='Open house doorway';plane.userData.ownMaterial=true;
   if(dark){plane.userData.ownMaterial=false;const opening=new THREE.Mesh(new THREE.PlaneGeometry(2.25,3.4),mats.void);opening.position.set(x,y+1.7,front+.005);opening.name='Black eye-room entrance';group.add(opening);}
   // A doorway shows a crop, never a vertically stretched landscape photograph.
   const uv=plane.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,.5+(uv.getX(i)-.5)*.48);
   group.add(plane);
  }else box(group,x,y+1.7,front+.03,2.25,3.4,.13,'door');
  // Side windows and white joinery stay three-dimensional; the front uses photo pixels.
  for(const side of [-1,1])for(const level of [1.8,4.7])for(const dz of [-h.d*.25,h.d*.23]){
   box(group,x+side*(h.w/2+.06),y+level,z+dz,.05,1.55,1.25,'white');box(group,x+side*(h.w/2+.1),y+level,z+dz,.04,1.35,1.07,'void');
   box(group,x+side*(h.w/2+.13),y+level,z+dz,.04,1.37,.055,'white');box(group,x+side*(h.w/2+.13),y+level,z+dz,.04,.055,1.1,'white');
  }
  const pitch=.78,rise=Math.tan(pitch)*h.w/2;
  for(const end of [-1,1]){
   const geo=new THREE.BufferGeometry(),zz=z+end*h.d/2;
   const a=[x-h.w/2,y+h.h,zz,x+h.w/2,y+h.h,zz,x,y+h.h+rise,zz];if(end<0){const first=a.slice(0,3);a.splice(0,3,...a.slice(3,6));a.splice(3,3,...first);}
   geo.setAttribute('position',new THREE.Float32BufferAttribute(a,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1],2));geo.computeVertexNormals();mesh(group,geo,paint);
   for(const side of [-1,1]){const trim=box(group,x+side*h.w/4,y+h.h+rise/2,zz+end*.12,(h.w/2+.2)/Math.cos(pitch),.18,.15,'white');trim.rotation.z=-side*pitch;}
  }
  for(const side of [-1,1]){const roof=box(group,x+side*h.w/4,y+h.h+rise/2,z,(h.w/2+.25)/Math.cos(pitch),.13,h.d+.55,'roof');roof.rotation.z=-side*pitch;}
  for(const side of [-1,1])for(let i=0;i<15;i++){
   const xx=x+side*(h.w/2+2),zz=z-h.d/2-1+i*.65,yy=roofHeight(xx,zz);box(group,xx,yy+.62,zz,.095,1.24,.14,'white');
   if(i<14)for(const level of [.38,.88])box(group,xx,yy+level,zz+.32,.07,.07,.65,'white');
  }
 }
 function towerMesh(group,t){
  // Skrunda: solid masonry shaft, wider cylindrical reservoir, flat ruined crown.
  const r=towerRadius(t),head=r*1.29,cap=t.h*.22,top=t.y+t.h+cap;
  function cylinder(radius,height,y,material,repeat=1){
   const geo=new THREE.CylinderGeometry(radius,radius,height,24),uv=geo.attributes.uv;
   if(repeat!==1)for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*repeat,uv.getY(i)*height/(material==='towerBrick'?4.1:1.2));
   const m=mesh(group,geo,material);m.position.set(t.x,y,t.z);return m;
  }
  cylinder(r+.15,.35,t.y+.025,'towerRim');
  cylinder(r,t.h,t.y+t.h/2,'towerBrick',2*Math.PI*r/1.8);
  cylinder(head+.08,.22,t.y+t.h-.04,'towerRim');
  cylinder(head,cap,t.y+t.h+cap/2,'towerHead',2*Math.PI*head/2.2);
  cylinder(head+.035,.13,top,'towerRim');
  cylinder(head-.15,.1,top-.17,'black');
  box(group,t.x,t.y+1.1,t.z+r+.025,.82,2.2,.08,'towerRim');
  box(group,t.x,t.y+1.03,t.z+r+.08,.63,2.04,.04,'void');
  // Narrow photographic window recesses, plus the single shaft opening.
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4+.11,rr=head+.015,win=new THREE.Mesh(new THREE.PlaneGeometry(.43,.91),mats.towerWindow);
   win.position.set(t.x+Math.sin(a)*rr,top-.8,t.z+Math.cos(a)*rr);win.rotation.y=a;group.add(win);
  }
  box(group,t.x-r*.48,t.y+t.h-.62,t.z+r*.9,.3,.8,.035,'void');
  // Irregular exposed beams replace the conical American roof.
  for(let i=0;i<7;i++){
   const a=i*Math.PI*2/7,len=1.1+(i%3)*.24,beam=box(group,t.x+Math.sin(a)*head*.67,top+.09+(i%2)*.035,t.z+Math.cos(a)*head*.67,.14,.11,len,'towerRim',a);
   beam.rotation.x=(i%3-1)*.065;
  }
 }
 function buildChunk(c){
  const g=new THREE.Group(),positions=[],uv=[],indices=[],n=40;
  for(let iz=0;iz<=n;iz++)for(let ix=0;ix<=n;ix++){const x=c.cx*CELL+ix*CELL/n,z=c.cz*CELL+iz*CELL/n;positions.push(x,roofHeight(x,z),z);uv.push(x/6,z/6);}
  for(let iz=0;iz<n;iz++)for(let ix=0;ix<n;ix++){const a=iz*(n+1)+ix,b=a+1,d=a+n+1;indices.push(a,d,b,b,d,d+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();mesh(g,geo,'grass');
  for(const h of c.houses){houseMesh(g,h);
   for(let i=0;i<12;i++){const z=h.z+h.d/2+1+i*1.1,x=h.x+Math.sin(i*.16)*1.4;box(g,x,roofHeight(x,z)+.025,z,1.65,.035,1.13,'path');}
  }
  for(const t of c.towers)towerMesh(g,t);batch(g);return g;
 }
 function buildHorizon(cx,cz){
  clear(horizon);const p=[],uv=[],indices=[],step=8,x0=(cx-14)*CELL,z0=(cz-14)*CELL,n=290;
  for(let iz=0;iz<=n;iz++)for(let ix=0;ix<=n;ix++){const x=x0+ix*step,z=z0+iz*step;p.push(x,naturalHeight(x,z)-.035,z);uv.push(x/6,z/6);}
  for(let iz=0;iz<n;iz++)for(let ix=0;ix<n;ix++){const x=x0+(ix+.5)*step,z=z0+(iz+.5)*step;if(x>=(cx-2)*CELL&&x<(cx+3)*CELL&&z>=(cz-2)*CELL&&z<(cz+3)*CELL)continue;const a=iz*(n+1)+ix,b=a+1,d=a+n+1;indices.push(a,d,b,b,d,d+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();mesh(horizon,geo,'grass');
 }
 let lastChunk='';
 function stream(x,z,force=false){
  const cx=Math.floor(x/CELL),cz=Math.floor(z/CELL),center=cx+','+cz;if(center===lastChunk&&!force)return;lastChunk=center;buildHorizon(cx,cz);
  const keep=new Set();for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){
   const key=(cx+dx)+','+(cz+dz);keep.add(key);if(!chunks.has(key)){const g=buildChunk(getChunk(cx+dx,cz+dz));chunks.set(key,g);outside.add(g);}
  }
  for(const [key,g]of chunks)if(!keep.has(key)){clear(g);outside.remove(g);chunks.delete(key);}
  for(const [key,c]of data)if(Math.abs(c.cx-cx)>4||Math.abs(c.cz-cz)>4)data.delete(key);
 }
 function showRoof(player,arrival){
  encounters?.close();
  clearPortals();ensurePhotos();mode='roof';inside.visible=false;outside.visible=true;scene.background=new THREE.Color(ROOF_SKY);scene.fog=new THREE.FogExp2(ROOF_SKY,.0038);ambient.intensity=.82;sun.intensity=.4;
  const h=arrival||getChunk(0,0).houses[0];player.x=h.x;player.z=h.z+h.d/2+2.4;player.walkY=roofHeight(player.x,player.z);player.yaw=Math.PI;player.pitch=0;stream(player.x,player.z,true);revision++;
 }
 function ascendToRoof(player,from){
  const mapped=from?window.NovaHousePortals.map(from,roofDoor(),{x:player.x,z:player.z,y:player.walkY,yaw:player.yaw}):null,pitch=player.pitch;
  const entry=rootReturn?.type==='roof'?rootReturn.house:getChunk(0,0).houses[0];
  doorLinks.set(entry.id,{graph:graph(),port:'u'});while(doorLinks.size>256){const k=[...doorLinks.keys()].find(k=>k!=='arrival');if(!k)break;doorLinks.delete(k);}
  roofReturn={...entry};showRoof(player,entry);if(mapped){Object.assign(player,{x:mapped.x,z:mapped.z,walkY:mapped.y,yaw:mapped.yaw,pitch});stream(player.x,player.z);}
 }
 function jumpToRoof(player,saved,seed=0x504c4154){
  enter(player,saved,seed);
  // Construct the same late staircase graph as a real ascent. The arrival
  // house therefore remains a working route back down, rather than a dead end.
  const flights=current.roofAt;path=[];
  for(let i=1;i<flights;i++)path.push('s','u');
  path.push('s');current=spec(rootSeed,path,toys?.seed||0);ascendToRoof(player);return true;
 }
 function restoreGraph(g,player,portId){rootSeed=g.seed;path=[...g.path];rootReturn=g.rootReturn;mode='interior';rebuild(true);placeAt(player,current.ports.find(p=>p.id===portId)||current.ports[0]);}
 function leave(player){if(!active)return false;encounters?.close();active=false;inside.visible=outside.visible=field.visible=false;if(worldReturn)Object.assign(player,worldReturn);onExit?.();return true;}
 function transfer(player,from,to){const mapped=window.NovaHousePortals.map(from,to,{x:player.x,z:player.z,y:player.walkY,yaw:player.yaw});Object.assign(player,{x:mapped.x,z:mapped.z,walkY:mapped.y,yaw:mapped.yaw});}
 function cross(port,player){
  if(port.id==='back'){
   if(!path.length){if(rootReturn?.type==='roof'){showRoof(player,rootReturn.house);return;}const mapped={...player};transfer(mapped,port,worldDestination());leave(player);Object.assign(player,mapped);return;}
   const back=path.at(-1),ns=spec(rootSeed,path.slice(0,-1),toys?.seed||0);encounters?.follow?.(current,port,ns,ns.ports.find(p=>p.id===back),player);
   path.pop();rebuild();transfer(player,port,current.ports.find(p=>p.id===back));return;
  }
  if(port.id==='u'&&current.steps>=current.roofAt){ascendToRoof(player,port);return;}
  if(port.id==='f'){enterField(player,port);return;}
  {const ns=spec(rootSeed,[...path,port.id],toys?.seed||0);encounters?.follow?.(current,port,ns,ns.ports[0],player);}
  path.push(port.id);rebuild();transfer(player,port,current.ports[0]);
 }
 function advance(player,before){
  if(mode==='field'){
   const d=FIELD_HOUSE.door;if(before.z<=d.z&&player.z>d.z&&Math.abs(player.x-d.x)<d.width/2){leaveField(player);return true;}
   return false;
  }
  if(mode==='interior'){
   for(const p of current.ports){const a=(before.x-p.x)*p.nx+(before.z-p.z)*p.nz,b=(player.x-p.x)*p.nx+(player.z-p.z)*p.nz,side=Math.abs((player.x-p.x)*p.nz-(player.z-p.z)*p.nx);
    if(a<=.00001&&b>.00001&&side<HALF-.2&&Math.abs(player.walkY-p.y)<.4){cross(p,player);return true;}
   }
  }else for(const c of nearby(player.x,player.z))for(const h of c.houses){
   const threshold=h.z+h.d/2-2.85;if(h.enterable&&before.z>=threshold&&player.z<threshold&&Math.abs(player.x-h.x)<.84){
    const link=doorLinks.get(h.id);if(link)restoreGraph(link.graph,player,link.port);
    else if(onEyeRoom){
     const saved={house:true,kind:eyeKind(h),door:{x:h.x,z:threshold,y:h.y,nx:0,nz:-1},entryX:player.x-h.x,entryYaw:player.yaw,entryPitch:player.pitch,player:{...player,z:threshold+.10,walkY:h.y,yaw:Math.PI}};
     active=false;outside.visible=inside.visible=false;onEyeRoom(eyeKind(h),saved);
    }else{rootSeed=h.seed;path=[];rootReturn={type:'roof',house:{...h}};mode='interior';rebuild(true);placeAt(player,current.ports[0]);}
    return true;
   }
  }return false;
 }
 function move(player,dx,dz){
  if(!active)return 0;const distance=Math.hypot(dx,dz),steps=Math.max(1,Math.ceil(distance/.065));let walked=0;
  for(let i=0;i<steps;i++){
   const before={x:player.x,z:player.z};for(const axis of ['x','z']){
    const x=player.x+(axis==='x'?dx/steps:0),z=player.z+(axis==='z'?dz/steps:0);
    const nextY=mode==='field'?0:mode==='roof'?roofHeight(x,z):floorAt(current,x,z);
    if(nextY!==null&&Math.abs(nextY-player.walkY)<=.225&&!(mode==='field'?fieldBlocked(x,z):mode==='roof'?roofBlocked(x,z):blocked(current,x,z))){player.x=x;player.z=z;player.walkY=nextY;}
   }
   const step=Math.hypot(player.x-before.x,player.z-before.z);walked+=step;if(mode==='interior')walkedInside+=step;if(advance(player,before))break;
  }
  if(active&&mode==='roof')stream(player.x,player.z);if(active&&mode==='field')updateField(player);return walked;
 }
 function radioRecord(r){if(!radioStates.has(r.id))radioStates.set(r.id,{...r});return radioStates.get(r.id);}
 function radioTarget(eye,look){
  if(!active||mode!=='interior')return null;let best=null,score=Infinity;
  for(const raw of current.radios){const r=radioRecord(raw),v=new THREE.Vector3(r.x-eye.x,r.y-eye.y,r.z-eye.z),distance=v.length();if(distance<.2||distance>2.6||v.dot(look)/distance<.955)continue;
   let clear=true;for(let i=1;i<Math.ceil(distance/.18);i++){const t=i/Math.ceil(distance/.18),x=eye.x+v.x*t,z=eye.z+v.z*t,y=eye.y+v.y*t,lo=floorAt(current,x,z),hi=ceilingAt(current,x,z);if(lo===null||y<lo||y>hi){clear=false;break;}}
   if(clear&&distance<score){score=distance;best=r;}
  }return best;
 }
 function cycleRadio(r){const station=settlements.cycleRadio(r);updateRadioLamps();return station;}
 function setRadioLamp(o){o.material=radioStates.get(o.userData.radioId)?.on?mats.radioOn:mats.radioOff;}
 function updateRadioLamps(){for(const o of radioLamps)setRadioLamp(o);}
 function radioMix(eye,yaw){
  const channels=settlements.radioStations.map(s=>({id:s.id,gain:0,pan:0}));let gain=0,pan=0;
  if(!active||mode!=='interior')return{gain,pan,channels};
  const entries=current.radios.map(r=>({r:radioRecord(r),x:r.x,y:r.y,z:r.z}));
  // Adjacent receivers keep fading through the same portals used by movement.
  for(const link of adjacent)for(const r of link.spec.radios){const mapped=window.NovaHousePortals.map(link.to,link.from,r);entries.push({r:radioRecord(r),...mapped});}
  for(const p of entries){if(!p.r.on)continue;const dx=p.x-eye.x,dz=p.z-eye.z,d=Math.hypot(dx,p.y-eye.y,dz);if(d>=38)continue;
   const g=.85/(1+(Math.max(0,d-1.2)/8)**1.5)*(1-window.NovaTerrain.smooth(24,38,d)),stereo=clamp((dx*Math.cos(yaw)-dz*Math.sin(yaw))/Math.max(1,d),-.85,.85),channel=channels[p.r.station-1];
   if(channel&&g>channel.gain){channel.gain=g;channel.pan=stereo;}if(g>gain){gain=g;pan=stereo;}
  }
  // v91: a radio once switched on in the backrooms follows the player everywhere, from no
  // particular direction, until it is switched off again.
  for(const r of radioStates.values()){if(!r.on)continue;const channel=channels[r.station-1],g=.5,drift=.3*Math.sin(nowMs()*.00017+r.number*1.7);
   if(channel&&g>channel.gain){channel.gain=g;channel.pan=drift;}if(g>gain){gain=g;pan=drift;}}
  return{gain,pan,channels};
 }
 function renderEntrances(renderer,camera,night,effects,time){
  entranceGroup.visible=!!night&&!active;if(!entranceGroup.visible||!outsideView)return;window.NovaHousePortals.beginFrame();ensurePhotos();ensureEffects();pumpPrefetch(3);if(effects&&time)applyEffects(effects,time);
  for(const core of settlements.cores){const far=Math.hypot(camera.position.x-core.x,camera.position.z-core.z);if(far<120&&!prefetch.houses.has(core.x)){prefetch.houses.add(core.x);queueAround(hash(core.x,0x504c4154),[]);}if(far>65)continue;
   let entry=entrances.find(e=>e.from.id===core.x);
   if(!entry){const first=spec(hash(core.x,0x504c4154),[],toys?.seed||0),sc=roomScene(first,'back',false,0,hash(core.x,0x504c4154)),from={id:core.x,x:core.x,z:core.z-10.4,y:core.base,nx:0,nz:1};entry=window.NovaHousePortals.create(THREE,entranceGroup,from,first.ports[0],sc,{width:2.4,height:2.44});entrances.push(entry);}
   entry.render(renderer,camera);
  }
 }
 const effectTime={value:0},effectBreath={value:0};let effectsReady=false;
 function applyEffects(effects,time){
  effectTime.value=time.value;effectBreath.value=time.breath?.value??effects.psychedelic??0;
  ambient.intensity=(mode==='field'?1.02:mode==='roof'?.82:.95)+(effects.nightVision||0)*.12;sun.intensity=(mode==='field'?.32:mode==='roof'?.4:.1)+(effects.nightVision||0)*.05;
  ensureEffects();
  mats.water.userData.time.value=time.value;
 }
 function ensureEffects(){
  if(!effectsReady&&window.NovaInterference){effectsReady=true;for(const m of Object.values(mats)){
   if(m.isShaderMaterial||m===mats.void||m===mats.water||m.isMeshBasicMaterial)continue;
   const before=m.onBeforeCompile,key=m.customProgramCacheKey();m.onBeforeCompile=function(shader,renderer){before.call(this,shader,renderer);shader.uniforms.houseBreath=effectBreath;shader.uniforms.houseBreathTime=effectTime;
    shader.vertexShader='uniform float houseBreath,houseBreathTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat pulse=sin(houseBreathTime*.72+position.x*.19+position.z*.16)*houseBreath;transformed+=normal*pulse*.09;');};m.customProgramCacheKey=()=>key+'-house-breath-v54';m.needsUpdate=true;
  }}
 }

 // ------------------------------------------------------------------ v90 field
 // The level at the foot of the long descent: an endless overcast meadow with a
 // single white farmhouse, a faint rainbow and nothing else. Built on first visit.
 const FIELD_ARRIVAL={x:0,z:33,y:0,nx:0,nz:1};
 const FIELD_HOUSE={door:{x:-1.05,z:-2.75,width:1}};
 const field=new THREE.Group();field.name='Feld mit Haus';field.visible=false;scene.add(field);
 let fieldReturn=null,fieldBuilt=false,fieldCenter=null,fieldGround=null,fieldRainbow=null,fieldSky=null;
 const FIELD_HORIZON=0x9a9b9c;
 function fieldLook(){scene.background=new THREE.Color(FIELD_HORIZON);scene.fog=new THREE.FogExp2(FIELD_HORIZON,.0052);ambient.intensity=1.02;sun.intensity=.32;}
 function sidingTexture(){
  const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
  x.fillStyle='#f1f1ec';x.fillRect(0,0,256,256);
  for(let i=0;i<10;i++){const y=i*25.6;x.fillStyle='#d9dad4';x.fillRect(0,y+22,256,3.6);x.fillStyle='#fbfbf8';x.fillRect(0,y,256,3);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;
 }
 function buildField(){
  if(fieldBuilt)return;fieldBuilt=true;const photos=ensurePhotos();
  const lam=(color,extra={})=>new THREE.MeshLambertMaterial({color,...extra});
  // Sky: an overcast gradient dome, darker towards the zenith, matching the fog at the horizon.
  {const g=new THREE.SphereGeometry(950,32,18),p=g.attributes.position,col=[],lo=new THREE.Color(FIELD_HORIZON),hi=new THREE.Color(0x56585b),c=new THREE.Color();
   for(let i=0;i<p.count;i++){const t=Math.max(0,p.getY(i)/950);c.copy(lo).lerp(hi,Math.pow(t,.42));col.push(c.r,c.g,c.b);}
   g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
   fieldSky=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));fieldSky.renderOrder=-2;fieldSky.frustumCulled=false;field.add(fieldSky);}
  // A faint rainbow, always ahead of the house direction, fixed to the viewer like a real one.
  {const inner=312,outer=346,g=new THREE.RingGeometry(inner,outer,180,7,0,Math.PI),p=g.attributes.position,col=[],alpha=[],c=new THREE.Color();
   const bands=[0x8a6fb0,0x7083b8,0x7fa883,0xc9c27c,0xc99a72,0xb7716b];
   for(let i=0;i<p.count;i++){const r=(Math.hypot(p.getX(i),p.getY(i))-inner)/(outer-inner),k=Math.min(bands.length-1.001,Math.max(0,r*(bands.length-1))),a=Math.floor(k);
    c.setHex(bands[a]).lerp(new THREE.Color(bands[a+1]),k-a);const edge=Math.sin(Math.PI*Math.min(1,Math.max(0,r)));col.push(c.r,c.g,c.b);alpha.push(edge);}
   g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setAttribute('bandAlpha',new THREE.Float32BufferAttribute(alpha,1));
   // Normal blending with soft band edges: a faint, colourful arc, not a bright white one.
   const rm=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.2,depthWrite:false,fog:false,side:THREE.DoubleSide});
   rm.onBeforeCompile=sh=>{sh.vertexShader='attribute float bandAlpha;varying float vBandAlpha;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBandAlpha=bandAlpha;');sh.fragmentShader='varying float vBandAlpha;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vBandAlpha;');};
   rm.customProgramCacheKey=()=>'field-rainbow-v90';fieldRainbow=new THREE.Mesh(g,rm);
   fieldRainbow.renderOrder=-1;fieldRainbow.frustumCulled=false;field.add(fieldRainbow);}
  // Ground: the user's grass photograph, tiled every 3 m and anchored to the world.
  {const size=1800,g=new THREE.PlaneGeometry(size,size,1,1);g.rotateX(-Math.PI/2);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/3,-p.getZ(i)/3);
   fieldGround=new THREE.Mesh(g,lam(0x77814d,{map:photos?.grass||null}));fieldGround.name='Endlose Wiese';field.add(fieldGround);}
  // v90: the meadow is only the green grass photograph (no modelled grass tufts).
  field.add(farmhouse());
 }
 function farmhouse(){
  const house=new THREE.Group();house.name='Haus im Feld';
  const siding=new THREE.MeshLambertMaterial({map:sidingTexture(),color:0xffffff}),trim=new THREE.MeshLambertMaterial({color:0xf3f3ef}),dark=new THREE.MeshBasicMaterial({color:0x000000});
  const red=new THREE.MeshLambertMaterial({color:0xae2b25}),roof=new THREE.MeshLambertMaterial({color:0x56595a}),porch=new THREE.MeshLambertMaterial({color:0x6c7072}),door=new THREE.MeshLambertMaterial({color:0x5d4b3b});
  function part(geo,mat,x,y,z,rx=0,ry=0,rz=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);house.add(m);return m;}
  function walls(w,h,d,x,y,z){const g=new THREE.BoxGeometry(w,h,d),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
   for(let i=0;i<p.count;i++){const along=Math.abs(n.getX(i))>.5?p.getZ(i)+z:p.getX(i)+x;uv.setXY(i,along/2,(p.getY(i)+y)/2);}return part(g,siding,x,y,z);}
  function window_(x,y,z,w,h,ry=0){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;house.add(g);
   const add=(geo,mat,px,py,pz)=>{const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);g.add(m);};
   add(new THREE.BoxGeometry(w,h,.03),dark,0,0,.04);
   for(const [px,py,pw,ph]of [[0,h/2,w+.16,.09],[0,-h/2,w+.2,.1],[-w/2,0,.08,h],[w/2,0,.08,h],[0,0,w,.05]])add(new THREE.BoxGeometry(pw,ph,.06),trim,px,py,.065);}
  // Main block with the front gable towards the arrival side (+z).
  walls(4.6,5,5.5,0,2.5,0);
  {const s=new THREE.Shape();s.moveTo(-2.3,0);s.lineTo(2.3,0);s.lineTo(0,1.9);s.lineTo(-2.3,0);const g=new THREE.ExtrudeGeometry(s,{depth:5.5,bevelEnabled:false});g.translate(0,5,-2.75);
   const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/2,p.getY(i)/2);part(g,siding,0,0,0);}
  const slope=Math.atan2(1.9,2.3),len=Math.hypot(2.3,1.9)+.3;
  for(const side of [-1,1])part(new THREE.BoxGeometry(len,.12,5.9),roof,side*1.15,5.98,0,0,0,-side*slope);
  for(const side of [-1,1])part(new THREE.BoxGeometry(len,.14,.12),trim,side*1.15,5.93,2.82,0,0,-side*slope);
  part(new THREE.BoxGeometry(4.75,.14,.1),trim,0,5,2.8);
  // Lower wing on the right with red roofs, as in the reference picture.
  walls(2.8,4.7,4.4,3.7,2.35,-.35);
  {const g=new THREE.ConeGeometry(2.55,1.35,4,1);g.rotateY(Math.PI/4);g.scale(.85,1,1.32);part(g,red,3.7,4.7+.67,-.35);}
  part(new THREE.BoxGeometry(3.05,.1,1.05),red,3.7,2.62,2.28,.33,0,0);
  part(new THREE.BoxGeometry(2.3,1.55,.03),porch,3.7,3.75,1.87);
  // Windows: one up and two down in the gable front, one per floor in the wing.
  window_(0,3.75,2.75,.58,.95);window_(-1.02,1.42,2.75,.62,1.02);window_(1.02,1.42,2.75,.62,1.02);
  window_(3.7,3.8,1.88,.56,.84);window_(3.7,1.35,1.85,.62,1.02);
  window_(-2.3,1.42,1,.6,1,-Math.PI/2);window_(-2.3,3.75,-1,.6,.95,-Math.PI/2);
  // The way back: a plain door on the far side of the house.
  part(new THREE.BoxGeometry(1,2.1,.05),door,FIELD_HOUSE.door.x,1.05,-2.78);
  for(const [px,py,pw,ph]of [[-.56,1.07,.1,2.15],[.56,1.07,.1,2.15],[0,2.16,1.22,.1]])part(new THREE.BoxGeometry(pw,ph,.07),trim,FIELD_HOUSE.door.x+px,py,-2.8);
  return house;
 }
 function fieldBlocked(x,z,radius=.27){
  const d=FIELD_HOUSE.door;
  if(Math.abs(x-d.x)<d.width/2-.08&&z<d.z+.45&&z>d.z-3)return false;
  if(Math.abs(x)<2.3+radius&&Math.abs(z)<2.75+radius)return true;
  return x>2.3-radius&&x<5.1+radius&&z>-2.55-radius&&z<1.85+radius;
 }
 function updateField(p){
  if(!fieldBuilt)return;
  fieldSky.position.set(p.x,0,p.z);fieldRainbow.position.set(p.x,-150,p.z-440);
  fieldGround.position.set(Math.round(p.x/3)*3,0,Math.round(p.z/3)*3);
  fieldCenter={x:p.x,z:p.z};
 }
 function fieldView(group,from,s,entry){
  let saved;
  return interiorPortal(group,from,FIELD_ARRIVAL,scene,s,entry,{beforeRender(){
   buildField();if(!fieldCenter)updateField(FIELD_ARRIVAL);
   saved={inside:inside.visible,outside:outside.visible,field:field.visible,background:scene.background,fog:scene.fog,ambient:ambient.intensity,sun:sun.intensity};
   inside.visible=outside.visible=false;field.visible=true;fieldLook();
  },afterRender(){inside.visible=saved.inside;outside.visible=saved.outside;field.visible=saved.field;scene.background=saved.background;scene.fog=saved.fog;ambient.intensity=saved.ambient;sun.intensity=saved.sun;}});
 }
 function enterField(player,port){
  encounters?.close();
  fieldReturn={seed:rootSeed,path:[...path],rootReturn:rootReturn?structuredCopy(rootReturn):null};
  buildField();transfer(player,port,FIELD_ARRIVAL);player.walkY=0;
  clearPortals();mode='field';inside.visible=outside.visible=false;field.visible=true;fieldLook();fieldCenter=null;updateField(player);revision++;
 }
 function leaveField(player){
  const g=fieldReturn||{seed:rootSeed,path:[...path],rootReturn};fieldReturn=null;field.visible=false;fieldCenter=null;
  // Back up to the room where the long stairs began, facing into that room.
  restoreGraph({seed:g.seed,path:g.path.slice(0,-1),rootReturn:g.rootReturn},player,'d');player.yaw+=Math.PI;
 }

 function reset(){encounters?.reset();walkedInside=0;clearPortals();if(sharedCourtyard){disposePreview(sharedCourtyard);sharedCourtyard=null;}clear(inside);radioStates.clear();entranceGroup.visible=false;for(const e of entrances){e.dispose();disposePreview(e.targetScene);}entrances.length=0;for(const entry of roomCache.values())disposeRoom(entry.group);roomCache.clear();active=false;inside.visible=outside.visible=field.visible=false;fieldReturn=null;path=[];current=null;worldReturn=rootReturn=null;doorLinks.clear();lastChunk='';clear(horizon);for(const g of chunks.values()){clear(g);outside.remove(g);}chunks.clear();data.clear();revision++;}
 reset();
 return{scene,updateEncounters(dt,player,playing,flashlight){if(active&&mode==='interior'&&!level.active)encounters?.update(current,dt,player,playing,flashlight);},encounterTarget(eye,look){return active&&mode==='interior'?encounters?.target(current,eye,look):null;},encounterPresence(player){return active&&mode==='interior'?encounters?.presence?.(current,player)||null:null;},interactEncounter(obj){return encounters?.interact(obj);},get mode(){return mode;},get revision(){return revision;},get degradation(){return 0;}/* v91: no analogue static deeper in the apartment */,prepareMaterials(){ensurePhotos();ensureEffects();},renderEntrances,applyEffects,radioTarget,cycleRadio,radioMix,get entrances(){return entrances;},get radios(){return current?.radios.map(r=>radioRecord(r))||[];},renderPortals(renderer,camera){if(!(active&&mode==='interior'))return;const P=window.NovaHousePortals;P.beginFrame(level.active||loading()?40:6);if(level.active)levelStep(renderer);
  // v90: nearest openings first, so the view straight ahead gets this frame's build budget;
  // an idle frame prepares one more neighbouring room ahead of time.
  const x=camera.position.x,z=camera.position.z,order=portals.slice().sort((a,b)=>Math.hypot(a.from.x-x,a.from.z-z)-Math.hypot(b.from.x-x,b.from.z-z));
  for(const p of order)p.render(renderer,camera);
  if(P.idle())for(const p of order)if(p.prepare())break;
  // v102: the nearer the missing room, the more of the frame goes to building it (there is no
  // loading screen to fall back on any more): next door 9 ms, two doorways 6 ms, else 2–4 ms.
  if(!level.active){const near=urgency();pumpPrefetch(near<=1?9:near===2?6:P.idle()?4:2);if(fresh.length&&P.idle())upload(renderer,fresh.shift());}
 },
 get levelLoading(){return level.active&&active&&mode==='interior';},get levelProgress(){return level.active?Math.max(0,Math.min(.99,1-remaining()/level.total)):1;},
 get loading(){return loading();},prefetchState(){return{queued:prefetch.queue.length,building:prefetch.job?.key||null,cached:roomCache.size,nearest:urgency(),uploads:fresh.length};},warmup,eyeReturnPortal(group,saved){return window.NovaHousePortals.create(THREE,group,{x:0,z:5,y:0,nx:0,nz:1},saved.door,scene,{width:2.25,height:3.4,beforeRender(){outside.visible=true;},afterRender(){outside.visible=false;}});},get portals(){return portals;},get materials(){return mats;},enterFromWorld,enter,jumpToRoof,leave,move,reset,advance,roofHeight,roofBlocked,fieldBlocked,stream,debugField(player,saved,seed){
  // Breadth-first through the stable room graph to the nearest room with the long stairs.
  const queue=[[]];for(let i=0;i<queue.length&&i<900;i++){const p=queue[i],s=spec(seed,p,toys?.seed||0);
   if(s.ports.some(q=>q.id==='d')){enter(player,saved,seed);path=[...p,'d'];rebuild(true);const f=current.ports.find(q=>q.id==='f');placeAt(player,f);enterField(player,f);player.yaw=0;return true;}
   if(p.length<6)for(const q of s.ports){if(q.id==='back'||q.id==='f'||q.id==='d'||(q.id==='u'&&s.steps>=s.roofAt))continue;queue.push([...p,q.id]);}}
  return false;},
 debugStairs(player,saved,seed){
  // v91: the nearest room with the long stairs, standing at the top of its stairwell.
  const queue=[[]];for(let i=0;i<queue.length&&i<900;i++){const p=queue[i],s=spec(seed,p,toys?.seed||0);
   if(s.descent){enter(player,saved,seed);path=[...p];rebuild(true);const d=current.descent;player.x=d.x;player.z=d.z-d.dir*1.6;player.walkY=0;player.yaw=d.dir<0?0:Math.PI;player.pitch=-.32;return true;}
   if(p.length<6)for(const q of s.ports){if(q.id==='back'||q.id==='f'||q.id==='d'||(q.id==='u'&&s.steps>=s.roofAt))continue;queue.push([...p,q.id]);}}
  return false;},
 debugEnter(player,saved,seed,p=[]){enter(player,saved,seed);path=[...p];rebuild(true);placeAt(player,current.ports[0]);return current;},suspend(player){const saved={...player};leave(player);return saved;},resume(player,saved){active=true;inside.visible=mode==='interior';outside.visible=mode==='roof';field.visible=mode==='field';if(mode==='field')fieldLook();Object.assign(player,saved);},get active(){return active;},get current(){return current;},get worldReturn(){return worldReturn;},get state(){return{active,mode,encounters:encounters?.snapshot(current)||[],seed:rootSeed,path:[...path],stairs:current?.steps||0,roofAt:current?.roofAt||0,theme:current?.theme,ports:current?.ports.map(p=>({...p}))||[],chunks:chunks.size,chunkData:data.size,revision,windows:windowCount,photoTextures:!!photoTiles,rooms:current?.rooms.map(r=>({...r}))||[],pools:current?.pools.map(p=>({...p}))||[],radios:current?.radios.map(r=>({...radioRecord(r)}))||[],walkedInside,interference:active&&mode==='interior'?degradation(walkedInside):0,paintings:current?.paintings||[],gardens:current?.gardens||[],poolProps:current?.poolProps||[],toys:current?.toys||[],carpetMain:!!current?.carpetMain,glitch:active&&mode==='interior'&&walkedInside>45};}};
}
window.NovaNightHouse={create,spec,degradation,openingVisible,floorAt,ceilingAt,blocked,hash,chunk,naturalHeight};
})();
