// Species templates, clustered habitat placement and bounded instanced rendering.
(() => {
'use strict';
const T=window.NovaTerrain,L=window.NovaLandmarks,taxa=window.NOVA_TAXA,byId=new Map(taxa.map(t=>[t.id,t]));
const isTree=t=>t.modelType.startsWith('tree_'),isMoss=t=>['moss','liverwort'].includes(t.modelType);
const sceneTaxa=taxa.filter(t=>!isMoss(t));
const hash=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
const profiles={
 'chamaenerion-angustifolium':{h:1.45,flower:0xb7468a,spike:10},'maianthemum-bifolium':{h:.22,flower:0xeee8cc,leaves:2},
 'melampyrum-pratense':{h:.35,flower:0xedd47e,spike:4},'lysimachia-europaea':{h:.18,flower:0xf0edda,leaves:7},
 'eryngium-maritimum':{h:.48,flower:0x8b9ba2,leaves:8},'lathyrus-japonicus-subsp-maritimus':{h:.36,flower:0xa06db3,leaves:10},
 'pulsatilla-pratensis':{h:.25,flower:0x644265,leaves:4},'viola-uliginosa':{h:.19,flower:0x8f76b5,leaves:5},
 'honckenya-peploides':{h:.16,flower:0xeae9c8,leaves:12},'cakile-maritima':{h:.33,flower:0xdab5d3,leaves:9},
 'dianthus-arenarius':{h:.28,flower:0xe7e5d5,leaves:5},'dianthus-deltoides':{h:.29,flower:0xc24878,leaves:5},
 'jasione-montana':{h:.32,flower:0x8b91be,leaves:6},'sedum-acre':{h:.085,flower:0xdbcb57,leaves:16},
 'goodyera-repens':{h:.22,flower:0xecebd5,spike:9},'dactylorhiza-russowii':{h:.36,flower:0xb062a3,spike:12},
 'dactylorhiza-incarnata':{h:.43,flower:0xc1789e,spike:14},'epipactis-atrorubens':{h:.48,flower:0x834655,spike:8},
 'epipactis-palustris':{h:.42,flower:0xeae3ca,spike:7},'leymus-arenarius':{h:1.15},'ammophila-arenaria':{h:1.05},
 'cladium-mariscus':{h:1.55},'calamagrostis-epigejos':{h:1.35},'luzula-campestris':{h:.25},'luzula-pilosa':{h:.29},
 'eriophorum-gracile':{h:.48},'rhynchospora-fusca':{h:.3},'lycopodium-annotinum':{h:.26},
 'juniperus-communis':{h:2.8},'myrica-gale':{h:1.35},'frangula-alnus':{h:2.7},'salix-cinerea':{h:2.5},
 'andromeda-polifolia':{h:.23},'empetrum-nigrum':{h:.19},'rhododendron-tomentosum':{h:.65},
 'vaccinium-myrtillus':{h:.42},'vaccinium-vitis-idaea':{h:.25},'vaccinium-uliginosum':{h:.52},'calluna-vulgaris':{h:.45}
};
const barkOnly=new Set(['radula-complanata','lewinskya-speciosa','pylaisia-polyantha']);
const woodOnly=new Set(['nowellia-curvifolia','fuscocephaloziopsis-lunulifolia','herzogiella-seligeri']);
const sizeFor=t=>isTree(t)?1.18:isMoss(t)?1.25:t.id==='chamaenerion-angustifolium'?1.28:({grass:1.4,fern:1.55,shrub:1.25,dwarf_shrub:1.8,orchid:1.65,herb:1.7}[t.modelType]||1.5);
function createPopulation(){
 const random=T.rng(200096),records=[],trees=[],logs=[],counts=Object.fromEntries(taxa.map(t=>[t.id,0])),buckets=new Map(),treeCells=new Map();
 const key=(x,z,size=32)=>Math.floor(x/size)+','+Math.floor(z/size);
 function add(t,x,z,scale,extra={}){scale*=extra.support?1:sizeFor(t);const record={id:t.id,x,z,y:T.height(x,z)-.015,scale,yaw:random()*Math.PI*2,rx:0,rz:0,h:isMoss(t)?scale*.09:scale,type:t.modelType,support:'ground',...extra};records.push(record);counts[t.id]++;const k=key(x,z);if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(record);return record;}
 function treeAt(x,z){const ix=Math.floor(x/8),iz=Math.floor(z/8);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const t of treeCells.get((ix+dx)+','+(iz+dz))||[])if(Math.hypot(t.x-x,t.z-z)<t.r+.45)return t;return null;}
 function addTree(id,x,z,h){const t=byId.get(id),e=T.env(x,z);if(T.biosphereReserved(x,z,2)||L.bridgeReserved(x,z,2)||e.h<.25||e.d<69||e.path<3.2||T.inRuin(x,z,8)||T.inSettlement(x,z,3)||Math.hypot(x-L.tower.x,z-L.tower.z)<19||L.blocked(x,z,1)||treeAt(x,z))return;
  const record=add(t,x,z,h,{r:h*sizeFor(t)*(id==='pinus-sylvestris'?.021:.014)+.22,score:1});trees.push(record);const k=key(x,z,8);if(!treeCells.has(k))treeCells.set(k,[]);treeCells.get(k).push(record);
 }
 for(let z=-85;z<510;z+=6.6)for(let x=-486;x<486;x+=6.6){const px=x+(random()-.5)*4,pz=z+(random()-.5)*4,e=T.env(px,pz),cover=T.smooth(70,130,e.d)*(1-e.open*.38)*(1-e.wet*.37);
  if(random()>cover||e.rt<1.35||e.pool<1.5)continue;
  const a=random();let id='pinus-sylvestris';
  if(e.wet>.58)id=a<.38?'betula-pubescens':a<.62?'picea-abies':a<.89?'pinus-sylvestris':'frangula-alnus';
  else if(e.disturbance>.2)id=a<.48?'pinus-sylvestris':a<.70?'betula-pendula':a<.86?'populus-tremula':a<.94?'salix-caprea':'sorbus-aucuparia';
  else id=a<.72?'pinus-sylvestris':a<.85?'betula-pendula':a<.94&&e.d>160&&e.wet>.2&&e.open<.6?'picea-abies':'sorbus-aucuparia';
  if(id==='frangula-alnus')continue;
  addTree(id,px,pz,(id==='sorbus-aucuparia'?7.5:11.5)+random()*7);
 }
 // Match the inherited forest entrance, with clear space to start walking.
 addTree('pinus-sylvestris',3,137,15.8);addTree('betula-pendula',26,142,13.1);
 for(let z=100;z<482;z+=39)for(let x=-385;x<385;x+=43){const px=x+(random()-.5)*26,pz=z+(random()-.5)*22,e=T.env(px,pz);if(e.h<.2||e.path<6||T.inRuin(px,pz,8)||T.inSettlement(px,pz,3)||e.pool<1.6||random()<.45)continue;logs.push({x:px,z:pz,y:e.h+.20,yaw:random()*Math.PI*2,len:3+random()*3,r:.20+random()*.15,wet:e.wet});}
 const candidates=[];
 for(let z=-151;z<515;z+=8)for(let x=-480;x<481;x+=9){const px=x+(random()-.5)*5,pz=z+(random()-.5)*5,e=T.env(px,pz);if(!T.inRuin(px,pz,3)&&!T.inSettlement(px,pz,2))candidates.push(e);}
 const anchors={};
 for(const t of taxa){
  if(isTree(t)){const existing=trees.find(r=>r.id===t.id);if(existing)anchors[t.id]=[existing.x,existing.z];continue;}
  const r=T.rng(hash(t.id)),h=profiles[t.id]?.h||t.worldHeight;
  // Epiphytes attach to actual broadleaf trunks; wood specialists sit on actual logs.
  if(barkOnly.has(t.id)||woodOnly.has(t.id)||(isMoss(t)&&t.habitats.includes('deadwood'))){
   const bark=barkOnly.has(t.id),hosts=bark?trees.filter(a=>!['pinus-sylvestris','picea-abies'].includes(a.id)&&a.z-T.shore(a.x)>150):logs;
   const n=Math.min(hosts.length,bark?18:25);
   for(let i=0;i<n;i++){const host=hosts[Math.floor(r()*hosts.length)];if(!host)continue;
    if(bark){const yaw=r()*Math.PI*2,radius=Math.max(.10,host.r-.22)*.92,y=T.height(host.x,host.z)+.55+r()*.8;add(t,host.x+Math.sin(yaw)*radius,host.z+Math.cos(yaw)*radius,.25+r()*.16,{y,rx:Math.PI/2,yaw,rz:0,support:'bark',host:host.id,score:1});}
    else {const along=(r()-.5)*host.len*.7;add(t,host.x+Math.sin(host.yaw)*along,host.z+Math.cos(host.yaw)*along,1,{y:host.y+host.r*.94,yaw:host.yaw,sx:host.r*1.65,sz:.7+r()*.7,support:'deadwood',host:'fallen-log',score:1});}
   }
   if(bark||woodOnly.has(t.id)){const first=records.find(a=>a.id===t.id);if(first)anchors[t.id]=[first.x,first.z];continue;}
  }
  const suitable=candidates.map(e=>({e,score:T.suitability(t,e)})).filter(a=>a.score>.19);
  if(!suitable.length)throw new Error('No suitable habitat for '+t.id);
  let clusters=isMoss(t)?28:t.modelType==='grass'?92:t.modelType==='orchid'?5:t.modelType==='waterlily'?9:t.modelType.includes('shrub')?45:30;
  if(t.id==='calluna-vulgaris'||t.id==='vaccinium-myrtillus'||t.id==='vaccinium-vitis-idaea')clusters=150;
  const common=Math.max(.22,Math.min(1,t.abundance||.12));clusters=Math.max(t.modelType==='orchid'?4:8,Math.round(clusters*(.6+common*.7)));
  const selected=[];
  for(let k=0;k<clusters;k++){
   let center=null;for(let tries=0;tries<50;tries++){const a=suitable[Math.floor(r()*suitable.length)];if(r()<a.score&&!selected.some(p=>Math.hypot(p.x-a.e.x,p.z-a.e.z)<7)){center=a.e;break;}}
   if(!center)center=suitable[Math.floor(r()*suitable.length)].e;selected.push(center);
   const number=t.modelType==='orchid'?2+Math.floor(r()*3):t.modelType==='shrub'?3+Math.floor(r()*3):5+Math.floor(r()*8),spread=t.modelType==='grass'?5:3.3;
   for(let j=0;j<number;j++){const x=center.x+(r()-.5)*spread,z=center.z+(r()-.5)*spread,e=T.env(x,z),score=T.suitability(t,e);if(score<.17||L.blocked(x,z,.3)||treeAt(x,z))continue;
    const isWater=t.modelType==='waterlily',scale=isMoss(t)?.65+r()*1.1:isWater?.7+r()*.45:h*(.78+r()*.42),extra={score};
    if(isWater){extra.y=.005;extra.h=.14;extra.support='still-water';}
    const rec=add(t,x,z,scale,extra);if(!anchors[t.id])anchors[t.id]=[rec.x,rec.z];
   }
  }
  // Guarantee a reachable representative without weakening its habitat constraints.
  if(!counts[t.id]){const best=suitable.sort((a,b)=>b.score-a.score).find(a=>!treeAt(a.e.x,a.e.z));if(!best)throw new Error('No model placement for '+t.id);const e=best.e,water=t.modelType==='waterlily';add(t,e.x,e.z,isMoss(t)?1:h,{score:best.score,...(water?{y:.005,support:'still-water',h:.14}:{})});anchors[t.id]=[e.x,e.z];}
 }
 // Continuous, patchy understorey connects the species clusters across the whole map.
 // Keep specialist orchids rare; common grasses, bilberry, heather and moss form the matrix.
 const matrixIds=['avenella-flexuosa','luzula-pilosa','calamagrostis-epigejos','deschampsia-cespitosa','molinia-caerulea','leymus-arenarius','ammophila-arenaria','calluna-vulgaris','vaccinium-myrtillus','vaccinium-vitis-idaea','empetrum-nigrum','dryopteris-carthusiana','pleurozium-schreberi','hylocomium-splendens'];
 const matrix=matrixIds.map(id=>byId.get(id)).filter(Boolean);
 for(let z=-139;z<514;z+=3.1)for(let x=-484;x<484;x+=3.1){
  const px=x+(random()-.5)*2.5,pz=z+(random()-.5)*2.5,e=T.env(px,pz);
  if(e.h<.13||e.path<2.15||T.inRuin(px,pz,2)||T.inSettlement(px,pz,1)||L.blocked(px,pz,.3)||treeAt(px,pz))continue;
  const density=.68+T.fbm(px*.039+17,pz*.039+7,2)*.32;
  if(random()>density)continue;
  const choices=matrix.map(t=>({t,s:T.suitability(t,e)})).filter(a=>a.s>.24);
  if(!choices.length)continue;
  const total=choices.reduce((n,a)=>n+a.s,0);let value=random()*total,choice=choices[0];for(const c of choices){value-=c.s;if(value<=0){choice=c;break;}}
  const n=isMoss(choice.t)?1:2+Math.floor(random()*3);
  for(let j=0;j<n;j++){const xx=px+(random()-.5)*2.3,zz=pz+(random()-.5)*2.3,ee=T.env(xx,zz),score=T.suitability(choice.t,ee);if(score<.22||ee.path<1.8||L.blocked(xx,zz,.3)||treeAt(xx,zz))continue;const h=profiles[choice.t.id]?.h||choice.t.worldHeight;add(choice.t,xx,zz,isMoss(choice.t)?1.1+random():h*(.8+random()*.55),{score});}
 }
 // Succession inside the ruins: plants root in soil and rubble, leaving the former aisles open.
 const ruinIds=['calamagrostis-epigejos','chamaenerion-angustifolium','dryopteris-carthusiana','brachythecium-rutabulum','ceratodon-purpureus'];
 for(const pad of T.ruins)for(let z=pad.z0;z<pad.z1;z+=1.35)for(let x=pad.x0;x<pad.x1;x+=1.35){
  const xx=x+(random()-.5),zz=z+(random()-.5);if(L.blocked(xx,zz,.22)||L.aisle(xx,zz)||!window.NovaFactory.plantArea(xx,zz)||random()<.16)continue;
  const id=ruinIds[Math.floor(random()*ruinIds.length)],t=byId.get(id);if(!t)continue;
  const y=L.substrate(xx,zz),h=profiles[id]?.h||t.worldHeight;
  add(t,xx,zz,(isMoss(t)?.85+random()*.9:h*(.85+random()*.65))*sizeFor(t),{y:y-.01,support:'ruin-ground',score:1});
 }
 // Young trees reclaim roofless corners without blocking doors or the central corridors.
 for(const [id,x,z,h]of [['betula-pendula',125,247,5.6],['salix-caprea',149,277,4.1],['betula-pendula',159,263,6.4],['sorbus-aucuparia',183,293,4.8]]){
  if(L.blocked(x,z,.6))continue;const t=byId.get(id),record=add(t,x,z,h,{r:.25,support:'ruin-ground',y:L.substrate(x,z)-.015,score:1});trees.push(record);const k=key(x,z,8);if(!treeCells.has(k))treeCells.set(k,[]);treeCells.get(k).push(record);
 }
 for(const p of window.NovaFactory.plants){
  const t=byId.get(p.id),record=add(t,p.x,p.z,p.scale,{y:p.y,support:p.support,r:.25,score:1,yaw:p.support==='factory-floor'?0:random()*6.283});
  if(isTree(t)&&p.support!=='factory-roof')trees.push(record);
 }
 // Moss on actual vertical brick/concrete faces and broken wall tops.
 const wallMoss=byId.get('ceratodon-purpureus');
 for(const p of L.pieces){if(p.cell>1||p.geo!=='box'||p.sy<.65||p.y>T.height(p.x,p.z)+4||Math.min(p.sx,p.sz)>.6||random()>.6)continue;
  const side=random()<.5?-1:1,alongX=p.sx>p.sz,w=Math.min(1.6,Math.max(p.sx,p.sz)*.85),scale=Math.min(w,p.sy*.88);
  add(wallMoss,p.x+(alongX?0:side*(p.sx*.5+.012)),p.z+(alongX?side*(p.sz*.5+.012):0),scale,{y:p.y,rx:Math.PI/2,yaw:alongX?(side>0?0:Math.PI):(side>0?Math.PI/2:-Math.PI/2),support:'masonry',score:1});
 }
 // Extend the forest into the modest new border strip after the inherited placements.
 const borderRandom=T.rng(31002000);
 for(let z=-80;z<T.WORLD.zmax-12;z+=6.6)for(let x=T.WORLD.xmin+12;x<T.WORLD.xmax-12;x+=6.6){
  if(x>-486&&x<486&&z<510)continue;
  const px=x+(borderRandom()-.5)*4,pz=z+(borderRandom()-.5)*4,e=T.env(px,pz);
  if(e.h<.3||e.rt<1.6||e.pool<1.5)continue;
  if(borderRandom()<.68)addTree(borderRandom()<.78?'pinus-sylvestris':'betula-pendula',px,pz,12+borderRandom()*6);
  const t=byId.get(e.wet>.55?'dryopteris-carthusiana':'vaccinium-myrtillus');
  if(!treeAt(px+1,pz+1)&&T.suitability(t,T.env(px+1,pz+1))>.2)add(t,px+1,pz+1,.5+borderRandom()*.5,{score:1});
 }
 if(taxa.some(t=>counts[t.id]===0))throw new Error('A species is missing from the landscape.');
 function nearby(x,z,radius){const result=[],a=Math.floor((x-radius)/32),b=Math.floor((x+radius)/32),c=Math.floor((z-radius)/32),d=Math.floor((z+radius)/32),r2=radius*radius;for(let ix=a;ix<=b;ix++)for(let iz=c;iz<=d;iz++)for(const p of buckets.get(ix+','+iz)||[])if((p.x-x)**2+(p.z-z)**2<r2)result.push(p);return result;}
 // Preserve the seeded placement of all other vegetation, then omit every separate
 // moss/liverwort object, including patches on the ground, logs, trunks and walls.
 // Terrain moss is rendered independently by the ground material in game.js.
 // Extend the woods on the far bank without changing the original forest seed.
 const eastRandom=T.rng(6600400);
 for(let z=90;z<305;z+=6.6)for(let x=488;x<630;x+=6.6){const px=x+(eastRandom()-.5)*3,pz=z+(eastRandom()-.5)*3,e=T.env(px,pz);if(e.rt<1.5||eastRandom()<.12)continue;addTree(eastRandom()<.78?'pinus-sylvestris':'betula-pendula',px,pz,12+eastRandom()*8);
  if(!T.biosphereReserved(px,pz,2)&&!L.bridgeReserved(px,pz,2))for(let k=0;k<3;k++){const xx=px+(eastRandom()-.5)*5,zz=pz+(eastRandom()-.5)*5;if(T.height(xx,zz)>.2&&!T.biosphereReserved(xx,zz,1))add(byId.get('vaccinium-myrtillus'),xx,zz,.4+eastRandom()*.3,{score:.8});}
 }
 // Tighter, deterministic woodland immediately around the building walls.
 const closeWoods=T.rng(6700400),site=T.biosphereSite;
 for(let z=site.z-75;z<site.z+48;z+=4.8)for(let x=site.x-35;x<site.x+56;x+=4.8){const xx=x+(closeWoods()-.5)*2,zz=z+(closeWoods()-.5)*2;if(T.biosphereReserved(xx,zz,2.4)||!T.biosphereReserved(xx,zz,13))continue;addTree(closeWoods()<.72?'pinus-sylvestris':'betula-pendula',xx,zz,13+closeWoods()*8);}
 // Close the sparse belt between the river crossing and the Biosphere with
 // irregular mixed-age stands. A separate seed keeps the older forest intact.
 const approachWoods=T.rng(7200400),approachStart=L.biosphereBridge.x1-9,approachEnd=site.x-13;
 function approachOpen(x,z,spacing){
  const ix=Math.floor(x/8),iz=Math.floor(z/8);
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const t of treeCells.get((ix+dx)+','+(iz+dz))||[])if(Math.hypot(t.x-x,t.z-z)<spacing)return false;
  return true;
 }
 for(let i=0;i<1850;i++){
  const x=approachStart+approachWoods()*(approachEnd-approachStart),z=site.z+(approachWoods()-.5)*136,e=T.env(x,z);
  const fringe=T.smooth(0,12,x-approachStart)*T.smooth(0,18,68-Math.abs(z-site.z));
  if(e.rt<1.55||e.h<.3||T.biosphereReserved(x,z,2.3)||L.bridgeReserved(x,z,2.3)||approachWoods()>fringe*(.68+.32*T.fbm(x*.045,z*.045,2))||!approachOpen(x,z,2.8))continue;
  const n=approachWoods(),id=n<.48?'pinus-sylvestris':n<.72?'picea-abies':n<.94?'betula-pendula':'sorbus-aucuparia';
  const young=approachWoods()<.25,h=id==='sorbus-aucuparia'?5.5+approachWoods()*3.5:young?4.5+approachWoods()*5:12+approachWoods()*7;
  addTree(id,x,z,h);
 }
 // Uneven fern and bilberry patches obscure the open floor between trunks.
 // Their centres avoid the walking corridor and all building footprints.
 for(let i=0;i<410;i++){
  const x=approachStart+approachWoods()*(approachEnd-approachStart),z=site.z+(approachWoods()-.5)*122,e=T.env(x,z);
  if(e.h<.3||e.rt<1.45||T.biosphereReserved(x,z,1.7)||L.bridgeReserved(x,z,1.7)||treeAt(x,z))continue;
  const t=byId.get(approachWoods()<.46?'dryopteris-carthusiana':'vaccinium-myrtillus');
  for(let k=0;k<3;k++){
   const xx=x+(approachWoods()-.5)*2.6,zz=z+(approachWoods()-.5)*2.6;
   if(T.height(xx,zz)<.3||T.biosphereReserved(xx,zz,1.25)||L.bridgeReserved(xx,zz,1.25)||treeAt(xx,zz)||L.blocked(xx,zz,.3))continue;
   add(t,xx,zz,(t.modelType==='fern'?.45:.38)+approachWoods()*.32,{score:.8});
  }
 }
 const visibleRecords=records.filter(p=>!T.paeikeselinnReserved(p.x,p.z,isTree(byId.get(p.id))?5:1.5)&&!T.biosphereReserved(p.x,p.z,isTree(byId.get(p.id))?2:.5)&&!L.bridgeReserved(p.x,p.z,isTree(byId.get(p.id))?2:.5)&&!isMoss(byId.get(p.id))&&!L.towerClearance(p.x,p.z,isTree(byId.get(p.id))?1.5:.75)&&!window.NovaCoast?.reserved(p.x,p.z,isTree(byId.get(p.id))?1.5:.35));
 const visibleSet=new Set(visibleRecords),visibleTrees=trees.filter(p=>visibleSet.has(p));
 buckets.clear();treeCells.clear();
 const visibleCounts=Object.fromEntries(sceneTaxa.map(t=>[t.id,0])),visibleAnchors={};
 for(const p of visibleRecords){const k=key(p.x,p.z);if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(p);visibleCounts[p.id]++;if(!visibleAnchors[p.id])visibleAnchors[p.id]=[p.x,p.z];}
 for(const p of visibleTrees){const k=key(p.x,p.z,8);if(!treeCells.has(k))treeCells.set(k,[]);treeCells.get(k).push(p);}
 return{records:visibleRecords,trees:visibleTrees,logs:logs.filter(p=>!T.paeikeselinnReserved(p.x,p.z,p.len*.5+p.r+1)&&!T.biosphereReserved(p.x,p.z,p.len*.5+p.r)&&!L.bridgeReserved(p.x,p.z,p.len*.5+p.r)&&!L.towerClearance(p.x,p.z,p.len*.5+p.r)&&!window.NovaCoast?.reserved(p.x,p.z,p.len*.5+p.r)),counts:visibleCounts,anchors:visibleAnchors,nearby,treeAt};
}

