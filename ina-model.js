/* Original rigid low-poly character. Metres, +Y up, +Z forward. */
(function(root){
'use strict';
const T=typeof THREE!=='undefined'?THREE:require('./three.min.js');
const patches={face:[0,0,256,256],coat:[256,0,256,256],scarf:[0,256,128,128],wicker:[128,256,128,128],skin:[256,256,64,64],hair:[320,256,64,64],moss:[384,256,128,128],boot:[256,320,64,64],dress:[0,384,128,128],lining:[128,384,128,128],button:[256,384,64,64],dark:[320,320,64,64]};
function uv(key,u,v){let p=patches[key];return [(p[0]+1+u*(p[2]-2))/512,1-(p[1]+1+(1-v)*(p[3]-2))/512];}
function geo(vs,fs,key,uvs){let p=[],u=[];for(const f of fs)for(const i of f){p.push(...vs[i]);u.push(...uv(key,...(uvs?uvs[i]:[.5,.5])));}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(u,2));g.computeVertexNormals();return g;}
function tube(rings,key,sides=8,cap=true){
 let v=[],u=[],f=[];rings.forEach(([x,y,z,rx,rz],j)=>{for(let i=0;i<=sides;i++){let a=i/sides*Math.PI*2;v.push([x+Math.sin(a)*rx,y,z+Math.cos(a)*rz]);u.push([i/sides,1-j/(rings.length-1)]);}});
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<sides;i++){let a=j*(sides+1)+i,b=a+sides+1;f.push([a,b,a+1],[a+1,b,b+1]);}
 if(cap){let first=v.length;v.push(rings[0].slice(0,3));u.push([.5,1]);let last=v.length;v.push(rings.at(-1).slice(0,3));u.push([.5,0]);for(let i=0;i<sides;i++){f.push([first,i,i+1]);let a=(rings.length-1)*(sides+1)+i;f.push([last,a+1,a]);}}
 return geo(v,f,key,u);
}
function ell(x,y,z,rx,ry,rz,key,sides=8){return tube([[-1,.04],[-.65,.74],[0,1],[.65,.74],[1,.04]].map(([a,b])=>[x,y+a*ry,z,rx*b,rz*b]),key,sides);}
function segment(a,b,r1,r2,key,sides=6){let delta=new T.Vector3(...b).sub(new T.Vector3(...a));let g=tube([[0,0,0,r1[0],r1[1]],[0,delta.length(),0,r2[0],r2[1]]],key,sides);g.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize())));g.translate(...a);return g;}
function createCollector(texture){
 const group=new T.Group();group.name='Ina';let rig=new T.Group();rig.name='root';group.add(rig);let bones={};
 const mat=new T.MeshLambertMaterial({map:texture||null,side:T.DoubleSide,color:0xffffff});mat.name='collector_diffuse_512';
 function add(g,parent=rig,name='surface'){const m=new T.Mesh(g,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function joint(name,pos,parent=rig){let b=new T.Group();b.name=name;b.position.set(...pos);parent.add(b);bones[name]=b;return b;}
 // The hip carries a separate long skirt; the upper body bends above it.
 let hips=joint('hips',[0,.73,0]);
 let skirt=joint('skirt',[0,0,0],hips);
 add(tube([[0,-.46,.006,.22,.16],[0,-.28,0,.205,.15],[0,-.08,0,.18,.14],[0,.06,0,.16,.12]],'dress',10),skirt,'wool_skirt');
 let spine=joint('spine',[0,.015,0],hips);
 add(tube([[0,-.41,-.006,.23,.165],[0,-.20,0,.218,.155],[0,.02,0,.178,.145],[0,.24,-.014,.20,.15],[0,.37,-.015,.234,.142],[0,.43,.02,.178,.115]],'coat',10),spine,'long_wool_coat');
 add(ell(0,.35,-.060,.18,.135,.125,'coat',8),spine,'stooped_shoulders');
 // Two fitted lapels and a strip down the front keep the coat readable.
 for(const s of [-1,1])add(geo([[s*.035,.38,.128],[s*.13,.41,.095],[s*.13,.23,.148],[s*.025,.16,.155]],[[0,1,2],[0,2,3]],'lining',[[0,1],[1,1],[1,0],[0,0]]),spine,'lapel');
 for(let i=0;i<4;i++)add(ell(.016,.20-i*.13,.149,.016,.014,.007,'button',6),spine,'coat_button');
 add(geo([[-.15,-.01,.135],[-.075,-.02,.153],[-.075,-.11,.16],[-.15,-.10,.143]],[[0,1,2],[0,2,3]],'lining',[[0,1],[1,1],[1,0],[0,0]]),spine,'worn_pocket');
 let neck=joint('neck',[0,.42,.065],spine);add(segment([0,0,0],[0,.1,.025],[.061,.055],[.057,.055],'skin',8),neck,'neck_skin');
 let head=joint('head',[0,.165,.048],neck);
 // Skull under the scarf, with a custom portrait-projected faceted front.
 add(ell(0,.015,-.034,.118,.184,.116,'hair',10),head,'skull');
 const rows=[
  [.184,.068,.065,.11], [.141,.102,.091,.21], [.073,.109,.109,.35],
  [.032,.106,.108,.44], [-.021,.097,.121,.56], [-.054,.086,.153,.64],
  [-.097,.075,.107,.765], [-.149,.063,.082,.905], [-.166,.042,.054,.945]
 ];
 const xs=[-1,-.62,-.25,0,.25,.62,1];let vs=[],us=[],fs=[];
 rows.forEach(([y,w,z,photoY],j)=>xs.forEach((x,i)=>{
  let zz=z-(Math.abs(x)**1.45)*(.049+(j===5?.04:0));
  if(j===3 && Math.abs(x)>.3 && Math.abs(x)<.8)zz-=.012;
  vs.push([x*w,y,zz]);let imgWidth=[.25,.335,.345,.35,.335,.305,.273,.229,.17][j];
  us.push([.501+x*imgWidth,1-photoY]);
 }));
 for(let j=0;j<rows.length-1;j++)for(let i=0;i<xs.length-1;i++){let a=j*xs.length+i,b=a+xs.length;fs.push([a,b,a+1],[a+1,b,b+1]);}
 // Chin/mouth are a rigid jaw section with the same continuous UV projection.
 let jaw=joint('jaw',[0,-.073,.041],head);
 let faceFS=fs.filter(f=>Math.max(...f)<7*xs.length);let jawFS=fs.filter(f=>Math.max(...f)>=7*xs.length);
 add(geo(vs,faceFS,'face',us),head,'portrait_face');
 add(geo(vs.map(v=>[v[0],v[1]+.073,v[2]-.041]),jawFS,'face',us),jaw,'portrait_jaw');
 for(const s of [-1,1]){
  add(ell(s*.107,-.006,.014,.020,.051,.029,'skin',6),head,'ear');
  // Hood crosses the back of the skull; the opening exposes the full face.
 }
 let hv=[],hu=[],hf=[];const hoodRings=[[-.15,.096,.11],[-.035,.137,.126],[.095,.132,.123],[.195,.09,.088],[.222,.034,.045]];
 hoodRings.forEach(([y,rx,rz],j)=>{for(let i=0;i<=10;i++){let a=.91+i/10*(Math.PI*2-1.82);hv.push([Math.sin(a)*rx,y,-.024+Math.cos(a)*rz]);hu.push([i/10,j/(hoodRings.length-1)]);}});
 for(let j=0;j<hoodRings.length-1;j++)for(let i=0;i<10;i++){let a=j*11+i,b=a+11;hf.push([a,b,a+1],[a+1,b,b+1]);}
 let crown=hv.length;hv.push([0,.224,-.024]);hu.push([.5,1]);for(let i=0;i<10;i++)hf.push([crown,44+i,45+i]);
 add(geo(hv,hf,'scarf',hu),head,'floral_kerchief');
 add(ell(0,-.179,.078,.037,.026,.023,'scarf',6),head,'scarf_knot');
 for(const s of [-1,1])add(geo([[s*.015,-.186,.078],[s*.027,-.178,.096],[s*.090,-.283,.084],[s*.033,-.277,.10]],[[0,1,2],[0,2,3]],'scarf',[[0,1],[1,1],[1,0],[0,0]]),head,'scarf_tail');
 // Legs end in chunky old rubber boots. Separate knees allow short shuffling steps.
 for(const s of [-1,1]){
  let leg=joint('leg_'+s,[s*.096,-.03,0],hips);
  add(segment([0,0,0],[0,-.32,.005],[.066,.071],[.049,.047],'dress'),leg,'stocking_upper');
  let shin=joint('knee_'+s,[0,-.32,.005],leg);
  add(segment([0,0,0],[0,-.29,0],[.050,.05],[.044,.046],'boot',8),shin,'boot_shaft');
  let foot=joint('foot_'+s,[0,-.29,0],shin);
  add(tube([[0,-.066,.042,.064,.121],[0,-.025,.042,.065,.119],[0,.025,.030,.056,.094],[0,.072,0,.045,.048]],'boot',8),foot,'rubber_boot');
 }
 // Offset shoulders and elbows are explicit pivots, not a single rigid torso.
 for(const s of [-1,1]){
  let arm=joint('arm_'+s,[s*.218,.342,.012],spine);
  add(ell(0,-.012,0,.076,.087,.082,'coat',6),arm,'shoulder_cap');
  add(segment([0,0,0],[s*.035,-.235,.016],[.079,.087],[.056,.062],'coat',8),arm,'coat_upper_sleeve');
  let elbow=joint('elbow_'+s,[s*.035,-.235,.016],arm);
  add(segment([0,0,0],[0,-.218,.037],[.056,.062],[.043,.043],'coat',8),elbow,'coat_lower_sleeve');
  add(tube([[0,-.203,.034,.044,.046],[0,-.225,.038,.045,.046]],'lining',8),elbow,'cuff');
  let hand=joint('hand_'+s,[0,-.244,.044],elbow);
  add(ell(0,-.028,.004,.035,.052,.020,'skin',6),hand,'palm');
  for(let i=0;i<3;i++)add(segment([-.020+i*.018,-.059,.008],[-.018+i*.016,-.087,.029],[.009,.010],[.007,.008],'skin',4),hand,'fingers');
  add(segment([-s*.026,-.016,.010],[-s*.041,-.047,.027],[.012,.012],[.009,.009],'skin',5),hand,'thumb');
 }
 // Basket hangs naturally from her right hand; the handle is an open arch.
 let basket=joint('basket',[0,-.072,.023],bones['hand_-1']);
 add(tube([[0,-.30,0,.113,.078],[0,-.272,0,.133,.094],[0,-.15,0,.154,.108]],'wicker',10,false),basket,'basket_weave');
 add(ell(0,-.279,0,.125,.02,.09,'wicker',10),basket,'basket_base');
 add(tube([[0,-.16,0,.157,.111],[0,-.139,0,.157,.111]],'wicker',10,false),basket,'basket_rim');
 let prev=null;for(let i=0;i<=12;i++){let a=i/12*Math.PI;let p=[Math.cos(a)*.15,-.15+Math.sin(a)*.155,0];if(prev)add(segment(prev,p,[.012,.012],[.012,.012],'wicker',5),basket,'basket_handle');prev=p;}
 for(let i=0;i<9;i++){let a=i*2.399,r=.10*Math.sqrt(i/9);add(ell(Math.sin(a)*r,-.141+(i%3)*.006,Math.cos(a)*r*.65,.055,.035,.047,'moss',6),basket,'collected_moss');}
 let moss=joint('moss_in_hand',[0,-.07,.03],bones['hand_1']);
 add(ell(0,0,0,.047,.036,.04,'moss',7),moss,'moss_sample');
 const m={group,rig,bones,mat,info:{name:'Ina',age:69,height:1.52,forward:'+Z',description:'An eccentric Estonian woman with a sharp memory for things that never happened.'}};
 m.base=[];group.traverse(o=>{m.base.push({o,p:o.position.clone(),q:o.quaternion.clone()});});
 group.userData.triangles=0;group.traverse(o=>{if(o.isMesh)group.userData.triangles+=o.geometry.attributes.position.count/3;});
 animate(m,0,'idle');return m;
}
function animate(m,t,mode='idle'){
 m.base.forEach(({o,p,q})=>{o.position.copy(p);o.quaternion.copy(q);});let b=m.bones;
 m.rig.position.y=-.024;let slow=t*Math.PI*2/({idle:4,walk:1.8,talk:4,gather:6}[mode]||4);b.spine.rotation.x=.145+Math.sin(slow)*.012;b.head.rotation.x=-.12+Math.sin(slow)*.025;b.head.rotation.y=Math.sin(slow)*.07;
 b['arm_-1'].rotation.z=-.10;b['elbow_-1'].rotation.x=-.30;b['hand_-1'].rotation.x=.155;
 b['arm_1'].rotation.z=.11;b['elbow_1'].rotation.x=-.60;b['hand_1'].rotation.x=.35;
 if(mode==='walk'){
  let p=t*Math.PI*2/1.8;m.rig.position.y=Math.cos(p*2)*.008-.014;
  for(let s of [-1,1]){let q=p+(s===1?Math.PI:0);b['leg_'+s].rotation.x=Math.sin(q)*.15;b['knee_'+s].rotation.x=Math.max(0,Math.cos(q))*.12;b['foot_'+s].rotation.x=-b['leg_'+s].rotation.x-b['knee_'+s].rotation.x;b['arm_'+s].rotation.x=-Math.sin(q)*.05;}
  b.hips.rotation.y=Math.sin(p)*.025;b.basket.rotation.z=Math.sin(p)*.045;
 } else if(mode==='talk'){
  let p=t*Math.PI*2/4;b.head.rotation.y=Math.sin(p)*.13;b.head.rotation.x=-.10+Math.sin(p*2)*.065;
  b.jaw.rotation.x=Math.max(0,Math.sin(p*7))*.095;b['arm_1'].rotation.x=-.16-Math.max(0,Math.sin(p))*.20;b['elbow_1'].rotation.x=-.75-Math.sin(p)*.25;b['hand_1'].rotation.z=Math.sin(p*2)*.18;
 } else if(mode==='gather'){
  let p=t*Math.PI*2/6,reach=(1-Math.cos(p))*.5;
  b.spine.rotation.x=.145+reach*.72;b.head.rotation.x=-.12-reach*.12;
  b.hips.position.y-=reach*.19;b.skirt.position.z=reach*.15;b.skirt.rotation.x=-reach*.1;
  for(let s of [-1,1]){const d=.61-reach*.19,L1=.32,L2=.29;const a=Math.acos(T.MathUtils.clamp((L1*L1+d*d-L2*L2)/(2*L1*d),-1,1));const k=Math.PI-Math.acos(T.MathUtils.clamp((L1*L1+L2*L2-d*d)/(2*L1*L2),-1,1));b['leg_'+s].rotation.x=-a;b['knee_'+s].rotation.x=k;b['foot_'+s].rotation.x=a-k;}
  b['elbow_1'].rotation.x=-.60+reach*.53;b['arm_1'].rotation.x=-reach*.88;b['hand_1'].rotation.x=.35-reach*.25;
  b['arm_-1'].rotation.x=-reach*.62;b['elbow_-1'].rotation.x=-.30-reach; b['hand_-1'].rotation.x=-b.spine.rotation.x-b['arm_-1'].rotation.x-b['elbow_-1'].rotation.x;b.basket.rotation.x=0;
 }
}
const api={createCollector,animate,patches,durations:{idle:4,walk:1.8,talk:4,gather:6}};if(typeof module!=='undefined')module.exports=api;else root.MossCollector=api;
})(typeof window==='undefined'?{}:window);
