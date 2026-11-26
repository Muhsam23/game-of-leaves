/* Die Maschine: wächst in einem eigenen Fenster um den Blick herum auf, im Apartment und draußen. Zahnräder steigen
   durch den Boden, ein Karussell mit Stücken des Apartments senkt sich von oben und dreht um den Blick. */
window.NovaMaskApparatus=(()=>{
 'use strict';
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);},ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
 function create(THREE,textures,pack){
  const group=new THREE.Group();group.name='Maschine';group.visible=false;
  const metal=new THREE.MeshLambertMaterial({map:textures.rust,color:0x6b6c5c}),black=new THREE.MeshLambertMaterial({color:0x1d221d}),wood=new THREE.MeshLambertMaterial({map:textures.wood,color:0x8f7951}),wall=new THREE.MeshLambertMaterial({map:textures.ruin,color:0xa4aa98}),brass=new THREE.MeshBasicMaterial({color:0x746847}),glass=new THREE.MeshBasicMaterial({color:0x8e9c8b});
  function mesh(parent,geometry,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);parent.add(m);return m;}
  function box(parent,x,y,z,w,h,d,mat){const geo=new THREE.BoxGeometry(w,h,d);if(mat===wall){const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,.015+uv.getX(i)*.47,.515+uv.getY(i)*.47);}return mesh(parent,geo,mat,x,y,z);}
  function gear(r,teeth,thick){
   const g=new THREE.Group(),segments=Math.max(28,teeth*2);
   mesh(g,new THREE.TorusGeometry(r,thick*.55,8,segments),metal);
   {const plate=mesh(g,new THREE.CylinderGeometry(r*.97,r*.97,thick*.5,segments),metal);plate.rotation.x=Math.PI/2;const ring=mesh(g,new THREE.CylinderGeometry(r*.62,r*.62,thick*.62,segments),black);ring.rotation.x=Math.PI/2;}
   mesh(g,new THREE.TorusGeometry(r*.8,thick*.22,6,segments),black);
   mesh(g,new THREE.TorusGeometry(r*.5,.014,4,segments),brass);
   for(let i=0;i<teeth;i++){const a=i/teeth*Math.PI*2,t=box(g,Math.cos(a)*(r+thick*.85),Math.sin(a)*(r+thick*.85),0,thick*1.15,thick*1.25,thick*1.5,metal);t.rotation.z=a;}
   const spokes=Math.max(3,Math.round(r*1.6));for(let i=0;i<spokes;i++){const s=box(g,0,0,0,r*1.62,thick*.55,thick*.45,black);s.rotation.z=i/spokes*Math.PI;}
   const hub=mesh(g,new THREE.CylinderGeometry(r*.15,r*.15,thick*2.2,18),metal);hub.rotation.x=Math.PI/2;
   pack(g);return g;
  }
  function pivot(x,y,z,ry=0){const p=new THREE.Group();p.position.set(x,y,z);p.rotation.y=ry;group.add(p);return p;}
  // Großes Rad hinter dem Bett, zweites Rad im Eingriff, drittes Rad an der Fensterwand.
  const A={r:2.35,teeth:34,base:new THREE.Vector3(-3.38,.55,-.4)},B={r:1.05,teeth:15},C={r:1.6,teeth:23,base:new THREE.Vector3(2.35,.25,-4.02)};
  const pa=pivot(A.base.x,A.base.y,A.base.z,Math.PI/2),ga=gear(A.r,A.teeth,.16);pa.add(ga);
  const reach=A.r+B.r+.16*1.8,angB=Math.PI*.92;B.base=new THREE.Vector3(A.base.x,A.base.y+Math.sin(angB)*reach,A.base.z+Math.cos(angB)*reach);
  const pb=pivot(B.base.x,B.base.y,B.base.z,Math.PI/2),gb=gear(B.r,B.teeth,.14);pb.add(gb);
  const pc=pivot(C.base.x,C.base.y,C.base.z,0),gc=gear(C.r,C.teeth,.15);pc.add(gc);
  // Karussell unter der Decke: Speichen, Ring und hängende Stücke des Apartments, die um den Blick kreisen.
  const D={R:2.1,base:new THREE.Vector3(.3,2.95,1.0),panels:6};
  const pd=pivot(D.base.x,D.base.y,D.base.z,0),carousel=new THREE.Group();
  {
   const ring=mesh(carousel,new THREE.TorusGeometry(D.R,.06,8,72),metal);ring.rotation.x=Math.PI/2;
   const inner=mesh(carousel,new THREE.TorusGeometry(D.R*.55,.03,6,48),black);inner.rotation.x=Math.PI/2;
   for(let i=0;i<8;i++){const s=box(carousel,0,0,0,D.R*2,.07,.09,black);s.rotation.y=i/8*Math.PI;}
   mesh(carousel,new THREE.CylinderGeometry(.22,.22,.3,18),metal);
   for(let i=0;i<D.panels;i++){
    const a=i/D.panels*Math.PI*2,p=new THREE.Group();p.position.set(Math.cos(a)*D.R,0,Math.sin(a)*D.R);p.rotation.y=-a-Math.PI/2;carousel.add(p);
    for(const x of [-.42,.42])mesh(p,new THREE.CylinderGeometry(.015,.015,.4,6),metal,x,-.2,0);
    box(p,0,-1.15,0,1.1,1.5,.05,wall);box(p,0,-.42,.02,1.14,.05,.08,wood);box(p,0,-1.9,.02,1.14,.05,.08,wood);
    if(i%2===0){box(p,0,-1.0,.03,.56,.62,.02,glass);box(p,0,-1.0,.045,.04,.62,.02,wood);box(p,0,-1.0,.045,.56,.04,.02,wood);box(p,0,-1.34,.06,.66,.04,.1,wood);}
    else{box(p,-.12,-1.28,.03,.4,.88,.02,black);box(p,.24,-1.55,.12,.3,.04,.26,wood);box(p,.24,-1.33,.24,.3,.4,.03,wood);}
   }
   pack(carousel);pd.add(carousel);
  }
  let wA=0,wC=0,wD=0,last=null,tooth=null,pass=null;const events=[];
  function update(s,indoor=true){
   const m=s.layers&&s.layers.maschine===false?0:(s.machine||0);
   group.visible=s.active&&m>.004;
   const dt=last===null?0:clamp(s.time-last,0,.1);last=s.time;
   if(!group.visible){tooth=pass=null;return;}
   wA+=dt*(.05+.15*m);wC+=dt*(.045+.12*m);wD+=dt*(.07+.19*m);
   pa.position.y=A.base.y-3.3*(1-ease(smooth(0,.45,m)));
   pb.position.y=B.base.y-3.6*(1-ease(smooth(.1,.55,m)));
   pc.position.y=C.base.y-3.1*(1-ease(smooth(.15,.6,m)));
   pd.position.y=D.base.y+1.9*(1-ease(smooth(.35,.85,m)));
   ga.rotation.z=wA;gb.rotation.z=-wA*A.r/B.r+.11;gc.rotation.z=-wC;carousel.rotation.y=wD;
   const t=Math.floor(wA/(Math.PI*2/A.teeth)),p=Math.floor(wD/(Math.PI*2/D.panels));
   if(tooth!==null&&t!==tooth)events.push('cog');if(pass!==null&&p!==pass&&m>.6)events.push('pass');tooth=t;pass=p;
  }
  return{group,update,drainEvents(){return events.splice(0);}};
 }
 return{create};
})();
