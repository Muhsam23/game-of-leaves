/* Live-scene adaptation of the supplied Unreal_Nova_Psilocybin_Test_v9 (1).html.
   The v9 lattice/color algorithm is retained; GPU structure tensors replace
   one-off CPU image analysis. Depth anchors patterns to real world surfaces. */
window.NovaPsilocybin9={
 glsl:`
 uniform sampler2D flowView;
 uniform float pattern;
 uniform mat4 inverseProjection,cameraWorld;
 vec3 hueShift(vec3 c,float a){vec3 k=vec3(.57735);float ca=cos(a);return c*ca+cross(k,c)*sin(a)+k*dot(k,c)*(1.-ca);}
 vec3 wave3(vec2 x,vec2 tg,float s,float kk,float psi){
  vec2 nm=vec2(-tg.y,tg.x),q1=kk*nm,q2=kk*(-.866*s*tg-.5*nm),q3=kk*(.866*s*tg-.5*nm);
  float a1=dot(q1,x),a2=dot(q2,x)+1.3,a3=dot(q3,x)+psi-1.3;
  return vec3(cos(a1)+cos(a2)+cos(a3),-(sin(a1)*q1+sin(a2)*q2+sin(a3)*q3))/3.;
 }
 float psiAt(vec2 px,float t){return PI*(.5+.5*sin(noise(px/170.)*6.+t*.11));}
 vec3 surfacePattern(vec2 px,vec4 f,float period,float t,float psi){
  vec2 o=f.rg*2.-1.;float coh=f.b,kk=TAU/period;vec3 acc=vec3(0.);float wsum=0.;
  for(int b=0;b<4;b++){
   float ang=float(b)*PI*.25;vec2 tg=vec2(cos(ang),sin(ang));
   float m=max(0.,dot(o,vec2(cos(2.*ang),sin(2.*ang)))),wb=smoothstep(.3,.65,coh)*m*m;
   acc+=wb*wave3(px-tg*period*.1*t,tg,.5,kk,psi);wsum+=wb;
  }
  float wi=1.-smoothstep(.3,.65,coh)+.03;
  acc+=wi*wave3(px+vec2(.03,.05)*period*t,vec2(1.,0.),1.,kk*1.08,psi);wsum+=wi;
  return acc/wsum;
 }
 float latticeLine(vec3 w,float psi){
  float g=max(length(w.yz),1e-3),lev=-.3*cos(psi);
  return max(1.-smoothstep(.5,1.7,abs(w.x-lev)/g),smoothstep(.55,.9,pattern)*(1.-smoothstep(.4,1.3,abs(w.x-lev-.42)/g)));
 }
 vec3 surfacePosition(vec2 p){vec4 q=inverseProjection*vec4(p*2.-1.,texture2D(depthView,p).r*2.-1.,1.);return (cameraWorld*vec4(q.xyz/q.w,1.)).xyz;}
 vec2 surfacePlane(vec3 p,vec3 n){if(n.y>n.x&&n.y>n.z)return p.xz;if(n.x>n.z)return p.zy;return p.xy;}
 vec3 psiloColor(vec2 uv,vec3 inputColor){
  vec2 p=uv;vec4 fl=texture2D(flowView,p);vec3 c0=texture2D(view,p).rgb;float l0=dot(c0,vec3(.2126,.7152,.0722));
  float fog=smoothstep(.4,.56,l0)*(1.-smoothstep(.08,.2,max(c0.r,max(c0.g,c0.b))-min(c0.r,min(c0.g,c0.b))));
  // Unlike the photograph preview, empty sky is known from the depth buffer.
  float surface=hasDepth>.5?1.-smoothstep(.9995,.99999,texture2D(depthView,p).r):1.;
  float amt=pattern*(1.-fog)*smoothstep(.08,.3,fl.a)*(1.-.4*smoothstep(.85,1.,fl.a))*surface;
  float P=.25,line=0.;vec2 G=vec2(0.);
  if(amt>.002){
   float ecc=length((uv0-.5)*vec2(aspect,1.));vec2 px=p*vec2(960.,540.)+7.*(l0-.25)*vec2(.8,.6);
   if(hasDepth>.5){
    vec3 pos=surfacePosition(p),dx=surfacePosition(clamp(p+vec2(1./resolution.x,0.),.001,.999))-pos,dy=surfacePosition(clamp(p+vec2(0.,1./resolution.y),.001,.999))-pos;
    vec3 n=abs(normalize(cross(dx,dy)+vec3(1e-8)));float a=.5*atan(fl.g*2.-1.,fl.r*2.-1.);
    vec2 tangent=surfacePlane(dx*cos(a)+dy*sin(a),n);tangent=normalize(tangent+vec2(1e-7));
    fl.rg=.5+.5*vec2(tangent.x*tangent.x-tangent.y*tangent.y,2.*tangent.x*tangent.y);
    px=surfacePlane(pos,n)*42.;
   }
   float wc=mix(.3,.65,smoothstep(.1,.7,ecc))+.25*(1.-smoothstep(.3,.65,fl.b)),ps1=psiAt(px,time),ps2=psiAt(px+vec2(311.,173.),time*.8);
   vec3 fine=surfacePattern(px,fl,13.,time,ps1),coarse=surfacePattern(px+vec2(311.,173.),fl,31.,time*.8,ps2);
   P=mix(fine.x,coarse.x,wc);G=mix(fine.yz,coarse.yz,wc);
   line=max(latticeLine(fine,ps1)*(1.-.6*wc),latticeLine(coarse,ps2)*(.4+.6*wc));
   p=clamp(p+amt*2.6*G/(length(G)+.08)*smoothstep(.0,.6,abs(P-.25))/vec2(960.,540.),vec2(.001),vec2(.999));
  }
  vec3 c=clamp(inputColor+texture2D(view,p).rgb-c0,0.,1.),raw=c;float l=dot(c,vec3(.2126,.7152,.0722));
  float lg=max(.5+(l-.5)*(1.38+.38*psychedelic),l*.8);vec3 ch=c-l;
  float F=(1.45+.45*psychedelic)*(1.19+.19*psychedelic)*clamp(lg/max(l,.02),.6,1.6);
  F=min(F,min(lg/max(max(-ch.r,max(-ch.g,-ch.b)),1e-4),(1.-lg)/max(max(ch.r,max(ch.g,ch.b)),1e-4)));
  c=clamp(lg+ch*F,0.,1.);
  vec2 hp=vec2(5./960.,5./540.);
  vec3 halo=(texture2D(view,clamp(p+vec2(hp.x,0.),.001,.999)).rgb+texture2D(view,clamp(p-vec2(hp.x,0.),.001,.999)).rgb+texture2D(view,clamp(p+vec2(0.,hp.y),.001,.999)).rgb+texture2D(view,clamp(p-vec2(0.,hp.y),.001,.999)).rgb)*.25;
  c=clamp(c+psychedelic*(max(halo-vec3(.42),vec3(0.))*.4+c*.055*smoothstep(.38,.72,l)),0.,1.);
  if(amt>.002){
   c=clamp(c+amt*.7*(raw-halo),0.,1.);float sp=P-.25,lum=dot(c,vec3(.2126,.7152,.0722));
   c=clamp(hueShift(c,amt*sp*.9),0.,1.);c=clamp(mix(vec3(lum),c,1.+amt*.3*(sp+.35))*(1.+amt*.4*sp),0.,1.);
   vec3 base=c/max(max(c.r,c.g),max(c.b,.03));
   vec3 glow=clamp(hueShift(mix(vec3(dot(base,vec3(.2126,.7152,.0722))),base,1.35),.45*sin(P*4.+time*.05+p.x*3.)),0.,1.);
   c=clamp(1.-(1.-c)*(1.-amt*line*.42*glow),0.,1.);
  }
  if(hasDepth>.5){vec3 b2=c/max(max(c.r,c.g),max(c.b,.03));vec3 rainbow=clamp(hueShift(mix(vec3(dot(b2,vec3(.2126,.7152,.0722))),b2,1.3),1.2*sin(p.x*17.+p.y*11.-time*.11)),0.,1.)*.9;c=mix(c,rainbow,silhouette(p)*(.13+.23*psychedelic));}
  return mix(inputColor,c,clamp(psychedelic/.2,0.,1.));
 }`,
 createFlow(T){
  let targets=null,w=0,h=0;const scene=new T.Scene(),eye=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const uniforms={source:{value:null},stepSize:{value:new T.Vector2()},mode:{value:0}};
  const material=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms,vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
   precision highp float;varying vec2 uv0;uniform sampler2D source;uniform vec2 stepSize;uniform float mode;
   float lum(vec2 p){return dot(texture2D(source,clamp(p,.001,.999)).rgb,vec3(.2126,.7152,.0722));}
   void main(){
    if(mode<.5){
     vec2 e=stepSize;
     float a=lum(uv0+vec2(-e.x,e.y)),b=lum(uv0+vec2(0.,e.y)),c=lum(uv0+e),d=lum(uv0-vec2(e.x,0.)),f=lum(uv0+vec2(e.x,0.)),g=lum(uv0-e),h=lum(uv0-vec2(0.,e.y)),i=lum(uv0+vec2(e.x,-e.y));
     vec2 grad=clamp(vec2(c+2.*f+i-a-2.*d-g,a+2.*b+c-g-2.*h-i),-1.,1.);
     float high=lum(uv0)-(a+b+c+d+f+g+h+i)/8.;
     gl_FragColor=vec4(grad.x*grad.x,grad.y*grad.y,.5+.5*grad.x*grad.y,min(1.,abs(high)*12.));return;
    }
    vec4 t=texture2D(source,uv0)*.227027;
    t+=(texture2D(source,clamp(uv0+stepSize*1.384615,.001,.999))+texture2D(source,clamp(uv0-stepSize*1.384615,.001,.999)))*.316216;
    t+=(texture2D(source,clamp(uv0+stepSize*3.230769,.001,.999))+texture2D(source,clamp(uv0-stepSize*3.230769,.001,.999)))*.070270;
    if(mode>1.5){vec2 v=vec2(t.r-t.g,2.*(t.b*2.-1.));float m=length(v);vec2 o=m>.002?-v/m:vec2(1.,0.);t=vec4(.5+.5*o,clamp(m/(t.r+t.g+.002),0.,1.),sqrt(max(0.,t.a)));}
    gl_FragColor=t;
   }`});
  const geometry=new T.PlaneGeometry(2,2);scene.add(new T.Mesh(geometry,material));
  return{material,render(renderer,source,width,height){
   const scale=Math.min(.5,480/width,270/height),nw=Math.max(1,Math.round(width*scale)),nh=Math.max(1,Math.round(height*scale));
   if(!targets)targets=Array.from({length:3},()=>new T.WebGLRenderTarget(nw,nh,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:false}));
   if(w!==nw||h!==nh){w=nw;h=nh;for(const t of targets)t.setSize(w,h);}
   uniforms.source.value=source;uniforms.mode.value=0;uniforms.stepSize.value.set(1/width,1/height);renderer.setRenderTarget(targets[0]);renderer.render(scene,eye);
   uniforms.source.value=targets[0].texture;uniforms.mode.value=1;uniforms.stepSize.value.set(1/w,0);renderer.setRenderTarget(targets[1]);renderer.render(scene,eye);
   uniforms.source.value=targets[1].texture;uniforms.mode.value=2;uniforms.stepSize.value.set(0,1/h);renderer.setRenderTarget(targets[2]);renderer.render(scene,eye);return targets[2].texture;
  },get state(){return{width:w,height:h,targets:targets?.length||0};},dispose(){for(const t of targets||[])t.dispose();targets=null;material.dispose();geometry.dispose();}};
 }
};
