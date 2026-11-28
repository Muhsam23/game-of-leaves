/* Salvinorin-inspirierte Komposition: Tunnel aus verschachtelten Scheiben, seitlicher Zug, dünne dunkle Regenbogenfilme
   an Konturen, Kulissen nach Tiefe, Riss, Trommel mit Filmstreifen, Blick aus einem Objekt, Wiese im Tunnel und hinter den Kulissen, fraktale Blasen.
   Die Basiskamera bleibt unverändert. */
window.NovaMaskEffect=(()=>{
 'use strict';
 const VERT='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
 const ANTIALIAS=`
 precision highp float;
 uniform sampler2D tComposite;uniform vec2 pixelSize;uniform float clock,filmPost,sharpen;varying vec2 vUv;
 vec3 tap(vec2 uv){return texture2D(tComposite,uv).rgb;}
 // Dünne dunkle Regenbogenfilme auf allen kräftigen Kanten des fertigen Bildes, auch in Trommel und Blasen.
 vec3 postFilms(vec3 c,float range){
  if(filmPost<.001||range<.035)return c;
  const vec3 luma=vec3(.2126,.7152,.0722);
  vec2 o=normalize(vec2(.8,.6))*pixelSize*.7;
  vec3 ink=vec3(0.);float cover=0.;
  for(int i=0;i<3;i++){
   float layer=float(i);vec2 q=vUv+o*(layer-1.);
   float gx=dot(tap(q+vec2(pixelSize.x,0.))-tap(q-vec2(pixelSize.x,0.)),luma),gy=dot(tap(q+vec2(0.,pixelSize.y))-tap(q-vec2(0.,pixelSize.y)),luma);
   float coat=smoothstep(.055,.18,length(vec2(gx,gy)))*pow(.66,layer);
   ink+=(.012+.30*pow(.5+.5*cos(6.2831853*(.027*clock+layer*.145+vec3(0.,.3333,.6667))),vec3(1.8)))*coat;cover+=coat;
  }
  ink/=max(cover,.0001);
  return mix(c,c*.2+ink*.9,min(1.,cover*.6)*filmPost*.9);
 }
 void main(){
  const vec3 luma=vec3(.2126,.7152,.0722);
  vec3 center=tap(vUv),cnw=tap(vUv+vec2(-1.,1.)*pixelSize),cne=tap(vUv+pixelSize),csw=tap(vUv-pixelSize),cse=tap(vUv+vec2(1.,-1.)*pixelSize);
  float nw=dot(cnw,luma),ne=dot(cne,luma),sw=dot(csw,luma),se=dot(cse,luma);
  float m=dot(center,luma),lo=min(m,min(min(nw,ne),min(sw,se))),hi=max(m,max(max(nw,ne),max(sw,se)));
  // Flächen und Feinstruktur: kontrastabhängig nachschärfen, begrenzt auf die Nachbarwerte, damit keine Säume entstehen.
  if(hi-lo<max(.05,hi*.15)){
   vec3 c=center;
   if(sharpen>.001){
    vec3 mn=min(center,min(min(cnw,cne),min(csw,cse))),mx=max(center,max(max(cnw,cne),max(csw,cse)));
    c=clamp(center+(center-.25*(cnw+cne+csw+cse))*sharpen*(1.-smoothstep(.02,.12,hi-lo)*.5),mn,mx);
   }
   gl_FragColor=vec4(postFilms(c,hi-lo),1.);return;
  }
  vec2 direction=vec2(-((nw+ne)-(sw+se)),(nw+sw)-(ne+se));
  float reduction=max((nw+ne+sw+se)*.03125,.0078125);
  direction=clamp(direction/(min(abs(direction.x),abs(direction.y))+reduction),vec2(-4.),vec2(4.))*pixelSize;
  vec3 a=.5*(tap(vUv-direction/6.)+tap(vUv+direction/6.));
  vec3 b=a*.5+.25*(tap(vUv-direction*.5)+tap(vUv+direction*.5));
  float lb=dot(b,luma);gl_FragColor=vec4(postFilms(mix(center,(lb<lo||lb>hi)?a:b,.8),hi-lo),1.);
 }`;
 // Fraktal statt Kaleidoskop: Kreisinversionen. Sieben große Blasen überschneiden sich von Anfang an zu einer
 // zusammenhängenden Fläche, die sich dann ausbreitet. Jede Blase zeigt die ganze Welt umgestülpt, in ihr liegen die
 // Bilder der anderen Blasen, kleiner, und in diesen wieder, ohne Ende. Ohne Ränder: am Kreis selbst ändert die
 // Spiegelung nichts, dort wird das fertige Bild gelesen; Helligkeit und Unschärfe hängen nur von der Verkleinerung ab.
 const FRACTAL=`
 precision highp float;
 #if __VERSION__<300
 #ifndef GL_EXT_shader_texture_lod
 #define texture2DLodEXT(t,u,l) texture2D(t,u)
 #endif
 #endif
 uniform sampler2D tSrc,tWorld;uniform vec2 pixelSize;uniform float amount,spread,aspect,clock;varying vec2 vUv;
 float mir(float x){return 1.-abs(1.-mod(x,2.));}
 void main(){
  vec3 base=texture2D(tSrc,vUv).rgb;
  vec2 p=(vUv-.5)*vec2(aspect,1.);
  float t=clock*.02,s=spread;
  vec2 cc=vec2(.06*sin(t*1.3),.04*cos(t*.9));
  vec3 C[7];
  C[0]=vec3(cc,(.2+.2*s)*(1.+.05*sin(clock*.06)));
  for(int i=1;i<7;i++){
   float fi=float(i),a=fi*1.0472+.3+t*(mod(fi,2.)<.5?.6:-.6),d=(.13+.37*s)*(1.+.12*sin(fi*2.1));
   C[i]=vec3(cc+vec2(cos(a),sin(a))*d*vec2(1.25,1.),(.17+.03*sin(fi*1.3))*(1.+.75*s)*(1.+.06*sin(clock*.07+fi*1.7)));
  }
  float mag=1.;bool any=false;
  for(int n=0;n<9;n++){
   bool hit=false;
   for(int i=0;i<7;i++){
    float r=C[i].z;vec2 d=p-C[i].xy;float dd=dot(d,d);
    if(dd<r*r){float f=r*r/max(dd,1e-6);p=C[i].xy+d*f;mag*=f;hit=true;any=true;break;}
   }
   if(!hit)break;
  }
  if(!any){gl_FragColor=vec4(base,1.);return;}
  vec2 q=p/vec2(aspect,1.)+.5,m=vec2(mir(q.x),mir(q.y));
  float lm=log2(mag);
  // Kaum verkleinert: das fertige Bild, damit es an der Kreislinie nahtlos weitergeht. Stark verkleinert: die Welt
  // selbst aus verkleinerten Stufen, damit tiefe Blasen weich statt flirrend sind.
  vec3 near=texture2D(tSrc,m).rgb,deep=texture2DLodEXT(tWorld,m,clamp(lm-.3,0.,9.)).rgb;
  vec3 c=mix(near,deep,smoothstep(.15,1.2,lm))*(1.-.16*smoothstep(1.,7.,lm));
  gl_FragColor=vec4(mix(base,c,amount),1.);
 }`;
 const FRAG=`
 precision highp float;
 #if __VERSION__<300
 #ifndef GL_EXT_shader_texture_lod
 #define texture2DLodEXT(t,u,l) texture2D(t,u)
 #endif
 #endif
 #include <packing>
 varying vec2 vUv;
 uniform sampler2D tWorld,tDepth,tOther,tPrev,tMem;
 uniform vec2 pixelSize;uniform mat3 portalH;uniform float portal,droste,hinge,hingePh,dark,memFront,memMix,behindMem;
 uniform float clock,aspect,nearZ,farZ,depthScale,dir,pull,flatAmt,mis,gapB,seam,drum,offset,scatter,otherShare,grain,feedback,fabOff,tanH,fovH,tearVis,wear,seal,tunnel,tunnelBreak,contour,tunnelAlign;uniform vec2 tunnelAim;
 float h11(float n){return fract(sin(n*127.1+311.7)*43758.5453);}
 float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n11(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(h11(i),h11(i+1.),f);}
 float fbm1(float x){return .5*n11(x)+.25*n11(x*2.07+1.3)+.125*n11(x*4.13+2.1)+.0625*n11(x*8.3+5.);}
 float mir(float x){return 1.-abs(1.-mod(x,2.));}
 float depthAt(vec2 uv){return -perspectiveDepthToViewZ(texture2D(tDepth,uv).x,nearZ,farZ);}
 // Fünf flache Kulissen nach Abstand; im Freien mit größerem Maßstab.
 float layerOf(float z){z/=depthScale;return z<1.2?0.:z<2.2?1.:z<3.4?2.:z<5.?3.:4.;}
 vec2 layerOff(float k){
  float s=flatAmt*(.006+.016*k)*dir,wob=flatAmt*.005*sin(clock*.55+k*1.9);
  vec2 o=vec2(s+wob,flatAmt*.0035*sin(clock*.41+k*2.3));
  o.x+=mis*.05*dir*step(1.5,k)*step(k,2.5);
  return o;
 }
 float layerScale(float k){return 1.+flatAmt*.022*k;}
 vec3 filmHue(float layer){return .012+.30*pow(.5+.5*cos(6.2831853*(.027*clock+layer*.145+vec3(0.,.3333,.6667))),vec3(1.8));}
 // Vier durchscheinende Filme auf derselben Kante, je nur Bruchteile eines Bildpunkts versetzt (aus Version 5).
 vec3 spectralEdge(vec3 scene,float distancePx,float amount){
  if(amount<.001||abs(distancePx)>3.5)return scene;
  vec3 ink=vec3(0.);float coverage=0.;
  for(int i=0;i<4;i++){
   float layer=float(i),d=(distancePx+(layer-1.5)*.12)/(.55+layer*.12);
   float coat=exp(-d*d*1.4)*pow(.62,layer);
   ink+=filmHue(layer)*coat;coverage+=coat;
  }
  ink/=max(coverage,.0001);
  return mix(scene,scene*.20+ink*.90,min(1.,coverage*.56)*clamp(amount,0.,1.)*.8);
 }
 float contourAt(vec2 q){
  float z=depthAt(q);
  float zx=abs(depthAt(q+vec2(pixelSize.x,0.))-depthAt(q-vec2(pixelSize.x,0.))),zy=abs(depthAt(q+vec2(0.,pixelSize.y))-depthAt(q-vec2(0.,pixelSize.y)));
  return smoothstep(.035,.13,(zx+zy)/max(z,.05));
 }
 // Konturen: drei dünne dunkle Regenbogenfilme, um weniger als einen Bildpunkt gegeneinander versetzt.
 // Vorprüfung auf einem Kreuz von 1,6 Bildpunkten: ohne Tiefensprung in der Nähe bleibt der Film aus.
 vec4 depthCross(vec2 s){vec2 q=1.6*pixelSize;return vec4(depthAt(s+vec2(q.x,0.)),depthAt(s-vec2(q.x,0.)),depthAt(s+vec2(0.,q.y)),depthAt(s-vec2(0.,q.y)));}
 vec3 contourFilms(vec3 c,vec2 s,float z0,vec4 zc){
  if(contour<.002||(abs(zc.x-zc.y)+abs(zc.z-zc.w))/max(z0,.05)<.05)return c;
  vec2 o=normalize(vec2(dir*.8,.6))*pixelSize*.7;
  vec3 ink=vec3(0.);float coverage=0.;
  for(int i=0;i<3;i++){float layer=float(i),coat=contourAt(s+o*(layer-1.))*pow(.68,layer);ink+=filmHue(layer)*coat;coverage+=coat;}
  ink/=max(coverage,.0001);
  return mix(c,c*.2+ink*.9,min(1.,coverage*.6)*contour*.8);
 }
 vec3 membrane(vec2 uv){
  float band=sin(uv.y/pixelSize.y*.09+3.*sin(uv.x*7.+clock*.6)+clock*.8),sheen=pow(.5+.5*band,10.);
  vec3 iri=.5+.5*cos(6.2831*(vec3(0.,.33,.67)+uv.x*1.5+clock*.05));
  return vec3(.02,.022,.018)+sheen*.1*iri;
 }
 vec3 behind(vec2 uv){vec3 b=mix(membrane(uv),texture2D(tOther,uv).rgb,gapB);return behindMem>.001?mix(b,texture2DLodEXT(tMem,uv,0.).rgb,behindMem):b;}
 // Bild an der Wand: lebendige Wiese (tMem) oder der Raum selbst aus dem letzten Bild (tPrev), unendlich ineinander.
 vec3 worldTex(vec2 s){
  vec3 c=texture2DLodEXT(tWorld,s,0.).rgb;
  if(portal+droste<.001)return c;
  vec3 p=portalH*vec3(s,1.);
  if(p.z<=0.)return c;
  vec2 f=p.xy/p.z;
  if(f.x<0.||f.x>1.||f.y<0.||f.y>1.)return c;
  if(portal>.001)c=mix(c,texture2D(tMem,f).rgb,portal);
  if(droste>.001)c=mix(c,texture2D(tPrev,mix(vec2(.5),f,.995)).rgb*.97,droste);
  return c;
 }
 // Kulissen klappen auf: jede Schicht ist eine flache Tafel, die sich an einem Bildrand wie eine Tür um eine senkrechte Achse dreht.
 vec3 hingeMap(vec2 s,float k){
  float cyc=.5+.5*sin(hingePh+k*2.39+1.1),th=hinge*1.2*smoothstep(.42,.95,cyc);
  if(th<.002)return vec3(s,1.);
  float sgn=mod(k,2.)<.5?1.:-1.,hx=sgn>0.?.03:.97,X=(s.x-hx)*aspect,d=1.5;
  float den=d*cos(th)-sgn*X*sin(th);
  if(den<.05)return vec3(0.,0.,-1.);
  float a=X*d/den;
  if(sgn*a<0.)return vec3(0.,0.,-1.);
  float depth=d+sgn*a*sin(th);
  return vec3(hx+a/aspect,.5+(s.y-.5)*depth/d,1.-.38*sin(th)*smoothstep(0.,.25,abs(a)));
 }
 vec3 sampleWorld(vec2 uv){
  if(flatAmt<.002&&mis<.002&&hinge<.002){if(contour<.002)return worldTex(uv);return contourFilms(worldTex(uv),uv,depthAt(uv),depthCross(uv));}
  float edgeAmt=clamp(max(flatAmt,mis),0.,1.);
  for(int i=0;i<5;i++){
   float k=float(i);
   vec2 s=(uv-.5)*layerScale(k)+.5-layerOff(k);float shade=1.;
   if(hinge>.002){vec3 hm=hingeMap(s,k);if(hm.z<0.)continue;s=hm.xy;shade=hm.z;}
   if(s.x<0.||s.x>1.||s.y<0.||s.y>1.)continue;
   float z0=depthAt(s);
   if(abs(layerOf(z0)-k)<.5){
    vec4 zc=depthCross(s);
    vec3 c=contourFilms(worldTex(s),s,z0,zc)*shade;
    float e2=step(k+.5,layerOf(zc.x))+step(k+.5,layerOf(zc.y))+step(k+.5,layerOf(zc.z))+step(k+.5,layerOf(zc.w));
    if(e2>0.){
     vec2 px=.8*pixelSize;
     float e1=step(k+.5,layerOf(depthAt(s+vec2(px.x,0.))))+step(k+.5,layerOf(depthAt(s-vec2(px.x,0.))))+step(k+.5,layerOf(depthAt(s+vec2(0.,px.y))))+step(k+.5,layerOf(depthAt(s-vec2(0.,px.y))));
     c=spectralEdge(c,e1>0.?.35:1.25,edgeAmt);
    }
    if(i>0){
     float kf=k-1.;vec2 sf=(uv+vec2(-dir*.010,.012)*edgeAmt-.5)*layerScale(kf)+.5-layerOff(kf);
     if(layerOf(depthAt(sf))<k-.5)c*=1.-.5*edgeAmt;
    }
    return c;
   }
  }
  return behind(uv);
 }
 // Tunnel aus Membranscheiben: der ganze Bildausschnitt löst sich immer wieder als eigene Membran ab. Die Membranen kommen
 // aus dem Fluchtpunkt, eine hinter der anderen, wachsen auf den Blick zu, decken beim Erreichen des Bildrands genau das
 // Bild und ziehen dann vergrößert vorbei. Jede ist dort offen, wo die nächste, kleinere hinter ihr liegt. Die vorderste
 // ist am deutlichsten, nach hinten werden sie durchsichtiger, bis nur noch ihre Ränder bleiben und die Welt durchscheint.
 // Ab memFront tragen die Membranen die Wiese mit dem Haus statt des eigenen Bildes.
 float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
 float discF(vec2 p){vec2 e=abs(p*2.-1.);return pow(pow(e.x,2.2)+pow(e.y,2.2),1./2.2);}
 vec3 vn3(float n){return vec3(h11(n*1.31+.7),h11(n*2.17+3.1),h11(n*.73+5.9));}
 vec3 membraneTunnel(vec3 col){
  const float RATE=.3,DEEP=15.;
  vec2 c0=vec2(.5+dir*.08*pull+.015*sin(clock*.23),.5+.012*sin(clock*.31));
  vec2 bend=vec2(.05*sin(clock*.071)+.02*sin(clock*.13),.035*cos(clock*.059));
  float cyc=clock*RATE,ph=fract(cyc),base=floor(cyc),on=smoothstep(0.,1.,tunnel),inner=-1e4,innerW=0.;
  for(int i=15;i>=0;i--){
   float k=float(i)+.2-ph,scale=pow(.7,k);
   float fade=smoothstep(.0035,.008,scale)*(1.-smoothstep(1.02,1.34,scale)),w=on*fade;
   if(w<.001){inner=-1e4;continue;}
   float far=clamp(k/3.,0.,1.),kd=clamp(k/DEEP,0.,1.),front=exp(-.2*max(k-.6,0.)),edgeK=exp(-.085*max(k,0.));
   vec2 cb=mix(vec2(.5),c0,clamp(k/2.,0.,1.))+bend*kd*kd;
   // Flug: der Tunnel richtet sich auf das Haus aus. Jede Membran ist das Bild, um den Punkt zwischen den Zäunen verkleinert,
   // ohne Drehung und ohne Versatz; die Zäune laufen so durch alle Membranen in denselben Fluchtpunkt.
   cb=mix(cb,mix(tunnelAim,vec2(.5),scale),tunnelAlign);
   // Weit außerhalb dieser Membran und ihres Schattens: nichts zu tun.
   if(length((vUv-cb)*vec2(aspect,1.))>.5*scale*length(vec2(aspect,1.))+.035+50.*pixelSize.y){inner=-1e4;continue;}
   vec3 id=vn3(base+float(i));
   vec2 cc=cb+(id.xy-.5)*vec2(.03,.022)*min(1.,2.*scale)*clamp(k/2.,0.,1.)*(1.-tunnelAlign);
   float a=(dir*.045*max(k,0.)*tunnel+(.02*sin(clock*.2+id.x*6.))*far)*(1.-tunnelAlign);
   mat2 rot=mat2(cos(a),sin(a),-sin(a),cos(a));
   vec2 q=rot*((vUv-cc)*vec2(aspect,1.))/scale;
   q+=.006*vec2(sin(q.y*9.+clock*1.3+id.y*6.),cos(q.x*7.-clock*1.1+id.x*6.));
   vec2 up=q/vec2(aspect,1.)+.5;
   float f=discF(up),rimPx=(1.-f)*.5*scale/pixelSize.y;
   // Offen, wo die nächste Membran dahinter liegt.
   float hole=smoothstep(-.5,1.5,inner)*innerW;inner=rimPx;innerW=fade;
   if(rimPx<0.){col*=1.-.45*w*front*(1.-tunnelBreak)*exp(-pow(rimPx/15.,2.));continue;}
   float alpha=mix(.62,.97,smoothstep(.7,.93,f))*front*(1.-hole*(1.-.05*smoothstep(.6,1.,scale)));
   if(w*alpha<.003&&rimPx>4.)continue;
   // Sobald der Raum bricht, reißen Löcher in die Membranen, bis nur noch Fetzen bleiben.
   float keep=1.,tornPx=99.;
   if(tunnelBreak>.001){vec2 np=up*vec2(aspect,1.);float n=vn(np*4.+id.x*17.+vec2(clock*.05,0.))*.65+vn(np*11.+id.y*9.)*.35,thr=tunnelBreak*1.08-.04;keep=smoothstep(thr,thr+.03,n);tornPx=(n-thr)*90.;if(keep<.001){col=spectralEdge(col,tornPx+1.,w*tunnelBreak*edgeK);continue;}}
   float lod=max(0.,-log2(scale)-.4);
   vec3 img=texture2DLodEXT(tWorld,clamp(up,0.,1.),lod).rgb;
   if(memFront<20.){float mm=smoothstep(memFront-.7,memFront+.7,k);if(mm>.001)img=mix(img,texture2DLodEXT(tMem,clamp(up,0.,1.),lod).rgb,mm);}
   float l=dot(img,vec3(.2126,.7152,.0722)),tone=.94+.12*id.z;
   vec3 skin=(mix(img,vec3(l),.1+.1*id.x)*.96+.03)*tone;
   float thick=.5+.5*sin(up.x*13.+up.y*9.+clock*.5+id.y*13.+3.*sin(up.y*5.-clock*.3));
   vec3 iri=.5+.5*cos(6.2831*(vec3(0.,.33,.67)+thick*1.3+id.z));
   skin=mix(skin,skin*(.72+.56*iri),.22*front);
   skin+=.06*front*pow(max(0.,sin((up.x+up.y)*3.+clock*.4+id.x*6.)),24.);
   skin*=1.-.18*front*exp(-pow((rimPx-7.)/4.,2.));
   skin=mix(skin,vec3(l*1.04+.02),.25*kd);
   col=mix(col,skin,w*alpha*smoothstep(0.,1.5,rimPx)*keep);
   col=spectralEdge(col,min(rimPx-.6,tornPx),w*edgeK);
   col+=vec3(.1)*w*keep*edgeK*exp(-pow((rimPx-2.4)/1.1,2.));
  }
  return col;
 }
 vec3 stripField(vec2 uv,float d,out float gap){
  float xn=uv.x*2.-1.,th=atan(xn*tanH)/fovH,xd=mix(uv.x-.5,th,drum);
  float c=(xd-offset)*15.,i=floor(c),s=fract(c);
  float h1=h11(i*1.37+3.1),h2=h11(i*2.71+.7),h3=h11(i*.91+5.3);
  float spread=clamp(d*3.,0.,1.)*(1.-drum),gapF=mix(.02,.22,spread)+drum*.09;
  gap=step(1.-gapF,s);
  float vScale=mix(1.,cos(th*fovH*1.2),drum);
  float sx=xd-offset+(h1-.5)*scatter*.9-dir*spread*.05*h2;
  float sy=.5+(uv.y-.5)*vScale+(h2-.5)*(.07*spread+.12*scatter)+drum*.02*sin(clock*.9+i);
  vec2 suv=vec2(mir(sx+.5),mir(sy));
  float wB=clamp(otherShare*2.,0.,1.)*smoothstep(.25,.75,.5+.5*sin(clock*.18+h3*6.2831));
  vec3 col=wB>.999?texture2D(tOther,suv).rgb:mix(sampleWorld(suv),texture2D(tOther,suv).rgb,wB);
  col*=.8+.2*sin(clamp(s/(1.-gapF),0.,1.)*3.14159);
  float stripPx=pixelSize.x>0.?(1./15.)/pixelSize.x*mix(1.,.8,drum):40.;
  col=spectralEdge(col,min(s,1.-gapF-s)*stripPx,1.);
  col*=mix(1.,.5+.5*cos(th*fovH*1.5),drum*.8);
  float yy=abs(uv.y-.5)*vScale,band=smoothstep(.418,.426,yy)*drum;
  if(band>0.){
   float hx=fract(c*3.),hole=step(.3,hx)*step(hx,.7)*step(.442,yy)*step(yy,.474);
   vec3 film=vec3(.05,.034,.02)*(.8+.4*h21(floor(uv/pixelSize/3.)));
   col=mix(col,mix(film,vec3(.75,.68,.5),hole),band);
  }
  return col;
 }
 void main(){
  vec2 uv=vUv;
  float xr0=dir>0.?uv.x:1.-uv.x;
  uv.x+=dir*pull*.018*sin(xr0*3.14159);
  float xr=dir>0.?uv.x:1.-uv.x,on=step(.0001,seam),xs=mix(1.05,-.08,seam);
  float jag=on>.5?(fbm1(uv.y*18.+3.)-.5)*.05+(fbm1(uv.y*120.)-.5)*.012:0.,d=xr-(xs+jag);
  vec3 col;
  if(on>.5&&d>0.){
   float gap;vec3 sc=stripField(uv,d,gap);
   vec3 bk=mix(behind(uv),vec3(.010,.011,.009),drum*.85);
   col=mix(sc,bk,gap);
   col*=1.-.5*(1.-smoothstep(0.,.02,d))*tearVis;
   col=spectralEdge(col,d/pixelSize.x,tearVis);
  }else{
   col=sampleWorld(uv);
   if(tearVis*on>.001&&-d<.01){
    float edge=1.-smoothstep(0.,.004+.004*fbm1(uv.y*300.),-d);
    col=mix(col,vec3(.5,.48,.42),edge*tearVis*.6);
    col=spectralEdge(col,-d/pixelSize.x-1.5,tearVis);
   }
  }
  if(memMix>.001)col=mix(col,texture2DLodEXT(tMem,uv,0.).rgb,memMix);
  if(tunnel>.001)col=membraneTunnel(col);
  if(grain>.001){
   vec2 p=(vUv/pixelSize+vec2(fabOff/pixelSize.x,0.))/3.5;
   float weave=abs(sin(p.x*1.5708))*.5+abs(sin(p.y*1.5708))*.5,fib=h21(floor(p*.5));
   float l=dot(col,vec3(.2126,.7152,.0722));
   col=mix(col,vec3(l),.18*grain);
   col*=1.+grain*(.1*(weave-.5)+.05*(fib-.5));
  }
  if(feedback>.001)col=mix(col,texture2D(tPrev,vUv-vec2(dir*1.6*pixelSize.x*pull,0.)).rgb,feedback);
  col*=1.-dark;
  col*=1.-wear*.10*pow(length((vUv-.5)*vec2(1.,aspect<1.?1.4:1.)),2.);
  gl_FragColor=vec4(max(col,0.),1.);
 }`;
 function create(THREE){
  const U={uMaskPull:{value:0},uMaskSplit:{value:0},uMaskStretch:{value:0},uMaskCurl:{value:0},uMaskFlow:{value:0},uMaskFoldF:{value:new THREE.Vector3(0,0,-1)},uMaskFoldR:{value:new THREE.Vector3(1,0,0)},uMaskTime:{value:0},uMaskOrigin:{value:new THREE.Vector3()},uMaskRight:{value:new THREE.Vector3(1,0,0)},uMaskForward:{value:new THREE.Vector3(0,0,-1)}};
  // Boden steht auf (nur draußen): ein gut zwanzig Meter breiter Streifen Landschaft ab acht Metern vor dem Blick klappt
  // wie eine Buchseite um eine weiche Falte nach oben, steht als Wand und neigt sich über den Kopf. Links und rechts bleibt
  // der Boden liegen, die Ränder der Seite dehnen sich. Fluss schiebt die Landschaft dabei die Seite hinauf.
  const head=`uniform float uMaskPull,uMaskSplit,uMaskStretch,uMaskCurl,uMaskFlow,uMaskTime;uniform vec3 uMaskOrigin,uMaskRight,uMaskForward,uMaskFoldF,uMaskFoldR;
  vec3 novaMaskWarp(vec3 p){
   if(uMaskPull<=.0001&&uMaskStretch<=.0001&&uMaskCurl<=.0001)return p;
   vec3 relative=p-uMaskOrigin;
   float x=dot(relative,uMaskRight),z=dot(relative,uMaskForward),y=relative.y;
   float local=1.-smoothstep(28.,95.,length(relative));
   float layer=floor((x+z*.13)/.68),shift=sin(layer*1.71+uMaskTime*.34)*uMaskSplit*.18;
   float ang=clamp(x/17.,-2.,2.)*uMaskPull;
   float bentX=mix(x,sin(ang)*17./max(uMaskPull,.0001),uMaskPull*.6);
   float bentY=y+(1.-cos(ang))*12.*uMaskPull;
   relative+=uMaskRight*(bentX-x+shift+uMaskPull*.27)*local;
   relative.y+=(bentY-y+cos(layer*.91+uMaskTime*.2)*uMaskSplit*.08)*local;
   relative-=uMaskForward*z*uMaskPull*.20*local;
   relative+=uMaskForward*max(z,0.)*uMaskStretch*local;
   if(uMaskCurl>.0001){
    float zz=dot(relative,uMaskFoldF),s=zz-12.,xx=dot(relative,uMaskFoldR),band=1.-smoothstep(5.,12.,abs(xx+1.2*sin(zz*.06+uMaskTime*.07)));
    float fold=uMaskCurl*2.2*band;
    if(s>0.&&fold>.0001){
     float R=8.*(1.+.1*sin(xx*.08+uMaskTime*.09));
     s+=uMaskFlow*band*smoothstep(0.,14.,s);
     float h=relative.y+1.7,sa=min(s,fold*R),th=sa/R,sn=sin(th),cs=cos(th),hs=sin(th*.5),rest=s-sa;
     relative+=uMaskFoldF*(12.+sn*R+rest*cs-h*sn-zz);
     relative.y=-1.7+2.*hs*hs*R+rest*sn+h*cs;
    }
   }
   return uMaskOrigin+relative;
  }
`;
  const warp=`
   #include <project_vertex>
   if(uMaskPull>.0001||uMaskStretch>.0001||uMaskCurl>.0001){
    vec4 maskWorld=vec4(transformed,1.);
    #ifdef USE_INSTANCING
     maskWorld=instanceMatrix*maskWorld;
    #endif
    maskWorld=modelMatrix*maskWorld;
    maskWorld.xyz=novaMaskWarp(maskWorld.xyz);
    mvPosition=viewMatrix*maskWorld;
    gl_Position=projectionMatrix*mvPosition;
   }
  `;
  const hooked=new WeakSet();
  function hook(mat){
   if(!mat||hooked.has(mat)||mat.isShaderMaterial)return;hooked.add(mat);
   const before=mat.onBeforeCompile,key=mat.customProgramCacheKey?.bind(mat);
   mat.onBeforeCompile=function(shader,renderer){before.call(this,shader,renderer);Object.assign(shader.uniforms,U);shader.vertexShader=head+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',warp);};
   const prior=key?.()||'';mat.customProgramCacheKey=()=>prior+'|mask-room-v3';mat.needsUpdate=true;
  }
  function prepare(scene){scene.traverse(o=>{if(!o.isMesh||o.userData.novaNoWarp)return;for(const mat of Array.isArray(o.material)?o.material:[o.material])hook(mat);});}
  // Eigene Shader (Wasser) bekommen dieselbe Verbiegung, damit Meer und Teiche mit dem Boden mitgehen.
  function hookShader(mat,line,replacement){if(!mat||hooked.has(mat)||!mat.vertexShader.includes(line))return false;hooked.add(mat);Object.assign(mat.uniforms,U);mat.vertexShader=head+mat.vertexShader.replace(line,replacement);mat.needsUpdate=true;return true;}
  const opts={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:true},A=new THREE.WebGLRenderTarget(8,8,{...opts,minFilter:THREE.LinearMipmapLinearFilter,generateMipmaps:true}),B=new THREE.WebGLRenderTarget(8,8,opts);
  // Match the original renderer's output so putting the mask on does not change gamma.
  A.texture.encoding=B.texture.encoding=THREE.sRGBEncoding;
  let depthType=THREE.UnsignedIntType;
  function attachDepth(w,h){if(A.depthTexture)A.depthTexture.dispose();A.depthTexture=new THREE.DepthTexture(w,h);A.depthTexture.type=depthType;}
  attachDepth(8,8);
  let floatType=THREE.HalfFloatType;
  const compositeOpts=()=>({minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false,type:floatType});
  let composites=[new THREE.WebGLRenderTarget(8,8,compositeOpts()),new THREE.WebGLRenderTarget(8,8,compositeOpts())],current=0;
  const aaUniforms={tComposite:{value:composites[0].texture},pixelSize:{value:new THREE.Vector2()},sharpen:{value:0},clock:{value:0},filmPost:{value:0}};
  const aaMaterial=new THREE.ShaderMaterial({vertexShader:VERT,fragmentShader:ANTIALIAS,uniforms:aaUniforms,depthTest:false,depthWrite:false});
  const C=new THREE.WebGLRenderTarget(8,8,{...opts,minFilter:THREE.LinearMipmapLinearFilter,generateMipmaps:true});C.texture.encoding=THREE.sRGBEncoding;
  let F=new THREE.WebGLRenderTarget(8,8,compositeOpts());
  const fracUniforms={tSrc:{value:null},tWorld:{value:A.texture},pixelSize:{value:new THREE.Vector2()},amount:{value:0},spread:{value:0},aspect:{value:1},clock:{value:0}};
  const fracMaterial=new THREE.ShaderMaterial({vertexShader:VERT,fragmentShader:FRACTAL,uniforms:fracUniforms,depthTest:false,depthWrite:false});fracMaterial.extensions.shaderTextureLOD=true;
  const names=['clock','aspect','nearZ','farZ','depthScale','dir','pull','flatAmt','mis','gapB','seam','drum','offset','scatter','otherShare','grain','feedback','fabOff','tanH','fovH','tearVis','wear','seal','tunnel','tunnelBreak','contour','tunnelAlign'];
  const uniforms={tWorld:{value:A.texture},tDepth:{value:A.depthTexture},tOther:{value:B.texture},tPrev:{value:composites[1].texture},tMem:{value:C.texture},portalH:{value:new THREE.Matrix3()},portal:{value:0},droste:{value:0},hinge:{value:0},hingePh:{value:0},dark:{value:0},memFront:{value:99},memMix:{value:0},behindMem:{value:0},pixelSize:{value:new THREE.Vector2()},tunnelAim:{value:new THREE.Vector2(.5,.5)}};
  for(const n of names)uniforms[n]={value:0};uniforms.depthScale.value=1;uniforms.dir.value=1;uniforms.aspect.value=1;
  const material=new THREE.ShaderMaterial({vertexShader:VERT,fragmentShader:FRAG,uniforms,depthTest:false,depthWrite:false});material.extensions.shaderTextureLOD=true;
  const quadScene=new THREE.Scene();quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));quadScene.children[0].frustumCulled=false;const quadCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const eye=new THREE.PerspectiveCamera(),otherEye=new THREE.PerspectiveCamera(),targetEye=new THREE.PerspectiveCamera(),lampEye=new THREE.PerspectiveCamera(),wallEye=new THREE.Object3D(),aimP=new THREE.Vector3(),direction=new THREE.Vector3(),right=new THREE.Vector3(),size=new THREE.Vector2(),headQ=new THREE.Quaternion();let w=0,h=0,tick=0,checked=false;
  const LAMP=new THREE.Vector3(0,2.6,.2);
  let composing=false,fresh=0;
  // Bild an der Wand: Ecken wie im Vertex-Shader verbogen, damit Bild und Inhalt deckungsgleich bleiben.
  const corner=new THREE.Vector3(),viewP=new THREE.Vector3(),flyPos=new THREE.Vector3(),flyQ=new THREE.Quaternion(),normal=new THREE.Vector3(),quad=[[0,0],[0,0],[0,0],[0,0]],Hm=new THREE.Matrix3();
  const sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  function warpPoint(p){
   const pull=U.uMaskPull.value,split=U.uMaskSplit.value,stretch=U.uMaskStretch.value,t=U.uMaskTime.value;if(pull<=.0001&&stretch<=.0001)return p;
   const o=U.uMaskOrigin.value,R=U.uMaskRight.value,F=U.uMaskForward.value,rx=p.x-o.x,ry=p.y-o.y,rz=p.z-o.z;
   const x=rx*R.x+ry*R.y+rz*R.z,z=rx*F.x+ry*F.y+rz*F.z,y=ry,local=1-sm(28,95,Math.hypot(rx,ry,rz));
   const layer=Math.floor((x+z*.13)/.68),shift=Math.sin(layer*1.71+t*.34)*split*.18,ang=Math.max(-2,Math.min(2,x/17))*pull;
   const bentX=x+(Math.sin(ang)*17/Math.max(pull,.0001)-x)*pull*.6,bentY=y+(1-Math.cos(ang))*12*pull;
   const dx=(bentX-x+shift+pull*.27)*local,dy=(bentY-y+Math.cos(layer*.91+t*.2)*split*.08)*local,dz=-z*pull*.2*local+Math.max(z,0)*stretch*local;
   p.x+=R.x*dx+F.x*dz;p.y+=dy+R.y*dx+F.y*dz;p.z+=R.z*dx+F.z*dz;return p;
  }
  function pictureQuad(pic,cam){
   pic.mesh.updateWorldMatrix(true,false);const m=pic.mesh.matrixWorld,hw=pic.w/2,hh=pic.h/2,pts=[[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]];
   for(let i=0;i<4;i++){corner.set(pts[i][0],pts[i][1],0).applyMatrix4(m);warpPoint(corner);viewP.copy(corner).applyMatrix4(cam.matrixWorldInverse);if(viewP.z>-cam.near*1.02)return false;corner.project(cam);quad[i][0]=corner.x*.5+.5;quad[i][1]=corner.y*.5+.5;}
   const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=quad,dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3,dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3,den=dx1*dy2-dx2*dy1;
   if(Math.abs(den)<1e-12)return false;
   const g=(dx3*dy2-dx2*dy3)/den,hh2=(dx1*dy3-dx3*dy1)/den;
   Hm.set(x1-x0+g*x1,x3-x0+hh2*x3,x0,y1-y0+g*y1,y3-y0+hh2*y3,y0,g,hh2,1);
   uniforms.portalH.value.copy(Hm).invert();return true;
  }
  function pictureTarget(pic,cam,aspect){
   pic.mesh.updateWorldMatrix(true,false);flyPos.setFromMatrixPosition(pic.mesh.matrixWorld);pic.mesh.getWorldQuaternion(flyQ);normal.set(0,0,1).applyQuaternion(flyQ);
   const tanV=Math.tan(cam.fov*Math.PI/360),dz=Math.max(pic.h/2/tanV,pic.w/2/(tanV*aspect))*.998;flyPos.addScaledVector(normal,dz);
  }
  function render(renderer,world,base,s,spaces,dt=0,o={}){
   if(!checked){checked=true;if(!renderer.capabilities.isWebGL2){depthType=THREE.UnsignedShortType;attachDepth(8,8);floatType=renderer.extensions.has('OES_texture_half_float')?THREE.HalfFloatType:THREE.UnsignedByteType;composites.forEach(c=>c.dispose());composites=[new THREE.WebGLRenderTarget(8,8,compositeOpts()),new THREE.WebGLRenderTarget(8,8,compositeOpts())];F.dispose();F=new THREE.WebGLRenderTarget(8,8,compositeOpts());}}
   if(++tick%40===1){prepare(world);prepare(spaces.replacement);}
   const calm=s.calm||0,mem=spaces.memory||null,inMem=!!(mem&&s.memWorld),bau=spaces.bau||null,inBau=!inMem&&!!(bau&&s.bauWorld),pic=o.indoor?spaces.picture:null;
   U.uMaskPull.value=s.pull*.55*(1-calm);U.uMaskSplit.value=s.flat*.3;U.uMaskStretch.value=s.stretch||0;U.uMaskCurl.value=o.indoor?0:s.curl||0;U.uMaskFlow.value=s.flow||0;U.uMaskTime.value=s.time;U.uMaskOrigin.value.copy(base.position);
   base.getWorldDirection(direction);direction.y=0;direction.normalize();right.crossVectors(direction,base.up).normalize();U.uMaskRight.value.copy(right);U.uMaskForward.value.copy(direction);
   {const c=Math.cos(s.driftYaw||0),n=Math.sin(s.driftYaw||0),F=U.uMaskFoldF.value,R=U.uMaskFoldR.value;F.set(direction.x*c+direction.z*n,0,direction.z*c-direction.x*n);R.crossVectors(F,base.up).normalize();}
   if(!s.active||(s.amount<.0005&&s.seal<.001&&s.wear<.001)){composing=false;U.uMaskPull.value=U.uMaskSplit.value=U.uMaskStretch.value=U.uMaskCurl.value=U.uMaskFlow.value=0;const previous=renderer.getRenderTarget();try{renderer.setRenderTarget(o.output||previous);renderer.render(world,base);}finally{renderer.setRenderTarget(previous);}return;}
   renderer.getDrawingBufferSize(size);
   if(size.x!==w||size.y!==h){w=size.x;h=size.y;fresh=2;composing=false;A.setSize(w,h);attachDepth(w,h);B.setSize(w,h);C.setSize(w,h);F.setSize(w,h);composites.forEach(c=>c.setSize(w,h));uniforms.pixelSize.value.set(1/w,1/h);aaUniforms.pixelSize.value.set(1/w,1/h);fracUniforms.pixelSize.value.set(1/w,1/h);}
   // Seitlicher Zug: Gierdrift, Versatz zur Seite und Neigung; die Basiskamera bleibt unberührt.
   let scene=world,depthScale=o.indoor?1:4;
   if(inMem){eye.copy(mem.update(s,base,w/h,false));scene=mem.scene;depthScale=6;}
   // Wohnblock: eigene Szene mit eigener Kamera; solange die Fenster einzeln sehen, wird in Ausschnitten gerechnet.
   else if(inBau){eye.copy(bau.update(s,base,w/h));scene=bau.scene;depthScale=6;}
   else{
    eye.copy(base);eye.rotation.set(Math.min(1.45,base.rotation.x+(o.indoor?0:s.tilt||0)),base.rotation.y+s.driftYaw+(s.sweep||0),s.roll,'YXZ');eye.position.addScaledVector(right,s.driftSide);
    if(o.indoor&&s.object>0){
     const e=s.object<.5?4*s.object**3:1-Math.pow(-2*s.object+2,3)/2;headQ.copy(eye.quaternion);
     lampEye.position.copy(LAMP);lampEye.up.set(0,1,0);lampEye.lookAt(base.position.x,1.05,base.position.z);
     eye.position.lerp(lampEye.position,e);eye.quaternion.copy(headQ).slerp(lampEye.quaternion,e);
    }
    // Sog: der Blick fliegt auf das Bild zu, bis es das ganze Bild füllt.
    if(pic&&s.fly>0){const f=s.fly,e=f*f*(3-2*f);pictureTarget(pic,eye,w/h);eye.position.lerp(flyPos,e);eye.quaternion.slerp(flyQ,e);}
    // Zug in die Wand: der Blick gleitet zur Seite, dreht sich zur Wand und bleibt eine Handbreit davor, bis sie ihn nimmt.
    if(o.indoor&&(s.bauWall||0)>0){const e=s.bauWall,side=s.dir<0?-1:1;wallEye.position.set(side*3.455,1.56,-.6);wallEye.rotation.set(0,-side*Math.PI/2,0,'YXZ');eye.position.lerp(wallEye.position,e);eye.quaternion.slerp(wallEye.quaternion,e);}
   }
   eye.updateMatrixWorld(true);
   // Fluchtpunkt des Tunnels beim Flug: die Tür des Hauses, wie sie die Kamera der Wiese gerade sieht.
   let align=s.tunnelAlign||0;
   if(align>.001&&mem&&mem.aim){const mc=inMem?eye:mem.update(s,base,w/h,false);aimP.copy(mem.aim).applyMatrix4(mc.matrixWorldInverse);if(aimP.z<-mc.near){aimP.applyMatrix4(mc.projectionMatrix);uniforms.tunnelAim.value.set(Math.max(.15,Math.min(.85,aimP.x*.5+.5)),Math.max(.15,Math.min(.85,aimP.y*.5+.5)));}else align=0;}else align=0;
   const pictureOn=!inMem&&pic&&(s.portal>.001||s.droste>.001)&&pictureQuad(pic,eye);
   otherEye.copy(base);otherEye.aspect=base.aspect;otherEye.near=.04;otherEye.far=140;otherEye.fov=base.fov*(1-.22*s.object+.15*s.wheel);otherEye.position.set(.14*Math.sin(s.time*.21),1.60+.06*Math.sin(s.time*.16),1.7-(s.time%5.4)*.11*s.replace);otherEye.rotation.set(-.055,-.10*Math.sin(s.time*.13),-.05*s.split,'YXZ');
   targetEye.position.set(.70,.86,-.96);targetEye.up.set(0,1,0);targetEye.lookAt(.5*s.wheel,1.55+3.65*s.wheel,1.7+10.3*s.wheel);targetEye.rotateZ(.42-.27*s.wheel);
   otherEye.position.lerp(targetEye.position,s.object);otherEye.quaternion.slerp(targetEye.quaternion,s.object);otherEye.updateProjectionMatrix();otherEye.updateMatrixWorld(true);spaces.updatePresence(otherEye,s);
   const previous=renderer.getRenderTarget(),out=composites[current],prev=composites[1-current];
   try{
    renderer.setRenderTarget(A);if(inBau&&bau.paned)bau.renderPanes(renderer,A,w,h);else renderer.render(scene,eye);
    const memSide=!inMem&&mem&&((s.memMix||0)>.001||(s.memFront??99)<17||(s.behindMem||0)>.001);
    if(pictureOn&&mem&&s.portal>.001){renderer.setRenderTarget(C);renderer.render(mem.scene,mem.update(s,base,w/h,true));}
    else if(memSide){renderer.setRenderTarget(C);renderer.render(mem.scene,mem.update(s,base,w/h,false));}
    if(!composing){composing=true;for(const c of composites){renderer.setRenderTarget(c);renderer.clear();}}
    if(s.gapB>.001||s.seam>0||s.drum>0){U.uMaskPull.value=U.uMaskSplit.value=U.uMaskCurl.value=0;renderer.setRenderTarget(B);renderer.render(spaces.replacement,otherEye);U.uMaskCurl.value=o.indoor?0:s.curl||0;}
    const fovH=2*Math.atan(Math.tan(eye.fov*Math.PI/360)*eye.aspect);
    const v={clock:s.time,aspect:w/h,nearZ:eye.near,farZ:eye.far,depthScale,dir:s.dir,pull:s.pull,flatAmt:s.flat,mis:s.mis,gapB:s.gapB,seam:s.seam,drum:s.drum,offset:s.drumOff,scatter:s.scatter,otherShare:s.otherShare,grain:s.grain,feedback:s.feedback,fabOff:s.fabOff,tanH:Math.tan(fovH/2),fovH,tearVis:s.tearVis,wear:s.wear*(s.rimFade??1),seal:s.seal,tunnel:s.tunnel,tunnelBreak:s.tunnelBreak,contour:s.contour*(1-calm),tunnelAlign:align};
    for(const n of names)uniforms[n].value=v[n];if(fresh>0){fresh--;uniforms.feedback.value=0;}
    uniforms.tDepth.value=A.depthTexture;uniforms.tPrev.value=prev.texture;
    uniforms.portal.value=pictureOn?s.portal:0;uniforms.droste.value=pictureOn&&fresh===0?s.droste:0;uniforms.hinge.value=s.hinge||0;uniforms.hingePh.value=s.hingePh||0;uniforms.dark.value=s.dark||0;uniforms.memFront.value=memSide?s.memFront:99;uniforms.memMix.value=memSide?s.memMix:0;uniforms.behindMem.value=memSide?s.behindMem||0:0;
    renderer.setRenderTarget(out);renderer.render(quadScene,quadCam);
    let shown=out;
    if((s.fractal||0)>.001){fracUniforms.tSrc.value=out.texture;fracUniforms.amount.value=s.fractal;fracUniforms.spread.value=s.fractalSpread||0;fracUniforms.aspect.value=w/h;fracUniforms.clock.value=s.time;quadScene.children[0].material=fracMaterial;renderer.setRenderTarget(F);renderer.render(quadScene,quadCam);shown=F;}
    aaUniforms.tComposite.value=shown.texture;aaUniforms.sharpen.value=(o.sharpen||0)*Math.min(1,(s.wear||0)*1.4);aaUniforms.filmPost.value=(s.filmPost||0)*(1-.9*(s.fractal||0));aaUniforms.clock.value=s.time;quadScene.children[0].material=aaMaterial;renderer.setRenderTarget(o.output||previous);renderer.render(quadScene,quadCam);
    current=1-current;
   }finally{quadScene.children[0].material=material;U.uMaskPull.value=s.pull*.55*(1-calm);U.uMaskSplit.value=s.flat*.3;renderer.setRenderTarget(previous);}
  }
  return{prepare,hook,hookShader,render,uniforms,warpUniforms:U,material,reset(){composing=false;fresh=2;U.uMaskPull.value=U.uMaskSplit.value=U.uMaskStretch.value=U.uMaskCurl.value=U.uMaskFlow.value=0;},dispose(){A.dispose();B.dispose();C.dispose();F.dispose();fracMaterial.dispose();composites.forEach(c=>c.dispose());aaMaterial.dispose();material.dispose();quadScene.children[0].geometry.dispose();}};
 }
 return{create,vertexShader:VERT,fragmentShader:FRAG,antialiasFragmentShader:ANTIALIAS};
})();
