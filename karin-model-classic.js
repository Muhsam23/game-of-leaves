// v89: the original forest Karin (v86 and earlier), kept beside the newer apartment model.
/* Original rigid low-poly forest character. Metres, +Y up, +Z forward. */
(function(root){
'use strict';
const T=typeof THREE!=='undefined'?THREE:require('./three.min.js');
const SIZE=1254;
const patches={
 face:[0,0,627,627],jacket:[627,0,210,627],sweater:[837,0,210,627],trouser:[1047,0,207,627],
 hair:[0,627,205,627],skin:[205,627,205,627],scarf:[410,627,217,627],
 boot:[627,627,236,348],satchel:[863,627,391,348],leather:[627,975,205,279],brass:[832,975,205,279],dark:[1037,975,217,279]
};
function uv(key,u,v){const p=patches[key];return[(p[0]+2+u*(p[2]-4))/SIZE,1-(p[1]+2+(1-v)*(p[3]-4))/SIZE];}
function geo(vertices,faces,key,uvs){const positions=[],coords=[];for(const face of faces)for(const i of face){positions.push(...vertices[i]);coords.push(...uv(key,...(uvs?uvs[i]:[.5,.5])));}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(coords,2));g.computeVertexNormals();return g;}
function tube(rings,key,sides=7,cap=true){
 const vertices=[],coords=[],faces=[];
 rings.forEach(([x,y,z,rx,rz],j)=>{for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2;vertices.push([x+Math.sin(a)*rx,y,z+Math.cos(a)*rz]);coords.push([i/sides,1-j/Math.max(1,rings.length-1)]);}});
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;faces.push([a,b,a+1],[a+1,b,b+1]);}
 if(cap){const first=vertices.length;vertices.push(rings[0].slice(0,3));coords.push([.5,1]);const last=vertices.length;vertices.push(rings.at(-1).slice(0,3));coords.push([.5,0]);for(let i=0;i<sides;i++){faces.push([first,i,i+1]);const a=(rings.length-1)*(sides+1)+i;faces.push([last,a+1,a]);}}
 return geo(vertices,faces,key,coords);
}
function ell(x,y,z,rx,ry,rz,key,sides=8){return tube([[-1,.05],[-.68,.7],[0,1],[.68,.7],[1,.05]].map(([a,b])=>[x,y+a*ry,z,rx*b,rz*b]),key,sides);}
function segment(a,b,r1,r2,key,sides=6){const delta=new T.Vector3(...b).sub(new T.Vector3(...a));const g=tube([[0,0,0,r1[0],r1[1]],[0,delta.length(),0,r2[0],r2[1]]],key,sides);g.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize())));g.translate(...a);return g;}
function create(texture){
 const group=new T.Group();group.name='ForestWoman';const rig=new T.Group();rig.name='root';group.add(rig);const bones={};
 if(texture){texture.magFilter=T.NearestFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.anisotropy=1;}
 const mat=new T.MeshLambertMaterial({map:texture||null,side:T.DoubleSide,color:0xffffff});mat.name='karin_study_atlas_v1';
 function add(g,parent=rig,name='surface'){const m=new T.Mesh(g,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function joint(name,pos,parent=rig){const b=new T.Group();b.name=name;b.position.set(...pos);parent.add(b);bones[name]=b;return b;}

 const hips=joint('hips',[0,.91,0]);
 add(tube([[0,-.08,0,.16,.125],[0,.08,0,.175,.135],[0,.2,-.005,.165,.13]],'trouser',8),hips,'trouser_waist');
 const spine=joint('spine',[0,.16,0],hips);
 add(tube([[0,-.17,0,.17,.14],[0,.03,0,.19,.15],[0,.24,-.005,.215,.155],[0,.41,.005,.19,.145]],'sweater',9),spine,'wool_sweater');
 add(tube([[0,-.2,-.008,.18,.145],[0,.02,-.004,.205,.16],[0,.25,0,.23,.165],[0,.43,.01,.205,.15]],'jacket',9,false),spine,'field_jacket');
 // Open jacket front, collar, pockets and brass closures.
 for(const s of [-1,1]){
  add(geo([[s*.02,.42,.145],[s*.115,.405,.115],[s*.1,.22,.158],[s*.015,.12,.166]],[[0,1,2],[0,2,3]],'jacket',[[0,1],[1,1],[1,0],[0,0]]),spine,'jacket_lapel');
  add(geo([[s*.045,.08,.159],[s*.145,.07,.138],[s*.14,-.08,.142],[s*.045,-.07,.165]],[[0,1,2],[0,2,3]],'jacket',[[0,1],[1,1],[1,0],[0,0]]),spine,'jacket_pocket');
 }
 for(let i=0;i<3;i++)add(ell(0,.15-i*.13,.181,.012,.012,.006,'brass',5),spine,'jacket_button');
 const neck=joint('neck',[0,.43,.035],spine);add(segment([0,0,0],[0,.11,.012],[.056,.052],[.052,.048],'skin',7),neck,'neck');
 // Plain black wool scarf: a close wrap and one narrow hanging end.
 add(tube([[0,.018,.026,.098,.084],[0,.058,.025,.112,.094],[0,.096,.022,.096,.081]],'dark',8,false),neck,'black_scarf_wrap');
 add(geo([[-.052,.045,.109],[.038,.04,.118],[.031,-.145,.145],[-.035,-.16,.137]],[[0,1,2],[0,2,3]],'dark',[[0,1],[1,1],[1,0],[0,0]]),neck,'black_scarf_tail');
 const head=joint('head',[0,.18,.022],neck);head.scale.set(1.06,1.02,1.06);
 add(ell(0,.015,-.03,.112,.175,.11,'hair',9),head,'head_back');
 const rows=[[.176,.058,.052,.09],[.137,.091,.08,.21],[.075,.104,.103,.35],[.015,.106,.112,.49],[-.045,.091,.113,.63],[-.098,.073,.096,.77],[-.15,.046,.065,.91]];
 const xs=[-1,-.66,-.32,0,.32,.66,1],vertices=[],coords=[],faces=[];
 rows.forEach(([y,w,z,photoY])=>xs.forEach(x=>{vertices.push([x*w,y,z-Math.pow(Math.abs(x),1.5)*.046]);coords.push([.5+x*.46,1-photoY]);}));
 for(let j=0;j<rows.length-1;j++)for(let i=0;i<xs.length-1;i++){const a=j*xs.length+i,b=a+xs.length;faces.push([a,b,a+1],[a+1,b,b+1]);}
 // Keep the entire portrait rigid so speech cannot open a seam across the face.
 joint('jaw',[0,-.085,.035],head); // Retain the rig anchor for existing study controls.
 add(geo(vertices,faces,'face',coords),head,'portrait_face');
 for(const s of [-1,1])add(ell(s*.105,-.005,-.002,.018,.045,.025,'skin',6),head,'ear');
 // Closed practical knit cap in the same olive material as the jacket.
 add(tube([[0,.07,.012,.126,.13],[0,.125,.012,.128,.132],[0,.18,.004,.105,.115],[0,.225,-.012,.038,.058]],'jacket',10,true),head,'olive_knit_cap');
 add(tube([[0,.066,.016,.13,.134],[0,.105,.016,.13,.136]],'jacket',10,false),head,'cap_band');
 // Angular swept-back hair and small practical bun.
 add(tube([[0,.17,-.03,.085,.075],[0,.065,-.085,.13,.09],[0,-.09,-.105,.105,.07],[0,-.18,-.09,.07,.055]],'hair',8,false),head,'swept_hair');
 add(ell(.015,-.12,-.142,.074,.072,.062,'hair',7),head,'hair_bun');

 for(const s of [-1,1]){
  const arm=joint('arm_'+s,[s*.215,.34,0],spine);add(ell(0,-.012,0,.06,.072,.065,'jacket',6),arm,'shoulder');
  add(segment([0,0,0],[s*.014,-.255,.018],[.058,.064],[.045,.049],'jacket',7),arm,'upper_sleeve');
  const elbow=joint('elbow_'+s,[s*.014,-.255,.018],arm);add(segment([0,0,0],[0,-.245,.038],[.045,.049],[.037,.04],'jacket',7),elbow,'lower_sleeve');
  add(tube([[0,-.218,.034,.043,.045],[0,-.245,.039,.043,.045]],'leather',7),elbow,'cuff');
  const hand=joint('hand_'+s,[0,-.27,.044],elbow);add(ell(0,-.025,.004,.033,.052,.019,'skin',6),hand,'hand');
  for(let i=0;i<3;i++)add(segment([-.018+i*.017,-.052,.008],[-.017+i*.015,-.082,.022],[.008,.008],[.006,.006],'skin',4),hand,'finger');
 }
 for(const s of [-1,1]){
  const leg=joint('leg_'+s,[s*.082,-.05,0],hips);add(segment([0,0,0],[0,-.46,.004],[.092,.084],[.066,.062],'trouser',7),leg,'upper_leg');
  const knee=joint('knee_'+s,[0,-.39,.004],leg);add(segment([0,0,0],[0,-.34,.014],[.071,.066],[.052,.052],'trouser',7),knee,'lower_leg');
  const foot=joint('foot_'+s,[0,-.34,.014],knee);add(tube([[0,-.075,.065,.073,.145],[0,-.026,.064,.076,.143],[0,.035,.037,.061,.09],[0,.105,0,.05,.05]],'boot',8),foot,'hiking_boot');
 }
 // Cross-body canvas bag and broad leather strap.
 add(segment([-.16,.39,.14],[.16,-.1,.165],[.019,.007],[.019,.007],'leather',5),spine,'bag_strap');
 const bag=joint('bag',[-.19,-.03,.05],hips);add(tube([[0,-.24,0,.115,.06],[0,.02,0,.115,.06]],'satchel',8),bag,'canvas_satchel');
 add(geo([[-.115,.02,.063],[.115,.02,.063],[.105,-.11,.067],[-.105,-.11,.067]],[[0,1,2],[0,2,3]],'satchel',[[0,1],[1,1],[1,0],[0,0]]),bag,'satchel_flap');
 add(ell(0,-.075,.081,.018,.02,.007,'brass',5),bag,'satchel_buckle');

 group.scale.setScalar(.91);
 const model={group,rig,bones,mat,base:[],info:{name:'Forest woman',age:45,height:1.7,forward:'+Z',description:'A practical forest traveller rendered as a late-1990s articulated NPC.'}};
 // The host owns the world transform. Animation resets only the internal rig.
 group.traverse(o=>{if(o!==group)model.base.push({o,p:o.position.clone(),q:o.quaternion.clone()});});
 group.userData.triangles=0;group.traverse(o=>{if(o.isMesh)group.userData.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});
 animate(model,0,'idle');return model;
}
function animate(model,t,mode='idle'){
 model.base.forEach(({o,p,q})=>{o.position.copy(p);o.quaternion.copy(q);});const b=model.bones,cycle=t*Math.PI*2;
 model.rig.position.y=-.01+Math.sin(cycle*.5)*.004;b.spine.rotation.x=.025+Math.sin(cycle*.5)*.008;b.head.rotation.x=-.025+Math.sin(cycle*.5+.7)*.018;b.head.rotation.y=Math.sin(cycle*.27)*.045;
 b['arm_-1'].rotation.z=-.06;b['arm_1'].rotation.z=.06;b['elbow_-1'].rotation.x=-.18;b['elbow_1'].rotation.x=-.22;
 if(mode==='walk'){
  const p=cycle/1.15;model.rig.position.y=Math.abs(Math.cos(p))*.012-.018;
  for(const s of [-1,1]){const q=p+(s===1?Math.PI:0);b['leg_'+s].rotation.x=Math.sin(q)*.42;b['knee_'+s].rotation.x=Math.max(0,Math.cos(q))*.34;b['foot_'+s].rotation.x=-b['leg_'+s].rotation.x*.55-b['knee_'+s].rotation.x*.75;b['arm_'+s].rotation.x=-Math.sin(q)*.32;}
  b.hips.rotation.y=Math.sin(p)*.035;b.bag.rotation.z=Math.sin(p)*.045;
 }else if(mode==='gather'){
  model.rig.position.y=-.18;b.hips.rotation.x=.14;b.spine.rotation.x=.55;b.head.rotation.x=.24;
  b['knee_-1'].rotation.x=.45;b['knee_1'].rotation.x=.45;
  b['arm_1'].rotation.x=-.7;b['elbow_1'].rotation.x=-.32+Math.sin(cycle*.35)*.1;
 }else if(mode==='talk'){
  const p=cycle/2.5;b.head.rotation.y=Math.sin(p)*.12;
  b['arm_1'].rotation.x=-.34-Math.max(0,Math.sin(p))*.28;b['elbow_1'].rotation.x=-.52-Math.sin(p)*.25;b['hand_1'].rotation.z=Math.sin(p*2)*.16;
 }else if(mode==='listen'){
  b.head.rotation.y=.09;b.head.rotation.z=-.035;b['arm_-1'].rotation.x=-.12;b['elbow_-1'].rotation.x=-.38;
 }
}
const api={create,animate,patches,durations:{idle:4,walk:1.15,talk:2.5,listen:4}};
if(typeof module!=='undefined')module.exports=api;else root.NovaKarinModelClassic=api;
})(typeof window==='undefined'?{}:window);
