// Fundstücke: deutschsprachiger Textbestand, räumliche Requisiten und Lesemappe.
(() => {
'use strict';
const D=window.NovaDocuments,T=window.NovaTerrain,S=window.NovaSettlements,C=window.NovaFactory,L=window.NovaLandmarks,N=window.NovaCoast,B=window.NovaBackrooms;
const all=D.list(),byId=new Map(all.map(d=>[d.id,d])),storageKey='nova-schriftstuecke-v1';
const places={apartments:'Wohnblock',factory:'Fabrik',backrooms:'Backrooms',sawmill:'Sägewerk',lighthouse:'Leuchtturm',pigfarm:'Schweinemast',radio_tower:'Funkstation',ruins:'Ruinen'};
function createCollection(storage){
 const ids=new Set();let persistent=true;
 try{const saved=JSON.parse(storage?.getItem(storageKey)||'[]');if(Array.isArray(saved)){for(const id of saved)if(byId.has(id))ids.add(id);if(saved.length!==ids.size)storage?.setItem(storageKey,JSON.stringify([...ids]));}if(!storage)persistent=false;}catch{persistent=false;}
 return{has:id=>ids.has(id),list:()=>all.filter(d=>ids.has(d.id)),get persistent(){return persistent;},
  collect(docIds){let added=0;for(const id of docIds)if(byId.has(id)&&!ids.has(id)){ids.add(id);added++;}
   try{if(!storage)throw new Error();storage.setItem(storageKey,JSON.stringify([...ids]));persistent=true;}catch{persistent=false;}return added;}
 };
}
// Individual loose sheets, with fixed irregular positions and rotations.
const placements=[];
function sheet(id,x,floor,z,yaw,options={}){return{id,kind:'document',title:byId.get(id).title,docIds:[id],x,y:floor+.018,z,zone:'world',style:'paper',floor,yaw,...options};}
function add(id,x,floor,z,yaw,options){const p=sheet(id,x,floor,z,yaw,options);placements.push(p);return p;}
const salme=S.apartments.find(a=>a.number===15);
add('APT_04',salme.x+4.52,salme.y,salme.z-3.94,.57);
add('RAD_02',salme.x+2.76,salme.y,S.housing.z-.47,-1.14);
// v88: three factory sheets moved out of the floor plants that covered them.
for(const [id,x,z,yaw]of [
 ['FAC_01',-173.38,221.74,.29],['FAC_02',-173.72,208.38,-.81],
 ['FAC_03',-150.63,221.17,1.38],['FAC_04',-138.93,203.23,-.36],
 ['FAC_05',-153.04,207.72,2.16],['FAC_06',-151.3,208.14,-1.64],
 ['FAC_07',-162.11,222.16,.72],['FAC_08',-139.71,222.51,-2.22]
])add(id,x,C.floor,z,yaw);
for(const [id,x,z,yaw]of [
 ['SAW_01',-22.67,-8.26,.41],['SAW_02',-21.91,8.71,-1.37],
 ['SAW_03',-14.52,9.19,2.31],['SAW_04',22.86,8.73,-.52],['SAW_05',15.28,-8.94,1.12]
])add(id,S.mill.x+x,S.mill.y+.06,S.mill.z+z,yaw);
// v88: two sheets on the ground floor, "Das Feuer" on the lamp gallery, the
// keeper's sheet outside beside the door.
for(const [id,x,z,yaw]of [['LHT_01',-.78,2.52,.81],['LHT_02',-2.14,-1.12,-.53]])add(id,N.lighthouse.x+x,N.lighthouse.base,N.lighthouse.z+z,yaw);
add('LHT_03',N.lighthouse.x+3.95,N.lighthouse.base+N.lighthouse.height,N.lighthouse.z,2.17);
{const x=N.lighthouse.x+5,z=N.lighthouse.z+5.13;add('LHT_04',x,T.height(x,z),z,-1.31,{terrain:true});}
// v88: PIG_02 lay inside a closed pen; PIG_01 was hidden in a grass tuft. Both now
// lie on open, walkable ground of the ruin, clear of plants.
for(const [id,x,z,yaw]of [['PIG_01',111,244,.91],['PIG_02',113.5,253.5,-1.83]])add(id,x,T.height(x,z),z,yaw,{terrain:true});
add('RAD_01',L.towerRoom.x-3.23,L.towerRoom.floorY,L.towerRoom.z-2.18,.31);
add('RAD_03',L.towerRoom.x+3.11,L.towerRoom.floorY,L.towerRoom.z-2.29,-1.77);
const ruinX=-84.2,ruinZ=T.shore(-86)+18;
add('RUIN_01',ruinX,T.height(ruinX,ruinZ),ruinZ,.93,{terrain:true});

// v88: the six Rechenstelle sheets lie in six different rooms of the first factory
// level (the room grammar is deterministic). Spots are free floor, reachable from
// each room's entry and clear of machines; "Das Gesicht" lies in the wall-figure room.
const mazeSheets={
 '1':[['BKR_01',-10.25,-9.5,.43]],'1/1':[['BKR_02',5,10.25,-1.71]],
 '2':[['BKR_03',-6.5,8,2.19]],'2/3':[['BKR_04',3.25,-2.75,-.31]],
 '0/3':[['BKR_05',.75,.75,1.03]],'1/1/2':[['BKR_06',-5,-7.5,-2.44]]
};
const mazePaths=Object.keys(mazeSheets).map(k=>k.split('/').map(Number));
function roomPlacements(path,s=B.spec(path)){
 const key=path.join('/');if(s.level!==0||!mazeSheets[key])return[];
 return mazeSheets[key].map(([id,x,z,yaw])=>sheet(id,B.origin.x+x,C.floor,B.origin.z+z,yaw,{zone:'maze',path:key,y:C.floor+.035}));
}
function intersects(eye,p,b){
 // Segment / oriented box. Ignore the last centimetres where the page meets the floor.
 const yaw=b.ry||0,c=Math.cos(yaw),s=Math.sin(yaw),dx=eye.x-b.x,dz=eye.z-b.z,ex=p.x-b.x,ez=p.z-b.z;
 const a=[dx*c-dz*s,eye.y-b.y,dx*s+dz*c],end=[ex*c-ez*s,p.y-b.y,ex*s+ez*c],half=[(b.w||b.sx)/2,(b.h||b.sy)/2,(b.d||b.sz)/2];let lo=0,hi=.97;
 for(let i=0;i<3;i++){const v=end[i]-a[i];if(Math.abs(v)<1e-9){if(Math.abs(a[i])>half[i])return false;}else{let u=(-half[i]-a[i])/v,w=(half[i]-a[i])/v;if(u>w)[u,w]=[w,u];lo=Math.max(lo,u);hi=Math.min(hi,w);if(lo>hi)return false;}}
 return true;
}
function createWorld(THREE,scene,mazeScene,travel,mazeGeometry,collection){
 const group=new THREE.Group(),mazeGroup=new THREE.Group(),materials=new Map();group.name='Schriftstücke an den Fundorten';mazeGroup.name='Schriftstücke der Rechenstelle';scene.add(group);mazeScene.add(mazeGroup);
 const ray=new THREE.Raycaster(),aim=new THREE.Vector3();
 const blockers=[...L.pieces.filter(p=>p.solid),...S.solids];
 function paperMaterial(p){const key=p.style+':'+p.title;if(materials.has(key))return materials.get(key);
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=512;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#c7bea0';ctx.fillRect(0,0,384,512);ctx.fillStyle='#45453b';ctx.font='20px monospace';
  const words=p.title.split(' ');let line='',y=55;for(const word of words){if((line+word).length>23){ctx.fillText(line,26,y);line='';y+=27;}line+=word+' ';}ctx.fillText(line,26,y);
  ctx.globalAlpha=.45;for(let i=0;i<12;i++)ctx.fillRect(27,150+i*23,260-(i%4)*28,3);ctx.globalAlpha=.65;ctx.strokeRect(25,440,150,34);ctx.font='15px monospace';ctx.fillText('RECHENSTELLE',33,463);
  const texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;const mat=new THREE.MeshLambertMaterial({map:texture,side:THREE.DoubleSide});materials.set(key,mat);return mat;
 }
 function prop(p,parent){const g=new THREE.Group();g.position.set(p.x,p.y,p.z);g.rotation.y=p.yaw;parent.add(g);
  const paper=new THREE.Group();g.add(paper);g.userData={paper,record:p};
  const geometry=new THREE.PlaneGeometry(.29,.40,2,2);geometry.rotateX(-Math.PI/2);
  // Outdoor sheets follow the earth at every vertex instead of hovering on a slope.
  if(p.terrain){const vertices=geometry.attributes.position,c=Math.cos(p.yaw),s=Math.sin(p.yaw);
   for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),z=vertices.getZ(i);vertices.setY(i,T.height(p.x+x*c+z*s,p.z-x*s+z*c)+.018-p.y);}geometry.computeVertexNormals();}
  paper.add(new THREE.Mesh(geometry,paperMaterial(p)));return g;
 }
 for(const p of placements)prop(p,group);
 let revision=-1,mazeRecords=[];
 function visibility(){for(const parent of [group,mazeGroup])for(const g of parent.children){const p=g.userData.record;g.userData.paper.visible=!p.docIds.every(id=>collection?.has(id));}}
 function update(){visibility();if(revision===travel.revision)return;revision=travel.revision;
  for(const g of [...mazeGroup.children]){g.traverse(m=>{if(m.geometry)m.geometry.dispose();});mazeGroup.remove(g);}
  const path=travel.preview(),s=travel.current;mazeRecords=roomPlacements(path,s);for(const p of mazeRecords)prop(p,mazeGroup);
  for(const port of s.ports){const next=B.neighbour(path,port);if(next===null)continue;const shift=B.distance(path,port);for(const p of roomPlacements(next))prop({...p,x:p.x+B.dirs[port][0]*shift,z:p.z+B.dirs[port][1]*shift},mazeGroup);}
  visibility();
 }
 function target(eye,look,foot){update();let best=null,score=Infinity;const records=travel.active?mazeRecords:placements;
  for(const p of records){if(p.docIds.every(id=>collection?.has(id)))continue;const dx=p.x-eye.x,dy=p.y-eye.y,dz=p.z-eye.z,d=Math.hypot(dx,dy,dz);if(d<.1||d>2.7||Math.abs(foot-p.floor)>.55)continue;const dot=(dx*look.x+dy*look.y+dz*look.z)/d;if(dot<.958)continue;
   if(travel.active){aim.set(dx,dy,dz).normalize();ray.set(eye,aim);ray.far=d-.065;if(ray.intersectObjects(mazeGeometry.children).length)continue;}
   else if(blockers.some(b=>Math.abs(b.x-p.x)<6+(b.w||b.sx)/2&&Math.abs(b.z-p.z)<6+(b.d||b.sz)/2&&intersects(eye,p,b)))continue;
   const candidate=d+(1-dot)*18;if(candidate<score){best=p;score=candidate;}
  }return best;
 }
 update();return{placements,update,target};
}
function createReader(collection,{onOpen,onClose,onCollect}){
 const $=id=>document.getElementById(id);let current=null,index=0,fromInventory=false;
 const collected=()=>current?.docIds.every(id=>collection.has(id));
 function render(){const d=byId.get(current.docIds[index]);$('documentTitle').textContent=d.title;$('documentBody').textContent=d.body;$('documentSource').textContent=current.title;
  $('documentMeta').textContent=(places[d.landmark]||'Fundstück')+' · '+d.date.split('-').reverse().join('.')+(d.medium==='printout'?' · Ausdruck':'');
  $('documentPage').textContent=`Blatt ${index+1} von ${current.docIds.length}`;$('documentPrev').disabled=index===0;$('documentNext').disabled=index===current.docIds.length-1;
  $('documentPaging').hidden=current.docIds.length===1;$('documentCollect').disabled=collected();$('documentCollect').textContent=collected()?'In der Feldtasche':current.docIds.length>1?`G · Alle ${current.docIds.length} Blätter einpacken`:'G · Einpacken';
  $('documentClose').textContent=fromInventory?'Zurück zur Feldtasche · Esc':'Schließen · E / Esc';$('documentBody').scrollTop=0;
 }
 function close(resume=true){if(!current)return;const back=fromInventory;current=null;$('documentReader').hidden=true;document.body.classList.remove('document-open');if(resume)onClose(back);}
 function collect(){if(!current||collected())return;const n=collection.collect(current.docIds);$('documentFeedback').textContent=collection.persistent?`${n} ${n===1?'Schriftstück':'Schriftstücke'} eingepackt.`:'Eingepackt. Dauerhaftes Speichern ist in diesem Browser nicht verfügbar.';render();onCollect();}
 function page(delta){index=Math.max(0,Math.min(current.docIds.length-1,index+delta));render();}
 $('documentClose').addEventListener('click',()=>close());$('documentCollect').addEventListener('click',collect);$('documentPrev').addEventListener('click',()=>page(-1));$('documentNext').addEventListener('click',()=>page(1));
 $('documentReader').addEventListener('keydown',e=>{if(e.key!=='Tab')return;const nodes=[...$('documentReader').querySelectorAll('button:not([disabled]),[tabindex="0"]')].filter(n=>n.offsetParent!==null),first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
 return{get isOpen(){return!!current;},get currentId(){return current?.docIds[index]||null;},open(p,inventory=false,startId=null){current=p;index=Math.max(0,p.docIds.indexOf(startId));fromInventory=inventory;onOpen();$('documentReader').hidden=false;document.body.classList.add('document-open');$('documentFeedback').textContent='';render();$('documentClose').focus();},close,
  key(e){if(!current)return false;if(['KeyE','Escape','KeyI','KeyG','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();if(!e.repeat){if(['KeyE','Escape','KeyI'].includes(e.code))close();else if(e.code==='KeyG')collect();else page(e.code==='ArrowLeft'?-1:1);}}return true;}
 };
}
window.NovaLore={all,byId,places,placements,roomPlacements,mazePaths,createCollection,createWorld,createReader,intersects,storageKey};
})();
