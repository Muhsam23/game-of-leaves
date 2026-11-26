// Perspective-correct views use isolated scenes; no neighboring wall can leak
// into the current corridor. Walking and viewing share the same rigid transform.
(() => {
'use strict';
function angle(from,to){return Math.atan2(-to.nx,-to.nz)-Math.atan2(from.nx,from.nz);}
function map(from,to,p){const a=angle(from,to),c=Math.cos(a),s=Math.sin(a),x=p.x-from.x,z=p.z-from.z;return{x:to.x+x*c+z*s,z:to.z-x*s+z*c,y:to.y+(p.y-from.y),yaw:(p.yaw||0)+a};}
// v90: building a neighbouring room is the costly part of a room change. Each frame
// builds at most one more destination once ~6 ms are spent; the rest follow in the
// next frames (or ahead of time in idle frames). Until then an opening shows haze.
const budget={spent:0,frame:0,managed:false},now=()=>typeof performance!=='undefined'?performance.now():Date.now();
function beginFrame(limit=6){budget.spent=0;budget.limit=limit;budget.frame=now();budget.managed=true;}
// v102, oblique: for a view into the outside world. Instead of a clipping plane (for which
// three.js compiles a second shader program for every material out there; the first look back
// at the house door froze the game for about ten seconds) the camera's near plane is laid
// into the opening (Eric Lengyel's oblique frustum, as in three.js' Reflector). The world is
// then drawn with the programs it already has.
function create(THREE,group,from,to,destination,{height=2.5,width=2.7,beforeRender,afterRender,isVisible,haze=0x6f705f,cheap,urgent,smooth=false,oblique=false}={}){
 // A hidden opening must not build its destination or allocate GPU buffers.
 let targetScene=typeof destination==='function'?null:destination;
 const getScene=()=>{if(!targetScene){const t=now();targetScene=destination();budget.spent+=now()-t+.01;}return targetScene;};
 let painted=false,hazeScene=null;const hazeColor=new THREE.Color(haze),savedClear=new THREE.Color();
 function canBuild(){if(targetScene||!budget.managed)return true;if(now()-budget.frame>250)beginFrame();
  // v91: an expensive destination (room not built yet) is requested from the background
  // builder instead; only the loading phase on entry may build it right away.
  if(cheap&&!cheap()){urgent?.();if((budget.limit||6)<40)return false;}
  return budget.spent<(budget.limit||6);}
 // v92: smooth views (the courtyard windows) are multisampled and rendered at full width.
 const Target=smooth&&THREE.WebGLMultisampleRenderTarget?THREE.WebGLMultisampleRenderTarget:THREE.WebGLRenderTarget,maxWidth=smooth?(typeof smooth==='number'?smooth:1600):900;
 const target=new Target(640,400,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});if(Target!==THREE.WebGLRenderTarget)target.samples=4;target.texture.encoding=THREE.sRGBEncoding;
 // The camera can approach closer than its 8 cm near plane before the feet
 // cross. Keep the portal at the near plane for those frames, preserving its
 // perspective UVs. Otherwise it vanishes and exposes the gray background.
 const material=new THREE.ShaderMaterial({uniforms:{view:{value:target.texture}},vertexShader:'varying vec4 projected;void main(){projected=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position=projected;gl_Position.z=max(gl_Position.z,-gl_Position.w+0.000001);}',fragmentShader:'uniform sampler2D view;varying vec4 projected;void main(){gl_FragColor=texture2D(view,projected.xy/projected.w*.5+.5);}',side:THREE.DoubleSide,toneMapped:false});
 const pane=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);pane.name='Open portal '+(from.id||'');pane.position.set(from.x,from.y+height/2,from.z);pane.rotation.y=Math.atan2(-from.nx,-from.nz);pane.frustumCulled=false;group.add(pane);
 // Clip the rectangle against the eye plane before projection. At an oblique
 // angle one corner can be behind the camera; clamping that corner alone
 // would cut a gray triangle through the otherwise visible opening.
 const corners=[[-width/2,-height/2],[width/2,-height/2],[width/2,height/2],[-width/2,height/2]],positions=new Float32Array(27),modelView=new THREE.Matrix4();
 pane.geometry.dispose();pane.geometry=new THREE.BufferGeometry();pane.geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
 function aperture(main){
  let polygon=corners;
  if(main){
   pane.updateWorldMatrix(true,false);modelView.multiplyMatrices(main.matrixWorldInverse,pane.matrixWorld);const e=modelView.elements,depth=p=>-(e[2]*p[0]+e[6]*p[1]+e[14])-.0001;
   polygon=[];
   for(let i=0;i<4;i++){
    const a=corners[i],b=corners[(i+1)%4],da=depth(a),db=depth(b);
    if(da>=0)polygon.push(a);
    if((da>=0)!==(db>=0)){const t=da/(da-db);polygon.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
   }
  }
  let count=0;for(let i=1;i<polygon.length-1;i++)for(const v of [polygon[0],polygon[i],polygon[i+1]]){positions[count++]=v[0];positions[count++]=v[1];positions[count++]=0;}
  pane.geometry.setDrawRange(0,count/3);pane.geometry.attributes.position.needsUpdate=true;pane.geometry.computeBoundingSphere();
 }
 aperture();
 const camera=new THREE.PerspectiveCamera(),turn=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle(from,to)),clip=new THREE.Plane(new THREE.Vector3(-to.nx,0,-to.nz),to.nx*to.x+to.nz*to.z+.006),size=new THREE.Vector2(),toward=new THREE.Vector3(),direction=new THREE.Vector3();const frustum=new THREE.Frustum(),viewProjection=new THREE.Matrix4(),bounds=new THREE.Sphere(new THREE.Vector3(),Math.hypot(width,height)/2);
 const projected=new THREE.Vector3(),nearPlane=new THREE.Plane(),nearClip=new THREE.Vector4(),corner=new THREE.Vector4();
 // Lays the near plane of `camera` into the opening; false when the eye is in the opening
 // (nothing lies between it and the plane then) or the plane is out of view.
 function obliqueNear(){
  nearPlane.copy(clip).applyMatrix4(camera.matrixWorldInverse);if(nearPlane.constant>-.02)return false;
  const e=camera.projectionMatrix.elements;nearClip.set(nearPlane.normal.x,nearPlane.normal.y,nearPlane.normal.z,nearPlane.constant);
  corner.set((Math.sign(nearClip.x)+e[8])/e[0],(Math.sign(nearClip.y)+e[9])/e[5],-1,(1+e[10])/e[14]);
  const d=nearClip.dot(corner);if(!(d>1e-6))return false;
  nearClip.multiplyScalar(2/d);e[2]=nearClip.x;e[6]=nearClip.y;e[10]=nearClip.z+1;e[14]=nearClip.w;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();return true;
 }
 function render(renderer,main,parentRect){
  main.updateMatrixWorld(true);
  const side=(main.position.x-from.x)*from.nx+(main.position.z-from.z)*from.nz;
  toward.copy(pane.position).sub(main.position);main.getWorldDirection(direction);
  viewProjection.multiplyMatrices(main.projectionMatrix,main.matrixWorldInverse);frustum.setFromProjectionMatrix(viewProjection);bounds.center.copy(pane.position);
  if(side>.15||toward.length()>70||!frustum.intersectsSphere(bounds))return;
  if(isVisible&&!isVisible(main))return;
  // Keep a finite projected area even on the exact crossing plane.
  const eyeGap=Math.max(0,side+.0002);pane.position.x=from.x+from.nx*eyeGap;pane.position.z=from.z+from.nz*eyeGap;
  aperture(main);
  // Child views may only contribute inside their parent's projected opening.
  // Using the whole camera frustum here rendered rooms behind solid walls.
  const rect={x0:1,y0:1,x1:0,y1:0};
  for(let i=0;i<pane.geometry.drawRange.count;i++){
   projected.fromBufferAttribute(pane.geometry.attributes.position,i).applyMatrix4(pane.matrixWorld).project(main);
   const x=projected.x*.5+.5,y=projected.y*.5+.5;
   rect.x0=Math.min(rect.x0,x);rect.y0=Math.min(rect.y0,y);rect.x1=Math.max(rect.x1,x);rect.y1=Math.max(rect.y1,y);
  }
  rect.x0=Math.max(parentRect?.x0||0,rect.x0);rect.y0=Math.max(parentRect?.y0||0,rect.y0);
  rect.x1=Math.min(parentRect?.x1??1,rect.x1);rect.y1=Math.min(parentRect?.y1??1,rect.y1);
  if(rect.x1<=rect.x0||rect.y1<=rect.y0)return;
  renderer.getDrawingBufferSize(size);const w=Math.min(maxWidth,size.x),h=Math.max(1,Math.round(w*size.y/size.x));if(target.width!==w||target.height!==h)target.setSize(w,h);
  const pos=map(from,to,{x:main.position.x,y:main.position.y,z:main.position.z});camera.position.set(pos.x,pos.y,pos.z);camera.quaternion.copy(main.quaternion).premultiply(turn);camera.projectionMatrix.copy(main.projectionMatrix);camera.projectionMatrixInverse.copy(main.projectionMatrixInverse);camera.updateMatrixWorld(true);
  if(!canBuild()){
   if(!painted&&renderer.getClearColor&&renderer.clear){const saved=renderer.getRenderTarget(),alpha=renderer.getClearAlpha();renderer.getClearColor(savedClear);renderer.setRenderTarget(target);renderer.setClearColor(hazeColor,1);renderer.clear(true,true,false);
    // v102: a multisampled target only reaches its texture through a render: draw an empty scene.
    if(Target!==THREE.WebGLRenderTarget){hazeScene=hazeScene||new THREE.Scene();hazeScene.background=hazeColor;renderer.render(hazeScene,camera);}
    renderer.setRenderTarget(saved);renderer.setClearColor(savedClear,alpha);painted=true;}
   return;
  }
  painted=true;const sc=getScene(),savedTarget=renderer.getRenderTarget(),planes=renderer.clippingPlanes;beforeRender?.();
  try{
   sc.userData.renderPortalViews?.(renderer,camera,rect);
   // Scissor the full-perspective target, keeping UVs and near-plane crossings
   // unchanged while shading only the pixels visible through the opening.
   const x=Math.max(0,Math.floor(rect.x0*w)-1),y=Math.max(0,Math.floor(rect.y0*h)-1);
   target.scissor.set(x,y,Math.min(w,Math.ceil(rect.x1*w)+1)-x,Math.min(h,Math.ceil(rect.y1*h)+1)-y);target.scissorTest=true;
   if(oblique)obliqueNear();else renderer.clippingPlanes=[clip];
   renderer.setRenderTarget(target);renderer.render(sc,camera);
  }finally{renderer.setRenderTarget(savedTarget);renderer.clippingPlanes=planes;afterRender?.();}
 }
 return{pane,from,to,get targetScene(){return getScene();},get ready(){return !!targetScene;},prepare(){if(!targetScene){if(!canBuild())return false;getScene();return true;}return targetScene.userData.prepareViews?.()||false;},render,dispose(){group.remove(pane);pane.geometry.dispose();target.dispose();
  // v102: the material is not disposed. Every doorway change disposed all panes at once, three.js
  // then deleted their shared shader program and compiled it again for the next room (15–30 ms).
  // An undisposed ShaderMaterial holds no GPU memory of its own.
 }};
}
function idle(){return budget.spent===0;}
window.NovaHousePortals={create,map,angle,beginFrame,idle};
})();
