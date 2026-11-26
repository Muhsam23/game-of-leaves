/* GP-5 aus Fotos (siehe MASK_CREDITS.txt): Gummihaube ShM-62 mit zwei Augengläsern, Ventilkasten und Filter GP-5.
   Außen liegt der Atlas gasmask-gp5-atlas.jpg, der aus dem Außenfoto abgewickelt ist (textur/gp5_atlas.py),
   innen das bereinigte Innenfoto, von hinten auf die Haube projiziert. Maße in Metern, Ursprung zwischen den Gläsern. */
window.NovaMaskModel=(()=>{
 'use strict';
 const sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
 const YB=-.125,YC=.128,POW=.8,K_IN=.042/212.5;
 const crownK=y=>y<=.02?1:Math.sqrt(Math.max(0,1-((y-.02)/(YC-.02))**2));
 const halfWidth=y=>(.079-.009*sm(-.04,YB,y))*Math.pow(crownK(y),.85);
 const front=y=>(.086-.012*sm(.03,.11,y)-.013*sm(-.04,YB,y))*crownK(y);
 const back=y=>(.106-.008*sm(-.02,YB,y))*crownK(y);
 const edgeY=phi=>YB+.175*Math.pow(sm(0,1,(1-Math.cos(phi))/2),2.4);
 function surface(phi,y,out){
  const s=Math.sin(phi),c=Math.cos(phi),x=halfWidth(y)*Math.sign(s)*Math.pow(Math.abs(s),POW);
  let z=(c>=0?front(y):back(y))*Math.sign(c)*Math.pow(Math.abs(c),POW);
  if(c>0)z+=.013*Math.exp(-((x/.032)**2+((y+.088)/.03)**2));
  return out.set(x,y,z);
 }
 function create(T,textures){
  const group=new T.Group();group.name='GP-5';
  const atlas=textures.maskAtlas,inner=textures.maskInner;
  const px=(x,y)=>[x/2048,1-y/2048];
  // Augengläser: leicht nach außen gedreht, Mittelpunkt auf der Haube.
  const tmp=new T.Vector3(),eyes=[1,-1].map(side=>{
   let lo=0,hi=Math.PI/2;for(let i=0;i<40;i++){const m=(lo+hi)/2;surface(m,0,tmp);if(tmp.x<.042)lo=m;else hi=m;}
   surface(lo,0,tmp);const c=new T.Vector3(side*tmp.x,0,tmp.z+.003),n=new T.Vector3(side*Math.sin(.22),-.04,Math.cos(.22)).normalize();
   return{c,n};
  });
  const v3=a=>`vec3(${a.x.toFixed(5)},${a.y.toFixed(5)},${a.z.toFixed(5)})`;
  const holes=eyes.map(e=>`{vec3 d=vHoodPos-${v3(e.c)};float a=dot(d,${v3(e.n)});if(length(d-a*${v3(e.n)})<.0232&&abs(a)<.035)discard;}`).join('');
  // Beim Aufsetzen wird die Haube hinten geöffnet (uHoodCut), damit der Blick wie auf dem Innenfoto hineinsieht.
  const cut={value:-1},cutTop={value:1};group.userData.cut=cut;group.userData.cutTop=cutTop;
  function hood(mat,innerSide,eyesOpen=true){
   mat.onBeforeCompile=sh=>{
    sh.uniforms.uHoodCut=cut;sh.uniforms.uHoodTop=cutTop;
    sh.vertexShader='varying vec3 vHoodPos;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvHoodPos=position;');
    sh.fragmentShader='uniform float uHoodCut,uHoodTop;varying vec3 vHoodPos;\n'+sh.fragmentShader.replace('void main() {','void main() {\nif(vHoodPos.z<uHoodCut||vHoodPos.y>uHoodTop)discard;\n'+(eyesOpen?holes:''));
    if(innerSide)sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb*=mix(.16,1.,smoothstep(-.085,-.01,vHoodPos.z));').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=mix(.1,1.,smoothstep(-.085,-.01,vHoodPos.z));');
   };
   mat.customProgramCacheKey=()=>innerSide?'gp5-hood-inner':eyesOpen?'gp5-hood-outer':'gp5-hood-rim';return mat;
  }
  const rubberOut=hood(new T.MeshStandardMaterial({map:atlas,roughness:.8,metalness:0}),false);
  const rubberIn=hood(new T.MeshStandardMaterial({map:inner,emissive:0xffffff,emissiveMap:inner,emissiveIntensity:.5,color:0x9a9a92,roughness:.9,metalness:0,side:T.BackSide}),true);
  const rubber=new T.MeshStandardMaterial({map:atlas,roughness:.8,metalness:0}),rubberRim=hood(new T.MeshStandardMaterial({map:atlas,roughness:.8,metalness:0}),false,false);
  const metal=new T.MeshStandardMaterial({map:atlas,roughness:.32,metalness:.55,side:T.DoubleSide});
  const paint=new T.MeshStandardMaterial({map:atlas,roughness:.42,metalness:.12});
  const bakelite=new T.MeshStandardMaterial({map:atlas,roughness:.45,metalness:0});
  const glass=new T.MeshStandardMaterial({color:0x6f7f78,roughness:.05,metalness:.35,transparent:true,opacity:.32,side:T.DoubleSide,depthWrite:false});
  function mesh(geometry,material,name,parent=group){const m=new T.Mesh(geometry,material);m.name=name;m.userData.novaNoWarp=true;m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
  // Haube als Fläche über Umfang und Höhe; unten und hinten offen, damit man hineinsieht.
  const NI=96,NJ=46,pos=[],nrm=[],uvOut=[],uvIn=[],idx=[],P=new T.Vector3(),A=new T.Vector3(),B=new T.Vector3(),C=new T.Vector3(),D=new T.Vector3(),N=new T.Vector3();
  for(let j=0;j<=NJ;j++)for(let i=0;i<=NI;i++){
   const phi=-Math.PI+2*Math.PI*i/NI,y0=edgeY(phi),y=y0+(YC-y0)*Math.pow(j/NJ,.92);
   surface(phi,y,P);pos.push(P.x,P.y,P.z);
   const e=.002;surface(phi+e,y,A);surface(phi-e,y,B);surface(phi,Math.min(YC,y+e),C);surface(phi,Math.max(YB-.01,y-e),D);
   N.crossVectors(A.sub(B),C.sub(D));if(N.lengthSq()<1e-14)N.set(0,1,0);N.normalize();nrm.push(N.x,N.y,N.z);
   uvOut.push(.5*Math.abs(phi)/Math.PI,.5+.5*(y-YB)/(YC-YB));
   uvIn.push(Math.min(1,Math.max(0,(417.5-P.x/K_IN)/768)),Math.min(1,Math.max(0,1-(392-P.y/K_IN)/1024)));
   if(j<NJ&&i<NI){const a=j*(NI+1)+i,b=a+1,c=a+NI+1,d=c+1;idx.push(a,b,c,b,d,c);}
  }
  const shell=new T.BufferGeometry();shell.setAttribute('position',new T.Float32BufferAttribute(pos,3));shell.setAttribute('normal',new T.Float32BufferAttribute(nrm,3));shell.setIndex(idx);
  const outer=shell.clone();outer.setAttribute('uv',new T.Float32BufferAttribute(uvOut,2));
  const inside=shell;inside.setAttribute('uv',new T.Float32BufferAttribute(uvIn,2));
  mesh(outer,rubberOut,'Gummihaube außen');mesh(inside,rubberIn,'Gummihaube innen');
  // Wulst am offenen Rand.
  const rimPts=[];for(let i=0;i<NI;i++){const phi=-Math.PI+2*Math.PI*(i+.5)/NI;rimPts.push(surface(phi,edgeY(phi)+.002,new T.Vector3()));}
  const rim=new T.TubeGeometry(new T.CatmullRomCurve3(rimPts,true),160,.0042,8,true);
  {const uv=rim.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,.25+uv.getX(i)*.25,.03+uv.getY(i)*.25);}
  mesh(rim,rubberRim,'Wulst am Haubenrand');
  // Augengläser: Gummiwulst, gerollter Metallring aus dem Fotoring, Glas.
  const ringProfile=[[.0212,-.004],[.0214,.0015],[.0232,.0042],[.027,.0052],[.031,.0046],[.0338,.0022],[.0346,-.001],[.034,-.004]].map(([r,z])=>new T.Vector2(r,z));
  for(const e of eyes){
   const g=new T.Group();g.position.copy(e.c);g.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),e.n);group.add(g);
   const collar=new T.TorusGeometry(.0345,.0052,10,56);{const uv=collar.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,.25+uv.getX(i)*.25,.03+uv.getY(i)*.25);}
   mesh(collar,rubber,'Gummiwulst am Glas',g).position.z=-.0035;
   const ring=new T.LatheGeometry(ringProfile,64);ring.rotateX(Math.PI/2);
   {const p=ring.attributes.position,uv=ring.attributes.uv;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),r=Math.hypot(x,y),a=Math.atan2(y,x),rp=(60+(r-.0212)/(.0346-.0212)*32)*256/96;uv.setXY(i,...px(256+rp*Math.cos(a),1280-rp*Math.sin(a)));}}
   ring.computeVertexNormals();mesh(ring,metal,'Metallring',g);
   const pane=mesh(new T.CircleGeometry(.0222,48),glass,'Glas',g);pane.position.z=.001;pane.castShadow=false;
  }
  // Ventilkasten, Anschluss, Gewinde und Filter entlang der Filterachse schräg nach vorn unten.
  const axis=new T.Vector3(0,-.8,.6).normalize(),valve=surface(0,-.088,new T.Vector3()).addScaledVector(axis,-.004),up=new T.Vector3(0,1,0);
  const qAxis=new T.Quaternion().setFromUnitVectors(up,axis.clone().negate());
  function band(row0,row1){return g=>{const uv=g.attributes.uv;for(let i=0;i<uv.count;i++){const v=uv.getY(i);uv.setXY(i,.25+.75*uv.getX(i),1-(row1-(row1-row0)*v)/2048);}return g;};}
  function cylinder(r0,r1,d0,d1,mat,map,name,open=true){
   const g=map(new T.CylinderGeometry(r0,r1,d1-d0,56,1,open));const m=mesh(g,mat,name);m.quaternion.copy(qAxis);m.position.copy(valve).addScaledVector(axis,(d0+d1)/2);return m;
  }
  cylinder(.031,.031,0,.019,metal,band(1280,1344),'Rändelring am Ventilkasten');
  cylinder(.026,.026,.019,.031,bakelite,band(1344,1408),'Brauner Anschluss');
  cylinder(.0215,.0215,.031,.05,bakelite,band(1408,1472),'Gewinde');
  cylinder(.056,.056,.05,.13,paint,band(1024,1280),'Filter GP-5');
  const disc=(r,d,flip,name)=>{const g=new T.CircleGeometry(r,56);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*.25,uv.getY(i)*.25);const m=mesh(g,paint,name);m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),flip?axis:axis.clone().negate());m.position.copy(valve).addScaledVector(axis,d);return m;};
  disc(.056,.05,false,'Filterdeckel');disc(.056,.13,true,'Filterboden');
  for(const d of [.0515,.1285]){const t=new T.TorusGeometry(.0562,.0034,8,56);{const uv=t.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,.25+.75*uv.getX(i),1-(1040+20*uv.getY(i))/2048);}const m=mesh(t,paint,'Gerollte Kante');m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),axis);m.position.copy(valve).addScaledVector(axis,d);}
  // Für das Aufsetzen: Bezugspunkte des Innenfotos (Oberkante Mitte, linker und rechter Bildrand, Mitte) und Standfläche.
  group.userData.liftRef=[[0,(392-7)*K_IN,-.02],[(417.5-5)*K_IN,(392-255)*K_IN,-.02],[-(763-417.5)*K_IN,(392-255)*K_IN,-.02],[0,(392-255)*K_IN,-.02]];
  group.userData.base=valve.clone().addScaledVector(axis,.1325);group.userData.tilt=Math.atan2(.6,.8);
  return group;
 }
 return{create,K_IN};
})();
