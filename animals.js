/* Unreal Nova 2000 / wildlife study. Original geometry. Rigid articulated meshes,
   deliberately faceted and photo-textured. +X forward, +Y up, metres. */
(function(root){
const T=typeof THREE!=='undefined'?THREE:require('./three.min.js');
const patches={body:[0,0,128,128],face:[128,0,128,128],under:[0,128,64,64],dark:[64,128,64,64],eye:[128,128,32,32],ear:[160,128,64,96],nose:[128,160,32,32],foot:[0,192,64,64],tail:[64,192,64,64],white:[224,128,32,128]};
function uv(k,u,v){const p=patches[k]||patches.body;return [(p[0]+1+u*(p[2]-2))/256,1-(p[1]+1+(1-v)*(p[3]-2))/256];}
function geo(verts,faces,key='body',coords=null){let p=[],v=[];for(const f of faces){for(const i of f){p.push(...verts[i]);v.push(...uv(key,...(coords?coords[i]:[.5,.5])));}}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(v,2));g.computeVertexNormals();return g;}
function tube(rings,key='body',sides=8){ // rings [x, y, z, vertical radius, lateral radius]
 let vs=[],uvs=[],fs=[];for(let j=0;j<rings.length;j++){let [x,y,z,ry,rz]=rings[j];for(let i=0;i<=sides;i++){let a=i/sides*Math.PI*2;vs.push([x,y+Math.cos(a)*ry,z+Math.sin(a)*rz]);uvs.push([j/(rings.length-1),(Math.cos(a)+1)*.5]);}}
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<sides;i++){let a=j*(sides+1)+i,b=a+sides+1;fs.push([a,a+1,b],[a+1,b+1,b]);}
 let start=vs.length;vs.push(rings[0].slice(0,3));uvs.push([0,.5]);let end=vs.length;vs.push(rings.at(-1).slice(0,3));uvs.push([1,.5]);for(let i=0;i<sides;i++){fs.push([start,i+1,i]);let a=(rings.length-1)*(sides+1)+i;fs.push([end,a,a+1]);}return geo(vs,fs,key,uvs);}
