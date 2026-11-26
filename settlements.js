// Rural industrial remains. Geometry, collision and walking surfaces share one plan.
(() => {
'use strict';
const T=window.NovaTerrain,C=window.NovaFactory,LEVEL=3.2;
// Keep the solid floor above the terrain mesh, including all four entrance aprons.
const housing={...T.settlements[1],y:T.settlements[1].y+.12,width:112,depth:20,levels:3,apartments:48};
const mill={...T.settlements[0],width:48,depth:20};
const tower=window.NovaLandmarks.tower;
const radioFlats=new Set([1,6,12,17,22,26,31,36,40,43,45]);
const radioStations=['apartment-station','apartment-4625','apartment-catatonia','radio-ste-005','radio-ste-006','radio-ste-007','radio-ste-008'].map(id=>({id}));
const machineStation={id:'radio-plane'};
const pieces=[],solids=[],surfaces=[],plants=[],cores=[],apartments=[],radios=[];
const furnitureCatalog=new Map();
function rememberFurniture(kind,start,x,y,z){
 if(furnitureCatalog.has(kind))return;
 furnitureCatalog.set(kind,pieces.slice(start).map(p=>({...p,x:p.x-site.x-x,y:p.y-site.y-y,z:p.z-site.z-z,solid:solids.includes(p)})));
}
function furniturePieces(kind,x,z,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);return(furnitureCatalog.get(kind)||[]).map(p=>({...p,x:x+p.x*c+p.z*s,z:z-p.x*s+p.z*c,ry:p.ry+yaw,material:'day_'+p.mat,template:kind}));}
let site=housing;
const rng=T.rng(0x53415731),rand=(a,b)=>a+(b-a)*rng();
function box(x,y,z,w,h,d,mat='concrete',solid=true,ry=0){
 const p={x:site.x+x,y:site.y+y,z:site.z+z,w,h,d,mat,ry,zone:site.zone||(site===housing?'housing':'mill')};pieces.push(p);if(solid)solids.push(p);return p;
}
function slab(x,y,z,w,d,mat='concrete'){box(x,y-.12,z,w,.24,d,mat,false);surfaces.push({x:site.x+x,z:site.z+z,w,d,y:site.y+y});}
function plant(id,x,y,z,scale){plants.push({id,x:site.x+x,y:site.y+y,z:site.z+z,scale,yaw:rand(0,6.28)});}
function round(x,y,z,w,h,d,mat,geo='cylinder',rx=0){const p=box(x,y,z,w,h,d,mat,false);p.geo=geo;p.rx=rx;return p;}
function furnish(cx,y,side,end,number){
 // Enamel bath with an open basin, exposed feet and a wall-mounted tap.
 let furnitureStart=pieces.length;
 const bx=cx+side*4.03,bz=end*1.65;
 box(bx,y+.29,bz,.84,.58,1.88,'porcelain',true).hidden=true;
 round(bx,y+.35,bz,.84,.48,1.88,'porcelain','basin');
 round(bx,y+.14,bz,.67,.045,1.62,'enamel');
 for(const z of [-.67,.67])for(const x of [-.25,.25])round(bx+x,y+.08,bz+z,.07,.16,.07,'rust');
 round(bx,y+.16,bz-end*.63,.09,.025,.09,'metal');
 box(bx,y+.78,end*.63,.04,.35,.04,'metal',false);box(bx,y+.94,end*.76,.04,.04,.28,'metal',false);
 rememberFurniture('bath',furnitureStart,bx,y,bz);furnitureStart=pieces.length;
 // Toilet: pedestal, hollow oval bowl, dark aperture, raised cistern and flush.
 const tx=cx+side*5.35,tz=end*2.75;
 box(tx,y+.27,tz,.52,.54,.7,'porcelain',true).hidden=true;
 round(tx,y+.18,tz,.32,.36,.4,'porcelain');
 round(tx,y+.41,tz,.53,.22,.7,'porcelain','basin');
 round(tx,y+.43,tz,.38,.035,.52,'dark');
 round(tx,y+.54,tz,.56,.055,.73,'enamel','basin');
 box(tx,y+.79,tz-end*.31,.52,.51,.21,'porcelain');box(tx+side*.16,y+.92,tz-end*.19,.07,.035,.035,'metal',false);
 rememberFurniture('toilet',furnitureStart,tx,y,tz);furnitureStart=pieces.length;
 // The former document counter and sideboard in flat 15 have been cleared out.
 if(number===15)return;
 // Fitted kitchen: individual doors, enamel hob, oven and an inset sink.
 const kx=cx+side*9.15,kz=end*.63;
 box(kx,y+.45,kz,3.9,.9,.8,'cabinet');box(kx,y+.925,kz,4,.065,.9,'enamel',false);
 for(let j=0;j<5;j++){
  const dx=kx-1.56+j*.78;box(dx,y+.46,kz+end*.416,.735,.77,.045,j===0?'porcelain':'cabinet',false);
  box(dx+.23,y+.72,kz+end*.451,.19,.035,.04,'metal',false);
 }
 const oven=kx-1.55;
 box(oven,y+.42,kz+end*.448,.57,.39,.04,'dark',false);
 box(oven,y+.975,kz,.72,.04,.72,'porcelain',false);
 for(const dx of [-.19,.19])for(const dz of [-.18,.18])round(oven+dx,y+1.005,kz+dz,.24,.018,.24,'dark');
 round(kx+.6,y+.942,kz,.83,.085,.57,'metal','basin');round(kx+.6,y+.915,kz,.67,.035,.41,'dark');
 box(kx+.6,y+1.13,kz-end*.28,.035,.38,.035,'metal',false);box(kx+.6,y+1.31,kz-end*.18,.035,.035,.24,'metal',false);
 for(let j=0;j<3;j++){box(kx-.75+j*.88,y+2.1,end*.44,.84,.75,.5,'cabinet');box(kx-.48+j*.88,y+1.87,end*.715,.03,.2,.03,'metal',false);}
 rememberFurniture('kitchen',furnitureStart,kx,y,kz);furnitureStart=pieces.length;
 // Sideboards in the remaining flats; only selected flats retain a radio.
 const rx=cx+side*8.25,rz=end*6.6;
 box(rx,y+.43,rz,1.36,.78,.59,'wood');box(rx,y+.835,rz,1.43,.055,.65,'wood',false);
 rememberFurniture('sideboard',furnitureStart,rx,y,rz);furnitureStart=pieces.length;
 if(!radioFlats.has(number))return;
 radioBody(rx,y,rz,end);
 rememberFurniture('radio',furnitureStart,rx,y,rz);
 radios.push({id:'radio-'+number,kind:'radio',zone:'housing',number,x:housing.x+rx,y:housing.y+y+1.095,z:housing.z+rz,end,floor:housing.y+y,on:false,station:0});
}
function radioBody(rx,y,rz,end){
 box(rx,y+1.095,rz,.88,.45,.29,'radio');box(rx,y+1.095,rz+end*.153,.8,.37,.025,'dark',false);
 for(let j=0;j<11;j++)box(rx-.32+j*.037,y+1.1,rz+end*.17,.013,.3,.013,'cloth',false);
 box(rx+.22,y+1.18,rz+end*.174,.25,.095,.012,'dial',false);
 for(let j=0;j<7;j++)box(rx+.12+j*.033,y+1.18,rz+end*.183,.008,.045,.008,'paper',false);
 for(const dx of [.13,.31])round(rx+dx,y+1.015,rz+end*.19,.079,.032,.079,'metal','cylinder',Math.PI/2);
 box(rx-.3,y+1.57,rz-.05,.014,.62,.014,'metal',false);
}
function worldRadio(id,zone,rx,rz,end,fixedStation=null){
 box(rx,.43,rz,1.1,.78,.55,'wood');box(rx,.835,rz,1.17,.055,.61,'wood',false);
 radioBody(rx,0,rz,end);
 radios.push({id,kind:'radio',zone,x:site.x+rx,y:site.y+1.095,z:site.z+rz,end,floor:site.y,on:false,station:0,fixedStation});
}
function wallDoorX(x,z0,z1,y,door,side,mat='plaster'){
 // Wall along z, with an actual 1.55 m doorway and a lintel above the player's head.
 const a=door-.8,b=door+.8;
 box(x,y+1.6,(z0+a)/2,.2,3.2,a-z0,mat);
 box(x,y+1.6,(b+z1)/2,.2,3.2,z1-b,mat);
 box(x,y+2.79,door,.2,.82,1.6,mat);
 // Door remains open inside the flat. It never occupies the aperture.
 box(x+side*.75,y+1.16,door+.84,1.45,2.3,.085,'wood',true);
}
function facade(x0,x1,z,y,mat='concrete'){
 const count=Math.round((x1-x0)/5.5),step=(x1-x0)/count;
 for(let i=0;i<count;i++){
  const x=x0+(i+.5)*step;
  box(x,y+.49,z,step-.035,.98,.28,mat);box(x,y+2.84,z,step-.035,.72,.28,mat);
  box(x-step/2+.48,y+1.74,z,.93,1.5,.28,mat);box(x+step/2-.48,y+1.74,z,.93,1.5,.28,mat);
  for(const xx of [x-1.34,x+1.34])box(xx,y+1.74,z,.07,1.52,.31,'wood',false);
  box(x,y+1.0,z,2.76,.065,.4,'rust',false);box(x,y+2.47,z,2.76,.065,.31,'wood',false);
  if(rng()<.65)box(x,y+1.75,z,.055,1.45,.1,'wood',false);
 }
}
// Four repeatable stair sections: four flats per floor, three floors, 48 total.
for(let core=0;core<4;core++){
 const cx=-42+core*28;cores.push({x:housing.x+cx,z:housing.z,base:housing.y});
 for(let level=0;level<3;level++){
  const y=level*LEVEL;
  for(const side of [-1,1]){
   slab(cx+side*8.5,y,0,11,20,'floor');
   // Per-floor party wall across the two flats in each wing.
   box(cx+side*8.5,y+1.6,0,11,3.2,.22,'plaster');
   wallDoorX(cx+side*3,-10,0,y,-8,side);
   wallDoorX(cx+side*3,0,10,y,8,side);
   facade(cx+(side<0?-14:3),cx+(side<0?-3:14),-10,y);
   facade(cx+(side<0?-14:3),cx+(side<0?-3:14),10,y);
   for(const end of [-1,1]){
    const ax=cx+side*8.5,az=end*5,number=core*12+level*4+(side>0?2:0)+(end>0?2:1);
    apartments.push({number,level,core,x:housing.x+ax,z:housing.z+az,y:housing.y+y,doorX:housing.x+cx+side*3,doorZ:housing.z+end*8});
    // Small kitchen/bath alcove beside the entrance; a wide passage leads to the living room.
    box(cx+side*6.1,y+1.5,end*2.0,.16,3,3.7,'plaster');
    furnish(cx,y,side,end,number);
    const bedStart=pieces.length;
    if(number!==1&&(number+level)%3!==0){
     box(cx+side*11.8,y+.27,end*3.6,1.8,.35,2.6,'wood');
     box(cx+side*11.8,y+.49,end*3.6,1.73,.16,2.5,'cloth');
     box(cx+side*11.8,y+.8,end*2.25,1.9,1.12,.09,'rust');rememberFurniture('bed',bedStart,cx+side*11.8,y,end*3.6);
    }
    const sofaStart=pieces.length;
    if(number%3===0){box(cx+side*10.9,y+.42,end*6.2,2.35,.62,.95,'cloth');box(cx+side*10.9,y+.91,end*6.55,2.35,.7,.22,'cloth');rememberFurniture('sofa',sofaStart,cx+side*10.9,y,end*6.2);}
    const tableStart=pieces.length;
    if(number%2===0){box(cx+side*8.5,y+.72,end*2.2,1.35,.1,.9,'wood');for(const a of [-.52,.52])for(const b of [-.3,.3])box(cx+side*8.5+a,y+.34,end*2.2+b,.07,.68,.07,'rust',false);rememberFurniture('table',tableStart,cx+side*8.5,y,end*2.2);}
    // Weathered plaster and torn paper; no rectangular moss or freestanding plants.
    for(let k=0;k<3;k++)box(cx+side*(7+k*1.7),y+1.8+rand(-.3,.3),end*.15,.3,rand(.6,1.3),.02,'paper',false);
   }
  }
  // The gallery beside the stairs connects front and rear landings on each floor.
  slab(cx+1.5,y,0,3,20,'floor');
  slab(cx-1.5,y,-8,3,4,'floor');slab(cx-1.5,y,8,3,4,'floor');
  {
   for(let i=0;i<20;i++){
    const treadY=y+(i+1)*LEVEL/20;
    // Step blocks follow a sloped underside, leaving headroom beneath the next flight.
    box(cx-1.45,treadY-.11,-6+(i+.5)*.6,2.72,.22,.6,'concrete',false);
   }
  }
  // The uppermost landing also keeps its stair opening and safety rail.
  {
   box(cx+.08,y+.56,0,.075,1.12,11.6,'rust');
   box(cx+.08,y+1.09,0,.08,.08,11.8,'rust',false);
  }
  // Porch and staircase glazing. Ground-level front entrance is open.
  if(level===0){
   box(cx-2.1,y+1.6,-10,1.8,3.2,.28);box(cx+2.1,y+1.6,-10,1.8,3.2,.28);box(cx,y+2.82,-10,2.4,.76,.28);
  }else facade(cx-3,cx+3,-10,y,'brick');
  facade(cx-3,cx+3,10,y,'brick');
  box(cx,y+2.9,9.78,1.5,.25,.04,'mold',false);
 }
 // A third flight reaches the roof through a real opening in the roof slab.
 for(const side of [-1,1])slab(cx+side*8.5,9.6,0,11,20);
 slab(cx+1.5,9.6,0,3,20);slab(cx-1.5,9.6,-8,3,4);slab(cx-1.5,9.6,8,3,4);
 for(const x of [-2.9,.05]){box(cx+x,10.16,0,.075,1.12,12,'rust');box(cx+x,10.69,0,.08,.08,12,'rust',false);}
 box(cx-1.45,10.16,-6,2.95,1.12,.075,'rust');
 for(const end of [-1,1])box(cx,10.15,end*10,28,1.1,.25);
 if(core===0||core===3)box(cx+(core===0?-13.86:13.86),10.15,0,.26,1.1,20);
 box(cx+7,10.13,-1,1.2,1.08,.9,'brick');
 // Brick entrance porches on the long panel facade.
 box(cx-1.7,1.35,-11.1,.35,2.7,2.2,'brick');box(cx+1.7,1.35,-11.1,.35,2.7,2.2,'brick');box(cx,2.82,-11.1,3.8,.24,2.5);
 slab(cx,0,-11.2,3.4,2.4,'floor');
}
for(const x of [-56,-28,0,28,56])box(x,4.8,0,.26,9.6,20);
// Panel seams and rusted drains. No exterior vegetation on the residential block.
for(let x=-55;x<=55;x+=5.5)for(const sign of [-1,1]){
 box(x,4.8,sign*10.17,.032,9.6,.025,'mold',false);
 for(const y of [3.2,6.4,9.6])box(x+2.73,y,sign*10.17,5.44,.028,.024,'mold',false);
}
for(const core of [-42,-14,14,42])box(core+3.6,4.8,-10.4,.13,9.6,.13,'rust',false);
// Shallow, smooth entrance aprons meet the level terrain pad.
housing.start={x:housing.x-42,z:housing.z-16,yaw:Math.PI,pitch:0};
// Plaster finishes inside each ceiling slab, never on its exposed top.
// Pieces and solids share these records, so collision stays with the walls.
for(const p of pieces)if(p.mat==='plaster'){
 const bottom=p.y-p.h/2,level=Math.floor((bottom-housing.y+.00001)/LEVEL);
 const top=Math.min(p.y+p.h/2,housing.y+(level+1)*LEVEL-.22);
 p.h=top-bottom;p.y=(top+bottom)/2;
}
// Sawmill: timber processing hall, roof trusses, saw bed, log feed and boiler chimney.
site=mill;
slab(0,.06,0,48,20,'floor');
for(let x=-24;x<=24;x+=6){
 for(const sign of [-1,1])box(x,2.65,sign*10,.45,5.3,.45,'brick');
 box(x,5.05,0,.24,.26,20,'wood',false);
 for(const sign of [-1,1]){
  box(x,6.3,sign*5,.24,.28,10.35,'wood',false);pieces.at(-1).rx=sign*.25;
  box(x,5.95,sign*3,.16,.2,6.6,'rust',false);pieces.at(-1).rx=-sign*.31;
 }
 box(x,6.3,0,.15,2.5,.15,'rust',false);
}
for(const sign of [-1,1])for(let x=-21;x<=21;x+=6){
 box(x,.65,sign*10,5.6,1.3,.35,'brick');
 if(!(sign<0&&x===-3))box(x,4.65,sign*10,5.6,1.2,.15,'wood');
 for(let j=0;j<6;j++)if(rng()>.3)box(x-2.5+j,2.6,sign*10,.13,2.6,.16,'wood',false);
}
// Large open gable entrances.
for(const x of [-24,24])for(const s of [-1,1])box(x,2.6,s*7.7,.35,5.2,4.6,'wood');
for(const x of [-21,-15,9,15,21])for(const sign of [-1,1]){
 if(rng()<.23)continue;
 const p=box(x,6.3,sign*5,5.7,.12,10.4,'rust',false);p.rx=sign*.25;
}
// Long toothed saw carriage with rollers and corroded drive wheels.
box(-2,.53,1,16,1.05,2.1,'rust');
for(let x=-9;x<6;x+=1.25)box(x,1.13,1,.23,.2,2.2,'metal',false);
for(const x of [-4,-1]){box(x,2.45,1,.22,3.4,.2,'rust');box(x,3.95,1,3.1,.2,.2,'rust',false);}
box(-2.5,2.4,1,.035,2.8,.14,'metal',false);
for(const z of [-.45,2.45])box(-3,.24,z,28,.18,.12,'rust',false);
box(9,.6,5,3.4,1.2,2.2,'rust');
box(9,1.55,5,1.3,1,1.5,'metal');
// Boiler-room fragment and square brick chimney.
box(20,1.7,-5,7,3.4,.4,'brick');box(23,1.7,-2,.4,3.4,6,'brick');
for(let i=0;i<7;i++)box(21,1+i*1.7,-3,2.5-i*.18,1.7,2.5-i*.18,'brick');
// Timber stacks on concrete sleepers in the log yard.
for(let row=0;row<4;row++)for(let n=0;n<5-row;n++){
 const p=box(-13+n*1.12+row*.5,.45+row*.78,17,1,.85,9,'log');p.geo='log';
}
for(const z of [13.5,20.5])box(-10,.15,z,8,.3,.5);
for(let i=0;i<24;i++){const p=box(rand(-20,22),.16,rand(-8,8),rand(1.8,5),.18,.27,'wood',false,rand(-.7,.7));}
for(let i=0;i<110;i++){
 const x=rand(-26,27),z=rand(-12,12);if(Math.abs(z)<3.8||Math.abs(x)>22&&Math.abs(z)<6)continue;
 plant(i%4?'dryopteris-carthusiana':'calamagrostis-epigejos',x,.08,z,rand(.55,1.4));
 if(i%4===0)box(x,.085,z,rand(1,4),.035,rand(1,2),'moss',false);
}
for(const [x,z,h]of [[-17,-6,8.5],[3,7,9],[-7,-7,5.5]])plant('betula-pendula',x,.08,z,h);
mill.start={x:mill.x-32,z:mill.z,yaw:-Math.PI/2,pitch:0};
// Receivers share the apartment controls. Keep both main passages and the
// tower's ladder landing open; all new solids enter the same collision bins.
site={...mill,y:mill.y+.06,zone:'mill'};
worldRadio('radio-sawmill','mill',-17,-2.4,1);
site={x:tower.x,y:tower.platformY,z:tower.z,zone:'tower'};
worldRadio('radio-tower','tower',1.1,.3,-1);
// A separate, fixed-frequency receiver inside the building at ground level.
// The entrance, ladder and the original platform receiver remain accessible.
const towerRoom=window.NovaLandmarks.towerRoom;
site={x:towerRoom.x,y:towerRoom.floorY,z:towerRoom.z,zone:'tower'};
worldRadio('radio-tower-machine','tower',1.9,-2.25,1,machineStation.id);
// v95: a switch panel on the side wall puts the PLANE broadcast on the tower's megaphones.
box(3.79,1.3,-1.05,.07,.46,.34,'metal',false);box(3.745,1.47,-1.05,.02,.06,.22,'paper',false);
{const b=round(3.73,1.27,-1.05,.11,.05,.11,'signal','cylinder',Math.PI/2);b.ry=Math.PI/2;}
const megaphoneButton={id:'tower-megaphone',kind:'megaphoneButton',x:site.x+3.73,y:site.y+1.27,z:site.z-1.05};
// Three horn speakers on the antenna, high above the platform.
site={x:tower.x,y:tower.platformY,z:tower.z,zone:'tower'};
const megaphoneHorn={x:tower.x,y:tower.platformY+5.1,z:tower.z+.8};
for(let i=0;i<3;i++){const ry=i*Math.PI*2/3+.5,sx=Math.sin(ry),sz=Math.cos(ry);
 const h=round(sx*.62,5.0,.8+sz*.62,.62,.95,.62,'metal','horn',Math.PI/2+.22);h.ry=ry;
 const d=round(sx*.13,5.1,.8+sz*.13,.26,.3,.26,'dark','cylinder',Math.PI/2+.22);d.ry=ry;}
box(0,5.1,.8,.32,.32,.32,'metal',false);
const megaphone={on:false};
// Spatial bins keep the 48 furnished flats inexpensive to collide with.
const bins=new Map(),key=(x,z)=>Math.floor(x/8)+','+Math.floor(z/8);
for(const p of solids){const c=Math.abs(Math.cos(p.ry)),s=Math.abs(Math.sin(p.ry)),rx=p.w/2*c+p.d/2*s,rz=p.d/2*c+p.w/2*s;
 for(let x=Math.floor((p.x-rx-.4)/8);x<=Math.floor((p.x+rx+.4)/8);x++)for(let z=Math.floor((p.z-rz-.4)/8);z<=Math.floor((p.z+rz+.4)/8);z++){const k=x+','+z;if(!bins.has(k))bins.set(k,[]);bins.get(k).push(p);}}
function blocked(x,z,foot=T.height(x,z),radius=.29){
 for(const p of bins.get(key(x,z))||[]){if(p.y+p.h/2<=foot+.18||p.y-p.h/2>=foot+1.75)continue;const dx=x-p.x,dz=z-p.z,c=Math.cos(p.ry),s=Math.sin(p.ry);if(Math.abs(dx*c-dz*s)<p.w/2+radius&&Math.abs(dx*s+dz*c)<p.d/2+radius)return true;}return false;
}
function nearHousing(x,z,pad=0){return Math.abs(x-housing.x)<56+pad&&Math.abs(z-housing.z)<10+pad;}
function clearRadioSight(eye,r){
 const distance=Math.hypot(r.x-eye.x,r.y-eye.y,r.z-eye.z),n=Math.ceil(distance/.12);
 for(let i=1;i<n;i++){
  const t=i/n,x=eye.x+(r.x-eye.x)*t,y=eye.y+(r.y-eye.y)*t,z=eye.z+(r.z-eye.z)*t;
  if(distance*(1-t)<.3)break;
  for(const p of bins.get(key(x,z))||[]){
   if(Math.abs(y-p.y)>p.h/2+.01)continue;
   const dx=x-p.x,dz=z-p.z,c=Math.cos(p.ry),s=Math.sin(p.ry);
   if(Math.abs(dx*c-dz*s)<p.w/2+.01&&Math.abs(dx*s+dz*c)<p.d/2+.01)return false;
  }
 }
 return true;
}
function radioTarget(eye,look){
 let target=null,best=Infinity;
 for(const r of radios){const dx=r.x-eye.x,dy=r.y-eye.y,dz=r.z-eye.z,d=Math.hypot(dx,dy,dz);if(d<.2||d>2.6)continue;const dot=(dx*look.x+dy*look.y+dz*look.z)/d;if(dot<.955||!clearRadioSight(eye,r))continue;const score=d+(1-dot)*24;if(score<best){target=r;best=score;}}
 return target;
}
const radioRooms=new Map(apartments.map(a=>[a.number,a]));
function radioMix(eye,yaw){
 let gain=0,pan=0;const channels=[...radioStations,machineStation].map(s=>({id:s.id,gain:0,pan:0}));
 for(const r of radios){
  if(!r.on)continue;const dx=r.x-eye.x,dz=r.z-eye.z,d=Math.hypot(dx,r.y-eye.y,dz);if(d>=38)continue;
  // Sound carries through doorways and into neighbouring flats. Sight still
  // controls the E interaction, but no longer switches the sound level at walls.
  const room=radioRooms.get(r.number),outside=room?Math.hypot(Math.max(0,Math.abs(eye.x-room.x)-5.5),Math.max(0,Math.abs(eye.z-room.z)-5)):0;
  const roomGain=1-.35*T.smooth(0,6,outside),floors=room?Math.abs(eye.y-1.68-r.floor)/LEVEL:0;
  const distanceGain=1/(1+(Math.max(0,d-1.2)/8)**1.5),edge=1-T.smooth(24,38,d);
  const g=.85*distanceGain*edge*roomGain*Math.pow(.08,floors*floors);
  const p=Math.max(-.85,Math.min(.85,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/Math.max(1,d))),channel=r.fixedStation?channels.find(c=>c.id===r.fixedStation):channels[Math.max(0,r.station-1)];
  if(!channel)continue;
  if(g>channel.gain){channel.gain=g;channel.pan=p;}
  if(g>gain){gain=g;pan=p;}
 }
 return{gain,pan,channels};
}
// v95: the megaphone switch in the tower room.
function megaphoneTarget(eye,look){
 const b=megaphoneButton,dx=b.x-eye.x,dy=b.y-eye.y,dz=b.z-eye.z,d=Math.hypot(dx,dy,dz);
 if(d<.2||d>2.4||(dx*look.x+dy*look.y+dz*look.z)/d<.95||!clearRadioSight(eye,b))return null;
 return{...b,on:megaphone.on,label:'E · Drücken'};
}
const towerMachine=()=>radios.find(r=>r.id==='radio-tower-machine');
function megaphoneOn(){return megaphone.on&&!!towerMachine()?.on;}
function toggleMegaphone(){megaphone.on=!megaphone.on;return{on:megaphone.on,radio:!!towerMachine()?.on};}
// Where the tower's voice comes from, seen from the listener; it carries over the whole map.
function megaphoneMix(eye,yaw){
 const h=megaphoneHorn,dx=h.x-eye.x,dy=h.y-eye.y,dz=h.z-eye.z,d=Math.hypot(dx,dy,dz);
 const room=window.NovaLandmarks.towerRoom,inRoom=Math.abs(eye.x-room.x)<4&&Math.abs(eye.z-room.z)<3&&eye.y<room.floorY+3.2;
 const indoor=inRoom||nearHousing(eye.x,eye.z,-1)&&eye.y>housing.y+.5&&eye.y<housing.y+LEVEL*housing.levels;
 return{active:megaphone.on&&!!towerMachine()?.on,distance:d,pan:Math.max(-.8,Math.min(.8,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/Math.max(1,Math.hypot(dx,dz)))),indoor};
}
function cycleRadio(r){if(r.fixedStation===machineStation.id){r.on=!r.on;r.station=r.on?1:0;return r.on?machineStation:null;}r.station=r.on?(r.station%radioStations.length)+1:1;if(r.on&&r.station===1){r.on=false;r.station=0;}else r.on=true;return r.on?radioStations[r.station-1]:null;}
function radioLabel(r){return r?.on?(r.fixedStation===machineStation.id?machineStation:radioStations[r.station-1])?.frequency||'Radio aus':'Radio aus';}
function resetRadios(seed=Math.floor(Math.random()*0x100000000)){
 const tune=T.rng(seed);for(const [i,s]of radioStations.entries())s.frequency=(4000+i*2500+Math.floor(tune()*1800))+' kHz';
 machineStation.frequency=(4000+radioStations.length*2500+Math.floor(tune()*1800))+' kHz';
 for(const r of radios){r.on=false;r.station=0;}
 megaphone.on=false;
}
resetRadios();
function walkHeight(x,z,previous,fallback){
 if(!nearHousing(x,z,4)&&!T.inSettlement(x,z))return fallback;
 const candidates=[];
 for(const s of surfaces)if(Math.abs(x-s.x)<s.w/2+.001&&Math.abs(z-s.z)<s.d/2+.001)candidates.push(s.y);
 for(const c of cores)if(x>c.x-2.85&&x<c.x-.08&&z>=c.z-6&&z<=c.z+6){
  for(let level=0;level<3;level++)candidates.push(c.base+level*LEVEL+Math.min(20,1+Math.floor((z-c.z+6)/.6))*LEVEL/20);
 }
 // The raised residential slab takes precedence over the terrain below it.
 // Terrain resumes beyond the apron; upper floors never drop to ground level.
 const residentialFloor=nearHousing(x,z,4)&&candidates.some(y=>Math.abs(y-housing.y)<.001);
 if(!residentialFloor&&(!nearHousing(x,z)||previous<housing.y+.2))candidates.push(fallback);
 const reachable=candidates.filter(y=>Math.abs(y-previous)<=.225).sort((a,b)=>Math.abs(a-previous)-Math.abs(b-previous));
 // At each foot of a flight, begin climbing instead of remaining on the lower slab.
 for(const c of cores)if(x>c.x-2.85&&x<c.x-.08&&z>=c.z-6&&z<c.z-5.4)for(let level=0;level<3;level++)if(Math.abs(previous-(c.base+level*LEVEL))<.05)return c.base+level*LEVEL+LEVEL/20;
 return reachable.length?reachable[0]:null;
}
function pieceGeometry(THREE,p){let g;
  if(p.geo==='cylinder'){g=new THREE.CylinderGeometry(.5,.5,1,16);g.scale(p.w,p.h,p.d);}
  else if(p.geo==='horn'){g=new THREE.CylinderGeometry(.5,.12,1,16,1,true);g.scale(p.w,p.h,p.d);}
  else if(p.geo==='basin'){
   const shape=new THREE.Shape(),hole=new THREE.Path();shape.absellipse(0,0,.5,.5,0,Math.PI*2,false);hole.absellipse(0,0,.39,.4,0,Math.PI*2,true);shape.holes.push(hole);
   g=new THREE.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false,curveSegments:12});g.translate(0,0,-.5);g.rotateX(-Math.PI/2);g.scale(p.w,p.h,p.d);
  }
  else if(p.geo==='log'){g=new THREE.CylinderGeometry(.4,.45,p.d,8);g.rotateX(Math.PI/2);}else{
   g=C.pieceGeometry(THREE,{sx:p.w,sy:p.h,sz:p.d,cell:p.mat==='brick'?1:p.mat==='floor'?3:0,...(!['concrete','brick','plaster','floor','porcelain','paper'].includes(p.mat)?{surface:'plain'}:{})});
  }
 return g;
}
function createVisuals(THREE,scene,textures,models){
 const groups=new Map(),batches=new Map();
 const colors={concrete:0xb0afa0,brick:0x8b7d69,plaster:0x9c998e,floor:0x777369,rust:0x79604c,wood:0x615c49,cabinet:0x9a9d88,porcelain:0xbdbbaa,enamel:0xc3bfa9,dark:0x252a26,radio:0x705038,dial:0x98917a,cloth:0x615f4e,moss:0x526d32,mold:0x28372b,paper:0xb1b09b,metal:0x6a7168,log:0x5b5441,signal:0x8c2a1c};
 const materials=Object.fromEntries(Object.entries(colors).map(([k,color])=>[k,new THREE.MeshLambertMaterial({map:['porcelain','enamel','dark','dial','cabinet','signal'].includes(k)?null:['concrete','brick','plaster','floor','paper'].includes(k)?textures.ruin:['wood','radio','cloth','log'].includes(k)?textures.wood:k==='moss'?textures.moss:k==='mold'?textures.bark:textures.rust,color,side:THREE.DoubleSide})]));
 const day=window.NovaDayApartment.create(THREE,textures,materials,housing,cores);
 function add(g,mat,zone){if(g.index){const t=g.toNonIndexed();g.dispose();g=t;}const key=zone+':'+mat.uuid;if(!batches.has(key))batches.set(key,{zone,mat,list:[]});batches.get(key).list.push(g);}
 for(const p of pieces){
  if(p.hidden)continue;
  const zone=p.zone;let g;
  g=pieceGeometry(THREE,p);
  if(zone==='housing'&&p.mat==='plaster'){
   const v=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
   for(let i=0;i<v.count;i++)uv.setXY(i,(Math.abs(n.getX(i))>.5?v.getZ(i)+p.z:v.getX(i)+p.x)/2.1,(v.getY(i)+p.y-housing.y)/2.7);
  }
  g.rotateX(p.rx||0);g.rotateY(p.ry);g.translate(p.x,p.y,p.z);if(zone==='housing')day.piece(p,g,add);else add(g,materials[p.mat],zone);
 }
 for(const p of pieces){if(p.x>=0||p.mat!=='plaster'||p.h<2.5)continue;for(const side of [-1,1]){const alongX=p.w>p.d,g=new THREE.BoxGeometry(alongX?p.w:.045,.12,alongX?.045:p.d);g.translate(p.x+(alongX?0:side*(p.w/2+.016)),p.y-p.h/2+.06,p.z+(alongX?side*(p.d/2+.016):0));add(g,materials.wood,'housing');}}

 // Climbing ivy follows wet panel joints and hangs from broken eaves.
 const ivyShape=new THREE.Shape();
 [[0,.6],[-.14,.25],[-.43,.38],[-.3,.03],[-.5,-.12],[-.19,-.22],[0,-.46],[.2,-.2],[.48,-.1],[.29,.06],[.44,.36],[.13,.25]].forEach(([x,y],i)=>i?ivyShape.lineTo(x,y):ivyShape.moveTo(x,y));ivyShape.closePath();
 const ivyGeo=new THREE.ShapeGeometry(ivyShape),ivyMat=new THREE.MeshLambertMaterial({map:textures.moss,color:0x688248,side:THREE.DoubleSide});
 const grow=T.rng(310048),dummy=new THREE.Object3D();
 for(const [zone,place,total]of [['mill',mill,22]])for(let k=0;k<total;k++){
  const sign=k%2?1:-1,xx=zone==='housing'?-54+grow()*108:-23+grow()*46,top=zone==='housing'?3+grow()*7:2+grow()*4;
  if(zone==='housing'&&cores.some(c=>Math.abs(place.x+xx-c.x)<3.2))continue;
  for(let y=.3;y<top;y+=.3){
   const x=place.x+xx+Math.sin(y*.9+k)*.3,z=place.z+sign*10.22;
   const stem=new THREE.CylinderGeometry(.018,.024,.38,4);stem.translate(x,place.y+y,z);add(stem,materials.mold,zone);
   for(let j=0;j<3;j++){
    dummy.position.set(x+(grow()-.5)*.8,place.y+y+(grow()-.5)*.5,z+sign*(.05+grow()*.12));dummy.rotation.set(.15,sign>0?0:Math.PI,(grow()-.5)*1.8);dummy.scale.setScalar(.35+grow()*.45);dummy.updateMatrix();add(ivyGeo.clone().applyMatrix4(dummy.matrix),ivyMat,zone);
   }
  }
 }
 // Sparse interior ivy in twelve flats. Individual leaves follow hanging stems.
 for(const a of apartments.filter(a=>a.number%4===1))for(let k=0;k<5;k++){
  const xx=a.x+3.2+k*.22,zz=a.z+(a.z<housing.z?-4.79:4.79),length=.6+grow()*1.8;
  for(let drop=0;drop<length;drop+=.19){
   const x=xx+Math.sin(drop*3+k)*.1,y=a.y+2.95-drop,z=zz+Math.sin(drop*2)*.06;
   const stem=new THREE.CylinderGeometry(.009,.013,.23,4);stem.translate(x,y,z);add(stem,materials.mold,'housing');
   for(const sign of [-1,1]){dummy.position.set(x+sign*(.08+grow()*.08),y-.02,z);dummy.rotation.set(.12,sign*.3,(grow()-.5)*1.2);dummy.scale.setScalar(.19+grow()*.14);dummy.updateMatrix();add(ivyGeo.clone().applyMatrix4(dummy.matrix),ivyMat,'housing');}
  }
 }
 ivyGeo.dispose();
 for(const b of batches.values()){
  const g=new THREE.BufferGeometry();for(const name of ['position','normal','uv']){const data=new Float32Array(b.list.reduce((n,a)=>n+a.attributes[name].array.length,0));let n=0;for(const a of b.list){data.set(a.attributes[name].array,n);n+=a.attributes[name].array.length;}g.setAttribute(name,new THREE.BufferAttribute(data,name==='uv'?2:3));}
  if(b.mat.vertexColors){const color=new Float32Array(g.attributes.position.count*3).fill(1);let n=0;for(const a of b.list){if(a.attributes.color)color.set(a.attributes.color.array,n);n+=a.attributes.position.count*3;}g.setAttribute('color',new THREE.Float32BufferAttribute(color,3));}
  g.computeBoundingSphere();const mesh=new THREE.Mesh(g,b.mat);mesh.receiveShadow=true;mesh.castShadow=true;
  if(!groups.has(b.zone)){const group=new THREE.Group();group.name={housing:'48 abandoned apartments',mill:'Ruined timber mill',tower:'Radio on tower platform'}[b.zone];groups.set(b.zone,group);scene.add(group);}groups.get(b.zone).add(mesh);b.list.forEach(a=>a.dispose());
 }
 // Keep each plant in model coordinates. Baking its world position into a
 // shared mesh makes the breathing shader scale its distance from world zero.
 const planted=new Map();
 for(const p of plants){const zone=p.x<0?'housing':'mill',key=zone+':'+p.id;if(!planted.has(key))planted.set(key,{zone,id:p.id,records:[]});planted.get(key).records.push(p);}
 for(const {zone,id,records}of planted.values()){
  const model=models?.get(id);if(!model)continue;
  for(const part of model.parts){
   const mesh=new THREE.InstancedMesh(part.geometry,part.material,records.length);mesh.name='Flora: '+id;mesh.userData.rootedSettlement=true;mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=true;
   for(const [i,p]of records.entries()){dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.yaw,0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}
   mesh.instanceMatrix.needsUpdate=true;groups.get(zone).add(mesh);
  }
 }
 const powerLamps=[],lampColor=new THREE.Color();
 for(const [zone,group]of groups){
  const records=radios.filter(r=>r.zone===zone);if(!records.length)continue;
  const lamps=new THREE.InstancedMesh(new THREE.BoxGeometry(.038,.028,.018),new THREE.MeshBasicMaterial({color:0xffffff}),records.length);
  lamps.name='Radio power lamps';lamps.frustumCulled=false;
  for(const [i,r]of records.entries()){dummy.position.set(r.x+.34,r.y+.092,r.z+r.end*.195);dummy.rotation.set(0,0,0);dummy.scale.setScalar(1);dummy.updateMatrix();lamps.setMatrixAt(i,dummy.matrix);lamps.setColorAt(i,lampColor.setHex(0x28271d));}
  group.add(lamps);powerLamps.push({lamps,records});
 }
 return{groups,materials,dayMaterials:day.materials,prepareDay(){day.prepare(groups.get('housing'));},applyWallpaper(map){materials.plaster.map=map;materials.plaster.color.setHex(0xf4f0d8);materials.plaster.needsUpdate=true;},update(x,z,viewScale=1){for(const [id,g]of groups){const s={housing,mill,tower}[id];g.visible=Math.hypot(x-s.x,z-s.z)<(id==='housing'?240:190)*(.5+.5*viewScale);}for(const entry of powerLamps){const {lamps,records}=entry;let key='';for(const r of records)key+=r.on?'1':'0';if(entry.key===key)continue;entry.key=key;for(const [i,r]of records.entries())lamps.setColorAt(i,lampColor.setHex(r.on?0xf0b65c:0x28271d));lamps.instanceColor.needsUpdate=true;}}};
}
window.NovaSettlements={furnitureCatalog,furniturePieces,pieceGeometry,housing,mill,cores,apartments,radios,radioStations,radioLabel,cycleRadio,pieces,solids,surfaces,plants,blocked,walkHeight,nearHousing,radioTarget,megaphoneTarget,toggleMegaphone,megaphoneMix,megaphoneOn,radioMix,resetRadios,createVisuals};
})();