function createModels(THREE,textureLoader,shared,windTime){
 const models=new Map(),materials=[],white=new THREE.Color(0xffffff);
 const solid=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});materials.push(solid);
 const bark=new THREE.MeshLambertMaterial({map:shared.bark,vertexColors:true});materials.push(bark);
 const photoBarks=shared.barks||new Map();let activeTree=null;
 for(const mat of photoBarks.values())materials.push(mat);
 function material(map,amount=.015){const mat=new THREE.MeshLambertMaterial({map,vertexColors:true,side:THREE.DoubleSide,alphaTest:.37});
  mat.onBeforeCompile=s=>{s.uniforms.novaTime=windTime;s.uniforms.novaWind={value:amount};s.vertexShader='uniform float novaTime;uniform float novaWind;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nvec3 windOrigin=vec3(0.0);\n#ifdef USE_INSTANCING\nwindOrigin=instanceMatrix[3].xyz;\n#endif\ntransformed.x+=sin(novaTime*1.2+windOrigin.x*.21+windOrigin.z*.13)*novaWind*smoothstep(.02,.6,position.y);`);};
  mat.customProgramCacheKey=()=> 'flora-wind-v4';materials.push(mat);return mat;
 }
 const pine=material(shared.pine,.004),birch=material(shared.birch,.004),masonryMoss=material(shared.moss,0);
 const rowanFruit=new THREE.MeshLambertMaterial({map:shared.rowanFruit,vertexColors:true});
 rowanFruit.name='rowan-fruit-photo';materials.push(rowanFruit);
 class Builder{
  constructor(){this.parts=new Map();}
  add(g,mat,col=0xffffff){const a=g.index?g.toNonIndexed():g;if(a!==g)g.dispose();if(!a.attributes.normal)a.computeVertexNormals();if(!a.attributes.uv)a.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(a.attributes.position.count*2),2));const c=new THREE.Color(col),colors=new Float32Array(a.attributes.position.count*3);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}if(!a.attributes.color)a.setAttribute('color',new THREE.BufferAttribute(colors,3));if(!this.parts.has(mat))this.parts.set(mat,[]);this.parts.get(mat).push(a);}
  finish(){const parts=[];for(const [mat,list]of this.parts){const g=new THREE.BufferGeometry();for(const name of ['position','normal','uv','color']){const size=name==='uv'?2:3,len=list.reduce((n,a)=>n+a.attributes[name].array.length,0),data=new Float32Array(len);let offset=0;for(const a of list){data.set(a.attributes[name].array,offset);offset+=a.attributes[name].array.length;}g.setAttribute(name,new THREE.BufferAttribute(data,size));}g.computeBoundingSphere();list.forEach(a=>a.dispose());parts.push({geometry:g,material:mat});}return parts;}
 }
 function pose(g,x,y,z,yaw=0,rx=0,rz=0){g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,yaw,rz,'YXZ')),new THREE.Vector3(1,1,1)));return g;}
 function branch(b,a,c,r0,r1,col=0x68614a,barkCell=-1){if(activeTree){b.add(window.NovaBark.branchGeometry(THREE,activeTree,a,c,r0,r1),photoBarks.get(activeTree),0xffffff);return;}const from=new THREE.Vector3(...a),to=new THREE.Vector3(...c),v=to.clone().sub(from),g=new THREE.CylinderGeometry(r1,r0,v.length(),5,1,true);if(barkCell>=0){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,(barkCell+.03+uv.getX(i)*.94)/4);}g.applyMatrix4(new THREE.Matrix4().compose(from.add(to).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()),new THREE.Vector3(1,1,1)));b.add(g,barkCell>=0?bark:solid,col);}
 function panel(b,mat,x,y,z,w,h,yaw,tilt=0,color=0xa6b294){const g=new THREE.PlaneGeometry(w,h,1,3),p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin((p.getY(i)/h+.5)*Math.PI)*w*.09);g.computeVertexNormals();b.add(pose(g,x,y,z,yaw,tilt),mat,color);}
 // Both bough textures grow from their thick left-hand stem toward the right.
 // Anchor that stem to the trunk and map increasing U away from the trunk.
 function treeBough(b,mat,root,w,h,angle,tilt,color,conifer){
  const stem=conifer?[.02,.73]:[.047,.91],rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt,angle-Math.PI/2,0,'YXZ'));
  const point=(u,v)=>new THREE.Vector3((u-stem[0])*w,(v-stem[1])*h,(Math.sin(v*Math.PI)-Math.sin(stem[1]*Math.PI))*w*.09).applyQuaternion(rotation).add(new THREE.Vector3(...root));
  const g=new THREE.PlaneGeometry(w,h,1,3),p=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++){const v=point(uv.getX(i),uv.getY(i));p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();b.add(g,mat,color);
  return point(.52,conifer?.49:.58).toArray();
 }
 function leaf(b,x,y,z,w,h,yaw,tilt,color){const verts=[0,0,0,-w*.5,h*.42,0,0,h*.52,w*.06,0,0,0,0,h*.52,w*.06,w*.5,h*.42,0,-w*.5,h*.42,0,0,h,0,0,h*.52,w*.06,0,h*.52,w*.06,0,h,0,w*.5,h*.42,0],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.computeVertexNormals();b.add(pose(g,x,y,z,yaw,tilt),solid,color);}
 function flower(b,x,y,z,r,color,petals=5){for(let k=0;k<petals;k++){const a=k*Math.PI*2/petals;leaf(b,x,y,z,r*.8,r*1.4,a,Math.PI/2-.4,color);}const g=new THREE.IcosahedronGeometry(r*.28,0);g.translate(x,y+.015,z);b.add(g,solid,0xc4b66c);}
 function mossPatch(b,mat,random){const points=[],position=[],uv=[];for(let i=0;i<18;i++){const a=i*Math.PI/9,r=.4+random()*.12;points.push([Math.sin(a)*r,.005,Math.cos(a)*r]);}for(let i=0;i<18;i++)for(const p of [[0,.045,0],points[i],points[(i+1)%18]]){position.push(...p);uv.push(p[0]+.5,.04+(p[2]+.5)*.55);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(position,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();b.add(g,mat,0xc1c9a5);}
 // The unchanged Wikimedia photograph supplies four individual berry skins.
 // Polar UVs place the photographed calyx at the bottom, with skin around it;
 // they never sample the stems, leaves or black background of the source image.
 const fruitPatches=[[1590,2140,80],[1820,2075,100],[2165,2370,95],[2495,2495,80]];
 // `mid` receives the same bunch for trees beyond close range: identical stalk
 // structure and berry placement/UVs/colours, but berries as 8-face solids and
 // without the hair-thin individual stalks (both far below one pixel there).
 function rowanBunch(b,origin,angle,random,mid=null){
  const reach=.003+random()*.003,width=.0047+random()*.0012;
  const hub=[origin[0]+Math.sin(angle)*reach,origin[1]-.005-random()*.002,origin[2]+Math.cos(angle)*reach];
  branch(b,origin,hub,.00024,.00016,0x796443);if(mid)branch(mid,origin,hub,.00024,.00016,0x796443);
  const forks=[];
  for(let k=0;k<5;k++){
   const a=angle+k*Math.PI*2/5,node=[hub[0]+Math.sin(a)*width*.53,hub[1]-.002,hub[2]+Math.cos(a)*width*.53];
   branch(b,hub,node,.00014,.00008,0x8d5639);if(mid)branch(mid,hub,node,.00014,.00008,0x8d5639);forks.push(node);
  }
  const count=22+Math.floor(random()*7),turn=random()*Math.PI*2;
  for(let i=0;i<count;i++){
   const a=turn+i*2.39996323,q=Math.sqrt((i+.5)/count),r=.00072+random()*.00026;
   const x=hub[0]+Math.sin(a)*width*q,y=hub[1]-.004+(1-q)*.0018+(random()-.5)*.0013,z=hub[2]+Math.cos(a)*width*q;
   const stem=[x,y+r*.95,z],fork=forks.reduce((best,p)=>Math.hypot(p[0]-x,p[2]-z)<Math.hypot(best[0]-x,best[2]-z)?p:best,forks[0]);
   branch(b,fork,stem,.00008,.000045,0x9b633d);
   const g=new THREE.SphereGeometry(r,8,5),patch=fruitPatches[Math.floor(random()*fruitPatches.length)];
   const skin=geometry=>{const p=geometry.attributes.position,uv=geometry.attributes.uv;for(let j=0;j<p.count;j++){
    const phi=Math.atan2(p.getZ(j),p.getX(j)),rho=Math.pow(Math.max(0,Math.min(1,(p.getY(j)/r+1)*.5)),.35)*patch[2]*.88;
    uv.setXY(j,(patch[0]+Math.cos(phi)*rho)/5100,1-(patch[1]+Math.sin(phi)*rho)/3400);
   }};
   skin(g);const stretch=.91+random()*.12,spin=random()*Math.PI*2,tint=new THREE.Color().setRGB(.88+random()*.12,.86+random()*.1,.83+random()*.1).getHex();
   g.scale(1,stretch,1);g.rotateY(spin);g.translate(x,y,z);
   b.add(g,rowanFruit,tint);
   // 1.25x keeps the sub-pixel berry's projected area (and red mass) close to the sphere's.
   if(mid){const low=new THREE.OctahedronGeometry(r,0);skin(low);low.scale(1.25,stretch*1.25,1.25);low.rotateY(spin);low.translate(x,y,z);mid.add(low,rowanFruit,tint);}
  }
 }
 for(const t of sceneTaxa){
  let midParts=null;
  activeTree=isTree(t)&&photoBarks.has(t.id)?t.id:null;
  const random=T.rng(hash(t.id)),b=new Builder(),fruitClusters=[],profile=profiles[t.id]||{},map=textureLoader(t.id),photo=material(map,isTree(t)?.004:.025),color=new THREE.Color().setHSL(.21+random()*.07,.22+random()*.12,.30+random()*.07).getHex();
  if(isTree(t)){
   const spruce=t.id==='picea-abies',conifer=t.modelType==='tree_conifer',isBirch=t.id.startsWith('betula'),cell=conifer?(spruce?3:0):isBirch?1:2;
   const low=spruce?.13:conifer?.55:t.id==='salix-caprea'?.27:.38,layers=spruce?8:5,lean=(random()-.5)*.04;
   if(activeTree)b.add(window.NovaBark.stemGeometry(THREE,t.id,lean),photoBarks.get(t.id));
   else{branch(b,[0,0,0],[lean,.76,0],conifer?.023:.015,.008,isBirch?0xd4d5c8:0xa5a190,cell);branch(b,[lean,.76,0],[lean*1.5,1,0],.008,.001,0x999583,cell);}
   for(let l=0;l<layers;l++){const f=l/(layers-1),level=low+(.94-low)*f,radius=(spruce?.27:conifer?.29:t.id==='populus-tremula'?.24:.29)*(spruce?1-f*.86:conifer?1-f*.55:.42+Math.sin(f*Math.PI)*.66),rotation=random()*6.28;
    for(let k=0;k<5;k++){const y=level+(random()-.5)*(conifer?.04:.14),a=rotation+k*6.283/5,h=radius*(spruce?.85:1.15),baseY=Math.min(.97,y+.035+h*(conifer?.23:.41)),root=[baseY<=.76?lean*baseY/.76:lean*(1+.5*(baseY-.76)/.24),baseY,0];
     const tip=treeBough(b,conifer?pine:birch,root,radius*1.63,h,a,-.2-random()*.45,spruce?0x899b7d:isBirch?0xadb799:0x8b9c76,conifer);
     const trunkRadius=baseY<=.76?(conifer?.023:.015)+(.008-(conifer?.023:.015))*baseY/.76:.008-.007*(baseY-.76)/.24,branchRadius=Math.min(.005,trunkRadius*.72);
     branch(b,root,tip,branchRadius,branchRadius*.2,0xaaa492,cell);
     if(!conifer&&!isBirch){
      const rowan=t.id==='sorbus-aucuparia',aspen=t.id==='populus-tremula';
      for(let twig=0;twig<3;twig++){
       const ta=a+(twig-1)*.55,junction=root.map((v,i)=>v+(tip[i]-v)*.55),tx=junction[0]+Math.sin(ta)*radius*.55,tz=junction[2]+Math.cos(ta)*radius*.55,ty=junction[1]+.025+random()*.10;
       const twigRadius=Math.min(.002,branchRadius*.56*.7);branch(b,junction,[tx,ty,tz],twigRadius,twigRadius*.35,0x79794e);
       for(let j=0;j<(rowan?5:4);j++){const f=(j+1)/5,lx=junction[0]+(tx-junction[0])*f,lz=junction[2]+(tz-junction[2])*f,ly=junction[1]+(ty-junction[1])*f;
        const hue=.21+random()*.075,shade=.26+random()*.16,c=new THREE.Color().setHSL(hue,.30,shade).getHex();
        for(const side of [-1,1])leaf(b,lx,ly,lz,rowan?.012:aspen?.028:.019,rowan?.032:aspen?.032:.044,ta+side*1.1,.3+random()*1.3,c);
       }
       if(rowan&&twig===1&&(l+k)%3!==0)fruitClusters.push({origin:[tx,ty,tz],angle:ta});
      }
     }
    }
   }
   // Fruit stalks retain their thin reddish material, separate from woody bark.
   activeTree=null;const fruitRandom=T.rng(hash(t.id)+7200);
   let mid=null;if(fruitClusters.length){mid=new Builder();for(const [mat,list]of b.parts)mid.parts.set(mat,list.map(g=>g.clone()));}
   for(const cluster of fruitClusters)rowanBunch(b,cluster.origin,cluster.angle,fruitRandom,mid);
   if(mid)midParts=mid.finish();
  }else if(isMoss(t)){
   mossPatch(b,photo,random);
   if(t.id.startsWith('polytrichum')||t.id.startsWith('dicranum'))for(let k=0;k<12;k++){const x=(random()-.5)*.7,z=(random()-.5)*.7;leaf(b,x,.035,z,.05,.08,random()*6.28,0,color);}
  }else if(t.modelType==='waterlily'){
   for(let k=0;k<4;k++){const a=k*2.4,x=Math.sin(a)*.22,z=Math.cos(a)*.22,g=new THREE.CircleGeometry(.18,12,0,Math.PI*1.78);g.rotateX(-Math.PI/2);g.rotateY(a);g.translate(x,.018,z);b.add(g,solid,0x546e43);}
   flower(b,0,.06,0,.065,0xeee9d2,9);
  }else if(t.modelType==='grass'||t.modelType==='fern'){
   // These cutouts already contain the complete tuft/frond. The old solid
   // leaf fans protruded through them as pale, broad triangular wedges.
   // Three gently curved cutout planes give the same plant volume from any side.
   const width=t.modelType==='fern'?1.3:.8,angle=random()*6.283;
   for(let k=0;k<3;k++)panel(b,photo,0,.45,0,width,.9,angle+k*Math.PI/3,0,0xb8c5a3);
  }else if(t.modelType==='shrub'||t.modelType==='dwarf_shrub'){
   // The species cutouts already include woody stems; extra solid supports made pale cones.
   const dwarf=t.modelType==='dwarf_shrub',n=dwarf?5:7;
   for(let k=0;k<n;k++){const a=k*2.4,x=Math.sin(a)*.24,z=Math.cos(a)*.24,h=.55+random()*.45;panel(b,photo,x*.5,h*.51,z*.5,dwarf?.75:.85,h*1.02,a,-.08,0xaab59b);}
   if(t.id.startsWith('vaccinium')&&t.id!=='vaccinium-myrtillus')for(let k=0;k<9;k++){const a=k*2.4,g=new THREE.IcosahedronGeometry(.025,0);g.translate(Math.sin(a)*.23,.5+random()*.2,Math.cos(a)*.23);b.add(g,solid,t.id==='vaccinium-vitis-idaea'?0x963f43:0x474f76);}
  }else{
   const orchid=t.modelType==='orchid';
   if(orchid){
    // Orchids retain their small, distinct flowers and thin botanical leaves.
    branch(b,[0,0,0],[.035,1,0],.008,.003,0x7e8b58);
    for(let k=0;k<5;k++)leaf(b,0,.07+k*.10,0,.09,.36,k*2.4,.45+random()*.65,color);
    const spike=profile.spike||8;
    for(let k=0;k<spike;k++){const a=k*2.4;flower(b,Math.sin(a)*.045,.54+k*.43/spike,Math.cos(a)*.045,.042,profile.flower||0xd2cbbb,4);}
   }else{
    const angle=random()*Math.PI;
    for(let k=0;k<3;k++)panel(b,photo,0,.45,0,.85,.9,angle+k*Math.PI/3,0,0xc6ccb0);
   }
  }

  const parts=b.finish();let farParts=parts;midParts||=parts;
  if(isTree(t)){
   const far=new Builder(),conifer=t.modelType==='tree_conifer',spruce=t.id==='picea-abies',isBirch=t.id.startsWith('betula'),low=spruce?.13:conifer?.55:t.id==='salix-caprea'?.27:.38,layers=spruce?8:5,cell=conifer?(spruce?3:0):isBirch?1:2;
   if(photoBarks.has(t.id))far.add(window.NovaBark.stemGeometry(THREE,t.id,0,true),photoBarks.get(t.id));
   else branch(far,[0,0,0],[0,.99,0],conifer?.023:.015,.001,isBirch?0xd4d5c8:0xa5a190,cell);
   for(let l=0;l<layers;l++){const f=l/(layers-1),y=low+(.94-low)*f,r=(spruce?.27:t.id==='populus-tremula'?.24:.29)*(spruce?1-f*.86:conifer?1-f*.55:.42+Math.sin(f*Math.PI)*.66),h=r*(spruce?.85:1.15),baseY=Math.min(.97,y+.035+h*(conifer?.23:.41));for(let k=0;k<4;k++){const a=k*Math.PI/2+l*.73;treeBough(far,conifer?pine:birch,[0,baseY,0],r*1.63,h,a,-.45,spruce?0x899b7d:isBirch?0xadb799:0x8b9c76,conifer);}}
   farParts=far.finish();
  }else{
   const far=new Builder();
   if(isMoss(t))mossPatch(far,photo,T.rng(hash(t.id)+7));
   else if(t.modelType==='waterlily')farParts=parts;
   else{const width=t.modelType==='fern'?1.3:t.modelType.includes('shrub')?1.05:.85;panel(far,photo,0,.45,0,width,.9,0,0,0xb8c5a3);panel(far,photo,0,.45,0,width,.9,Math.PI/2,0,0xb8c5a3);}
   if(t.modelType!=='waterlily')farParts=far.finish();
  }
  let wallParts=parts;if(isMoss(t)){const wall=new Builder();mossPatch(wall,masonryMoss,T.rng(hash(t.id)+13));wallParts=wall.finish();}
  models.set(t.id,{id:t.id,parts,midParts,farParts,wallParts,type:t.modelType});
 }
 return{models,materials};
}

function createRenderer(THREE,scene,population,models,touch,changed){
 const pools=new Map(),dummy=new THREE.Object3D();let stamp='',active=[],viewScale=1,density=1;
 // Refreshes happen per 24 m cell. A plant may use its reduced close-range detail
 // only if it stays at least MID_GAP from every point of the current cell, so
 // walking anywhere inside the cell never brings a reduced model close.
 const MID_GAP=12,cellGap=(x,z,cx,cz)=>Math.hypot(Math.max(cx*24-x,0,x-cx*24-24),Math.max(cz*24-z,0,z-cz*24-24));
 function refresh(x,z,altitude=0,force=false){const cx=Math.floor(x/24),cz=Math.floor(z/24),high=altitude>28,newStamp=cx+','+cz+','+high;if(!force&&stamp===newStamp)return;stamp=newStamp;
  const radius=(high?(touch?168:220):(touch?96:116))*viewScale,list=population.nearby(cx*24+12,cz*24+12,radius),groups=new Map();active=[];
  for(const p of list){const tree=p.type.startsWith('tree_'),distance=Math.hypot(p.x-x,p.z-z);if(!tree&&distance>(high?110:78)*viewScale)continue;if(!tree&&distance>10&&density<1&&(Math.abs(Math.sin(p.x*12.9898+p.z*78.233)*43758.5453)%1)>density)continue;let lod=p.support==='masonry'?'wall':distance>(tree?(touch?48:70):(touch?30:42))*viewScale?'far':'near';if(lod==='near'&&models.get(p.id).midParts!==models.get(p.id).parts&&cellGap(p.x,p.z,cx,cz)>MID_GAP)lod='mid';const key=p.id+':'+lod;if(!groups.has(key))groups.set(key,{id:p.id,lod,items:[]});groups.get(key).items.push(p);active.push(p);}
  for(const pool of pools.values())for(const mesh of pool.meshes){mesh.visible=false;mesh.count=0;}
  for(const [key,{id,lod,items}]of groups){const model=models.get(id);let pool=pools.get(key);const parts=lod==='wall'?model.wallParts:lod==='far'?model.farParts:lod==='mid'?model.midParts:model.parts;
   if(!pool||pool.capacity<items.length){if(pool)for(const mesh of pool.meshes){scene.remove(mesh);mesh.customDepthMaterial?.dispose();mesh.dispose?.();}const capacity=2**Math.ceil(Math.log2(Math.max(8,items.length))),meshes=parts.map(part=>{const mesh=new THREE.InstancedMesh(part.geometry,part.material,capacity);mesh.name='Flora: '+id;mesh.frustumCulled=false;mesh.castShadow=model.type.startsWith('tree_')&&(!touch||!part.material.alphaTest);mesh.receiveShadow=true;if(part.material.alphaTest)mesh.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:part.material.map,alphaTest:part.material.alphaTest,side:THREE.DoubleSide});scene.add(mesh);return mesh;});pool={capacity,meshes};pools.set(key,pool);}
   for(let i=0;i<items.length;i++){const p=items[i];dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.rx,p.yaw,p.rz,'YXZ');dummy.scale.set(p.sx??p.scale,p.scale,p.sz??p.scale);dummy.updateMatrix();for(const mesh of pool.meshes)mesh.setMatrixAt(i,dummy.matrix);}
   for(const mesh of pool.meshes){mesh.count=items.length;mesh.visible=true;mesh.instanceMatrix.needsUpdate=true;}
  }
  changed(cx*24+12,cz*24+12);
 }
 return{refresh,setPerformance(s){viewScale=s.distance;density=s.density;stamp='';},get active(){return active;},get stats(){return{visible:active.length,pools:pools.size};}};
}
window.NovaFlora={taxa:sceneTaxa,createPopulation,createModels,createRenderer,profiles,isTree,isMoss,byId};
})();
