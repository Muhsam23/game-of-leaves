/* Unreal Nova 2000 | EyeRooms v2 | Three.js r128+
   Standalone scene module. No UI, controls, renderer or animation loop ownership.
   Supplied photograph pixels are sampled at runtime; no generated substitute art. */
(function(root){
'use strict';
const mod=(n,m)=>((n%m)+m)%m;
const SPECS={
  lane:{id:'lane',title:'Der Weg',image:'barn',horizon:416/767,cx:374/767,fx:.75,fy:.75,eye:1.65,
    floorPeriodX:5.4,floorPeriodZ:6.2,ceiling:10.5,sky:0x507ca3,fence:true},
  field:{id:'field',title:'Das Feld',image:'field',horizon:550/1080,cx:650/1300,fx:650/1300,fy:650/1080,eye:1.65,
    floorPeriodX:1.7,floorPeriodZ:4,ceiling:12,sky:0x468bb8,fence:false}
};
function create({THREE,images,kind='lane',anisotropy=4,onExit=()=>{}}){
 if(!THREE||!images?.barn||!images?.field)throw Error('EyeRooms requires THREE and decoded barn/field images.');
 const scene=new THREE.Scene(),group=new THREE.Group();scene.add(group);
 const resources=new Set();
 let spec,active=false,disposed=false,lastX=0,lastZ=0,total=0,originX=0,originZ=0,initial=null,rebaseX=0,rebaseZ=0,exitOffset=.5;
 const v3=new THREE.Vector3(),matrix=new THREE.Matrix4();
 function own(r){resources.add(r);return r}
 function texture(img){const t=own(new THREE.Texture(img));t.needsUpdate=true;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;return t}
 function canvasTexture(c){const t=own(new THREE.CanvasTexture(c));t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=anisotropy;return t}
 function sampleTile(photo,s){
   const c=document.createElement('canvas');c.width=512;c.height=512;
   const source=document.createElement('canvas');source.width=photo.width;source.height=photo.height;
   const ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(photo,0,0);
   const data=ctx.getImageData(0,0,source.width,source.height).data;
   const out=c.getContext('2d').createImageData(512,512);
   const sample=(x,y,k)=>data[((Math.max(0,Math.min(source.height-1,y))|0)*source.width+(Math.max(0,Math.min(source.width-1,x))|0))*4+k];
   for(let y=0;y<512;y++)for(let x=0;x<512;x++){
     let px,py;
     if(s.id==='lane'){
       // Actual grass from between the fences, away from white rails and shadows.
       px=(.433+.122*x/511)*source.width;py=(.812+.175*y/511)*source.height;
     }else{
       // Inverse pinhole projection: straighten the ORIGINAL photographed field rows.
       const wx=(x/511-.5)*1.7,depth=2.9+(y/511)*4;
       px=(s.cx+s.fx*wx/depth)*source.width;
       py=(s.horizon+s.fy*s.eye/depth)*source.height;
     }
     for(let k=0;k<3;k++)out.data[(y*512+x)*4+k]=sample(px,py,k);
     out.data[(y*512+x)*4+3]=255;
   }
   // Periodic crossfade only at tile margins. No artificial replacement texture.
   const raw=new Uint8ClampedArray(out.data),edge=32;
   for(let y=0;y<512;y++)for(let x=0;x<512;x++){
     const bx=Math.min(x,511-x),by=Math.min(y,511-y);
     for(let k=0;k<3;k++){
       const i=(y*512+x)*4+k;
       let col=raw[i];
       if(bx<edge){const t=.5*(1-bx/edge);col=col*(1-t)+raw[(y*512+(511-x))*4+k]*t}
       if(by<edge){const t=.5*(1-by/edge);let opp=raw[((511-y)*512+x)*4+k];if(bx<edge){const u=.5*(1-bx/edge);opp=opp*(1-u)+raw[((511-y)*512+(511-x))*4+k]*u}col=col*(1-t)+opp*t}
       out.data[i]=col;
     }
   }
   c.getContext('2d').putImageData(out,0,0);return canvasTexture(c);
 }
 const photoTextures={barn:texture(images.barn),field:texture(images.field)};
 const floorTextures={lane:sampleTile(images.barn,SPECS.lane),field:sampleTile(images.field,SPECS.field)};
 function shader(uniforms,fragment,options={}){
   const m=own(new THREE.ShaderMaterial({uniforms,vertexShader:`varying vec3 localPoint;varying vec3 worldPoint;varying vec2 texUV;
   void main(){localPoint=position;texUV=uv;vec4 w=modelMatrix*vec4(position,1.);worldPoint=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
   fragmentShader:fragment,side:THREE.DoubleSide,toneMapped:false,...options}));return m;
 }
 const backdrop=shader({photo:{value:null},eye:{value:new THREE.Vector3()},center:{value:0},horizon:{value:0},focal:{value:new THREE.Vector2()},circular:{value:0}},`
 precision highp float;
 uniform sampler2D photo;uniform vec3 eye;uniform float center,horizon,circular;uniform vec2 focal;
 varying vec3 worldPoint;
 vec3 pic(vec2 p){return texture2D(photo,vec2(p.x,1.-p.y)).rgb;}
 void main(){
   vec3 d=normalize(worldPoint-eye);
   float a=atan(d.x,-d.z);
   float v=clamp(horizon-d.y/max(.12,length(d.xz))*focal.y,.08,.91);
   float u=center+tan(clamp(a,-1.15,1.15))*focal.x;
   float sideU=(a<0.?.18:.82)+.07*sin(a*6.);
   float limit=.485;
   if(circular>.5){float dy=(v-.498)*1080.;limit=sqrt(max(1.,475.*475.-dy*dy))/1300.-.012;}
   sideU=clamp(sideU,.5-limit,.5+limit);
   vec3 extension=pic(vec2(sideU,v));
   vec3 central=pic(vec2(clamp(u,.5-limit,.5+limit),v));
   float photoWeight=smoothstep(.5-limit+.015,.5-limit+.13,u)*(1.-smoothstep(.5+limit-.13,.5+limit-.015,u));
   photoWeight*=1.-smoothstep(.8,1.15,abs(a));
   vec3 col=mix(extension,central,photoWeight);
   gl_FragColor=vec4(col,1.);
 }`,{depthWrite:false});
 const dome=new THREE.Mesh(own(new THREE.SphereGeometry(800,48,24)),backdrop);dome.frustumCulled=false;dome.renderOrder=-10;group.add(dome);
 const ground=shader({map:{value:null},eye:{value:new THREE.Vector3()},offset:{value:new THREE.Vector2()},period:{value:new THREE.Vector2()},isField:{value:0}},`
 precision highp float;uniform sampler2D map;uniform vec3 eye;uniform vec2 offset,period;uniform float isField;
 varying vec3 localPoint,worldPoint;
 void main(){
   vec2 q=localPoint.xz+offset;
   vec2 uv=vec2(q.x/period.x,-q.y/period.y);
   vec3 color=texture2D(map,uv).rgb;
   float distanceToEye=length(worldPoint.xz-eye.xz);
   // Photo target supplies the distant landscape; real floor supplies optical flow nearby.
   float alpha=1.-smoothstep(19.,92.,distanceToEye);
   gl_FragColor=vec4(color,alpha);
 }`,{transparent:true,depthWrite:false});
 const floor=new THREE.Mesh(own(new THREE.PlaneGeometry(1800,1800).rotateX(-Math.PI/2)),ground);floor.renderOrder=0;floor.frustumCulled=false;group.add(floor);
 const ceiling=shader({offset:{value:new THREE.Vector2()},kind:{value:0}},`
 precision highp float;uniform vec2 offset;uniform float kind;varying vec3 localPoint;
 void main(){vec2 p=localPoint.xz+offset;vec2 tile=abs(fract(p/2.4)-.5);float line=smoothstep(.473,.493,max(tile.x,tile.y));line*=1.-smoothstep(25.,70.,length(localPoint.xz));
 vec3 c=mix(vec3(.52,.61,.64),vec3(.28,.36,.40),line*.36);
 if(kind<.5)c=mix(vec3(.57,.68,.77),vec3(.51,.61,.70),line*.18);
 gl_FragColor=vec4(c,1.);}`);
 const shell=new THREE.Group();group.add(shell);
 const sideMaterial=backdrop.clone();sideMaterial.uniforms=backdrop.uniforms;sideMaterial.depthWrite=true;own(sideMaterial);
 for(const side of [-1,1]){
   const wallMesh=new THREE.Mesh(own(new THREE.PlaneGeometry(110,12)),sideMaterial);wallMesh.rotation.y=Math.PI/2;wallMesh.position.set(side*32,6,0);shell.add(wallMesh);
 }
 const roof=new THREE.Mesh(own(new THREE.PlaneGeometry(64,110).rotateX(Math.PI/2)),ceiling);group.add(roof);
 const lampMat=own(new THREE.MeshBasicMaterial({color:0xfff4d3,toneMapped:false}));
 const lampGeo=own(new THREE.BoxGeometry(1.6,.06,.85));
 const lamps=new THREE.InstancedMesh(lampGeo,lampMat,35);lamps.frustumCulled=false;group.add(lamps);
 const trim=own(new THREE.MeshBasicMaterial({color:0xc9c5ad,toneMapped:false}));
 const door=new THREE.Group();group.add(door);
 function box(g,w,h,d,x,y,z,m){const o=new THREE.Mesh(own(new THREE.BoxGeometry(w,h,d)),m);o.position.set(x,y,z);g.add(o);return o}
 const molding=new THREE.Group();shell.add(molding);
 for(const side of [-1,1]){
   box(molding,.11,.14,110,side*31.94,11.93,0,trim);
   box(molding,.09,12,.09,side*31.95,6,-54.96,trim);
 }
 box(molding,64,.12,.09,0,11.93,-54.96,trim);
 const dark=own(new THREE.MeshBasicMaterial({color:0x222722,toneMapped:false}));
 const wall=own(new THREE.MeshBasicMaterial({color:0x777761,toneMapped:false}));
 box(door,.19,3.5,.5,-1.21,1.75,0,trim);box(door,.19,3.5,.5,1.21,1.75,0,trim);box(door,2.6,.18,.5,0,3.5,0,trim);
 box(door,2.25,3.4,.07,0,1.7,3.1,dark);box(door,.1,3.4,3,-1.16,1.7,1.5,wall);box(door,.1,3.4,3,1.16,1.7,1.5,wall);
 box(door,2.3,.08,3,0,0,1.5,wall);box(door,2.3,.08,3,0,3.4,1.5,wall);door.position.z=5;
 const fenceMaterial=shader({eye:{value:new THREE.Vector3()}},`
 precision highp float;uniform vec3 eye;varying vec3 worldPoint;varying vec2 texUV;varying vec3 faceNormal;
 void main(){float a=1.-smoothstep(21.,78.,length(worldPoint.xz-eye.xz));
 float grain=sin(worldPoint.y*41.+worldPoint.z*2.)*.012;
 float light=.76+.24*max(0.,dot(normalize(faceNormal),normalize(vec3(-.6,.8,.35))));gl_FragColor=vec4((vec3(.95,.93,.78)+grain)*light,a);}`,{transparent:true,depthWrite:true});
 // Instance transforms must be applied in the vertex shader for r128.
 fenceMaterial.vertexShader=`varying vec3 faceNormal;varying vec3 localPoint;varying vec3 worldPoint;varying vec2 texUV;void main(){faceNormal=mat3(modelMatrix)*normal;localPoint=position;texUV=uv;vec4 p=vec4(position,1.);
 #ifdef USE_INSTANCING
 p=instanceMatrix*p;
 #endif
 vec4 w=modelMatrix*p;worldPoint=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
 const postGeo=own(new THREE.BoxGeometry(.16,1.27,.16)),railGeo=own(new THREE.BoxGeometry(.10,.17,3.2));
 const posts=new THREE.InstancedMesh(postGeo,fenceMaterial,104),rails=new THREE.InstancedMesh(railGeo,fenceMaterial,208);
 posts.frustumCulled=rails.frustumCulled=false;posts.renderOrder=rails.renderOrder=2;group.add(posts,rails);
 function setKind(id){
   if(!SPECS[id])throw Error('Unknown eye room: '+id);
   spec=SPECS[id];backdrop.uniforms.photo.value=photoTextures[spec.image];backdrop.uniforms.center.value=spec.cx;
   backdrop.uniforms.horizon.value=spec.horizon;backdrop.uniforms.focal.value.set(spec.fx,spec.fy);backdrop.uniforms.circular.value=spec.id==='field'?1:0;
   ground.uniforms.map.value=floorTextures[id];ground.uniforms.period.value.set(spec.floorPeriodX,spec.floorPeriodZ);
   ground.uniforms.isField.value=id==='field'?1:0;roof.position.y=spec.ceiling;ceiling.uniforms.kind.value=id==='field'?1:0;
   shell.scale.y=spec.ceiling/12;posts.visible=rails.visible=spec.fence;scene.background=new THREE.Color(spec.sky);
 }
 function enter(camera,{kind:next=kind,position=[0,1.65,0],rotation=[0,0,0],entryDoor=null,exitAt=.5}={}){
   if(disposed)throw Error('EyeRoom was disposed');setKind(next);initial={position:camera.position.clone(),quaternion:camera.quaternion.clone(),fov:camera.fov};
   camera.position.fromArray(position);camera.rotation.set(...rotation);camera.updateMatrixWorld(true);
   originX=entryDoor?entryDoor[0]:position[0];originZ=entryDoor?entryDoor[2]-5:position[2];exitOffset=exitAt;door.position.set(originX,entryDoor?entryDoor[1]:position[1]-spec.eye,originZ+5);
   total=0;rebaseX=0;rebaseZ=0;lastX=position[0];lastZ=position[2];active=true;update(camera,0);return api;
 }
 function update(camera,dt){
   if(!active||disposed)return;
   let x=camera.position.x,z=camera.position.z;const y=camera.position.y;
   total+=Math.hypot(x-lastX,z-lastZ);
   // Keep GPU coordinates small on arbitrarily long journeys.
   if(Math.max(Math.abs(x),Math.abs(z))>2048){
     const sx=Math.trunc(x/1024)*1024,sz=Math.trunc(z/1024)*1024;
     x-=sx;z-=sz;camera.position.x=x;camera.position.z=z;
     originX-=sx;originZ-=sz;door.position.x-=sx;door.position.z-=sz;rebaseX+=sx;rebaseZ+=sz;
   }
   lastX=x;lastZ=z;
   const baseY=door.position.y;
   dome.position.set(x,y,z);backdrop.uniforms.eye.value.copy(camera.position);
   floor.position.set(x,baseY,z);ground.uniforms.eye.value.copy(camera.position);
   ground.uniforms.offset.value.set(mod(x-originX,spec.floorPeriodX),mod(z-originZ,spec.floorPeriodZ));
   roof.position.set(x,baseY+spec.ceiling,z);shell.position.set(x,baseY,z);ceiling.uniforms.offset.value.set(mod(x-originX,2.4),mod(z-originZ,2.4));
   fenceMaterial.uniforms.eye.value.copy(camera.position);
   const bz=Math.floor((z-originZ)/3.2);let j=0,r=0;
   for(let side of [-1,1])for(let k=-26;k<26;k++){
     const fz=originZ+(bz+k)*3.2,fx=originX+side*3.55;
     matrix.makeTranslation(fx,baseY+.635,fz);posts.setMatrixAt(j++,matrix);
     for(const h of [.40,.94]){matrix.makeTranslation(fx,baseY+h,fz+1.6);rails.setMatrixAt(r++,matrix)}
   }
   posts.instanceMatrix.needsUpdate=rails.instanceMatrix.needsUpdate=true;
   let n=0;const gx=Math.floor((x-originX)/12),gz=Math.floor((z-originZ)/14);
   for(let a=-2;a<=2;a++)for(let b=-3;b<=3;b++){
     const lx=originX+(gx+a)*12,lz=originZ+(gz+b)*14;if(Math.abs(lx-x)>31||Math.abs(lz-z)>54)continue;matrix.makeTranslation(lx,baseY+spec.ceiling-.035,lz);lamps.setMatrixAt(n++,matrix);
   }
   lamps.count=n;lamps.instanceMatrix.needsUpdate=true;
   if(Math.abs(x-door.position.x)<.96&&z>door.position.z+exitOffset&&z<door.position.z+2.8){active=false;onExit(api)}
 }
 function leave(camera,{restore=true}={}){active=false;if(restore&&initial){camera.position.copy(initial.position);camera.quaternion.copy(initial.quaternion);camera.fov=initial.fov;camera.updateProjectionMatrix()}return initial}
 function resolveMovement(from,to){
   const y=door.position.y+spec.eye;to.y=y;
   // Rails are real obstacles; this preserves the walkway and prevents clipping.
   if(spec.fence){
     for(const side of [-1,1]){const fx=originX+side*3.55;
       if((from.x-fx)*(to.x-fx)<=0||Math.abs(to.x-fx)<.28)to.x=fx+(from.x<fx?-.28:.28);
     }
   }
   // Do not walk through the little return doorway's side walls.
   if(to.z>door.position.z-.3&&to.z<door.position.z+3.2&&Math.abs(to.x-door.position.x)<1.5){
     const rel=to.x-door.position.x;
     if(Math.abs(rel)>1)to.x=door.position.x+Math.sign(rel)*1;
   }
   return to;
 }
 function dispose(){if(disposed)return;active=false;disposed=true;resources.forEach(r=>r.dispose?.());scene.clear();resources.clear()}
 const api={scene,enter,update,leave,resolveMovement,dispose,get kind(){return spec.id},get active(){return active},get distance(){return total},
  getState(){return{kind:spec.id,active,walked:total,position:[lastX+rebaseX,lastZ+rebaseZ],localPosition:[lastX,lastZ],texturePhase:ground.uniforms.offset.value.toArray(),objects:scene.children[0]?.children.length||0,houseAngularSizeConstant:true}},
  // Host should put the entry at a procedural doorway, then switch to this virtual scene.
  floorY(){return door.position.y},entryPoint(){return door.position.clone()},specs:SPECS};
 setKind(kind);return api;
}
root.EyeRooms={version:'2.0.0',create,specs:SPECS};
})(typeof window!=='undefined'?window:globalThis);