function ellipsoid(x,y,z,rx,ry,rz,key='body',sides=8){return tube([[-1,.10],[-.65,.77],[0,1],[.65,.77],[1,.10]].map(([f,s])=>[x+f*rx,y,z,ry*s,rz*s]),key,sides);}
function segment(a,b,r1,r2,key='body',sides=6){let v=new T.Vector3(...b).sub(new T.Vector3(...a)),l=v.length();let g=tube([[0,0,0,r1[0],r1[1]],[l*.4,0,0,(r1[0]+r2[0])*.54,(r1[1]+r2[1])*.54],[l,0,0,r2[0],r2[1]]],key,sides);g.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(1,0,0),v.normalize())));g.translate(...a);return g;}
const info={
 cat:{name:'Tabby cat',latin:'Felis catus',height:.35,desc:'Approach and press E to pet. The cat follows you.',speed:.65},
 deer:{name:'Roe deer',latin:'Capreolus capreolus',height:.94,desc:'Slender legs, short tail, large ears and pale rump.',speed:.90},
 hare:{name:'European hare',latin:'Lepus europaeus',height:.47,desc:'Long black-tipped ears and an articulated hopping gait.',speed:.8},
 bear:{name:'Brown bear',latin:'Ursus arctos',height:1.12,desc:'Heavy shoulders, broad paws and a slow rolling walk.',speed:.65},
 fox:{name:'Red fox',latin:'Vulpes vulpes',height:.51,desc:'Narrow muzzle, dark lower legs and a white-tipped brush.',speed:.8}
};
function createAnimal(kind,texture){
 if(!info[kind])throw Error('Unknown animal '+kind);
 let group=new T.Group();group.name=kind;group.userData.species=kind;let rig=new T.Group();rig.name='rig';group.add(rig);
 let mat=new T.MeshLambertMaterial({map:texture||null,color:0xffffff,side:T.DoubleSide});mat.name=kind+'_photo_256';
 let bones={},legs=[];
 const add=(g,p=rig,name='mesh')=>{let m=new T.Mesh(g,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;p.add(m);return m;};
 const joint=(name,pos,parent=rig)=>{let g=new T.Group();g.name=name;g.position.set(...pos);parent.add(g);bones[name]=g;return g;};
 let cfg={
 cat:{body:[[-.27,.24,0,.073,.056],[-.20,.255,0,.101,.084],[0,.255,0,.094,.079],[.16,.255,0,.10,.082],[.23,.29,0,.071,.062]],neck:[[.15,.26,0,.075,.075],[.245,.325,0,.071,.065]],head:[.265,.355,0],hr:[.077,.076,.076],muzzle:.027,ears:[.045,.105,.039],leg:[.15,-.195,.267,.067,.115,.04,.032],tail:[[-.26,.282,0,.030,.030],[-.37,.33,0,.028,.027],[-.45,.45,0,.023,.023],[-.44,.55,0,.013,.014]],paw:[.041,.025,.029]},
 fox:{body:[[-.36,.34,0,.10,.077],[-.24,.37,0,.14,.106],[.02,.36,0,.126,.096],[.23,.365,0,.15,.11],[.32,.40,0,.09,.079]],neck:[[.20,.38,0,.10,.096],[.31,.46,0,.116,.107],[.40,.49,0,.076,.062]],head:[.39,.50,0],hr:[.11,.09,.075],muzzle:.17,ears:[.046,.138,.045],leg:[.23,-.245,.36,.09,.157,.052,.034],tail:[[-.32,.40,0,.065,.061],[-.50,.36,0,.095,.09],[-.72,.24,0,.085,.085],[-.91,.19,0,.060,.06],[-1.04,.20,0,.008,.008]],paw:[.048,.029,.035]},
 deer:{body:[[-.40,.63,0,.15,.118],[-.30,.67,0,.19,.15],[-.03,.67,0,.175,.137],[.26,.685,0,.18,.137],[.37,.71,0,.13,.10]],neck:[[.23,.68,0,.125,.108],[.34,.83,0,.115,.086],[.40,.98,0,.082,.067]],head:[.44,1.03,0],hr:[.109,.085,.069],muzzle:.135,ears:[.060,.19,.034],leg:[.265,-.305,.69,.111,.300,.057,.021],tail:[[-.39,.70,0,.034,.028],[-.46,.66,0,.025,.021]],paw:[.034,.036,.028]},
 hare:{body:[[-.29,.24,0,.09,.10],[-.18,.27,0,.164,.131],[-.035,.28,0,.137,.112],[.14,.285,0,.099,.082]],neck:[[.10,.285,0,.088,.077],[.205,.36,0,.077,.071]],head:[.235,.389,0],hr:[.099,.09,.078],muzzle:.056,ears:[.044,.225,.025],leg:[.125,-.19,.265,.088,.10,.047,.026],tail:[[-.29,.26,0,.034,.041],[-.345,.26,0,.028,.032]],paw:[.078,.023,.032]},
 bear:{body:[[-.66,.73,0,.22,.25],[-.48,.76,0,.32,.33],[-.14,.74,0,.34,.31],[.25,.81,0,.40,.32],[.46,.80,0,.32,.27],[.55,.79,0,.22,.20]],neck:[[.39,.80,0,.235,.23],[.61,.81,0,.22,.21]],head:[.65,.87,0],hr:[.20,.179,.17],muzzle:.25,ears:[.080,.105,.057],leg:[.35,-.47,.75,.22,.31,.13,.09],tail:[[-.66,.79,0,.055,.055],[-.75,.77,0,.033,.036]],paw:[.135,.065,.101]}
 }[kind];
 add(tube(cfg.body),rig,'torso');add(tube(cfg.neck),rig,'neck');
 // Pale belly and the characteristic rump are separate fitted surfaces.
 if(kind==='fox')add(ellipsoid(.19,.335,0,.13,.12,.094,'white',8),rig,'chest_bib');
 if(kind==='deer')add(ellipsoid(-.386,.667,0,.050,.103,.118,'white',8),rig,'rump_patch');
 if(kind==='hare'){add(ellipsoid(.15,.274,0,.078,.084,.078,'under',8),rig,'pale_chest');for(const s of [-1,1])add(ellipsoid(-.185,.21,.079*s,.112,.135,.068,'body',8),rig,'haunch_'+s);}
 let head=joint('head',cfg.head);add(ellipsoid(0,0,0,...cfg.hr,'body',8),head,'skull');
 let [rx,ry,rz]=cfg.hr;
 // Tapered cheek / muzzle profiles, never a sphere stuck on a body.
 let isShort=kind==='cat'||kind==='hare';let muzzle=cfg.muzzle;
 if(kind!=='cat')add(tube([[rx*.3,-ry*.15,0,ry*.65,rz*.76],[rx*.75+muzzle*.30,-ry*.35,0,ry*.43,rz*.55],[rx*.65+muzzle,-ry*.36,0,ry*.21,rz*.25]],kind==='bear'||kind==='deer'?'under':'white',8),head,'muzzle');
 add(ellipsoid((kind==='cat'?.139:rx*.65+muzzle+.004),-ry*.33,0,.011*(kind==='bear'?2.7:1),ry*.22,rz*.28,'nose',6),head,'nose');
 // Frontal photographic face for the cat, with explicit cheek planes and a nose ridge.
 if(kind==='cat'){
  const vs=[[.071,.058,-.052],[.089,.054,0],[.071,.058,.052],[.082,.005,-.071],[.131,.000,0],[.082,.005,.071],[.084,-.054,-.046],[.131,-.041,0],[.084,-.054,.046]];
  const uvs=[[0,1],[.5,1],[1,1],[0,.52],[.5,.52],[1,.52],[0,0],[.5,0],[1,0]];
  add(geo(vs,[[0,3,1],[1,3,4],[1,4,2],[2,4,5],[3,6,4],[4,6,7],[4,7,5],[5,7,8]],'face',uvs),head,'photo_face');
 }
 for(const s of [-1,1]){
  // Ears taper through 5 vertices per side, with a photo-mapped inner panel.
  let eg=joint('ear_'+s,[-rx*.20,ry*.70,rz*.68*s],head);let [ew,eh,ed]=cfg.ears;
  let lean=kind==='deer'?-.055:kind==='hare'?-.05:-.023;
  if(kind==='bear')add(ellipsoid(0,eh*.44,0,ed,eh*.6,ew,'body',6),eg,'round_ear');
  else if(kind==='deer'||kind==='hare'){
   let egGeo=tube([[0,0,0,ed*.5,ew*.4],[eh*.44,0,0,ed,ew],[eh*.77,0,0,ed*.7,ew*.72],[eh,0,0,ed*.04,ew*.03]],'body',6);egGeo.rotateZ(Math.PI/2+.17);add(egGeo,eg,'leaf_ear');
   add(geo([[ed*.5,.025,-ew*.18],[ed*.5,.025,ew*.18],[ed*.8-eh*.075,eh*.44,ew*.7],[-eh*.15,eh*.92,0],[ed*.8-eh*.075,eh*.44,-ew*.7]],[[0,1,2],[0,2,4],[4,2,3]],'ear',[[.4,0],[.6,0],[1,.45],[.5,1],[0,.45]]),eg,'ear_inner');
   if(kind==='hare'){let tip=segment([-eh*.14,eh*.8,0],[-eh*.17,eh,0],[ed*.6,ew*.5],[ed*.01,ew*.01],'dark',6);add(tip,eg,'black_ear_tip');}
  }else{
   let vs=[[-ed,0,-ew],[ed,0,-ew],[ed,0,ew],[-ed,0,ew],[lean,eh*.72,-ew*.53],[lean+.012,eh*.72,ew*.53],[lean-.004,eh,0]];
   add(geo(vs,[[0,1,4],[1,2,5],[1,5,4],[2,3,5],[3,0,4],[3,4,5],[4,6,5]],'body',[[0,0],[0,0],[1,0],[1,0],[.25,.72],[.75,.72],[.5,1]]),eg,'ear_outer');
   add(geo([[ed+.001,.012,-ew*.77],[ed+.002,.012,ew*.77],[lean+.017,eh*.69,ew*.39],[lean+.009,eh*.89,0],[lean+.009,eh*.69,-ew*.39]],[[0,1,2],[0,2,4],[4,2,3]],'ear',[[0,0],[1,0],[1,.7],[.5,1],[0,.7]]),eg,'ear_inner');
   if(kind==='hare')add(geo([[lean-.006,eh*.80,-ew*.4],[lean+.018,eh*.80,ew*.4],[lean-.003,eh+.002,0]],[[0,1,2]],'dark',[[0,0],[1,0],[.5,1]]),eg,'ear_tip');
  }
  if(kind!=='cat'){
   let ex=rx*.55,ey=ry*.24,ez=rz*.87*s,w=ry*(kind==='hare'?.22:.19),h=w*.75;
   let vs=[[ex-w,ey,ez],[ex,ey+h,ez+s*.002],[ex+w,ey,ez],[ex,ey-h,ez+s*.002]];
   add(geo(vs,[[0,1,2],[0,2,3]],'eye',[[0,.5],[.5,1],[1,.5],[.5,0]]),head,'eye_'+s);
  }
 }
 // Rigid upper leg / lower leg / foot hierarchy with two-link IK.
 const [front,back,hipY,spread,kneeY,thick,thin]=cfg.leg;
 for(let rear of [false,true])for(let s of [-1,1]){
  let hx=rear?back:front,hy=hipY-(rear&&kind==='hare'?.035:0),hz=spread*s;
  let ky=kneeY,kx=(rear?.06:-.018)*(kind==='bear'?2:1);
  let fx=hx+(rear?-.024:.012),fy=cfg.paw[1];
  if(kind==='hare'&&rear){kx=.115;ky=.08;fx=hx+.15;}
  let upper=joint((rear?'hind':'fore')+'_'+s,[hx,hy,hz]);let lower=joint(upper.name+'_shin',[kx,ky-hy,0],upper);let foot=joint(upper.name+'_foot',[fx-hx-kx,fy-ky,0],lower);
  add(segment([0,0,0],[kx,ky-hy,0],[thick*(rear?1.32:.9),thick],[thin*1.2,thin*1.15],rear?'body':'body',6),upper,'upper_leg');
  add(segment([0,0,0],[fx-hx-kx,fy-ky,0],[thin*1.25,thin*1.14],[thin*.76,thin*.8],kind==='fox'?'dark':'body',6),lower,'lower_leg');
  add(ellipsoid(cfg.paw[0]*.38,0,0,...cfg.paw,kind==='deer'?'dark':'foot',6),foot,'paw');
  if(kind==='bear')for(let c=-1;c<=1;c++)add(segment([.095,0,c*.049],[.153,-.018,c*.05],[.01,.01],[.001,.003],'dark',4),foot,'claw');
  legs.push({upper,lower,foot,hx,hy,hz,fx,fy,kx,ky,L1:Math.hypot(kx,ky-hy),L2:Math.hypot(fx-hx-kx,fy-ky),a1:Math.atan2(ky-hy,kx),a2:Math.atan2(fy-ky,fx-hx-kx),rear,s});
 }
 let tail=joint('tail',cfg.tail[0].slice(0,3));let tr=cfg.tail.map(r=>[r[0]-cfg.tail[0][0],r[1]-cfg.tail[0][1],r[2],r[3],r[4]]);
 add(tube(tr,kind==='hare'?'white':'tail',6),tail,'tail_mesh');
 if(kind==='fox'){let tip=tr.slice(-2).map(r=>[...r]);tip[0][0]-=.018;add(tube(tip,'white',6),tail,'tail_tip');}
 group.userData.triangles=0;group.traverse(o=>{if(o.isMesh)group.userData.triangles+=o.geometry.attributes.position.count/3;});
 if(kind==='hare'){const neckMesh=rig.getObjectByName('neck');const neckPose=joint('neck_pose',[.10,.255,0]);rig.remove(neckMesh);neckMesh.position.set(-.10,-.255,0);neckPose.add(neckMesh);rig.remove(head);head.position.x-=.10;head.position.y-=.255;neckPose.add(head);}
 const model={kind,group,rig,bones,legs,mat,cfg,info:info[kind]};animate(model,0,'idle');return model;
}
function animate(m,t,mode='idle'){
 let moving=mode==='walk'||mode==='run',run=mode==='run';let speed=m.kind==='bear'?1.3:m.kind==='hare'?2.1:1.9;
 let p=t*speed*(run?1.7:1)*Math.PI*2;let bob=m.kind==='hare'&&moving?Math.max(0,Math.sin(p))*.11:Math.sin(t*2.4)*.002;
 m.rig.position.y=bob;m.rig.rotation.z=m.kind==='hare'&&moving?Math.sin(p)*.07:0;
 m.bones.head.rotation.set(0,Math.sin(t*.8)*.07,Math.sin(t*1.5)*.022+(mode==='sniff'?-.35:0));
 m.bones.tail.rotation.y=Math.sin(t*2.2)*(.13+(moving?.06:0));
 for(let s of [-1,1])m.bones['ear_'+s].rotation.x=Math.sin(t*1.9+s)*.045;
 for(const l of m.legs){
  let phase=p+(m.kind==='hare'?(l.rear?Math.PI:0):(l.rear?Math.PI:0)+(l.s===1?Math.PI:0));
  let stride=(m.kind==='bear'?.13:m.kind==='deer'?.115:m.kind==='hare'?.065:.055)*(run?1.7:1);
  let targetX=l.fx+(moving?Math.cos(phase)*stride:0),targetY=l.fy+(moving?Math.max(0,Math.sin(phase))*(m.kind==='bear'?.075:.042)*(run?1.5:1):0);
  let dx=targetX-l.hx,dy=targetY-l.hy;let d=Math.min(Math.hypot(dx,dy),l.L1+l.L2-.00005),angle=Math.atan2(dy,dx);
  let offset=Math.acos(T.MathUtils.clamp((l.L1*l.L1+d*d-l.L2*l.L2)/(2*l.L1*d),-1,1));
  // Select the rest-pose bend, and solve both joints in the sagittal plane.
  let restCross=(l.fx-l.hx)*(l.ky-l.hy)-(l.fy-l.hy)*l.kx;
  let a=angle+(restCross>=0?1:-1)*offset;let kx=Math.cos(a)*l.L1,ky=Math.sin(a)*l.L1;
  let b=Math.atan2(dy-ky,dx-kx);l.upper.rotation.z=a-l.a1;l.lower.rotation.z=b-l.a2-l.upper.rotation.z;l.foot.rotation.z=-(l.upper.rotation.z+l.lower.rotation.z);
 }
}
function createCatFollower(cat){
 let active=false,state='idle',phase=0;return {
  get following(){return active},get state(){return state},
  interact(player){if(cat.group.position.distanceTo(new T.Vector3(player.x,0,player.z))>1.15)return false;active=!active;state=active?'following':'idle';return true;},
  update(dt,player){dt=Math.min(dt,.05);let g=cat.group,dx=player.x-g.position.x,dz=player.z-g.position.z,d=Math.hypot(dx,dz);let moving=active&&d>.72;if(moving){let desired=Math.atan2(-dz,dx);let diff=Math.atan2(Math.sin(desired-g.rotation.y),Math.cos(desired-g.rotation.y));g.rotation.y+=diff*Math.min(1,dt*6);let velocity=Math.min(d>2?1.6:.82,Math.max(0,(d-.68)*2));g.position.x+=dx/d*velocity*dt;g.position.z+=dz/d*velocity*dt;phase+=dt*(velocity/.65);state='following';}else{phase+=dt*.4;state=active?'waiting':'idle';}animate(cat,phase,moving?'walk':'idle');return {following:active,state,distance:d};},
  reset(){active=false;state='idle';phase=0;}
 };
}
const api={createAnimal,animate,createCatFollower,info,patches};if(typeof module!=='undefined')module.exports=api;else root.Wildlife=api;
})(typeof window==='undefined'?{}:window);
