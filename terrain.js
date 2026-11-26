// Coastal relief and habitat gradients adapted from Rannamets 0.2.
(() => {
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const random=rng(1234567),noiseGrid=Float32Array.from({length:65536},random);
function vn(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=smooth(0,1,x-ix),fz=smooth(0,1,z-iz),at=(a,b)=>noiseGrid[((b&255)<<8)+(a&255)];return(at(ix,iz)*(1-fx)+at(ix+1,iz)*fx)*(1-fz)+(at(ix,iz+1)*(1-fx)+at(ix+1,iz+1)*fx)*fz;}
function fbm(x,z,n=3){let sum=0,weight=0,a=.5;for(let i=0;i<n;i++){sum+=vn(x,z)*a;weight+=a;x=x*2.02+13.7;z=z*2.02+7.3;a*=.5;}return sum/weight;}
const WORLD={xmin:-560,xmax:640,zmin:-170,zmax:600,width:1200,depth:770};
const GRID={xmin:-560,zmin:-172,step:4,nx:300,nz:193};
const shore=x=>-152+12*Math.sin(x*.021)+5*Math.sin(x*.053+1.1)+6*(vn(x*.009,7.3)-.5);
const riverA=z=>-455+46*Math.sin(z*.011)+17*Math.sin(z*.029+1.2);
const riverB=z=>458+41*Math.sin(z*.0125+2)+14*Math.sin(z*.031);
const riverC=x=>520+31*Math.sin(x*.0095+.7)+12*Math.sin(x*.024);
function riverT(x,z){return Math.min(Math.abs(x-riverA(z))/(11+3.5*Math.sin(z*.017)),Math.abs(x-riverB(z))/(10+3*Math.sin(z*.021+1)),z>365?Math.abs(z-riverC(x))/(9+3*Math.sin(x*.02)):99);}
const ponds=[{x:-232,z:282,rx:24,rz:19,soil:'acid'},{x:265,z:130,rx:23,rz:17,soil:'base'}];
const ruins=[{x:-139,z:208,x0:-178,x1:-72,z0:176,z1:240},{x:147,z:269,x0:100,x1:194,z0:232,z1:306}];
const settlements=[{id:'sawmill',x:288,z:38,x0:260,x1:325,z0:19,z1:66},{id:'housing',x:-354,z:443,x0:-414,x1:-294,z0:424,z1:461}];
function inSettlement(x,z,margin=0){return settlements.some(p=>x>p.x0-margin&&x<p.x1+margin&&z>p.z0-margin&&z<p.z1+margin);}
// Keep the surveyed map extent; the unmarked facility borders the eastern edge.
// Field reference is row 6, column 8 in the north-to-south 100 m grid.
const paeikeselinnGate={x:190,z:380,half:8,row:6,column:8};
function paeikeselinnReserved(x,z,pad=0){return Math.abs(x-paeikeselinnGate.x)<paeikeselinnGate.half+pad&&Math.abs(z-paeikeselinnGate.z)<paeikeselinnGate.half+pad;}
const MAP={xmin:-560,xmax:560,zmin:-170,zmax:600};
// Map northing labels are 600 - world z: the requested 400 line is world z=200.
const biosphereSite={x:riverB(200)+(10+3*Math.sin(200*.021+1))*1.4+100,z:200,mapHeight:400};
// Building footprints in facility-local coordinates, not one rectangular clearing.
const biosphereFootprints=[[-14.5,14.5,-14.5,14.5],[-28.5,-15.5,-10.5,10.5],[-16, -14,-1.8,1.8],[14,25.5,-12.5,10.5],[25.5,54,-14.5,44.5],[-2.1,2.1,14,33],[1.4,8.5,29,33],[4.2,8.5,33,41.5]];
function biosphereReserved(x,z,margin=0){const p=biosphereSite,lx=p.z-z,lz=x-p.x;return biosphereFootprints.some(b=>lx>b[0]-margin&&lx<b[1]+margin&&lz>b[2]-margin&&lz<b[3]+margin)||(x>riverB(p.z)+38&&x<p.x-14&&Math.abs(z-p.z)<1.5+margin);}
const biospherePad={...biosphereSite,x0:biosphereSite.x-19,x1:biosphereSite.x+49,z0:biosphereSite.z-58,z1:biosphereSite.z+33};
const radioSite={x:-360,z:100};
const towerPad={x:radioSite.x+10,z:radioSite.z+4,x0:radioSite.x-14,x1:radioSite.x+22,z0:radioSite.z-15,z1:radioSite.z+19},pads=[...ruins,towerPad,...settlements,biospherePad];
function poolT(x,z){let q=Infinity,index=-1;ponds.forEach((p,i)=>{const d=Math.hypot((x-p.x)/p.rx,(z-p.z)/p.rz);if(d<q){q=d;index=i;}});return{q,index};}
const pathX=z=>14+Math.sin(z*.009)*19;
function pathDistance(x,z){return Math.min(Math.abs(x-pathX(z)),Math.abs(z-(211+Math.sin(x*.012)*7))*(x>-178&&x<178?1:99));}
function disturbance(x,z){let distance=Infinity;for(const p of ruins)distance=Math.min(distance,Math.hypot(Math.max(p.x0-x,0,x-p.x1),Math.max(p.z0-z,0,z-p.z1)));return Math.max(1-smooth(5,38,distance),(1-smooth(2,7,pathDistance(x,z)))*.6);}
function inRuin(x,z,margin=0){return ruins.some(p=>x>p.x0-margin&&x<p.x1+margin&&z>p.z0-margin&&z<p.z1+margin);}
function rawHeight(x,z){
 const d=z-shore(x);let h;
 if(d<0)h=Math.max(-3.6,-.2+d*.055);
 else h=.12+Math.min(d/10,1)*1.1+smooth(8,34,d)*2.2+smooth(30,110,d)*1.9+(fbm(x*.0125,z*.0125,3)-.5)*6.4*smooth(1.5,24,d)+(fbm(x*.055,z*.055,2)-.5)*1.1*smooth(1.5,24,d);
 const rt=riverT(x,z);
 if(rt<3.4){const w=Math.exp(-rt*rt*.72);h=h*(1-w)+(-1.35+(fbm(x*.09+3,z*.09+7,2)-.5)*.5)*w;}
 const pool=poolT(x,z);
 if(pool.q<2.5){const w=1-smooth(.55,2.5,pool.q);h=h*(1-w)+(-.8+pool.q*.14)*w;}
 return h;
}
pads.forEach(p=>p.y=rawHeight(p.x,p.z)+.12);
function height(x,z){let h=rawHeight(x,z);for(const p of pads){const dx=Math.max(p.x0-x,0,x-p.x1),dz=Math.max(p.z0-z,0,z-p.z1),a=1-smooth(0,12,Math.hypot(dx,dz));h=h*(1-a)+p.y*a;}return h;}
// Cached grid is shared by rendering, collision and every plant's root position.
const heights=new Float32Array((GRID.nx+1)*(GRID.nz+1));
for(let iz=0;iz<=GRID.nz;iz++)for(let ix=0;ix<=GRID.nx;ix++)heights[iz*(GRID.nx+1)+ix]=height(GRID.xmin+ix*4,GRID.zmin+iz*4);
function surface(x,z){const gx=clamp((x-GRID.xmin)/4,0,GRID.nx-.00001),gz=clamp((z-GRID.zmin)/4,0,GRID.nz-.00001),ix=Math.floor(gx),iz=Math.floor(gz),fx=gx-ix,fz=gz-iz,i=iz*(GRID.nx+1)+ix,a=heights[i],b=heights[i+1],c=heights[i+GRID.nx+1],d=heights[i+GRID.nx+2];return fx+fz<=1?a+fx*(b-a)+fz*(c-a):(1-fz)*b+(1-fx)*c+(fx+fz-1)*d;}
function env(x,z){
 const d=z-shore(x),h=surface(x,z),rt=riverT(x,z),pool=poolT(x,z),bog=smooth(.5,.71,fbm(x*.0075+13,z*.0075+41,3))*smooth(70,130,d);
 const wet=clamp(Math.max(bog,(1-smooth(1,3.2,pool.q))*.96,(1-smooth(.8,3.5,rt))*.87),0,1);
 const open=clamp(1-smooth(92,220,d)*.7+(fbm(x*.015+31,z*.015+19,2)-.5)*.7+wet*.14,0,1);
 const base=Math.max(pool.index===1?1-smooth(1,4,pool.q):0,smooth(120,360,x)*(1-smooth(65,165,d))*.85);
 return{x,z,d,h,rt,pool:pool.q,poolIndex:pool.index,wet,open,base,disturbance:disturbance(x,z),path:pathDistance(x,z)};
}
function suitability(t,e){
 const {d,h,rt,wet,open}=e,id=t.id,bell=(a,b,c)=>smooth(a,b,d)*(1-smooth(b,c,d));
 if(t.modelType==='waterlily')return e.pool<.78&&h<-.08?(id==='nymphaea-candida'?(e.poolIndex===0?1:.25):(e.poolIndex===1?1:.35)):0;
 if(h<.11||d<1.5||e.path<1.4||inRuin(e.x,e.z,3)||inSettlement(e.x,e.z,1))return 0;
 let score=0;
 for(const habitat of t.habitats){let s=0;
  if(habitat==='driftline')s=bell(1.5,5,12);
  if(habitat==='embryonic_dune')s=bell(6,14,25);
  if(habitat==='white_dune')s=bell(14,29,47);
  if(habitat==='gray_dune')s=bell(34,58,91)*open;
  if(habitat==='open_heath')s=bell(65,108,180)*(.5+.5*open);
  if(habitat==='forest'||habitat==='forest_floor')s=smooth(96,152,d)*(habitat==='forest_floor'?(1-open*.65):1);
  if(habitat==='forest_edge')s=smooth(68,112,d)*open;
  if(habitat==='wet_slack')s=smooth(.38,.8,wet)*(d>45?1:0);
  if(habitat==='wet_forest')s=smooth(100,170,d)*wet*(1-open*.55);
  if(habitat==='river_margin')s=(1-smooth(1,3.3,rt));
  if(habitat==='bog_pool')s=wet*(1-e.base)*smooth(.7,1.15,e.pool)*(1-smooth(1.7,3.6,e.pool));
  if(habitat==='disturbance')s=e.disturbance;
  if(['deadwood','birch_bark','pine_bark'].includes(habitat))s=smooth(105,170,d)*(1-open*.4);
  score=Math.max(score,s);
 }
 // The source's ecology text refines its broad habitat tags.
 if(['andromeda-polifolia','rhododendron-tomentosum','vaccinium-uliginosum','myrica-gale','eriophorum-gracile','rhynchospora-fusca','aulacomnium-palustre'].includes(id))score=Math.max(score,smooth(75,140,d))*smooth(.5,.85,wet)*(1-e.base*.9);
 if(['dactylorhiza-russowii','dactylorhiza-incarnata','epipactis-palustris','cladium-mariscus'].includes(id))score=smooth(.48,.85,wet)*smooth(.3,.75,e.base);
 if(['deschampsia-cespitosa','molinia-caerulea','salix-cinerea','viola-uliginosa'].includes(id))score*=smooth(.3,.7,wet);
 if(['calluna-vulgaris','juniperus-communis','avenella-flexuosa','luzula-campestris','vaccinium-vitis-idaea'].includes(id))score*=1-smooth(.45,.9,wet);
 if(['vaccinium-myrtillus','maianthemum-bifolium','luzula-pilosa','lysimachia-europaea','lycopodium-annotinum'].includes(id))score=smooth(125,190,d)*(1-open)*(.65+.35*wet);
 if(id==='dryopteris-carthusiana')score*=smooth(.25,.65,wet);
 if(id==='goodyera-repens')score=smooth(145,230,d)*(1-open)*(1-wet*.5);
 if(id==='epipactis-atrorubens')score=bell(48,100,185)*open*smooth(.2,.6,e.base)*(1-wet);
 if(['brachythecium-albicans','polytrichum-piliferum','polytrichum-juniperinum','ceratodon-purpureus'].includes(id))score=Math.max(bell(30,65,160)*open,e.disturbance*.65)*(1-wet);
 return clamp(score,0,1);
}
function area(x,z){const e=env(x,z);const settlement=settlements.find(p=>x>p.x0-8&&x<p.x1+8&&z>p.z0-8&&z<p.z1+8);if(settlement)return settlement.id==='housing'?'ABANDONED APARTMENTS':'RUINED SAWMILL';if(inRuin(x,z,10))return x>0?'ABANDONED PIG FARM':'OLD FACTORY';if(e.d<15)return 'BALTIC SHORE';if(e.d<85)return 'COASTAL DUNES';if(e.pool<3||e.wet>.7)return e.base>.4?'WET DUNE FEN':'PINE BOG';if(e.rt<3)return 'RIVER BANK';if(e.d<150)return 'DUNE HEATH';return 'MOSS FOREST';}
window.NovaTerrain={WORLD,MAP,paeikeselinnGate,paeikeselinnReserved,biosphereSite,biosphereReserved,GRID,heights,radioSite,riverA,riverB,riverC,settlements,inSettlement,shore,riverT,ponds,ruins,pathX,pathDistance,inRuin,height:surface,rawHeight:height,env,suitability,area,clamp,smooth,rng,fbm};
})();
