// Original aged models from Pfeifen_Test_Offline.html, 2026-10-03.
(function(global){
'use strict';
function createFactory(T, textures){
 const mats={};
 function photo(key,options={}) {const t=textures[key];return new T.MeshStandardMaterial({map:t,roughness:.8,metalness:0,...options});}
 mats.wood=photo('pipe_bowl',{bumpMap:textures.pipe_bowl,bumpScale:.00011,roughness:.79});
 mats.shank=photo('pipe_shank',{bumpMap:textures.pipe_shank,bumpScale:.00007,roughness:.76});
 mats.stem=photo('pipe_stem',{roughness:.78,color:0xc4c1a8});
 mats.char=photo('pipe_char',{roughness:1,color:0x77716a});
 mats.paper=photo('match_paper',{roughness:1,color:new T.Color(0xb5a27b).convertSRGBToLinear()});
 mats.label=photo('match_label',{roughness:1,color:new T.Color(0xc8b795).convertSRGBToLinear()});
 mats.tin=photo('tin_edge',{roughness:.98,metalness:.08,color:new T.Color(0x939b87).convertSRGBToLinear()});
 mats.lid=photo('tin_lid',{roughness:.89,metalness:.09,color:new T.Color(0xc6bba2).convertSRGBToLinear()});
 mats.metal=new T.MeshStandardMaterial({color:0x534a35,roughness:.68,metalness:.65});
 mats.dark=new T.MeshStandardMaterial({color:0x11100d,roughness:1});
 mats.matchWood=photo('match_paper',{color:0xb8a473,roughness:1});
 mats.head=new T.MeshStandardMaterial({color:new T.Color(0x503027).convertSRGBToLinear(),roughness:1});
 const mesh=(geo,mat,name)=>{const m=new T.Mesh(geo,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;return m;};
 function addBox(g,w,h,d,mat,x,y,z,name){const m=mesh(new T.BoxGeometry(w,h,d),mat,name);m.position.set(x,y,z);g.add(m);return m;}
 function lathe(g,profile,mat,x,y,z,name,segments=32){const m=mesh(new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),segments),mat,name);m.position.set(x,y,z);g.add(m);return m;}
 // Elliptical cross sections taper from the round tenon to the flattened bite.
 function sweepX(rings,radial=20){const pos=[],uv=[],ix=[];for(let i=0;i<rings.length;i++){const [x,y,ry,rz]=rings[i];for(let j=0;j<=radial;j++){const a=j/radial*Math.PI*2;pos.push(x,y+Math.cos(a)*ry,Math.sin(a)*rz);uv.push(i/(rings.length-1),j/radial);}}
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<radial;j++){const a=i*(radial+1)+j,b=a+radial+1;ix.push(a,a+1,b,a+1,b+1,b);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;}
 function roundedShape(w,d,r){const x=-w/2,z=-d/2;const s=new T.Shape();s.moveTo(x+r,z);s.lineTo(x+w-r,z);s.quadraticCurveTo(x+w,z,x+w,z+r);s.lineTo(x+w,z+d-r);s.quadraticCurveTo(x+w,z+d,x+w-r,z+d);s.lineTo(x+r,z+d);s.quadraticCurveTo(x,z+d,x,z+d-r);s.lineTo(x,z+r);s.quadraticCurveTo(x,z,x+r,z);return s;}
 function roundedSolid(w,d,h,r,mat,name){const geo=new T.ExtrudeGeometry(roundedShape(w,d,r),{depth:h,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.00025,bevelThickness:.00025,curveSegments:5});geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,normal=geo.attributes.normal,uv=geo.attributes.uv;for(let i=0;i<pos.count;i++){if(Math.abs(normal.getY(i))<.8)uv.setXY(i,Math.atan2(pos.getZ(i)/d,pos.getX(i)/w)/(Math.PI*2)+.5,(pos.getY(i)+.00025)/(h+.0005));}const m=mesh(geo,mat,name);return m;}
 function topPhoto(w,d,r,mat,y,name){const g=new T.ShapeGeometry(roundedShape(w,d,r),6);const p=g.attributes.position,u=g.attributes.uv;for(let i=0;i<p.count;i++)u.setXY(i,(p.getX(i)+w/2)/w,(p.getY(i)+d/2)/d);g.rotateX(-Math.PI/2);const m=mesh(g,mat,name);m.position.y=y;return m;}
 // Surface wear is model geometry and vertex colour, preserving the source photographs.
 // It exports to plain glTF without shaders or additional raster dependencies.
 function ageObject(root,kind){
  let seed={pipe:5071,matches:8023,tin:17411}[kind];
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const batches=new Map();
  const definitions={
   wood:{palette:[0x70513a,0x63462f,0x806247],roughness:.71},
   soot:{palette:[0x211914,0x16120f,0x33231a],roughness:1},
   stem:{palette:[0x494b41,0x555449,0x3e4038],roughness:.87},
   paper:{palette:[0x938263,0xa28f6c,0x9b896a,0xaf9c76],roughness:1},
   dirt:{palette:[0x5c4930,0x675237,0x736245],roughness:1,opacity:.23},
   rust:{palette:[0x593c27,0x79482b,0x875536,0x453423],roughness:1},
   metal:{palette:[0x8b8772,0x737568,0xaaa18a],roughness:.74,metalness:.50},
   paint:{palette:[0x526e66,0x6d8071,0x526358],roughness:.99}
  };
  const colorCache={};function rgb(hex){if(!colorCache[hex])colorCache[hex]=new T.Color(hex).convertSRGBToLinear();return colorCache[hex];}
  function patch(key,o,u,v,rx,ry,angle=0){
   if(!batches.has(key))batches.set(key,{p:[],n:[],c:[]});const b=batches.get(key),cfg=definitions[key],points=[];
   const n=new T.Vector3(...u).cross(new T.Vector3(...v)).normalize().toArray();
   const count=7+Math.floor(random()*4),ca=Math.cos(angle),sa=Math.sin(angle);
   for(let i=0;i<count;i++){const a=i/count*Math.PI*2,r=.62+random()*.52,x=Math.cos(a)*rx*r,y=Math.sin(a)*ry*r;const dx=x*ca-y*sa,dy=x*sa+y*ca;points.push(o.map((q,j)=>q+u[j]*dx+v[j]*dy));}
   const c=rgb(cfg.palette[Math.floor(random()*cfg.palette.length)]),shade=.85+random()*.20;
   for(let i=0;i<count;i++){const tri=[o,points[i],points[(i+1)%count]];for(let j=0;j<3;j++){b.p.push(...tri[j]);b.n.push(...n);const alpha=key==='dirt'?(j===0?1:0):1;b.c.push(c.r*shade,c.g*shade,c.b*shade,alpha);}}
  }
  const top=(key,x,z,y,rx,rz,angle=0)=>patch(key,[x,y,z],[1,0,0],[0,0,-1],rx,rz,angle);
  if(kind==='pipe'){
   // Rim darkening interrupted by the small polished places worn by a thumb.
   for(let i=0;i<74;i++){const a=random()*Math.PI*2,r=.0102+random()*.00065,y=.0325-(r-.0094)/.0019*.0005+.00006;
    top(i%5===0?'wood':'soot',-.049+Math.cos(a)*r,Math.sin(a)*r,y,.00021+random()*.00027,.00010+random()*.00017,a);
   }
   // Fine scuffs follow the curvature, concentrated at the lower bowl and rim.
   for(let i=0;i<39;i++){const a=random()*Math.PI*2,y=i<22?.010+random()*.008:.028+random()*.0015,r=y<.018?.01244:.01182;
    patch('wood',[-.049+Math.cos(a)*r,y,Math.sin(a)*r],[-Math.sin(a),0,Math.cos(a)],[0,1,0],.00014+random()*.0003,.00006+random()*.00017);
   }
   for(let i=0;i<20;i++){const x=.003+random()*.057,y=.0102+(x-.005)*.014+(.0051+(x-.005)/.059*(.0023-.0051));
    top('stem',x,(random()-.5)*.002,y+.00006,.00036+random()*.0008,.000021+random()*.000025,(random()-.5)*.3);
   }
   // A handful of dull bite marks, not white painted stripes.
   for(let i=0;i<8;i++)top('stem',.059+random()*.005,(random()-.5)*.007,.01395,.00008+random()*.0001,.00032+random()*.00035,(random()-.5)*.18);
  }
  if(kind==='matches'){
   const y=.01507;
   // Uneven exposed paper fibres around the four label edges.
   for(let i=0;i<78;i++){const side=i%4,edge=side<2;const x=edge?(random()-.5)*.050:(side===2?-.0255:.0255),z=edge?(side===0?-.0170:.0170):(random()-.5)*.032;
    top('paper',x,z,y,edge?.00010+random()*.0006:.00013+random()*.00035,edge?.00010+random()*.0003:.00010+random()*.0005,random());
   }
   for(let i=0;i<5;i++){const x=(i%2?1:-1)*(.020+random()*.003),z=(i<3?1:-1)*(.010+random()*.004);top('dirt',x,z,y+.000006,.002+random()*.003,.001+random()*.002,random());}
   // Broken creases and fine worn streaks in the printed paper.
   for(let i=0;i<19;i++){const t=i/18,x=-.013+t*.010,z=-.015+t*.021;top('paper',x,z,y+.000015,.00004,.00045+random()*.00055,-.45);}
   for(let i=0;i<20;i++)top('dirt',(random()-.5)*.046,(random()-.5)*.030,y+.000012,.00008+random()*.00017,.00008+random()*.00017);
   // Repeated striking leaves narrow, irregular dark rubs on the abrasive faces.
   for(const side of [-1,1])for(let i=0;i<26;i++)patch('dirt',[(random()-.5)*.045,.0075+(random()-.5)*.007,side*.01776],[side,0,0],[0,1,0],.001+random()*.004,.00015+random()*.0002,(random()-.5)*.25);
   // Slight damage along the exposed cardboard corners and sleeve ends.
   for(const side of [-1,1])for(let i=0;i<20;i++)patch('paper',[(random()-.5)*.050,i%2===0?.0018:.0136,side*.01758],[side,0,0],[0,1,0],.0003+random()*.0005,.00009+random()*.0002);
  }
  if(kind==='tin'){
   // Oxidation is strongest along rolled seams; central turquoise paint survives.
   for(const side of [-1,1])for(let i=0;i<92;i++){
    const x=(random()-.5)*.119,y=i<64?.0007+random()*.0024:.0185+random()*.0016;
    patch(i%4===0?'metal':'rust',[x,y,side*.030035],[side,0,0],[0,1,0],.0006+random()*.0021,.00018+random()*.00055,random()*.15);
   }
   for(const side of [-1,1])for(let i=0;i<22;i++)patch('rust',[side*.066035,.001+random()*.018,(random()-.5)*.045],[0,0,-side],[0,1,0],.0004+random()*.0010,.0002+random()*.0007);
   for(const side of [-1,1])for(let i=0;i<24;i++)patch(i%3===0?'metal':'paint',[(random()-.5)*.120,.004+random()*.013,side*.030048],[side,0,0],[0,1,0],.0002+random()*.0010,.00006+random()*.00010,(random()-.5)*.5);
   // Dents affect the metal geometry and therefore its highlight, not its label.
   const shell=root.getObjectByName('Hollow tin walls'),p=shell.geometry.attributes.position;
   for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(x>.055&&z<.019){x-=.00045*Math.exp(-Math.pow((z-.007)/.017,2))*Math.sin(y/.021*Math.PI);}p.setXYZ(i,x,y,z);}shell.geometry.computeVertexNormals();
  }
  for(const [key,b]of batches){const cfg=definitions[key],g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));g.setAttribute('color',new T.Float32BufferAttribute(b.c,4));
   const m=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:cfg.roughness,metalness:cfg.metalness||0,side:T.DoubleSide,transparent:!!cfg.opacity,opacity:cfg.opacity||1,depthWrite:!cfg.opacity,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));m.name='Wear '+key;m.receiveShadow=true;root.add(m);
  }
  root.userData.condition='Worn: handled edges, scratches, age staining and seam corrosion';
 }
 function ageLid(lid){
  // Darken the metal rim without changing the historical printed artwork.
  const rim=lid.getObjectByName('Rolled metal lid edge');rim.material=rim.material.clone();rim.material.color.set(0x55462e).convertSRGBToLinear();rim.material.roughness=.94;rim.material.metalness=.24;
 }

 function pipe(){const root=new T.Group();root.name='SovietWoodPipe';root.userData={itemId:'soviet_pipe',label:'Holzpfeife',pickup:true,units:'metres',source:'Odnajdy 57568, USSR 1960–1980'};
 const x=-.049;
 lathe(root,[[0,0],[.004,0],[.008,.001],[.0108,.003],[.0123,.008],[.0124,.018],[.0117,.0295],[.0113,.032],[.0094,.0325]],mats.wood,x,0,0,'Carved wooden bowl');
 lathe(root,[[.0094,.0325],[.0087,.0318],[.0083,.028],[.0078,.016],[.0061,.009],[.003,.007],[0,.007]],mats.char,x,0,0,'Hollow charred chamber');
 const shank=mesh(sweepX([[-.05,.009,.007,.007],[-.040,.009,.008,.0075],[-.033,.009,.0076,.0069],[-.020,.0095,.0067,.0062],[-.012,.010,.0066,.006]],24),mats.shank,'Wooden shank');root.add(shank);
 const mouth=mesh(sweepX([[-.012,.010,.0065,.006],[-.0115,.010,.0065,.006],[.005,.0102,.0051,.0058],[.038,.0108,.0032,.0056],[.064,.0115,.0023,.006],[.065,.0115,.0028,.0064],[.067,.0115,.0028,.0064],[.0677,.0115,.002,.0058]],24),mats.stem,'Flattened black mouthpiece');root.add(mouth);
 const end=mesh(new T.CircleGeometry(1,24),mats.stem,'Mouthpiece end');end.rotation.y=Math.PI/2;end.scale.set(.0058,.002,1);end.position.set(.06771,.0115,0);root.add(end);
 const slot=mesh(new T.PlaneGeometry(.0075,.0008),mats.dark,'Airway slot');slot.rotation.y=Math.PI/2;slot.position.set(.06773,.0115,0);root.add(slot);
 ageObject(root,'pipe');root.userData.dimensions=[.129,.033,.025];return {root,animate(){},openable:false};}
 function matches(){const root=new T.Group();root.name='SovietMatchbox';root.userData={itemId:'soviet_matches',label:'Streichhölzer',pickup:true,units:'metres',source:'Sputnik match label, Jane McDevitt / maraid'};
 const w=.052,d=.035,h=.015;
 addBox(root,w,.001,d,mats.paper,0,h-.0005,0,'Upper cardboard');
 const label=topPhoto(w-.0003,d-.0003,.00025,mats.label,h+.00002,'Original Sputnik label');root.add(label);
 addBox(root,w,.001,d,mats.paper,0,.0005,0,'Lower cardboard');
 addBox(root,w,h-.001,.0008,mats.paper,0,h/2,d/2-.0004,'Sleeve side');addBox(root,w,h-.001,.0008,mats.paper,0,h/2,-d/2+.0004,'Sleeve side');
 // Striking strips are reconstructed. The historical label remains an unpainted scan.
 const striker=new T.MeshStandardMaterial({color:0x493027,roughness:1});
 for(const z of [-1,1]){addBox(root,w-.003,h-.004,.00014,striker,0,h/2,z*(d/2+.00003),'Striking surface');const marks=new T.InstancedMesh(new T.BoxGeometry(.0006,.0006,.0001),mats.head,135);marks.name='Striker pressed pattern';const dummy=new T.Object3D();for(let j=0;j<5;j++)for(let i=0;i<27;i++){dummy.position.set(-.024+i*.0018,h/2-.004+j*.002,z*(d/2+.00011));dummy.rotation.z=Math.PI/4;dummy.updateMatrix();marks.setMatrixAt(j*27+i,dummy.matrix);}root.add(marks);}
 const tray=new T.Group();tray.name='Sliding inner tray';root.add(tray);
 addBox(tray,w-.0018,.0008,d-.002,mats.paper,0,.002,0,'Tray floor');
 for(const s of [-1,1]){addBox(tray,.0007,h-.003,d-.002,mats.paper,s*(w/2-.0012),h/2,0,'Tray end');addBox(tray,w-.002,h-.003,.0007,mats.paper,0,h/2,s*(d/2-.0016),'Tray wall');}
 for(let i=0;i<16;i++){const match=new T.Group();match.name='Match '+(i+1);const z=-.013+(i%8)*.0037,y=.004+Math.floor(i/8)*.0027;addBox(match,.041,.0017,.0017,mats.matchWood,0,y,z,'Wooden match');const head=mesh(new T.SphereGeometry(1,7,5),mats.head,'Brown match head');head.position.set(i%3===0?.020:-.020,y,z);head.scale.set(.0021,.00145,.0014);match.add(head);match.rotation.y=(i%3-1)*.011;tray.add(match);}
 ageObject(root,'matches');root.userData.dimensions=[w,h,d];return {root,openable:true,animate(t){tray.position.x=t*.032;}};}
 function tin(){const root=new T.Group();root.name='ReydTobaccoTin';root.userData={itemId:'soviet_tobacco',label:'Tabakdose Рейд',pickup:true,units:'metres',source:'RUCIG.RU / Pavel Kiselev, Leningrad State Tobacco Trust'};
 const w=.132,d=.060,h=.021,r=.005;
 const shell=roundedShape(w,d,r);shell.holes.push(roundedShape(w-.002,d-.002,r-.001));const shellGeo=new T.ExtrudeGeometry(shell,{depth:h,bevelEnabled:false,curveSegments:6,steps:1});shellGeo.rotateX(-Math.PI/2);const shellPos=shellGeo.attributes.position,shellUV=shellGeo.attributes.uv;for(let i=0;i<shellPos.count;i++)shellUV.setXY(i,Math.atan2(shellPos.getZ(i)/d,shellPos.getX(i)/w)/(Math.PI*2)+.5,shellPos.getY(i)/h);root.add(mesh(shellGeo,mats.tin,'Hollow tin walls'));root.add(roundedSolid(w-.001,d-.001,.0015,r,mats.metal,'Metal bottom'));
 const tobaccoMat=new T.MeshStandardMaterial({color:new T.Color(0x24130b).convertSRGBToLinear(),roughness:1});
 root.add(topPhoto(w-.003,d-.003,r-.001,tobaccoMat,h-.004,'Tobacco bed'));
 // Individual low-poly strands give the open can actual depth.
 let seed=637;function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
 const strandGeo=new T.BufferGeometry();strandGeo.setAttribute('position',new T.Float32BufferAttribute([-.004,0,-.00035,-.004,0,.00035,-.001,.0008,-.0005,-.001,.0008,.0002,.002,.0005,0,.002,.0005,.0007,.004,0,-.0002,.004,0,.0005],3));strandGeo.setIndex([0,1,2,1,3,2,2,3,4,3,5,4,4,5,6,5,7,6]);strandGeo.computeVertexNormals();const colors=[0x47301c,0x694123,0x352318,0x80603b];
 for(let c=0;c<4;c++){const im=new T.InstancedMesh(strandGeo,new T.MeshStandardMaterial({color:new T.Color(colors[c]).convertSRGBToLinear(),roughness:1,side:T.DoubleSide}),65);im.name='Loose tobacco strands';const dummy=new T.Object3D();for(let j=0;j<65;j++){dummy.position.set((rnd()-.5)*(w-.016),h-.0035+rnd()*.0016,(rnd()-.5)*(d-.010));dummy.rotation.set(rnd()*.15,rnd()*Math.PI,rnd()*.13);dummy.scale.set(.5+rnd(),1,1);dummy.updateMatrix();im.setMatrixAt(j,dummy.matrix);}im.castShadow=true;im.receiveShadow=true;root.add(im);}
 const lid=new T.Group();lid.name='Removable lid';root.add(lid);lid.position.y=h+.0006;
 lid.add(roundedSolid(w+.001,d+.001,.0038,r,mats.metal,'Rolled metal lid edge'));
 lid.add(topPhoto(w+.0005,d+.0005,r,mats.lid,.0041,'Original photographed Reyd lid'));
 ageObject(root,'tin');ageLid(lid);root.userData.dimensions=[w,h+.005,d];return {root,openable:true,animate(t){lid.position.set(0,(h+.0006)*(1-t)+.003*t+Math.sin(t*Math.PI)*.05,-t*.080);lid.rotation.x=-Math.sin(t*Math.PI)*.25;}};}
 return {pipe,matches,tin,materials:mats};
}
global.SovietProps={createFactory};
})(window);
