
/* Slow physical mechanisms carrying, pressing and feeding fragments of rooms. */
window.NovaRealityMachines=(()=>{
 'use strict';
 function create(THREE,textures,pack){
  const group=new THREE.Group();group.name='Realitätsmaschinen';
  const metal=new THREE.MeshLambertMaterial({map:textures.rust,color:0x6b6c5c}),black=new THREE.MeshLambertMaterial({color:0x202722}),wood=new THREE.MeshLambertMaterial({map:textures.wood,color:0x8f7951}),wall=new THREE.MeshLambertMaterial({map:textures.ruin,color:0xa4aa98});
  const brass=new THREE.MeshBasicMaterial({color:0x746847}),patina=new THREE.MeshBasicMaterial({color:0x526454});
  function mesh(parent,geometry,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
  function box(p,x,y,z,w,h,d,m=metal){const geo=new THREE.BoxGeometry(w,h,d);if(m===wall){const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,.015+uv.getX(i)*.47,.515+uv.getY(i)*.47);}return mesh(p,geo,m,x,y,z);}
  function cylinder(p,x,y,z,r,len,m=metal,n=14){return mesh(p,new THREE.CylinderGeometry(r,r,len,n),m,x,y,z);}
  function ring(p,r,tube,m=metal){return mesh(p,new THREE.TorusGeometry(r,tube,6,48),m);}
  function unit(name,x,y,z,yaw=0){const u=new THREE.Group();u.name=name;group.add(u);u.position.set(x,y,z);u.rotation.y=yaw;return u;}
  function packed(parent){const p=new THREE.Group();return{g:p,finish(){pack(p);parent.add(p);return p;}};}
  function roomPanel(parent,w=2.1,h=2.45){
   const p=new THREE.Group();box(p,0,0,0,w,h,.12,wall);box(p,0,-h*.5,.42,w,.10,.94,wood);
   box(p,-w*.17,-.12,.08,w*.43,h*.70,.025,black);box(p,-w*.17,-.13,.105,w*.36,h*.65,.028,wood);
   box(p,w*.32,h*.16,.08,.33,.46,.025,patina);box(p,0,h*.48,.075,w,.025,.025,brass);
   parent.add(p);return p;
  }
  // A giant gear carries complete wall/floor fragments around a vertical axis.
  const worldWheel=unit('Weltrad',.5,0,12,Math.PI),base=packed(worldWheel);
  box(base.g,0,.12,0,12,.35,5.6);for(const x of [-4.5,4.5]){box(base.g,x,3.0,.8,.60,6.1,1.25);box(base.g,x,.5,.5,1.6,.8,3.2,black);}
  box(base.g,0,6.3,.85,10.6,.58,.7);const axle=cylinder(base.g,0,6.25,.3,.55,3.2,black);axle.rotation.x=Math.PI/2;base.finish();
  const rotor=new THREE.Group();ring(rotor,4.42,.28);ring(rotor,3.75,.10,black);ring(rotor,4.08,.035,brass);ring(rotor,4.63,.035,patina);
  for(let i=0;i<32;i++){const a=i*Math.PI/16,m=box(rotor,Math.cos(a)*4.6,Math.sin(a)*4.6,0,.43,.34,.63);m.rotation.z=a;}
  for(let i=0;i<8;i++){const a=i*Math.PI/4,m=box(rotor,Math.cos(a)*2.1,Math.sin(a)*2.1,.12,4.2,.13,.23,black);m.rotation.z=a;}
  for(let i=0;i<6;i++){const a=i*Math.PI/3,p=roomPanel(rotor,1.65,2.2);p.position.set(Math.cos(a)*2.65,Math.sin(a)*2.65,-.12);p.rotation.z=a-Math.PI/2;}
  pack(rotor);rotor.position.y=6.25;worldWheel.add(rotor);
  // Two pistons close a heavy platen onto a stack of architectural sheets.
  const press=unit('Faltpresse',-6.2,0,-13,.23),pressBase=packed(press);
  box(pressBase.g,0,.10,0,6.3,.45,5.4);for(const x of [-2.55,2.55])for(const z of [-1.9,1.9])box(pressBase.g,x,4.2,z,.42,8.5,.42);
  box(pressBase.g,0,8.45,0,5.7,.75,4.6);box(pressBase.g,0,.78,0,5.3,.55,4.2,black);
  for(const x of [-2.55,2.55]){box(pressBase.g,x,4.2,-1.95,.08,7.4,.08,patina);box(pressBase.g,x,4.2,1.95,.08,7.4,.08,brass);}pressBase.finish();
  const platen=new THREE.Group();box(platen,0,0,0,5.5,.5,4.1);box(platen,0,-.29,0,4.85,.08,3.7,black);box(platen,0,-.02,2.09,5.25,.06,.04,brass);pack(platen);press.add(platen);
  const pistons=[];for(const x of [-1.7,1.7])pistons.push(cylinder(press,x,6,0,.17,1,black));
  const folds=[];for(let i=0;i<7;i++){const p=new THREE.Group();roomPanel(p,4.5,3.0);pack(p);p.rotation.x=-Math.PI/2;press.add(p);folds.push(p);}
  // Rollers feed repeating room sections through an open machine frame.
  const feeder=unit('Raumwalze',7.6,0,-4.4,-.28),feedBase=packed(feeder);
  box(feedBase.g,0,.18,0,4.5,.36,12);for(const x of [-1.75,1.75])box(feedBase.g,x,1.12,0,.26,.42,11.4);
  for(const z of [-3.4,3.4]){for(const x of [-1.85,1.85])box(feedBase.g,x,3.7,z,.3,5.3,.32);box(feedBase.g,0,6.3,z,4.0,.38,.42);box(feedBase.g,0,6.52,z,3.7,.06,.2,z<0?brass:patina);}feedBase.finish();
  const rollers=[];for(let i=0;i<9;i++){const r=new THREE.Group(),c=cylinder(r,0,0,0,.32,3.5,black);c.rotation.z=Math.PI/2;box(r,0,.30,0,3.42,.025,.055,i%2?brass:patina);pack(r);r.position.set(0,1.12,(i-4)*1.2);feeder.add(r);rollers.push(r);}
  const feedSheets=[];for(let i=0;i<5;i++){const p=new THREE.Group();roomPanel(p,2.7,2.05);pack(p);feeder.add(p);feedSheets.push(p);}
  const tunnel=new THREE.Group();for(let i=0;i<11;i++){const r=ring(tunnel,2.9,.075,i%3===0?patina:metal);r.position.z=-i*.85;}pack(tunnel);tunnel.position.set(6.9,3.3,-21);tunnel.rotation.y=-.22;group.add(tunnel);
  for(const [color,x,y,z]of [[0xb1aa7c,-3,5,10],[0x718578,6,5,-10]]){const light=new THREE.PointLight(color,.62,26,1.3);light.position.set(x,y,z);group.add(light);}
  // The wheel owns its materials so its long fade does not fade the other machines.
  const wheelMaterials=new Map();worldWheel.traverse(o=>{if(!o.isMesh)return;const original=o.material;if(!wheelMaterials.has(original)){const m=original.clone();m.transparent=true;m.opacity=0;m.depthWrite=false;wheelMaterials.set(original,m);}o.material=wheelMaterials.get(original);});
  function update(s){
   const t=s.time,fade=s.wheel||0;group.visible=s.active&&s.replace>.001;worldWheel.visible=s.active&&fade>.0005;rotor.rotation.z=-t*.073;
   for(const material of wheelMaterials.values()){material.opacity=fade;material.transparent=fade<.999;material.depthWrite=fade>=.999;}
   const stroke=.5+.5*Math.sin(t*.49);platen.position.y=3.15+stroke*3.25;
   for(const piston of pistons){const length=8.15-platen.position.y;piston.scale.y=length;piston.position.y=platen.position.y+length*.5;}
   folds.forEach((p,i)=>{p.position.set(Math.sin(t*.19+i*.4)*.16,1.22+i*(.14+.19*stroke),.20*Math.sin(t*.23+i*.62));p.rotation.z=Math.sin(t*.25+i*.35)*.07*(1-stroke);});
   rollers.forEach((r,i)=>{r.rotation.x=t*.78+(i%2)*.12;});
   feedSheets.forEach((p,i)=>{const z=((t*.55+i*2.2)%11)-5.5;p.position.set(0,2.34,z);p.rotation.x=-.4+.34*Math.sin(z*.43);});
  }
  worldWheel.visible=false;
  return{group,update,worldWheel,rotor,platen,folds,rollers,feedSheets};
 }
 return{create};
})();

