
window.NovaMaskWorld=(()=>{
 'use strict';
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
 function create(THREE,textures){
  const shared={};
  function tiled(t,u,v){const m=t.clone();m.repeat.set(u,v);m.needsUpdate=true;return m;}
  shared.wall=new THREE.MeshLambertMaterial({map:textures.wallpaper||textures.ruin,color:textures.wallpaper?0xd5d0b9:0xaaa38b,vertexColors:!!textures.wallpaper,side:THREE.DoubleSide});
  shared.plaster=new THREE.MeshLambertMaterial({color:0x929582});
  shared.floor=new THREE.MeshLambertMaterial({map:tiled(textures.wood,3,4),color:0x554936});
  shared.wood=new THREE.MeshLambertMaterial({map:textures.wood,color:0xa7824b});
  shared.metal=new THREE.MeshStandardMaterial({map:textures.rust,color:0x6a756a,roughness:.91,metalness:.18});
  shared.fabric=new THREE.MeshLambertMaterial({color:0x4f5949});
  shared.trim=new THREE.MeshLambertMaterial({color:0x4f574e});
  shared.white=new THREE.MeshLambertMaterial({color:0x8d9182});
  shared.dark=new THREE.MeshLambertMaterial({color:0x191f19});
  function box(parent,x,y,z,w,h,d,mat){const geometry=new THREE.BoxGeometry(w,h,d);if(mat===shared.wall){const uv=geometry.attributes.uv;
   if(textures.wallpaper){const pos=geometry.attributes.position,norm=geometry.attributes.normal,colors=new Float32Array(pos.count*3);
    for(let i=0;i<pos.count;i++){const px=pos.getX(i)+x,py=pos.getY(i)+y,pz=pos.getZ(i)+z;uv.setXY(i,(Math.abs(norm.getX(i))>.5?pz:px)/2.28,py/3.2);const shade=.66+.34*Math.sin(Math.PI*Math.max(0,Math.min(1,py/3.05)));colors.fill(shade,i*3,i*3+3);}geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
   }else for(let i=0;i<uv.count;i++)uv.setXY(i,.015+uv.getX(i)*.47,.515+uv.getY(i)*.47);
  }const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function cylinder(parent,x,y,z,r,h,mat,n=12){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,n),mat);m.position.set(x,y,z);parent.add(m);return m;}
  function chair(parent,x,z,yaw=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=yaw;parent.add(g);box(g,0,.48,0,.46,.065,.47,shared.wood);box(g,0,.88,-.20,.45,.38,.055,shared.wood);for(const a of [-.18,.18])for(const b of [-.18,.18])box(g,a,.245,b,.045,.49,.045,shared.wood);return g;}
  function table(parent,x,z){const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);box(g,0,.79,0,1.36,.075,.83,shared.wood);for(const a of [-.57,.57])for(const b of [-.31,.31])box(g,a,.38,b,.065,.76,.065,shared.wood);return g;}
  function batchRoom(root){
   root.updateMatrixWorld(true);const buckets=new Map(),meshes=[];
   root.traverse(o=>{if(!o.isMesh)return;meshes.push(o);const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrixWorld);if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(g);});
   for(const m of meshes){m.parent.remove(m);m.geometry.dispose();}
   for(const [material,parts]of buckets){const g=new THREE.BufferGeometry();for(const name of ['position','normal','uv','color']){if(name==='color')for(const p of parts)if(!p.attributes.color)p.setAttribute('color',new THREE.BufferAttribute(new Float32Array(p.attributes.position.count*3).fill(1),3));const itemSize=name==='uv'?2:3,array=new Float32Array(parts.reduce((n,p)=>n+p.attributes[name].array.length,0));let at=0;for(const p of parts){array.set(p.attributes[name].array,at);at+=p.attributes[name].array.length;}g.setAttribute(name,new THREE.BufferAttribute(array,itemSize));}g.computeBoundingSphere();const m=new THREE.Mesh(g,material);m.castShadow=m.receiveShadow=true;root.add(m);for(const p of parts)p.dispose();}
  }
  function room({openBack=false,cutaway=false,lit=true}={}){
   const g=new THREE.Group();g.name='Apartment';
   box(g,0,-.09,0,7.4,.18,8.6,shared.floor);
   if(!cutaway){box(g,0,3.04,0,7.4,.14,8.6,shared.plaster);box(g,-3.67,1.48,0,.18,3.02,8.6,shared.wall);}
   else{box(g,0,3.04,-3.8,7.4,.12,.28,shared.plaster);box(g,-3.67,1.48,-3.8,.18,3.02,.28,shared.wall);}
   if(!cutaway){box(g,3.67,1.5,-1.35,.18,3.0,5.9,shared.wall);box(g,3.67,1.5,3.68,.18,3.0,1.25,shared.wall);box(g,3.67,2.66,2.25,.18,.67,1.55,shared.wall);}
   if(!openBack){
    box(g,-2.15,1.5,-4.23,3.15,3,.16,shared.wall);box(g,3.05,1.5,-4.23,1.3,3,.16,shared.wall);box(g,.65,.42,-4.23,3.9,.84,.16,shared.wall);box(g,.65,2.8,-4.23,3.9,.4,.16,shared.wall);
    const glass=new THREE.MeshBasicMaterial({color:0xa0ae9e});box(g,.65,1.7,-4.30,3.85,1.78,.06,glass);
    for(const x of [-1.27,.65,2.58])box(g,x,1.73,-4.12,.065,1.95,.1,shared.trim);for(const y of [.81,2.66])box(g,.65,y,-4.12,3.95,.07,.1,shared.trim);
    for(let i=0;i<12;i++)cylinder(g,-.35+i*.17,.43,-3.98,.06,.58,shared.white,8);
   }
   if(!cutaway)box(g,0,1.5,4.23,7.4,3,.17,shared.wall);
   for(const x of [-3.55,3.55])box(g,x,.08,0,.09,.13,8.4,shared.trim);
   table(g,.1,-1.05);chair(g,1.23,-.18,-.5);chair(g,-.85,-1.28,.4);
   box(g,-2.65,.34,-2.16,1.22,.36,2.65,shared.wood);box(g,-2.65,.55,-2.16,1.18,.14,2.58,shared.fabric);box(g,-2.65,.65,-3.0,.94,.16,.55,shared.white);
   box(g,2.86,.66,-2.63,.72,1.32,.73,shared.wood);box(g,2.47,.87,-2.62,.04,.06,.23,shared.metal);
   const lampMat=new THREE.MeshBasicMaterial({color:0xddd3aa});cylinder(g,0,2.89,.2,.23,.11,shared.trim);cylinder(g,0,2.82,.2,.20,.05,lampMat);
   const lamp=new THREE.PointLight(0xf5ddb0,.55,10,1.4);lamp.position.set(0,2.60,.2);if(lit)g.add(lamp);
   batchRoom(g);return g;
  }
  const apartment=new THREE.Scene();apartment.background=new THREE.Color(0x444c42);apartment.fog=new THREE.FogExp2(0x727665,.014);apartment.add(new THREE.HemisphereLight(0xbfc9b6,0x3a3227,.8));
  const root=room();apartment.add(root);const mask=window.NovaMaskModel.create(THREE,textures);root.add(mask);
  // Die GP-5 liegt auf der linken Seite auf dem Tisch wie auf dem Foto, Gläser zum Blick, der Filter liegt daneben.
  // Die Drehung wird so gesucht, dass Haube und Filter beide aufliegen.
  {
   const k=1.2,v=new THREE.Vector3(),pts=[],isFilter=[];mask.scale.setScalar(k);mask.rotation.order='YXZ';mask.updateMatrixWorld(true);
   const inv=new THREE.Matrix4().copy(mask.matrixWorld).invert(),M=new THREE.Matrix4();
   mask.traverse(o=>{if(!o.isMesh)return;const pa=o.geometry.attributes.position,f=/Filter|Kante/.test(o.name);M.multiplyMatrices(inv,o.matrixWorld);for(let i=0;i<pa.count;i+=2){v.fromBufferAttribute(pa,i).applyMatrix4(M).multiplyScalar(k);pts.push(v.clone());isFilter.push(f);}});
   const q=new THREE.Quaternion(),e=new THREE.Euler(0,0,0,'YXZ');let best=null;
   for(let roll=-1.1;roll>=-2.0;roll-=.01){q.setFromEuler(e.set(0,.3,roll,'YXZ'));let mh=1e9,mf=1e9;pts.forEach((p,i)=>{const y=v.copy(p).applyQuaternion(q).y;if(isFilter[i])mf=Math.min(mf,y);else mh=Math.min(mh,y);});const d=Math.abs(mh-mf);if(!best||d<best.d)best={d,roll,low:Math.min(mh,mf)};}
   mask.rotation.set(0,.3,best.roll);mask.position.set(.11,.8275-best.low+.001,-.99);
  }
  // Gerahmtes Bild über dem Bett: die Erinnerung, die im Mittelteil lebendig wird.
  const picture={w:.9,h:.50625,mesh:null};
  {
   const g=new THREE.Group();g.name='Bild';g.position.set(-2.32,1.8,-4.13);root.add(g);
   const frameMat=new THREE.MeshLambertMaterial({map:textures.wood,color:0x4a3624}),photo=new THREE.MeshLambertMaterial({map:textures.memory||null,color:0xf2f2f2});
   const b=.045,W=picture.w,H=picture.h;
   for(const [x,y,w,h] of [[0,H/2+b/2,W+2*b,b],[0,-H/2-b/2,W+2*b,b],[-W/2-b/2,0,b,H],[W/2+b/2,0,b,H]]){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.035),frameMat);m.position.set(x,y,.0175);g.add(m);}
   const back=new THREE.Mesh(new THREE.BoxGeometry(W,H,.01),shared.dark);back.position.z=.005;g.add(back);
   picture.mesh=new THREE.Mesh(new THREE.PlaneGeometry(W,H),photo);picture.mesh.position.z=.0105;g.add(picture.mesh);
  }
  const memory=window.NovaMaskMemory?window.NovaMaskMemory.create(THREE):null;
  if(memory&&window.NovaVermesser)memory.setFigure(window.NovaVermesser.createModel(THREE,textures.vermesser));
  // Der andere Ort ist heller und klarer als in v5: berichtete Orte sind deutlich, oft vertraut, selten nur Nebel.
  const replacement=new THREE.Scene();replacement.background=new THREE.Color(0x56604f);replacement.fog=new THREE.FogExp2(0x8e917a,.021);replacement.add(new THREE.HemisphereLight(0xd8d8bc,0x3a382c,1.25));
  box(replacement,0,-.36,-4,62,.3,72,shared.floor);
  const wheel=new THREE.Group();replacement.add(wheel);const pages=[];
  for(let i=0;i<9;i++){
   const page=room({openBack:true,cutaway:true,lit:i%3===1});page.name='Repeated apartment '+i;page.position.set((i%3-1)*7.5,Math.floor(i/3)*3.16,-Math.floor(i/3)*8.6);wheel.add(page);pages.push(page);
  }
  const machines=window.NovaRealityMachines.create(THREE,textures,batchRoom);replacement.add(machines.group);
  // Vermesser als Entitäten am anderen Ort: einer früh, weitere mit wachsender Tiefe; sie stehen um den Blick herum und sehen ihn an.
  const crowd=[0,1,2].map(()=>{const v=window.NovaVermesser.createModel(THREE,textures.vermesser);v.group.scale.setScalar(.72);v.group.visible=false;replacement.add(v.group);return v;});
  const vermesser=crowd[0],presence=vermesser.group;
  // Eigene Gestalt mit derselben GP-5 für den Blick aus der Lampe und ein gebückter Vermesser als Präsenz in der Rückkehr.
  const self=new THREE.Group();self.name='Eigene Gestalt';self.visible=false;apartment.add(self);
  {
   const coat=new THREE.MeshLambertMaterial({color:0x0d100c,transparent:true}),skin=new THREE.MeshLambertMaterial({color:0x161713,transparent:true});
   const part=(geo,mat,x,y,z,rx=0,rz=0,sc)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,0,rz);if(sc)m.scale.set(...sc);self.add(m);return m;};
   part(new THREE.CylinderGeometry(.19,.29,1.25,14),coat,0,.78,0);
   part(new THREE.SphereGeometry(.22,14,10),coat,0,1.42,0,0,0,[1.25,.5,.85]);
   for(const side of [-1,1]){part(new THREE.CylinderGeometry(.05,.045,.74,8),coat,side*.3,1.08,.03,0,side*.06);part(new THREE.SphereGeometry(.05,10,8),skin,side*.32,.69,.04);part(new THREE.CylinderGeometry(.06,.07,.2,8),skin,side*.09,.1,0);}
   part(new THREE.SphereGeometry(.12,16,12),skin,0,1.66,0,0,0,[.92,1.1,.95]);
   const worn=window.NovaMaskModel.create(THREE,textures);worn.scale.setScalar(1.42);worn.position.set(0,1.69,.0);self.add(worn);
  }
  const selfMaterials=[];self.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))if(!selfMaterials.includes(m)){m.transparent=true;selfMaterials.push(m);}});
  const visitor=window.NovaVermesser.createModel(THREE,textures.vermesser);visitor.group.scale.setScalar(.6);visitor.group.position.set(-3.05,0,-3.72);visitor.group.visible=false;apartment.add(visitor.group);
  const visitorMaterials=[];visitor.group.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))if(!visitorMaterials.includes(m)){m.transparent=true;visitorMaterials.push(m);}});
  const apparatus=window.NovaMaskApparatus.create(THREE,textures,batchRoom);apartment.add(apparatus.group);
  const toVisitor=new THREE.Vector3(),view=new THREE.Vector3(),near=new THREE.Vector3(),CORNER=new THREE.Vector3(-3.05,0,-3.72);
  // Aufsetzen: die Maske hebt vom Tisch ab, dreht sich mit der Innenseite zum Blick und steigt von unten vor das Gesicht.
  // Bei handoff übernimmt das Bild der Innenseite im Laborfeld an derselben Stelle.
  const LIFT={handoff:.32,dist:.26,down:.205},home={p:mask.position.clone(),q:mask.quaternion.clone()};
  const look=new THREE.Matrix4(),liftQ=new THREE.Quaternion(),liftQW=new THREE.Quaternion(),rootQ=new THREE.Quaternion();
  const liftW=new THREE.Vector3(),liftTo=new THREE.Vector3(),liftA=new THREE.Vector3(),liftB=new THREE.Vector3(),away=new THREE.Vector3(),camUp=new THREE.Vector3(),camFwd=new THREE.Vector3(),probe=new THREE.Vector3();
  // Zielpose bei handoff: unterhalb der Blickmitte, Innenseite genau zum Auge gedreht.
  function liftTarget(camera){
   camera.getWorldDirection(camFwd);camUp.set(0,1,0).applyQuaternion(camera.quaternion);
   liftW.copy(camera.position).addScaledVector(camFwd,LIFT.dist).addScaledVector(camUp,-LIFT.down);
   away.copy(liftW).multiplyScalar(2).sub(camera.position);look.lookAt(away,liftW,camUp);liftQW.setFromRotationMatrix(look);
  }
  // Oberkante und Breite des Maskenrands in der Zielpose (Bildschirmkoordinaten), damit das Innenbild genau dort übernimmt.
  function liftScreen(camera,out=[0,0,0,0]){liftTarget(camera);const k=mask.scale.x;mask.userData.liftRef.forEach(([x,y,z],i)=>{probe.set(x*k,y*k,z*k).applyQuaternion(liftQW).add(liftW).project(camera);out[i]=i?probe.x:probe.y;});return out;}
  function liftMask(s,camera){
   const u=s.wear||0;mask.userData.cut.value=camera&&u>0?-.2+.178*smooth(.02,.3,u):-1;mask.userData.cutTop.value=camera&&u>0?.2-.124*smooth(.1,.3,u):1;
   if(!camera||u<=0){mask.position.copy(home.p);mask.quaternion.copy(home.q);mask.visible=true;return;}
   mask.visible=u<LIFT.handoff;if(!mask.visible)return;
   const k=u/LIFT.handoff,a=1-k;
   liftTarget(camera);root.getWorldQuaternion(rootQ).invert();
   liftTo.copy(liftW);root.worldToLocal(liftTo);camUp.applyQuaternion(rootQ);
   liftA.copy(home.p);liftA.y+=.16;liftB.copy(liftTo).addScaledVector(camUp,-.22);
   mask.position.set(0,0,0).addScaledVector(home.p,a*a*a).addScaledVector(liftA,3*a*a*k).addScaledVector(liftB,3*a*k*k).addScaledVector(liftTo,k*k*k);
   liftQ.copy(rootQ).multiply(liftQW);mask.quaternion.copy(home.q).slerp(liftQ,smooth(.05,.8,k));
  }
  function update(s,camera=null,indoor=true){
   liftMask(s,camera);const t=s.time;apparatus.update(s,indoor);
   const selfOpacity=indoor&&camera?smooth(.25,.6,s.object):0;self.visible=selfOpacity>.01;
   if(self.visible){self.position.set(camera.position.x,0,camera.position.z);self.rotation.y=camera.rotation.y+Math.PI;for(const m of selfMaterials)m.opacity=selfOpacity;}
   // Im Apartment: zuerst nur im Augenwinkel in der Ecke, mit wachsender Tiefe kommt er näher und bleibt auch im direkten Blick.
   let visitorOpacity=0,stay=0;
   if(indoor&&camera){
    if(s.wearing&&s.entity>0){
     camera.getWorldDirection(view);view.y=0;view.normalize();
     near.copy(camera.position).addScaledVector(view,1.9);near.x+=view.z*.55;near.z-=view.x*.55;near.x=Math.max(-3.2,Math.min(3.2,near.x));near.z=Math.max(-3.8,Math.min(3.8,near.z));near.y=0;
     visitor.group.position.copy(CORNER).lerp(near,smooth(0,1,s.approach));visitorOpacity=s.entity;stay=smooth(.3,.6,s.approach);
    }else if(s.presence>0){visitor.group.position.copy(CORNER);visitorOpacity=s.presence;}
    if(visitorOpacity>0){
     camera.getWorldDirection(view);toVisitor.set(visitor.group.position.x,1.6,visitor.group.position.z).sub(camera.position).normalize();
     const periphery=smooth(.15,.42,Math.acos(Math.max(-1,Math.min(1,view.dot(toVisitor)))));visitorOpacity*=periphery+(1-periphery)*stay;
     visitor.group.rotation.y=Math.atan2(camera.position.x-visitor.group.position.x,camera.position.z-visitor.group.position.z);visitor.pose(0,0,'warning',t);
    }
   }
   visitor.group.visible=visitorOpacity>.01;for(const m of visitorMaterials)m.opacity=visitorOpacity*.94;
   wheel.rotation.z=Math.sin(t*.13)*s.split*.13;wheel.rotation.y=Math.sin(t*.085)*s.replace*.14;
   pages.forEach((p,i)=>{const row=Math.floor(i/3),col=i%3-1;p.position.set(col*7.5+s.split*Math.sin(t*.32+i*.71)*.6,row*3.16+s.split*Math.sin(t*.26+i)*.28,-row*8.6);p.rotation.y=s.split*Math.sin(t*.20+i*.81)*.055;});
   machines.update(s);
   crowd.forEach((v,i)=>{v.group.visible=s.active&&s.replace>.12&&s.layers.entitaeten!==false&&(s.entity>.3||s.presence>.05)&&s.depth+(s.presence>.05?1:0)>.2+.25*i;v.pose(0,0,'warning',t+i*2.1);});
  }
  const CROWD=[[0,3.6],[-.55,4.6],[.62,4.2]];
  function updatePresence(eye,s){
   eye.getWorldDirection(view);view.y=0;if(view.lengthSq()<1e-6)view.set(0,0,-1);view.normalize();const base=Math.atan2(view.x,view.z);
   crowd.forEach((v,i)=>{const [da,dist]=CROWD[i],a=base+da+.06*Math.sin(s.time*.11+i),r=Math.max(1.8,dist-1.3*(s.depth||0));v.group.position.set(eye.position.x+Math.sin(a)*r,-.21,eye.position.z+Math.cos(a)*r);v.group.rotation.y=Math.atan2(eye.position.x-v.group.position.x,eye.position.z-v.group.position.z);});
  }
  function blocked(x,z){if(x< -3.36||x>3.36||z< -3.85||z>3.85)return true;const near=(cx,cz,w,d)=>Math.abs(x-cx)<w/2+.23&&Math.abs(z-cz)<d/2+.23;return near(.1,-1.05,1.36,.83)||near(-2.65,-2.16,1.22,2.65)||near(2.86,-2.63,.72,.73);}
  return{lift:LIFT,liftScreen,picture,memory,apartment,replacement,root,mask,shared,pages,presence,vermesser,crowd,machines,apparatus,self,visitor,update,updatePresence,blocked,maskPosition:mask.position.clone()};
 }
 return{create};
})();

