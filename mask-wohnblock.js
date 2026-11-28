/* Episode WOHNBLOCK: der Blick wird in die Wand gezogen und wird der sowjetische Wohnblock aus dem Spiel.
   Aus der Ichperspektive heißt das: kein Kopf mehr, der sich dreht, sondern viele Fenster, die zugleich sehen und
   zu einem einzigen, breiten, unbeweglichen Blick zusammenwachsen. Was sich bewegt, ist nur noch die Zeit.
   Ablauf (Sekunden seit Beginn, NovaMaskState.BAU):
   MAUERWERK  im Hohlraum der Wand zwischen Ziegeln und den Tapeten der Wohnungen; der Blick dreht sich in die Länge
   FENSTER    zwölf Fenster gehen auf wie Lider, jedes sieht denselben Hof aus seinem Zimmer
   EIN BLICK  die Augen drücken sich durch die Fenster und wachsen zu einem Blick zusammen
   ZEIT       Tage laufen als Schatten über den Hof, dann Jahre: 1971 bezogen, ab 1991 verlassen, 2000 im Wald
   DRAUSSEN   es ist Nacht und jetzt; einer kommt mit der Lampe aus dem Wald und geht hinein, in einem Fenster wird
              es hell; der Blick löst sich von der Fassade, dreht sich zum ersten Mal um, sieht den dunklen Block und
              fliegt in das Gesicht mit der Maske.
   Maße des Blocks wie in settlements.js (112 m, drei Geschosse zu 3,2 m, vier Treppenhäuser). Alle Flächen tragen
   Fotos: Fassade, Ziegel, Himmel, Gras und Platten aus Skrunda-1, Wandfotos der Wohnungen, Rinde und Äste aus dem Spiel. */
