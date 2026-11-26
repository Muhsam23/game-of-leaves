/* Real photographic bark, long source strips, nonperiodic cylindrical sampling.
   The source photographs and crop rectangles are documented in bark-sources.js. */
(() => {
 'use strict';
 const specs = {
  'pinus-sylvestris': {width:.90,height:1.25,relief:.019,radius:.023,flare:1.50},
  'picea-abies': {width:.78,height:1.12,relief:.013,radius:.023,flare:1.42},
  'betula-pendula': {width:.65,height:1.22,relief:.006,radius:.015,flare:1.45},
  'betula-pubescens': {width:.70,height:1.16,relief:.004,radius:.015,flare:1.38},
  'populus-tremula': {width:.72,height:1.18,relief:.004,radius:.015,flare:1.40},
  'salix-caprea': {width:.82,height:1.10,relief:.014,radius:.015,flare:1.48},
  'sorbus-aucuparia': {width:.64,height:1.04,relief:.004,radius:.015,flare:1.34}
 };
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 for(const source of window.NOVA_BARK_SOURCES){if(specs[source.id]&&source.cropAspect)specs[source.id].height=specs[source.id].width*source.cropAspect*.42;}
 for(const cfg of Object.values(specs))cfg.wrap=Math.max(2,Math.round(2*Math.PI*cfg.radius*18/cfg.width));
 // Four broad overlapping photographic strips. Each strip retains the original
 // orientation and proportions. Their offsets depend on the actual tree and
 // angular/height cell; neither the image nor its conspicuous knots repeat with
 // a fixed vertical period. Smooth irregular boundaries avoid horizontal bands.
 const sampleGLSL=`
 varying float vNovaBarkSeed;
 uniform float novaBarkWrap;
 float novaBarkSeed(){return floor(vNovaBarkSeed*16.+.5);}
 vec2 novaBarkHash(vec2 p){
  p.x=mod(p.x,novaBarkWrap);
  return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)))+novaBarkSeed())*43758.5453);
 }
 vec4 novaBarkPatch(sampler2D tex,vec2 uv,vec2 cell,vec2 gradientX,vec2 gradientY){
  vec2 h=novaBarkHash(cell);
  // Independent full-image phases, rather than recentering the same knot in
  // every blend region. Photograph grain keeps its vertical direction.
  vec2 at=vec2(uv.x+h.x*5.73,uv.y*.42+h.y*11.17);
  // Hash offsets jump at patch borders. Implicit derivatives would interpret
  // that jump as extreme minification and draw a thin line of the coarsest mip.
  #ifdef TEXTURE_LOD_EXT
   return texture2DGradEXT(tex,at,gradientX,gradientY);
  #else
   // Legacy WebGL1 without explicit gradients uses non-mipmapped bilinear maps.
   return texture2D(tex,at);
  #endif
 }
 vec4 novaBarkSampleGrad(sampler2D tex,vec2 uv,vec2 uvDx,vec2 uvDy){
  vec2 gradientX=uvDx*vec2(1.,.42),gradientY=uvDy*vec2(1.,.42);
  float seed=novaBarkSeed();
  vec2 p=uv+vec2(seed*.073,seed*.117);
  vec2 cell=floor(p),f=fract(p);
  // Small boundary undulations change the join, never the bark grain itself.
  float wave=sin(p.x*6.28318530718/novaBarkWrap+seed)*.065;
  vec2 weight=vec2(smoothstep(.20,.80,f.x),smoothstep(.20+wave,.80+wave,f.y));
  #ifdef TEXTURE_LOD_EXT
   // Most of each cell lies outside the blend bands, where a strip has zero
   // weight. Skipping those lookups is exact: mix(x,y,0.)==x and mix(x,y,1.)==y.
   // Explicit gradients keep the sampling valid inside these branches.
   vec4 top=vec4(0.),bottom=vec4(0.);
   if(weight.y<1.){
    vec4 a=weight.x<1.?novaBarkPatch(tex,p,cell,gradientX,gradientY):vec4(0.);
    vec4 b=weight.x>0.?novaBarkPatch(tex,p,cell+vec2(1.,0.),gradientX,gradientY):vec4(0.);
    top=mix(a,b,weight.x);
   }
   if(weight.y>0.){
    vec4 c=weight.x<1.?novaBarkPatch(tex,p,cell+vec2(0.,1.),gradientX,gradientY):vec4(0.);
    vec4 d=weight.x>0.?novaBarkPatch(tex,p,cell+vec2(1.,1.),gradientX,gradientY):vec4(0.);
    bottom=mix(c,d,weight.x);
   }
   return mix(top,bottom,weight.y);
  #else
   vec4 a=novaBarkPatch(tex,p,cell,gradientX,gradientY);
   vec4 b=novaBarkPatch(tex,p,cell+vec2(1.,0.),gradientX,gradientY);
   vec4 c=novaBarkPatch(tex,p,cell+vec2(0.,1.),gradientX,gradientY);
   vec4 d=novaBarkPatch(tex,p,cell+vec2(1.,1.),gradientX,gradientY);
   return mix(mix(a,b,weight.x),mix(c,d,weight.x),weight.y);
  #endif
 }
 vec4 novaBarkSample(sampler2D tex,vec2 uv){
  return novaBarkSampleGrad(tex,uv,dFdx(uv),dFdy(uv));
 }
 `;
 function photoTile(img,crop,id) {
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=2048;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const [x,y,w,h]=crop||[0,0,1,1];
  ctx.drawImage(img,x*img.width,y*img.height,w*img.width,h*img.height,0,0,512,2048);
  // Prepare unobtrusive source edges for phase-shifted sampling. The material
  // combines independently offset long strips rather than tiling this image
  // at a fixed vertical interval across the trunk.
  const pixels=ctx.getImageData(0,0,512,2048),a=pixels.data;
  const columns=new Float32Array(512);let total=0;
  for(let yy=0;yy<2048;yy++)for(let xx=0;xx<512;xx++){const i=(yy*512+xx)*4,l=a[i]*.2126+a[i+1]*.7152+a[i+2]*.0722;columns[xx]+=l/2048;total+=l/(512*2048);}
  for(let xx=0;xx<512;xx++){let sum=0,n=0;for(let dx=-72;dx<=72;dx++){const k=clamp(xx+dx,0,511);sum+=columns[k];n++;}const gain=clamp(Math.pow(total/Math.max(1,sum/n),.48),.82,1.18);for(let yy=0;yy<2048;yy++){const i=(yy*512+xx)*4;a[i]*=gain;a[i+1]*=gain;a[i+2]*=gain;}}
  const copy=new Uint8ClampedArray(a);
  const blend=(p,q,t)=>{for(let c=0;c<3;c++){const avg=(copy[p+c]+copy[q+c])*.5;a[p+c]=copy[p+c]*(1-t)+avg*t;a[q+c]=copy[q+c]*(1-t)+avg*t;}};
  for(let yy=0;yy<2048;yy++)for(let xx=0;xx<32;xx++)blend((yy*512+xx)*4,(yy*512+511-xx)*4,Math.pow(1-xx/32,1.5));
  copy.set(a);
  for(let yy=0;yy<64;yy++)for(let xx=0;xx<512;xx++)blend((yy*512+xx)*4,((2047-yy)*512+xx)*4,Math.pow(1-yy/64,1.5));
  ctx.putImageData(pixels,0,0);return canvas;
 }
 function createMaterials(THREE,manager,anisotropy=8,supportsTextureGrad=true) {
  const out=new Map(),loader=new THREE.ImageLoader(manager);
  for(const s of window.NOVA_BARK_SOURCES){
   const cfg=specs[s.id];if(!cfg)continue;
   const map=new THREE.Texture(),bump=new THREE.Texture();
   for(const t of [map,bump]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=supportsTextureGrad?anisotropy:1;t.generateMipmaps=supportsTextureGrad;t.minFilter=supportsTextureGrad?THREE.LinearMipmapLinearFilter:THREE.LinearFilter;t.magFilter=THREE.LinearFilter;}
   map.encoding=THREE.sRGBEncoding;
   const material=new THREE.MeshStandardMaterial({map,bumpMap:bump,bumpScale:cfg.relief,roughness:1,metalness:0,vertexColors:true});
   material.extensions={derivatives:true,shaderTextureLOD:supportsTextureGrad};
   material.onBeforeCompile=shader=>{
    shader.uniforms.novaBarkWrap={value:cfg.wrap};
    shader.vertexShader='varying float vNovaBarkSeed;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
     vNovaBarkSeed=0.;
     #ifdef USE_INSTANCING
      vNovaBarkSeed=dot(instanceMatrix[3].xz,vec2(.127,.311));
     #endif
    `);
    shader.fragmentShader=sampleGLSL+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',THREE.ShaderChunk.map_fragment.replace('texture2D( map, vUv )','novaBarkSample( map, vUv )'));
    // All three height samples share the original surface gradients. Deriving
    // them again from the offset samples can produce second-derivative artifacts.
    const bumpChunk=THREE.ShaderChunk.bumpmap_pars_fragment
     .replace('texture2D( bumpMap, vUv )','novaBarkSampleGrad( bumpMap, vUv, dSTdx, dSTdy )')
     .replace('texture2D( bumpMap, vUv + dSTdx )','novaBarkSampleGrad( bumpMap, vUv + dSTdx, dSTdx, dSTdy )')
     .replace('texture2D( bumpMap, vUv + dSTdy )','novaBarkSampleGrad( bumpMap, vUv + dSTdy, dSTdx, dSTdy )');
    shader.fragmentShader=shader.fragmentShader.replace('#include <bumpmap_pars_fragment>',bumpChunk);
   };
   material.customProgramCacheKey=()=> 'nova-bark-stable-gradients-4-'+supportsTextureGrad;
   material.name='Fotoborke: '+s.id;material.userData={species:s.id,photo:true,source:s.source,license:s.license};
   out.set(s.id,material);
   loader.load(s.path,img=>{
    map.image=photoTile(img,s.crop,s.id);map.needsUpdate=true;
    const c=document.createElement('canvas');c.width=512;c.height=2048;
    const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(map.image,0,0);
    const px=cx.getImageData(0,0,512,2048),a=px.data;
    // Restrained luminance relief: fine surface response, no silhouette displacement.
    for(let i=0;i<a.length;i+=4){const v=Math.round(a[i]*.2126+a[i+1]*.7152+a[i+2]*.0722);a[i]=a[i+1]=a[i+2]=v;}
    cx.putImageData(px,0,0);bump.image=c;bump.needsUpdate=true;
   });
  }
  return out;
 }
 function stemGeometry(THREE,id,lean,far=false){
  const cfg=specs[id],sides=far?8:14,levels=far?[-.022,0,.035,.15,.38,.76,1]:[-.022,0,.013,.035,.075,.14,.24,.38,.55,.76,.90,1];
  const verts=[],uvs=[],colors=[],indices=[];
  for(let j=0;j<levels.length;j++){
   const y=levels[j],f=Math.max(y,0),r=f<=.76?cfg.radius+(.008-cfg.radius)*f/.76:.008-.007*(f-.76)/.24;
   const cx=f<=.76?lean*f/.76:lean*(1+.5*(f-.76)/.24);
   const flare=Math.exp(-f*48)*(cfg.flare-1),baseShade=.85+.15*Math.min(1,f/.10);
   for(let k=0;k<=sides;k++){
    const a=k/sides*Math.PI*2,groove=1+Math.sin(a*5+.4)*.035+Math.sin(a*3+y*3)*.028;
    const buttress=flare*(.73+.27*Math.cos(a*4+.3)),rr=r*(1+buttress)*groove;
    verts.push(cx+Math.sin(a)*rr,y,Math.cos(a)*rr);
    // Physical scale based on the reference 18 m tree, continuous between all rings.
    uvs.push(k/sides*cfg.wrap,y*18/cfg.height);
    colors.push(baseShade,baseShade,baseShade);
    if(j<levels.length-1&&k<sides){const i=j*(sides+1)+k,n=i+sides+1;indices.push(i,i+1,n,i+1,n+1,n);}
   }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
  // Weld the lighting across the duplicated U seam, retaining distinct UVs.
  const normals=g.attributes.normal;
  for(let j=0;j<levels.length;j++){const a=j*(sides+1),b=a+sides,n=new THREE.Vector3(normals.getX(a)+normals.getX(b),normals.getY(a)+normals.getY(b),normals.getZ(a)+normals.getZ(b)).normalize();normals.setXYZ(a,n.x,n.y,n.z);normals.setXYZ(b,n.x,n.y,n.z);}
  g.userData={species:id,part:'stem',rings:levels.length,radialSegments:sides};return g;
 }
 function branchGeometry(THREE,id,a,c,r0,r1,far=false){
  const cfg=specs[id],from=new THREE.Vector3(...a),to=new THREE.Vector3(...c),v=to.clone().sub(from),len=v.length();
  const g=new THREE.CylinderGeometry(r1,r0,len,far?5:7,1,true),uv=g.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*cfg.wrap,uv.getY(i)*len*18/cfg.height+a[1]*18/cfg.height);
  g.applyMatrix4(new THREE.Matrix4().compose(from.add(to).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()),new THREE.Vector3(1,1,1)));return g;
 }
 window.NovaBark={specs,createMaterials,stemGeometry,branchGeometry,photoTile,sampleGLSL};
})();
