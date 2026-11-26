// Prepare first-visit GPU resources while the loading menu still owns the screen.
window.NovaRenderWarmup={create(THREE,renderer){
 const jobs=[],textures=new Set(),target=new THREE.WebGLRenderTarget(4,4);
 target.texture.encoding=renderer.outputEncoding;
 function offscreen(draw){
  const previous=renderer.getRenderTarget(),shadow=renderer.shadowMap.needsUpdate;
  try{renderer.setRenderTarget(target);draw();}
  finally{renderer.setRenderTarget(previous);renderer.shadowMap.needsUpdate=shadow;}
 }
 function texture(t){
  if(!t?.isTexture||t.isCubeTexture||t.isDepthTexture||!t.image||textures.has(t))return;
  textures.add(t);jobs.push(()=>renderer.initTexture?.(t));
 }
 function material(m){
  if(!m)return;
  for(const v of Object.values(m))if(v?.isTexture)texture(v);
  for(const u of Object.values(m.uniforms||{}))for(const v of [].concat(u.value||[]))texture(v);
 }
 // compile:false skips renderer.compile(). It builds its programs for the clipping state of
 // whatever was rendered last, so a scene that sets its own (the night house) would get a
 // second, unused set of programs from it; the full render below compiles the right ones.
 function visit(scene,camera,roots=[scene],{compile=true}={}){
  for(const root of roots)root.traverse(o=>{for(const m of [].concat(o.material||[]))material(m);});
  // compile() includes culled meshes, but does not upload their textures/geometry.
  if(compile)jobs.push(()=>offscreen(()=>renderer.compile?.(scene,camera)));
  jobs.push(()=>offscreen(()=>{
   const saved=[];
   try{
    for(const root of roots)root.traverse(o=>{
     saved.push([o,o.visible,o.frustumCulled]);
     if(!o.isLight)o.visible=true;
     if(o.isMesh||o.isPoints||o.isLine)o.frustumCulled=false;
    });
    renderer.render(scene,camera);
   }finally{for(const [o,visible,culled]of saved){o.visible=visible;o.frustumCulled=culled;}}
  }));
 }
 function draw(fn){jobs.push(()=>offscreen(fn));}
 function run(done,progress=()=>{},failed=console.error){
  let index=0;
  function next(){
   try{
    if(index===jobs.length){target.dispose();done();return;}
    jobs[index++]();progress(index,jobs.length);
    // Yield between uploads/scene passes so the menu can paint its progress.
    setTimeout(next,0);
   }catch(error){target.dispose();failed(error);}
  }
  setTimeout(next,0);
 }
 return{visit,draw,run};
}};
