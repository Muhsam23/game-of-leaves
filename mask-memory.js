/* Erinnerungsort nach dem Bild an der Wand: Wiese auf einem Hügel, zwei weiße Lattenzäune führen zu einer
   weißen Kirche mit rotem Dach, tiefblauer Himmel. Eigene Kamera; der Weg kommt durch eine Dehnungszufahrt
   nie an, und der Horizont kann sich zu einer Walze aufrollen. */
window.NovaMaskMemory=(()=>{
 'use strict';
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
 const ANCHOR_Z=6.6,EYE=1.55,CHURCH_Z=-96,FOV0=54,ASPECT_PICTURE=16/9;
 function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
 function ground(x,z){
  const rise=1.75*smooth(8,CHURCH_Z+4,z)-3*smooth(CHURCH_Z-6,CHURCH_Z-70,z);
  const hump=.5*Math.exp(-Math.pow((z+5)/5,2))*Math.exp(-Math.pow(x/16,2));
  return rise+hump-.00045*x*x+.05*Math.sin(x*.21+z*.13)*Math.sin(z*.17-x*.07);
 }
 function grassTexture(THREE){
  const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d'),r=rng(77);
  g.fillStyle='#4a8a45';g.fillRect(0,0,512,512);
  for(let i=0;i<2600;i++){g.fillStyle=`rgba(${30+r()*40|0},${90+r()*60|0},${35+r()*30|0},.35)`;g.fillRect(r()*512,r()*512,6+r()*20,4+r()*14);}
  g.lineCap='round';
  for(let i=0;i<11000;i++){
   const x=r()*512,y=r()*512,len=5+r()*12,lean=(r()-.5)*5,v=r();
   g.strokeStyle=v<.04?`rgb(${150+r()*40|0},${145+r()*30|0},${70+r()*30|0})`:`rgb(${45+v*70|0},${105+v*80|0},${45+v*45|0})`;
   g.lineWidth=.8+r()*1.4;const edge=x<20||x>492||y<20||y>492;
   for(const ox of edge?[0,-512,512]:[0])for(const oy of edge?[0,-512,512]:[0]){g.beginPath();g.moveTo(x+ox,y+oy);g.lineTo(x+ox+lean,y+oy-len);g.stroke();}
  }
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t;
 }
 function paintTexture(THREE){
  const c=document.createElement('canvas');c.width=64;c.height=256;const g=c.getContext('2d'),r=rng(19);
  g.fillStyle='#ecede4';g.fillRect(0,0,64,256);
  for(let i=0;i<70;i++){g.fillStyle=`rgba(${190+r()*30|0},${192+r()*30|0},${180+r()*30|0},.5)`;g.fillRect(r()*64,r()*256,1+r()*2,20+r()*90);}
  for(let i=0;i<26;i++){const y=r()*256;g.fillStyle=r()<.6?`rgba(140,120,88,${.35+r()*.4})`:`rgba(96,92,78,${.3+r()*.4})`;g.fillRect(r()<.5?r()*6:58+r()*6,y,2+r()*4,8+r()*40);}
  const grd=g.createLinearGradient(0,256,0,200);grd.addColorStop(0,'rgba(80,110,60,.45)');grd.addColorStop(1,'rgba(80,110,60,0)');g.fillStyle=grd;g.fillRect(0,200,64,56);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;
 }
 function create(THREE){
  const scene=new THREE.Scene();scene.name='Erinnerung';scene.fog=new THREE.FogExp2(0x8db6d8,.0016);
  const curlU={uCurl:{value:0},uCurlZ:{value:ANCHOR_Z}};
  // Aufrollen: die Wiese links und rechts des Weges biegt sich nach oben, bis sie sich über dem Kopf zu einer Röhre schließt.
  function hook(mat){
   mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,curlU);sh.vertexShader='uniform float uCurl,uCurlZ;\n'+sh.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
    vec4 cw=vec4(transformed,1.);
    #ifdef USE_INSTANCING
     cw=instanceMatrix*cw;
    #endif
    cw=modelMatrix*cw;
    if(uCurl>.00001){float ph=clamp(cw.x*uCurl,-3.2,3.2),sn=sin(ph),cs=cos(ph);cw.x=sn/uCurl-cw.y*sn;cw.y=(1.-cs)/uCurl+cw.y*cs;}
    mvPosition=viewMatrix*cw;
    gl_Position=projectionMatrix*mvPosition;`);};
   mat.customProgramCacheKey=()=>'mask-memory-curl';return mat;
  }
  const mark=o=>{o.userData.novaNoWarp=true;o.frustumCulled=false;return o;};
  scene.add(new THREE.HemisphereLight(0xc8dcff,0x48682e,.78));
  const sun=new THREE.DirectionalLight(0xfff4dc,1.05);sun.position.set(-60,70,30);scene.add(sun);
  // Himmel: tiefblau oben, hell und leicht türkis am Horizont.
  const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{},vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:`varying vec3 vDir;
    void main(){float h=clamp(vDir.y,0.,1.);
     vec3 horizon=vec3(.50,.70,.86),low=vec3(.40,.53,.75),mid=vec3(.28,.35,.65),zen=vec3(.19,.20,.44);
     vec3 c=mix(horizon,low,smoothstep(0.,.08,h));c=mix(c,mid,smoothstep(.06,.3,h));c=mix(c,zen,smoothstep(.28,.85,h));
     c=mix(c,horizon,smoothstep(.0,-.06,vDir.y));
     gl_FragColor=vec4(c+(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.,1.);}`});
  const sky=mark(new THREE.Mesh(new THREE.SphereGeometry(600,32,18),skyMat));scene.add(sky);
  // Wiese: dichtes Raster entlang des Weges, außen gröber.
  const xs=[],zs=[];for(let x=-300;x<=300;){xs.push(x);const a=Math.abs(x);x+=a<8?.35:a<30?1.2:a<90?4:12;}
  for(let z=40;z>=-330;){zs.push(z);z-=z>-40?.45:z>-140?1.6:6;}
  const pos=[],uv=[],col=[],idx=[],nx=xs.length;
  for(const z of zs)for(const x of xs){const y=ground(x,z);pos.push(x,y,z);uv.push(x/2.3,z/2.3);const patch=.5+.25*Math.sin(x*.031+Math.sin(z*.017)*2.3)+.25*Math.sin(z*.027-Math.sin(x*.021)*1.7),mown=.04*Math.sin((x*.8-z*.6)*.35)*smooth(14,30,Math.abs(x)),v=.82+.12*Math.sin(x*.05+Math.sin(z*.03)*2)*Math.sin(z*.04)-.05*smooth(60,200,Math.hypot(x,z))+.46*(patch-.5)+mown*3;col.push(v*(.9+.22*patch),v*(1.04-.04*patch),v*(1.02-.2*patch));}
  for(let j=0;j<zs.length-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i,b=a+1,c=a+nx,d=c+1;idx.push(a,b,c,b,d,c);}
  const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));gg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));gg.setAttribute('color',new THREE.Float32BufferAttribute(col,3));gg.setIndex(idx);gg.computeVertexNormals();
  const grass=grassTexture(THREE),groundMat=hook(new THREE.MeshLambertMaterial({map:grass,vertexColors:true,color:0x94b49a}));
  {const gm=mark(new THREE.Mesh(gg,groundMat));gm.userData.novaPatternKind='ground';scene.add(gm);}
  // Zäune: zwei Lattenzäune spreizen sich nahe am Blick nach außen und laufen dann parallel bis über die Kuppe.
  const fenceL=new THREE.CatmullRomCurve3([[-9,9.5],[-4.2,6.0],[-1.9,3.2],[-1.05,0],[-.93,-4],[-.9,-12],[-.9,-20],[-.92,-26]].map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal');
  const fenceR=new THREE.CatmullRomCurve3(fenceL.points.map(p=>new THREE.Vector3(-p.x,0,p.z)),false,'centripetal');
  const paint=paintTexture(THREE),picketMat=hook(new THREE.MeshLambertMaterial({map:paint,color:0xffffff}));
  const shape=new THREE.Shape();shape.moveTo(-.043,0);shape.lineTo(.043,0);shape.lineTo(.043,.98);shape.lineTo(0,1.08);shape.lineTo(-.043,.98);shape.lineTo(-.043,0);
  const picketGeo=new THREE.ExtrudeGeometry(shape,{depth:.022,bevelEnabled:false});picketGeo.translate(0,0,-.011);
  {const p=picketGeo.attributes.position,u=picketGeo.attributes.uv;for(let i=0;i<p.count;i++)u.setXY(i,(p.getX(i)+.043)/.086+(Math.abs(p.getZ(i))>.01?0:.3),p.getY(i)/1.08);}
  const r=rng(5),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sc=new THREE.Vector3(),pt=new THREE.Vector3(),tan=new THREE.Vector3(),color=new THREE.Color();
  function pickets(curves,spacing){
   const list=[];
   for(const curve of curves){const len=curve.getLength(),n=Math.floor(len/spacing);for(let i=0;i<=n;i++){const t=curve.getUtoTmapping(i/n);curve.getPoint(t,pt);curve.getTangent(t,tan);list.push([pt.x,pt.z,Math.atan2(tan.x,tan.z)]);}}
   const mesh=new THREE.InstancedMesh(picketGeo,picketMat,list.length);
   list.forEach(([x,z,yaw],i)=>{const h=.94+r()*.1;e.set((r()-.5)*.05,yaw+Math.PI/2,(r()-.5)*.06);q.setFromEuler(e);sc.set(1,h,1);m4.compose(pt.set(x,ground(x,z)-.03,z),q,sc);mesh.setMatrixAt(i,m4);const w=.86+r()*.14;color.setRGB(w,w*(.99+r()*.02),w*(.95+r()*.05));mesh.setColorAt(i,color);});
   mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;return mark(mesh);
  }
  scene.add(pickets([fenceL,fenceR],.125));
  // Querlatten hinter den Zaunlatten.
  {
   const railGeo=new THREE.BoxGeometry(1,.06,.024),list=[];
   for(const [curve,side] of [[fenceL,1],[fenceR,-1]]){const len=curve.getLength(),n=Math.ceil(len/1.1);for(let i=0;i<n;i++){const t0=curve.getUtoTmapping(i/n),t1=curve.getUtoTmapping((i+1)/n),a=curve.getPoint(t0),b=curve.getPoint(t1);for(const h of [.28,.74])list.push([a,b,h,side]);}}
   const mesh=new THREE.InstancedMesh(railGeo,picketMat,list.length);
   list.forEach(([a,b,h,side],i)=>{const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),mx=(a.x+b.x)/2,mz=(a.z+b.z)/2,ox=dz/len*.03*side,oz=-dx/len*.03*side;e.set(0,Math.atan2(-dz,dx),0);q.setFromEuler(e);sc.set(len,1,1);m4.compose(pt.set(mx+ox,ground(mx,mz)+h,mz+oz),q,sc);mesh.setMatrixAt(i,m4);color.setRGB(.8,.8,.77);mesh.setColorAt(i,color);});
   mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;scene.add(mark(mesh));
  }
  // Schatten der Zäune als dunkle Bänder auf der Wiese, Licht von links.
  {
   const shadowMat=hook(new THREE.MeshBasicMaterial({color:0x08140a,transparent:true,opacity:.42,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
   for(const curve of [fenceL,fenceR]){
    const n=220,p=[],ix=[];
    for(let i=0;i<=n;i++){const t=curve.getUtoTmapping(i/n),a=curve.getPoint(t),tg=curve.getTangent(t);let nx2=tg.z,nz2=-tg.x;if(nx2<0){nx2=-nx2;nz2=-nz2;}const w=.95;for(const o of [0,w]){const x=a.x+nx2*o+.06,z=a.z+nz2*o;p.push(x,ground(x,z)+.015,z);}if(i<n){const k=i*2;ix.push(k,k+1,k+2,k+2,k+1,k+3);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);scene.add(mark(new THREE.Mesh(g,shadowMat)));
   }
  }
  // Zaun am Horizont entlang der Kuppe, weit ausgedehnt.
  {
   const far=new THREE.BoxGeometry(.07,1,.02);far.translate(0,.5,0);
   const list=[];for(let x=-280;x<=280;x+=.22)list.push(x);
   const mesh=new THREE.InstancedMesh(far,picketMat,list.length);
   list.forEach((x,i)=>{const z=CHURCH_Z+6+.00035*x*x;m4.compose(pt.set(x,ground(x,z)-.02,z),q.identity(),sc.set(1,.95+r()*.1,1));mesh.setMatrixAt(i,m4);color.setRGB(.95,.95,.92);mesh.setColorAt(i,color);});
   mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;scene.add(mark(mesh));
   const rail=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.05,.02),picketMat,280);
   for(let i=0;i<280;i++){const x0=-280+i*2,x1=x0+2,z0=CHURCH_Z+6+.00035*x0*x0,z1=CHURCH_Z+6+.00035*x1*x1,mx=(x0+x1)/2,mz=(z0+z1)/2;e.set(0,Math.atan2(-(z1-z0),2),0);q.setFromEuler(e);m4.compose(pt.set(mx,ground(mx,mz)+.62,mz),q,sc.set(Math.hypot(2,z1-z0),1,1));rail.setMatrixAt(i,m4);rail.setColorAt(i,color.setRGB(.9,.9,.88));}
   rail.instanceMatrix.needsUpdate=true;rail.instanceColor.needsUpdate=true;scene.add(mark(rail));
  }
  // Zwei dünne Linien vom Ende des Zaunwegs hinauf zur Kirchentür.
  {
   const lineMat=hook(new THREE.MeshLambertMaterial({color:0xdcdcd2}));
   for(const x of [-.17,.17]){const n=120,p=[],ix=[];for(let i=0;i<=n;i++){const z=-26+(CHURCH_Z+3.6+26)*i/n,xx=x*(1-.45*i/n);for(const o of [-.012,.012])p.push(xx+o,ground(xx,z)+.05,z);if(i<n){const k=i*2;ix.push(k,k+2,k+1,k+1,k+2,k+3);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();const m=mark(new THREE.Mesh(g,lineMat));m.material.side=THREE.DoubleSide;scene.add(m);}
  }
  // Kirche: weißes Holzhaus mit rotem Dach, Glockenturm mit roter Spitze, Seitenflügel rechts.
  const church=new THREE.Group();church.position.set(0,ground(0,CHURCH_Z)-.15,CHURCH_Z);church.scale.setScalar(1.35);scene.add(church);
  {
   const white=hook(new THREE.MeshLambertMaterial({color:0xf1f0ea})),red=hook(new THREE.MeshLambertMaterial({color:0xd8141a,emissive:0x3a0000})),dark=hook(new THREE.MeshLambertMaterial({color:0x2b2c2e}));
   const part=(parent,x,y,z,ry=0)=>{const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;parent.add(g);return g;};
   const add=(parent,geo,mat,x,y,z)=>{const m=mark(new THREE.Mesh(geo,mat));m.position.set(x,y,z);parent.add(m);return m;};
   const box=(parent,w,h,d,mat,x,y,z)=>add(parent,new THREE.BoxGeometry(w,h,d),mat,x,y+h/2,z);
   // Haus mit Satteldach, First entlang der lokalen z-Achse.
   function house(parent,w,wall,rise,depth,over){
    box(parent,w,wall,depth,white,0,0,0);
    const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,rise);s.lineTo(-w/2,0);
    const gg=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false});gg.translate(0,wall,-depth/2);add(parent,gg,white,0,0,0);
    const ang=Math.atan2(rise,w/2),slope=Math.hypot(w/2,rise)+over,slab=new THREE.BoxGeometry(slope,.13,depth+over*2);
    for(const side of [-1,1]){const m=add(parent,slab,red,0,0,0);m.rotation.z=-side*ang;const cx=side*(w/4+over/2*Math.cos(ang))-side*.0,cy=wall+rise/2-over/2*Math.sin(ang)+.07;m.position.set(cx,cy,0);}
   }
   const hall=part(church,0,0,-4.5);house(hall,5.4,3.7,2.1,9,.28);
   box(church,1.25,2.15,.06,dark,0,0,.02);for(const x of [-1.6,1.6])box(church,.55,.9,.06,dark,x,1.7,.02);box(church,.45,.6,.06,dark,0,4.3,.02);
   for(const z of [-2,-4.5,-7])for(const x of [-2.73,2.73])box(church,.06,1.1,.6,dark,x,1.5,z);
   const wing=part(church,5,0,-6.4,Math.PI/2);house(wing,6.2,3.0,1.6,4.6,.24);
   box(church,.95,1.9,.06,dark,4.2,0,-4.08);for(const x of [5.6,6.6])box(church,.55,.85,.06,dark,x,1.55,-4.08);
   box(church,1.25,1.5,1.25,white,0,5.25,-.9);box(church,.5,.55,1.3,dark,0,5.75,-.9);box(church,1.32,.12,1.32,white,0,6.75,-.9);
   const spire=add(church,new THREE.ConeGeometry(.95,2.6,4),red,0,6.87+1.3,-.9);spire.rotation.y=Math.PI/4;
   add(church,new THREE.CylinderGeometry(.02,.02,.5,4),dark,0,6.87+2.75,-.9);
  }
  // Ein Vermesser kann vor der Tür stehen.
  let figure=null;
  function setFigure(model){figure=model;figure.group.position.set(-1.8,ground(-1.8,CHURCH_Z+2.5),CHURCH_Z+2.6);figure.group.rotation.y=0;figure.group.scale.setScalar(1.05);figure.group.visible=false;scene.add(figure.group);figure.group.traverse(o=>{if(o.isMesh)mark(o);});}
  const cam=new THREE.PerspectiveCamera(FOV0,1,.08,1500);cam.rotation.order='YXZ';
  const baseQ0=new THREE.Quaternion(),look=new THREE.Quaternion(),anchorQ=new THREE.Quaternion(),tmpQ=new THREE.Quaternion(),houseQ=new THREE.Quaternion(),eu=new THREE.Euler(0,0,0,'YXZ'),m4l=new THREE.Matrix4(),houseT=new THREE.Vector3(),upV=new THREE.Vector3(0,1,0);let wasWorld=false;
  // Flug: vom Weg steil hinauf und den Zaunweg entlang bis vor das Haus, dann in weitem Bogen um das Haus herum,
  // der Blick immer auf das Haus. Am Anfang identisch mit dem Blick am Weganfang.
  const ORBIT=16,HOUSE=new THREE.Vector3(0,0,CHURCH_Z);
  function flightPose(p,t){
   const z0=ANCHOR_Z+(CHURCH_Z+ORBIT-ANCHOR_Z)*smooth(.03,.55,p),phi=2.3*smooth(.55,1,p);
   const x=.04*Math.sin(t*.31)+(p>.55?ORBIT*Math.sin(phi):0),z=p>.55?CHURCH_Z+ORBIT*Math.cos(phi):z0;
   const lift=28*smooth(.02,.42,p)-3*smooth(.55,1,p);
   cam.position.set(x,ground(x,z)+EYE+lift+.03*Math.sin(t*.47),z);
   houseT.set(0,ground(0,CHURCH_Z)+4.5,CHURCH_Z);m4l.lookAt(cam.position,houseT,upV);houseQ.setFromRotationMatrix(m4l);
   return smooth(.08,.4,p);
  }
  // Kamera der Erinnerung: Gleiten den Weg entlang mit Dehnungszufahrt (die Kirche bleibt gleich groß),
  // Umsehen mit der Maus relativ zum Moment des Eintritts.
  function update(s,base,aspect,picture){
   const glide=s.memGlide||0,z=ANCHOR_Z-glide,dist0=ANCHOR_Z-CHURCH_Z,dist=dist0-glide;
   const fov=2*Math.atan(Math.tan(FOV0*Math.PI/360)*dist0/dist)*180/Math.PI;
   cam.position.set(.04*Math.sin(s.time*.31),ground(0,z)+EYE+.03*Math.sin(s.time*.47),z);
   anchorQ.setFromEuler(eu.set(.01+.012*Math.sin(s.time*.23),.006*Math.sin(s.time*.17),0,'YXZ'));
   const fp=s.flightP??-1;if(fp>=0&&!picture)anchorQ.slerp(houseQ,flightPose(fp,s.time));
   scene.fog.density=.0016*(1+1.3*smooth(3,26,cam.position.y-ground(cam.position.x,cam.position.z)));
   if(s.memWorld&&!wasWorld)baseQ0.copy(base.quaternion);wasWorld=!!s.memWorld;
   look.identity();if(s.memWorld||s.memExit)look.copy(baseQ0).invert().multiply(base.quaternion);
   tmpQ.setFromEuler(eu.set(0,0,.5*(s.roll||0),'YXZ'));
   cam.quaternion.copy(anchorQ).multiply(look).multiply(tmpQ);
   if(picture){
    cam.aspect=ASPECT_PICTURE;
    const fA=fov*Math.PI/180;cam.fov=(aspect<ASPECT_PICTURE?fA:2*Math.atan(Math.tan(fA/2)*aspect/ASPECT_PICTURE))*180/Math.PI;
   }else{cam.aspect=aspect;cam.fov=fov;}
   cam.updateProjectionMatrix();cam.updateMatrixWorld(true);
   sky.position.copy(cam.position);
   curlU.uCurl.value=.03*Math.pow((s.memCurl||0)/.6,2);curlU.uCurlZ.value=z;
   if(figure){const show=s.memWorld&&s.layers&&s.layers.entitaeten!==false&&(s.entity||0)>.2;figure.group.visible=show;if(show)figure.pose(0,0,'warning',s.time);}
   return cam;
  }
  // Tür des Hauses am Ende des Zaunwegs: dorthin richtet sich beim Flug der Tunnel aus.
  const aim=new THREE.Vector3(0,ground(0,CHURCH_Z)+1.3,CHURCH_Z+.05);
  return{scene,camera:cam,update,setFigure,ground,aim,ASPECT_PICTURE,FOV0,get figure(){return figure&&figure.group;}};
 }
 return{create};
})();