window.NovaMaskWohnblock=(()=>{
 'use strict';
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);},lerp=(a,b,t)=>a+(b-a)*t,fract=x=>x-Math.floor(x),hash=(a,b=0)=>fract(Math.sin(a*127.1+b*311.7)*43758.5453);
 const HALF=56,LEVEL=3.2,TOP=9.6,PLINTH=1,PHOTO_LEN=68.8,PHOTO_H=8.6,CORES=[-42,-14,14,42];
 // Die zwölf Fenster, die zu Augen werden: vier Achsen zwischen den mittleren Treppenhäusern, alle drei Geschosse.
 const EYE_X=[-8.25,-2.75,2.75,8.25],EYE_W=2.2,EYE_Y0=.98,EYE_Y1=2.48,EYE_BACK=2.6,EYE_FOV=64,COMMON={x:0,y:4.9,z:-.6,pitch:-.14,fov:86};
 // Das eine Fenster: im Fassadenfoto vermessen (Bildpunkte 2356 bis 2484 und 222 bis 300 von 4096 x 512).
 const WIN={x0:-HALF+2356/4096*PHOTO_LEN,x1:-HALF+2484/4096*PHOTO_LEN,y0:PLINTH+(1-300/512)*PHOTO_H,y1:PLINTH+(1-222/512)*PHOTO_H};
 function create(THREE,textures={}){
  const S=window.NovaMaskState,B=S.BAU,TX=textures.block||{};
  const scene=new THREE.Scene();scene.name='Wohnblock';
  const sky=new THREE.Color(0x558ddc),DARK=new THREE.Color(0x120e0b);scene.background=sky;scene.fog=new THREE.FogExp2(0xc5d2dc,.0032);
  // Die Zahl der Lichter bleibt immer gleich, damit beim Wechsel der Abschnitte kein Shader neu übersetzt wird.
  const hemi=new THREE.HemisphereLight(0xcfd8dc,0x4b4636,.9),sun=new THREE.DirectionalLight(0xfff0d8,.7),cavLight=new THREE.PointLight(0xffc890,0,15,1.4),torch=new THREE.PointLight(0xffe2ae,0,16,1.5),roomLamp=new THREE.PointLight(0xf2e2b4,0,8,1.3);
  scene.add(hemi,sun,sun.target,cavLight,torch,roomLamp);
  const hof=new THREE.Group();hof.name='Hof';scene.add(hof);const cavity=new THREE.Group();cavity.name='Mauerwerk';scene.add(cavity);

  // ---------- Hilfen ----------
  function geo(pos,nor,uv){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));return g;}
  function flat(P,order,n){const pos=[],nor=[],uv=[];for(const i of order){pos.push(P[i][0],P[i][1],P[i][2]);nor.push(n[0],n[1],n[2]);uv.push(P[i][3],P[i][4]);}return geo(pos,nor,uv);}
  const rectXY=(x0,x1,y0,y1,z,face,u0=0,u1=1,v0=0,v1=1)=>flat([[x0,y0,z,u0,v0],[x1,y0,z,u1,v0],[x1,y1,z,u1,v1],[x0,y1,z,u0,v1]],face>0?[0,1,2,0,2,3]:[0,2,1,0,3,2],[0,0,face]);
  const rectXZ=(x0,x1,z0,z1,y,u0=0,u1=1,v0=0,v1=1)=>flat([[x0,y,z0,u0,v0],[x1,y,z0,u1,v0],[x1,y,z1,u1,v1],[x0,y,z1,u0,v1]],[0,2,1,0,3,2],[0,1,0]);
  const rectYZ=(z0,z1,y0,y1,x,face,u0=0,u1=1,v0=0,v1=1)=>flat([[x,y0,z0,u0,v0],[x,y0,z1,u1,v0],[x,y1,z1,u1,v1],[x,y1,z0,u0,v1]],face<0?[0,1,2,0,2,3]:[0,2,1,0,3,2],[face,0,0]);
  function merge(list){
   const parts=list.map(g=>g.index?g.toNonIndexed():g),out=new THREE.BufferGeometry();
   for(const [name,size]of [['position',3],['normal',3],['uv',2]]){const arr=new Float32Array(parts.reduce((n,p)=>n+p.attributes[name].array.length,0));let at=0;for(const p of parts){arr.set(p.attributes[name].array,at);at+=p.attributes[name].array.length;}out.setAttribute(name,new THREE.BufferAttribute(arr,size));}
   for(const p of parts)p.dispose();out.computeBoundingSphere();return out;
  }
  function boxG(x0,x1,y0,y1,z0,z1,k=0){const g=new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0).toNonIndexed();g.translate((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);if(k){const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));if(ax>.5)uv.setXY(i,p.getZ(i)*k,p.getY(i)*k);else if(ay>.5)uv.setXY(i,p.getX(i)*k,p.getZ(i)*k);else uv.setXY(i,p.getX(i)*k,p.getY(i)*k);}}return g;}
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e3=new THREE.Euler(0,0,0,'YXZ'),v3=new THREE.Vector3(),sc=new THREE.Vector3(),col=new THREE.Color();
  function setInstance(mesh,i,x,y,z,sx=1,sy=1,sz=1,ry=0,rx=0,rz=0){q.setFromEuler(e3.set(rx,ry,rz,'YXZ'));m4.compose(v3.set(x,y,z),q,sc.set(sx,sy,sz));mesh.setMatrixAt(i,m4);}
  const mirror=(t,rx=1,ry=1,my=false)=>{if(t){t.wrapS=THREE.MirroredRepeatWrapping;t.wrapT=my?THREE.MirroredRepeatWrapping:THREE.ClampToEdgeWrapping;t.repeat.set(rx,ry);}return t||null;};
  function poolTexture(){const c=document.createElement('canvas');c.width=64;c.height=128;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,64,128);g.scale(1,2);const gr=g.createRadialGradient(32,32,1,32,32,31);gr.addColorStop(0,'#fff');gr.addColorStop(.45,'#8a8a8a');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}

  // ---------- Materialien: alle Flächen tragen Fotos ----------
  mirror(TX.fassade);mirror(TX.ziegel,1,1,true);mirror(TX.himmel,2,1);mirror(TX.gras,1,1,true);mirror(TX.platten,1,1,true);for(const t of TX.innen||[])mirror(t,1,1,true);
  const L=o=>new THREE.MeshLambertMaterial(o),Bm=o=>new THREE.MeshBasicMaterial(o);
  const facadeMat=L({map:TX.fassade||null,color:0xffffff}),brickMat=L({map:TX.ziegel||null,color:0xb9b7ad}),roofMat=L({map:TX.ziegel||null,color:0x4c4a44}),ironMat=L({map:textures.rust||null,color:0x8a8478}),woodMat=L({map:textures.wood||null,color:0xa59a80});
  const grassMat=L({map:textures.moss||TX.gras||null,color:0xffffff}),slabMat=L({map:TX.platten||null,color:0xffffff,transparent:true,depthWrite:false}),sheetMat=L({color:0xe9e7df,side:THREE.DoubleSide});
  const backdropMat=Bm({map:TX.himmel||null,side:THREE.BackSide,fog:false}),darkMat=Bm({color:0x0b0a08}),revealMat=Bm({map:TX.ziegel||null,color:0x6f6c63,side:THREE.DoubleSide}),innerFrameMat=Bm({map:textures.wood||null,color:0x857a62});
  const innerMats=(TX.innen||[null]).map(t=>Bm({map:t,color:0x77736a}));
  const birchBark=L({map:textures.birkenrinde||textures.bark||null,color:0xe6e6de}),pineBark=L({map:textures.kiefernrinde||textures.bark||null,color:0xa5927c});
  const birchBough=L({map:textures.birch||null,alphaTest:.4,side:THREE.DoubleSide,color:0xffffff}),pineBough=L({map:textures.pine||null,alphaTest:.4,side:THREE.DoubleSide,color:0xdfe6d8});

  // ---------- der Block von außen: das Fassadenfoto, gespiegelt fortgesetzt, mit einer echten Öffnung ----------
  const uOf=x=>(x+HALF)/PHOTO_LEN,vOf=y=>(y-PLINTH)/PHOTO_H;
  const skin=(x0,x1,y0,y1)=>rectXY(x0,x1,y0,y1,0,-1,uOf(x0),uOf(x1),vOf(y0),vOf(y1));
  const block=new THREE.Group();block.name='Block';hof.add(block);
  block.add(new THREE.Mesh(merge([skin(-HALF,WIN.x0,PLINTH,TOP),skin(WIN.x1,HALF,PLINTH,TOP),skin(WIN.x0,WIN.x1,PLINTH,WIN.y0),skin(WIN.x0,WIN.x1,WIN.y1,TOP)]),facadeMat));
  block.add(new THREE.Mesh(merge([rectXY(-HALF,HALF,0,PLINTH,-.05,-1,0,70,0,.31),rectYZ(0,12,0,TOP,-HALF,-1,0,7.5,0,3),rectYZ(0,12,0,TOP,HALF,1,0,7.5,0,3),boxG(-HALF,HALF,PLINTH-.06,PLINTH,-.1,0,.6)]),brickMat));
  block.add(new THREE.Mesh(merge([boxG(-HALF-.25,HALF+.25,TOP-.04,TOP+.22,-.3,12.2,.5),...CORES.map(cx=>boxG(cx-2,cx+2,2.55,2.7,-1.5,0,.5)),...CORES.map(cx=>boxG(cx-1.2,cx+1.2,0,2.5,-.03,.02,.5))]),roofMat));
  // Der Nachbarblock steht quer am rechten Rand des Hofs, dieselbe Fassade.
  {const g=new THREE.Group();g.position.set(76,0,-12);g.rotation.y=Math.PI/2;hof.add(g);
   g.add(new THREE.Mesh(rectXY(0,PHOTO_LEN,PLINTH,TOP,0,-1,0,1,0,1),facadeMat),new THREE.Mesh(merge([rectXY(0,PHOTO_LEN,0,PLINTH,-.05,-1,0,43,0,.31),rectYZ(0,12,0,TOP,0,-1,0,7.5,0,3)]),brickMat),new THREE.Mesh(boxG(-.25,PHOTO_LEN+.25,TOP-.04,TOP+.22,-.3,12.2,.5),roofMat));}

  // ---------- der Block von innen: zwölf Zimmerwände mit Fensteröffnung, tapeziert mit den Wandfotos ----------
  {const walls=innerMats.map(()=>[]),reveal=[],frames=[],dark=[rectXY(-HALF,EYE_X[0]-2.75,0,TOP+4,.32,1),rectXY(EYE_X[3]+2.75,HALF,0,TOP+4,.32,1),rectXY(EYE_X[0]-2.75,EYE_X[3]+2.75,TOP,TOP+4,.32,1)];
   EYE_X.forEach((ex,c)=>{for(let r=0;r<3;r++){
    const x0=ex-2.75,x1=ex+2.75,y0=r*LEVEL,y1=y0+LEVEL,ox0=ex-EYE_W/2,ox1=ex+EYE_W/2,oy0=y0+EYE_Y0,oy1=y0+EYE_Y1,list=walls[(c*3+r*5+1)%innerMats.length];
    const W=(a,b,c0,d)=>rectXY(a,b,c0,d,.32,1,(a-x0)/2.4,(b-x0)/2.4,(c0-y0)/LEVEL,(d-y0)/LEVEL);
    list.push(W(x0,ox0,y0,y1),W(ox1,x1,y0,y1),W(ox0,ox1,y0,oy0),W(ox0,ox1,oy1,y1));
    reveal.push(rectYZ(0,.32,oy0,oy1,ox0,1,0,.2,0,.5),rectYZ(0,.32,oy0,oy1,ox1,-1,0,.2,0,.5),rectXZ(ox0,ox1,0,.32,oy0,0,1.4,0,.2),rectXZ(ox0,ox1,0,.32,oy1,0,1.4,0,.2));
    frames.push(boxG(ox0,ox0+.07,oy0,oy1,.1,.16,.4),boxG(ox1-.07,ox1,oy0,oy1,.1,.16,.4),boxG(ox0,ox1,oy1-.07,oy1,.1,.16,.4),boxG(ox0,ox1,oy0,oy0+.07,.1,.16,.4),boxG(ex-.39,ex-.34,oy0,oy1,.1,.17,.4),boxG(ex+.34,ex+.39,oy0,oy1,.1,.17,.4),boxG(ox0-.06,ox1+.06,oy0-.05,oy0,.3,.52,.4));
   }});
   walls.forEach((list,i)=>{if(list.length)block.add(new THREE.Mesh(merge(list),innerMats[i]));});
   block.add(new THREE.Mesh(merge(reveal),revealMat),new THREE.Mesh(merge(frames),innerFrameMat),new THREE.Mesh(merge(dark),darkMat));}

  // ---------- das eine Zimmer hinter der Öffnung im Foto ----------
  const wxc=(WIN.x0+WIN.x1)/2,floorY=WIN.y0-1.02,roomWall=Bm({map:(TX.innen||[])[4]||null,color:0x000000}),roomFloor=Bm({map:textures.wood||null,color:0x000000}),winFrame=L({map:textures.wood||null,color:0xc9c4b4});
  {const x0=wxc-1.9,x1=wxc+1.9,y0=floorY,y1=floorY+2.75,z0=.3,z1=3.7;
   block.add(new THREE.Mesh(merge([rectXY(x0,x1,y0,y1,z1,-1,0,1.6,0,1),rectYZ(z0,z1,y0,y1,x0,1,0,1.4,0,1),rectYZ(z0,z1,y0,y1,x1,-1,0,1.4,0,1),rectXY(x0,WIN.x0,y0,y1,z0,1,0,.4,0,1),rectXY(WIN.x1,x1,y0,y1,z0,1,0,.4,0,1),rectXY(WIN.x0,WIN.x1,y0,WIN.y0,z0,1,0,.9,0,.4),rectXY(WIN.x0,WIN.x1,WIN.y1,y1,z0,1,0,.9,0,.3)]),roomWall));
   block.add(new THREE.Mesh(merge([rectXZ(x0,x1,z0,z1,y0,0,2,0,2),flat([[x0,y1,z0,0,0],[x1,y1,z0,2,0],[x1,y1,z1,2,2],[x0,y1,z1,0,2]],[0,1,2,0,2,3],[0,-1,0])]),roomFloor));
   const w=WIN.x1-WIN.x0,t=w/3;
   block.add(new THREE.Mesh(merge([boxG(WIN.x0,WIN.x0+.07,WIN.y0,WIN.y1,.06,.13,.4),boxG(WIN.x1-.07,WIN.x1,WIN.y0,WIN.y1,.06,.13,.4),boxG(WIN.x0,WIN.x1,WIN.y1-.07,WIN.y1,.06,.13,.4),boxG(WIN.x0,WIN.x1,WIN.y0,WIN.y0+.07,.06,.13,.4),boxG(WIN.x0+t-.03,WIN.x0+t+.03,WIN.y0,WIN.y1,.06,.14,.4),boxG(WIN.x0+2*t-.03,WIN.x0+2*t+.03,WIN.y0,WIN.y1,.06,.14,.4)]),winFrame));
   block.add(new THREE.Mesh(merge([rectYZ(0,.3,WIN.y0,WIN.y1,WIN.x0,1,0,.2,0,.5),rectYZ(0,.3,WIN.y0,WIN.y1,WIN.x1,-1,0,.2,0,.5),rectXZ(WIN.x0,WIN.x1,0,.3,WIN.y0,0,1.4,0,.2)]),revealMat));
   roomLamp.position.set(wxc,floorY+2.35,2.1);}
  let self=null,figure=null;
  const FACE=new THREE.Vector3(wxc,floorY+1.57,.8),OUT=new THREE.Vector3(wxc+5,4.2,-25);
  function setSelf(group){self=group;self.position.set(wxc,floorY,1.0);self.rotation.y=Math.PI;self.visible=false;hof.add(self);}
  function setFigure(model){figure=model;figure.group.position.set(13,0,-19);figure.group.visible=false;hof.add(figure.group);}

  // ---------- der Hof ----------
  {const g=new THREE.Mesh(rectXZ(-360,360,-420,300,0,0,103,0,103),grassMat);hof.add(g);}
  {const P=(x0,x1,z0,z1)=>rectXZ(x0,x1,z0,z1,.035,.26,.74,z0/2.6,z1/2.6),PX=(x0,x1,z0,z1)=>flat([[x0,.035,z0,.26,x0/2.6],[x1,.035,z0,.26,x1/2.6],[x1,.035,z1,.74,x1/2.6],[x0,.035,z1,.74,x0/2.6]],[0,2,1,0,3,2],[0,1,0]);
   const slabs=new THREE.Mesh(merge([...CORES.map(cx=>P(cx-1.1,cx+1.1,-13,0)),PX(-72,72,-15.2,-12.8),P(-1.2,1.2,-46,-15.2)]),slabMat);slabs.renderOrder=2;hof.add(slabs);}
  // Rundbild: unten maßstäblich (Waldrand), nach oben gestreckt bis über den oberen Bildrand
  const backdrop=new THREE.Mesh(new THREE.CylinderGeometry(190,190,1,48,3,true),backdropMat);backdrop.position.set(0,0,-20);
  {const p=backdrop.geometry.attributes.position,uv=backdrop.geometry.attributes.uv,Y=[260,96,38,-7],V=[1,.72,.36,0];for(let i=0;i<p.count;i++){const k=Math.round((.5-p.getY(i))*3);p.setY(i,Y[k]);uv.setY(i,V[k]);}backdrop.geometry.computeBoundingSphere();}backdrop.frustumCulled=false;hof.add(backdrop);
  // Bäume: Stamm mit Rindenfoto, Äste als freigestellte Astfotos
  const boughGeo=pv=>new THREE.PlaneGeometry(1,.667).translate(.5,-(.5-pv)*.667,0),BOUGHS={birch:26,pine:28};
  // Ein Ast: Höhe am Stamm, Länge, Drehung um den Stamm, Verwindung, Neigung. Birken hängen, Kiefern stehen ab.
  function bough(birch,h,i,n,seed){const u=(i+.5)/n,len=(birch?lerp(5.2,2.4,u):lerp(6.4,2.6,u))*(.8+.4*hash(i,seed))*(h/(birch?12:17));return[h*(birch?lerp(.3,.99,u):lerp(.5,1.0,u)),len,i*2.4+seed*7,birch?(hash(i,seed+2)-.5)*.6:(hash(i,seed+2)-.5)*2.4,birch?-.4-.45*hash(i,seed+3):(hash(i,seed+3)-.62)*.55];}
  function tree(parent,kind,h,seed){
   const birch=kind==='birch',r=birch?.05+h*.009:.08+h*.011,n=BOUGHS[kind];
   parent.add(new THREE.Mesh(new THREE.CylinderGeometry(r*.4,r,h,7,1).translate(0,h/2,0),birch?birchBark:pineBark));
   const boughs=new THREE.InstancedMesh(boughGeo(birch?.12:.29),birch?birchBough:pineBough,n);
   for(let i=0;i<n;i++){const [y,len,ry,rx,rz]=bough(birch,h,i,n,seed);setInstance(boughs,i,0,y,0,len,len,len,ry,rx,rz);}
   boughs.instanceMatrix.needsUpdate=true;boughs.frustumCulled=false;parent.add(boughs);return parent;
  }
  // Waldrand: dicht hinter dem Hof, nach hinten in das Rundbild mit dem fotografierten Waldrand übergehend
  {const list=[];for(let i=0;i<170;i++){const birch=hash(i,91)>.66;let x=-165+330*hash(i,92);const z=-33-80*Math.pow(hash(i,93),1.6);if(Math.abs(x)<3.5&&z>-52)x+=7;if(x>60&&z>-90)continue;list.push({birch,x,z,h:birch?12+6*hash(i,95):16+8*hash(i,95),seed:i+1});}
   for(const birch of [true,false]){const set=list.filter(t=>t.birch===birch),n=BOUGHS[birch?'birch':'pine'];if(!set.length)continue;
    const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.4,1,1,7,1).translate(0,.5,0),birch?birchBark:pineBark,set.length),boughs=new THREE.InstancedMesh(boughGeo(birch?.12:.29),birch?birchBough:pineBough,set.length*n);
    set.forEach((t,k)=>{const r=birch?.05+t.h*.009:.08+t.h*.011;setInstance(trunks,k,t.x,0,t.z,r,t.h,r);
     for(let i=0;i<n;i++){const [y,len,ry,rx,rz]=bough(birch,t.h,i,n,t.seed);setInstance(boughs,k*n+i,t.x,y,t.z,len,len,len,ry,rx,rz);}});
    trunks.instanceMatrix.needsUpdate=boughs.instanceMatrix.needsUpdate=true;trunks.frustumCulled=boughs.frustumCulled=false;hof.add(trunks,boughs);}}
  // Birken im Hof: 1971 gepflanzt und klein, nach 1991 kommen wilde dazu, zuletzt auch auf dem Dach
  const planted=[[-31,-18],[-19,-24],[-7,-20],[9,-26],[22,-19],[34,-23],[-43,-25],[46,-17]].map(([x,z],i)=>{const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=i*1.7;hof.add(tree(g,'birch',11+3*hash(i,61),i+60));return g;});
  const wild=[[-12,-6.5],[3,-9],[17,-5.5],[-26,-11],[28,-12],[-3,-16],[11,-13.5],[39,-7],[-37,-8.5],[-48,-12]].map(([x,z],i)=>{const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=i*2.3;hof.add(tree(g,'birch',6.5+3*hash(i,71),i+80));return g;});
  const roofTrees=[-38,-21,-5,12,30,44].map((x,i)=>{const g=new THREE.Group();g.position.set(x,TOP+.2,1.2+2*hash(i,77));hof.add(tree(g,'birch',2.6+1.4*hash(i,78),i+90));return g;});
  // Klopfstange, Wäschepfähle, Schaukel, Bänke vor den Eingängen
  {const parts=[boxG(-23.2,-23.1,0,1.9,-9.05,-8.95,.5),boxG(-20.9,-20.8,0,1.9,-9.05,-8.95,.5),boxG(-23.2,-20.8,1.84,1.9,-9.04,-8.96,.5)];
   for(const x of [25,32])for(const z of [-8.5,-11.5])parts.push(boxG(x-.04,x+.04,0,2.05,z-.04,z+.04,.5),boxG(x-.04,x+.04,1.97,2.05,z-.7,z+.7,.5));
   for(const s of [-1,1])for(const z of [-22.9,-21.1]){const leg=new THREE.CylinderGeometry(.035,.035,2.5,6).translate(0,1.25,0);leg.rotateZ(s*.26);leg.translate(4.2+s*1.6-s*.32,0,z);parts.push(leg);}
   parts.push(new THREE.CylinderGeometry(.035,.035,3.4,6).rotateZ(Math.PI/2).translate(4.2,2.42,-22).toNonIndexed());
   for(const x of [3.6,4.8]){parts.push(boxG(x-.01,x+.01,.5,2.42,-22.21,-22.19),boxG(x-.01,x+.01,.5,2.42,-21.81,-21.79),boxG(x-.22,x+.22,.46,.5,-22.24,-21.76,.5));}
   hof.add(new THREE.Mesh(merge(parts),ironMat));
   const benches=[];for(const cx of CORES)for(const s of [-1,1]){const x=cx+s*2.6;benches.push(boxG(x-.8,x+.8,.42,.48,-1.5,-1.1,.8),boxG(x-.7,x-.62,0,.42,-1.46,-1.14,.8),boxG(x+.62,x+.7,0,.42,-1.46,-1.14,.8));}
   hof.add(new THREE.Mesh(merge(benches),woodMat));}
  const sheets=new THREE.Group();hof.add(sheets);
  for(let i=0;i<8;i++){const w=.8+.7*hash(i,31),h=.9+.6*hash(i,32),m=new THREE.Mesh(new THREE.PlaneGeometry(w,h).translate(0,-h/2,0),sheetMat);m.position.set(25.6+(i%4)*1.7,2.0,i<4?-8.5:-11.5);m.userData.ph=hash(i,33)*6;sheets.add(m);}
  // Eigener Schatten: der Block, der man ist, wirft ihn in den Hof. Er wandert mit der Sonne wie ein Zeiger.
  const shadowG=new THREE.BufferGeometry();shadowG.setAttribute('position',new THREE.BufferAttribute(new Float32Array(12),3));shadowG.setIndex([0,2,1,0,3,2]);
  const shadowMat=Bm({color:0x05070a,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}),shadow=new THREE.Mesh(shadowG,shadowMat);shadow.frustumCulled=false;shadow.renderOrder=3;hof.add(shadow);
  // Solange jemand in einem wohnt, liegt abends das Licht der eigenen Fenster als Fleck im Hof.
  const pool=poolTexture(),patchMat=Bm({color:0xffffff,map:pool,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}),POOLS=60,patches=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),patchMat,POOLS+2);
  for(let i=0;i<POOLS;i++){const r=i%3;q.identity();m4.compose(v3.set(-52.25+Math.floor(i/3)*5.5,.05,-(2.6+r*2.7)),q,sc.set(3.4,1,3.6+r*.8));patches.setMatrixAt(i,m4);patches.setColorAt(i,col.setRGB(0,0,0));}
  for(const i of [POOLS,POOLS+1]){setInstance(patches,i,0,-40,0,0,0,0);patches.setColorAt(i,col.setRGB(0,0,0));}
  patches.instanceMatrix.needsUpdate=true;patches.frustumCulled=false;patches.renderOrder=4;hof.add(patches);
  const selfShadow=new THREE.Mesh(new THREE.PlaneGeometry(.55,2.3).rotateX(-Math.PI/2),Bm({map:pool,color:0xffffff,transparent:true,blending:THREE.SubtractiveBlending,depthWrite:false}));selfShadow.position.set(wxc,.07,-(2.6+2.7)-.2);selfShadow.renderOrder=5;selfShadow.visible=false;hof.add(selfShadow);
  // Bewohner: kleine Figuren zwischen Eingängen, Weg, Klopfstange, Schaukel und Wald
  const PEOPLE=10,people=new THREE.InstancedMesh(merge([boxG(-.2,.2,.0,1.28,-.13,.13),new THREE.SphereGeometry(.13,8,6).translate(0,1.5,0)]),L({color:0xffffff}),PEOPLE+1);people.frustumCulled=false;hof.add(people);
  const NODES=[...CORES.map(cx=>[cx,-.9]),[-60,-14],[60,-14],[-22,-9.6],[4.2,-20.6],[0,-38],[28,-10]];
  const routes=[];for(let i=0;i<PEOPLE;i++){const a=Math.floor(hash(i,41)*NODES.length);let b=Math.floor(hash(i,42)*NODES.length);if(b===a)b=(a+3)%NODES.length;routes.push({a:NODES[a],b:NODES[b],speed:1.05+.5*hash(i,43),cycle:40+50*hash(i,44),off:hash(i,45)*900});people.setColorAt(i,col.setHSL(.06+.5*hash(i,46),.18,.12+.16*hash(i,47)));}
  people.setColorAt(PEOPLE,col.setRGB(.07,.08,.07));people.instanceColor.needsUpdate=true;
  const HOME_PATH=[[.3,-40],[.2,-15],[-12.8,-13.9],[-14,-.9]],HOME_T=[44.5,B.home[0]+3.2];

  // ---------- das Mauerwerk von innen ----------
  const CAV_Y=-300,slitMat=Bm({color:0x000000,fog:false,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
  {cavity.position.y=CAV_Y;
   cavity.add(new THREE.Mesh(rectXY(-210,210,-30,30,-.27,1,0,262,0,18.75),L({map:TX.ziegel||null,color:0xd9cfc2})));
   // Gegenüber die Rückseiten der Wohnungen: jede drei Meter eine andere Tapete, ein anderer Anstrich
   const lists=innerMats.map(()=>[]);for(let k=-70;k<70;k++)for(let r=-3;r<3;r++)lists[((k*3+r*5)%lists.length+lists.length)%lists.length].push(rectXY(k*3,k*3+3,r*3.2,r*3.2+3.2,.27,-1,0,1,0,1));
   lists.forEach((list,i)=>cavity.add(new THREE.Mesh(merge(list),L({map:innerMats[i].map,color:0xcfc6b8}))));
   const up=[];for(let k=-38;k<=38;k++)up.push(new THREE.CylinderGeometry(.055,.055,60,8).translate(k*5.2+1.3,0,.1),new THREE.CylinderGeometry(.075,.075,.09,8).translate(k*5.2+1.3,(k%3)*.9-.4,.1));
   up.push(new THREE.CylinderGeometry(.035,.035,420,6).rotateZ(Math.PI/2).translate(0,-.62,-.15),new THREE.CylinderGeometry(.012,.012,420,5).rotateZ(Math.PI/2).translate(0,.56,.2),new THREE.CylinderGeometry(.012,.012,420,5).rotateZ(Math.PI/2).translate(0,.6,.21));
   cavity.add(new THREE.Mesh(merge(up),L({map:textures.rust||null,color:0x9a9288})));
   const list=[];for(let k=-60;k<=60;k++)for(const y of [-3.2,0,3.2])list.push([k*5.5+2.75,y]);
   const slits=new THREE.InstancedMesh(new THREE.PlaneGeometry(EYE_W,1.5),slitMat,list.length);list.forEach(([x,y],i)=>setInstance(slits,i,x,y,-.262));slits.instanceMatrix.needsUpdate=true;slits.frustumCulled=false;cavity.add(slits);}

  // ---------- Kameras ----------
  const cam=new THREE.PerspectiveCamera(COMMON.fov,1,.1,700);cam.rotation.order='YXZ';
  const paneCams=[];for(let r=0;r<3;r++)for(let c=0;c<4;c++){const pc=new THREE.PerspectiveCamera(EYE_FOV,1,.1,700);pc.rotation.order='YXZ';paneCams.push({cam:pc,c,r,x:EYE_X[c],y:r*LEVEL+(EYE_Y0+EYE_Y1)/2,delay:hash(c*4.1+r,71)*2.6,lid:0});}
  let paned=false,gap=0,lastTb=-99,lastTime=-99,yaw0=0,pitch0=0,slideX=0,slideY=0;const events=[];
  const commonQ=new THREE.Quaternion(),lookQ=new THREE.Quaternion(),turnQ=new THREE.Quaternion(),lookM=new THREE.Matrix4(),UP=new THREE.Vector3(0,1,0),from=new THREE.Vector3(),clearOld=new THREE.Color();
  const MARKS=[[B.wall,'bauWall'],...paneCams.map(p=>[B.cavity+p.delay+.15,'bauEye']),[B.merge[1],'bauOne'],[B.home[0]+3.2,'bauDoor'],...[0,1,2,3,4,5,6].map(k=>[B.home[0]+3.6+k*.4,'bauStep']),[B.lamp,'bauLamp'],[B.back,'bauHead']];

  function environment(ck,tb,s,time){
   const phi=fract(ck.day),elev=Math.sin(2*Math.PI*(phi-.25)),yr=ck.year,sp=fract(yr);
   const summerRaw=.5+.5*Math.cos(2*Math.PI*(sp-.53)),summer=lerp(.55,summerRaw,ck.seasonAmp),snow=0;
   const dayRaw=smooth(-.12,.18,elev),dl=lerp(lerp(.66,dayRaw,ck.dayAmp),0,ck.night),low=ck.dayAmp*dayRaw*smooth(.5,.05,elev)*(1-ck.night),nightAmt=1-dl;
   const lived=1-smooth(1990.6,1993.5,yr),over=smooth(1991,2000,yr);
   // Himmel: das Wolkenfoto, getönt nach Tageszeit
   col.setRGB(lerp(.045,1,dl)*lerp(1,1.15,.7*low),lerp(.06,1,dl)*lerp(1,.8,.7*low),lerp(.1,1,dl)*lerp(1,.55,.7*low));
   backdropMat.color.copy(col);sky.setRGB(.33*col.r,.55*col.g,.86*col.b);scene.background=sky;
   scene.fog.color.setRGB(.77*col.r,.82*col.g,.86*col.b);scene.fog.density=.0032+.003*snow;
   hemi.intensity=.2+.82*dl;hemi.color.setRGB(.6+.3*dl,.68+.22*dl,.8+.12*dl);hemi.groundColor.setRGB(lerp(.24,.62,snow)*(.3+.7*dl),lerp(.26,.64,snow)*(.3+.7*dl),lerp(.16,.68,snow)*(.3+.7*dl));
   const az=(.5-phi)*2*Math.PI*ck.dayAmp,maxEl=lerp(.3,1.0,summer),el=lerp(.72,maxEl*Math.max(0,elev),ck.dayAmp);
   sun.intensity=.75*dl*lerp(1,smooth(0,.16,elev),ck.dayAmp);sun.color.setRGB(1,lerp(.94,.72,low),lerp(.85,.5,low));sun.position.set(Math.sin(az)*Math.cos(el)*80,Math.sin(el)*80,Math.cos(az)*Math.cos(el)*80-17);sun.target.position.set(0,0,-17);
   {const len=TOP/Math.tan(Math.max(el,.14));let dx=-len*Math.sin(az),dz=-len*Math.cos(az);if(dz<-60){const k=-60/dz;dx*=k;dz=-60;}
    const p=shadowG.attributes.position;p.setXYZ(0,-HALF,.06,0);p.setXYZ(1,HALF,.06,0);p.setXYZ(2,HALF+dx,.06,dz);p.setXYZ(3,-HALF+dx,.06,dz);p.needsUpdate=true;
    shadowMat.opacity=.5*dl*lerp(.55,smooth(.02,.2,elev),ck.dayAmp)*(1-.35*snow);}
   // Jahreszeiten: Gras, Birkenlaub, Schnee
   const autumn=smooth(.68,.76,sp)*(1-smooth(.84,.9,sp))*ck.seasonAmp,leaves=lerp(.8,smooth(.2,.42,summerRaw),ck.seasonAmp),dry=1-summer;
   {const k=lerp(.5,1.12,dl);grassMat.color.setRGB(k*lerp(.86,1.05,dry),k*lerp(1.06,.92,dry),k*lerp(.7,.58,dry));}
   slabMat.color.setRGB(lerp(1,1.9,snow),lerp(1,1.9,snow),lerp(1,2.0,snow));slabMat.opacity=1-.55*over;
   birchBough.visible=leaves>.22;birchBough.color.setRGB(lerp(.95,1.5,autumn),lerp(1,1.1,autumn),lerp(.9,.25,autumn));pineBough.color.setRGB(lerp(.87,1.25,snow*.6),lerp(.9,1.25,snow*.6),lerp(.85,1.3,snow*.6));
   facadeMat.color.setRGB(lerp(1.08,.86,over),lerp(1.06,.9,over),lerp(1.02,.8,over));
   // Jahre: die gepflanzten Birken wachsen, nach dem Auszug kommen wilde, zuletzt auch auf dem Dach
   const grow=.22+.78*smooth(1971,1997,yr),wildK=smooth(1991.5,2003,yr),roofK=smooth(1994,2001,yr);
   for(const g of planted)g.scale.setScalar(grow);for(const g of wild){g.visible=wildK>.03;g.scale.setScalar(Math.max(.03,wildK*1.25));}for(const g of roofTrees){g.visible=roofK>.05;g.scale.setScalar(Math.max(.05,roofK));}
   sheets.visible=lived>.5&&summer>.5&&dl>.5&&ck.dayAmp>.5;if(sheets.visible)for(const m of sheets.children)m.rotation.x=.16*Math.sin(time*1.7+m.userData.ph)+.06*Math.sin(time*4.1+m.userData.ph*2);
   // Lichter der eigenen Fenster im Hof, nur solange jemand da wohnt
   const evening=phi>.7||phi<.03,cycle=ck.dayAmp>.5&&ck.night<.5,frac=lived*(cycle?(evening?.55:.05):.45),seed=cycle?Math.floor(ck.day-.25):77,dusk=smooth(.55,.9,nightAmt);
   for(let i=0;i<POOLS;i++){const lit=hash(i,seed+9)<frac?1:0,k=.14*dusk*lit*(.6+.4*hash(i,13));patches.setColorAt(i,col.setRGB(k,.8*k,.48*k));}
   // Bewohner
   const simS=ck.day*86400,showPeople=dl>.3&&ck.night<.3&&lived>.5;
   routes.forEach((r,i)=>{let shown=false;if(showPeople){const t=simS+r.off,c=((t%(2*r.cycle))+2*r.cycle)%(2*r.cycle),back=c>=r.cycle,tt=back?c-r.cycle:c,dist=Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1]),u=tt*r.speed/dist;
     if(u<1){const a=back?r.b:r.a,b=back?r.a:r.b;setInstance(people,i,lerp(a[0],b[0],u),.03*Math.abs(Math.sin(tt*r.speed*3.2)),lerp(a[1],b[1],u),1,.92+.16*hash(i,48),1,Math.atan2(b[0]-a[0],b[1]-a[1]));shown=true;}}
    if(!shown)setInstance(people,i,0,-40,0,0,0,0);});
   // Der Heimkehrer mit der Lampe: aus dem Wald über die Platten zum zweiten Eingang
   {const u=clamp((tb-HOME_T[0])/(HOME_T[1]-HOME_T[0])),on=ck.night>.15&&u<1;let k=0;
    if(on){const lens=[0,1,2].map(i=>Math.hypot(HOME_PATH[i+1][0]-HOME_PATH[i][0],HOME_PATH[i+1][1]-HOME_PATH[i][1]));let d=u*(lens[0]+lens[1]+lens[2]),i=0;while(i<2&&d>lens[i]){d-=lens[i];i++;}
     const a=HOME_PATH[i],b=HOME_PATH[i+1],t=d/lens[i],x=lerp(a[0],b[0],t),z=lerp(a[1],b[1],t),dx=(b[0]-a[0])/lens[i],dz=(b[1]-a[1])/lens[i];k=ck.night*(.85+.15*Math.sin(tb*9));
     setInstance(people,PEOPLE,x,.03*Math.abs(Math.sin(tb*7)),z,1,1,1,Math.atan2(dx,dz));torch.position.set(x+dx*2.2,1.1,z+dz*2.2);
     q.setFromEuler(e3.set(0,Math.atan2(dx,dz),0,'YXZ'));m4.compose(v3.set(x+dx*3.4,.06,z+dz*3.4),q,sc.set(2.6,1,4.6));patches.setMatrixAt(POOLS,m4);}
    else{setInstance(people,PEOPLE,0,-40,0,0,0,0);setInstance(patches,POOLS,0,-40,0,0,0,0);}
    torch.intensity=2.6*k;patches.setColorAt(POOLS,col.setRGB(.95*k,.84*k,.58*k));}
   people.instanceMatrix.needsUpdate=true;
   // Das eine Zimmer: Licht hinter der Öffnung, sein Schein im Hof mit dem Schatten dessen, der am Fenster steht
   const lit=tb>=B.lamp?1:0,flick=lit*(.9+.07*Math.sin(time*13.7)*Math.sin(time*5.3)+(tb<B.lamp+.5?.4*Math.sin((tb-B.lamp)*40):0));
   roomLamp.intensity=1.3*Math.max(0,flick);roomWall.color.setRGB(.95*flick,.9*flick,.72*flick);roomFloor.color.setRGB(.5*flick,.44*flick,.32*flick);if(self){self.visible=tb>=B.lamp+.35;if(self.visible&&self.userData.animate)self.userData.animate(time);}
   q.identity();m4.compose(v3.set(wxc,.06,-5.2),q,sc.set(3.6,1,5.4));patches.setMatrixAt(POOLS+1,m4);patches.setColorAt(POOLS+1,col.setRGB(.3*flick,.27*flick,.18*flick));selfShadow.visible=tb>=B.lamp+.35;
   patches.instanceMatrix.needsUpdate=true;patches.instanceColor.needsUpdate=true;
   if(figure){const show=ck.night>.55&&s.layers&&s.layers.entitaeten!==false&&(s.entity||0)>.2;figure.group.visible=show;if(show){figure.group.rotation.y=Math.atan2(cam.position.x-figure.group.position.x,cam.position.z-figure.group.position.z);figure.pose(0,0,'warning',time);}}
  }

  function update(s,base,aspect){
   const tb=s.bauT??0,dir=s.dir||-1,time=s.time||0,ck=S.bauClock(tb),dt=clamp(time-lastTime,0,.1);
   if(Math.abs(tb-lastTb)>1.5||time<lastTime||time-lastTime>.6){yaw0=base.rotation.y;pitch0=base.rotation.x;slideX=slideY=0;}
   else for(const [t,name]of MARKS)if(lastTb<t&&tb>=t)events.push(name);
   lastTb=tb;lastTime=time;
   const inCav=tb<B.cavity;cavity.visible=inCav;hof.visible=!inCav;cam.aspect=aspect;cam.near=.1;cam.far=700;
   if(inCav){
    // Im Hohlraum: erst liegt der Ziegel vor dem Gesicht, dann dreht sich der Blick in die Länge der Wand und wird weit.
    paned=false;const t=tb-B.wall,turn=smooth(1.0,4.6,t),run=Math.max(0,t-1.8),glide=.5*run*run*(1+.06*run),close=smooth(B.cavity-2.2,B.cavity-.25,tb);
    cam.position.set(dir*glide,CAV_Y+.03*Math.sin(time*.9),0);
    cam.rotation.set(.04*Math.sin(time*.4)*(1-turn),-dir*Math.PI/2*turn,.05*Math.sin(time*.31)*turn,'YXZ');cam.fov=lerp(67,122,smooth(2.2,8.8,t));cam.updateProjectionMatrix();
    scene.background=DARK;scene.fog.color.copy(DARK);scene.fog.density=lerp(.1,1.6,close*close);
    hemi.intensity=.55*(1-.7*close);hemi.color.setRGB(.95,.8,.62);hemi.groundColor.setRGB(.5,.38,.28);sun.intensity=0;torch.intensity=0;roomLamp.intensity=0;cavLight.intensity=2.4*(1-.6*close);cavLight.position.set(cam.position.x+dir*.5*turn,CAV_Y+.2,.05);
    slitMat.color.setRGB(.95,.9,.74).multiplyScalar(.16*smooth(5.5,9.6,t));
    cam.updateMatrixWorld(true);return cam;
   }
   cavLight.intensity=0;
   // Wer am Blick zieht, dreht keinen Kopf: die Aufmerksamkeit wandert die Fassade entlang.
   const k=1-Math.exp(-dt*2.2),tx=clamp(-(base.rotation.y-yaw0)*60,-30,30),ty=clamp((base.rotation.x-pitch0)*20,-2.6,3.4);slideX+=(tx-slideX)*k;slideY+=(ty-slideY)*k;
   environment(ck,tb,s,time);
   commonQ.setFromEuler(e3.set(COMMON.pitch,0,0,'YXZ'));
   if(tb<B.merge[1]){
    paned=true;const press=smooth(B.open+.3,B.merge[0],tb),m=smooth(B.merge[0],B.merge[1],tb),ap=aspect*3/4,t0=Math.tan(EYE_FOV*Math.PI/360),t1=Math.tan(COMMON.fov*Math.PI/360),r1=t1*aspect,near=.1,far=700;
    gap=.032*(1-m);
    for(const p of paneCams){
     const c0=p.cam;p.lid=smooth(0,1,(tb-B.cavity-p.delay)/1.5);
     c0.position.set(lerp(p.x,COMMON.x,m),lerp(p.y,COMMON.y,m),lerp(lerp(EYE_BACK,-.3,press),COMMON.z,m));c0.rotation.set(COMMON.pitch*m,0,0,'YXZ');
     const Lf=lerp(-t0*ap,-r1+2*r1*p.c/4,m),R=lerp(t0*ap,-r1+2*r1*(p.c+1)/4,m),Bt=lerp(-t0,-t1+2*t1*p.r/3,m),Tp=lerp(t0,-t1+2*t1*(p.r+1)/3,m);
     c0.projectionMatrix.makePerspective(Lf*near,R*near,Tp*near,Bt*near,near,far);c0.projectionMatrixInverse.copy(c0.projectionMatrix).invert();c0.updateMatrixWorld(true);
    }
    cam.position.set(COMMON.x,COMMON.y,COMMON.z);cam.quaternion.copy(commonQ);cam.fov=lerp(EYE_FOV,COMMON.fov,m);cam.updateProjectionMatrix();cam.updateMatrixWorld(true);return cam;
   }
   paned=false;
   // Ein Blick. Am Ende löst er sich von der Fassade, treibt in den Hof, dreht sich um und fliegt in das eine Fenster.
   const e=smooth(B.cross[0],B.cross[1],tb),a=smooth(0,.56,e),b=smooth(.56,1,e),free=1-smooth(0,.2,e);
   from.set(COMMON.x+slideX*free,COMMON.y+slideY*free,COMMON.z);
   cam.position.copy(from).lerp(OUT,a).lerp(FACE,b*b);cam.position.x+=dir*9*Math.sin(Math.PI*a)*(1-b);
   turnQ.setFromEuler(e3.set(COMMON.pitch*(1-a),-dir*Math.PI*smooth(.05,.9,a),0,'YXZ'));
   lookM.lookAt(cam.position.distanceTo(FACE)>.5?cam.position:OUT,FACE,UP);lookQ.setFromRotationMatrix(lookM);cam.quaternion.copy(turnQ).slerp(lookQ,smooth(.7,1,a));
   cam.fov=lerp(lerp(lerp(COMMON.fov,66,a),38,smooth(0,.6,b)),60,smooth(.8,1,b));cam.near=lerp(.1,.03,smooth(.85,1,b));cam.updateProjectionMatrix();cam.updateMatrixWorld(true);return cam;
  }
  // Zwölf Augen: jedes Fenster wird mit eigener Kamera in seinen Ausschnitt des Bildes gerechnet. Dazwischen bleibt Mauerwerk.
  const emptyScene=new THREE.Scene();emptyScene.background=DARK;
  function renderPanes(renderer,target,w,h){
   const tex=target.texture,mip=tex.generateMipmaps,g=Math.round(gap*h),pw=w/4,ph=h/3;
   renderer.getClearColor(clearOld);const alpha=renderer.getClearAlpha();
   target.viewport.set(0,0,w,h);target.scissor.set(0,0,w,h);target.scissorTest=false;tex.generateMipmaps=false;
   renderer.setRenderTarget(target);renderer.setClearColor(DARK,1);renderer.clear();
   const open=paneCams.filter(p=>p.lid>.004);
   open.forEach((p,i)=>{
    const x=Math.round(p.c*pw+g/2),y=Math.round(p.r*ph+g/2),ww=Math.round(pw-g),hh=Math.round(ph-g),lid=Math.max(1,Math.round(hh*p.lid));
    target.viewport.set(x,y,ww,hh);target.scissor.set(x,y+Math.round((hh-lid)/2),ww,lid);target.scissorTest=true;if(i===open.length-1)tex.generateMipmaps=mip;
    renderer.setRenderTarget(target);renderer.render(scene,p.cam);
   });
   tex.generateMipmaps=mip;target.viewport.set(0,0,w,h);target.scissor.set(0,0,w,h);target.scissorTest=false;renderer.setRenderTarget(target);renderer.setClearColor(clearOld,alpha);
   if(!open.length&&mip)renderer.render(emptyScene,cam);
  }
  return{scene,camera:cam,update,renderPanes,setSelf,setFigure,get paned(){return paned;},get selfGroup(){return self;},get figureGroup(){return figure&&figure.group;},drainEvents(){return events.splice(0);},parts:{hof,cavity,block,planted,wild},COMMON,FACE,WIN};
 }
 return{create};
})();
