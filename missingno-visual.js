// Exact silhouette, crawling and optics from approved sandbox v12.
window.NovaMissingNoVisual={create({THREE,images:IMG,corpora}){
const drawSize=new THREE.Vector2();
const PI=Math.PI,cv=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;if(draw)draw(c.getContext('2d'),w,h);return c;},mulberry=NovaEncounter.seeded,digits=new NovaEncounter.DigitBag(),markov=new NovaEncounter.Markov(corpora);
let mn=null,sim=null,psilo=null,focus=null,post=null;const mnVisuals=new Set();
function makeMissingNo() {
  const ent = new THREE.Group(); ent.name = 'MissingNo'; 
  const tc = cv(512, 1024), base = cv(512, 1024, (g) => {
    const rnd = mulberry(4242), rr = (a, b) => a + rnd() * (b - a), ch = (a) => a[Math.floor(rnd() * a.length)];
    g.fillStyle = '#aaa997'; g.fillRect(0, 0, 512, 1024);
    const srcs = ['moss.webp', 'ruin.jpg', 'bark.jpg', 'rust.webp'].map((n) => IMG[n]).filter(Boolean);
    for (let i = 0; i < 1600; i++) {
      const x = rr(0, 512), y = rr(0, 1024), w = rr(2, 58), h = rr(1, 19);
      if (i % 8 === 0 && srcs.length) g.drawImage(ch(srcs), 0, 0, 180, 90, x, y, w, h * 3);
      else { g.fillStyle = ch(['#1c2824', '#ddd9ba', '#7f8b77', '#b8a3ab', '#343b3b', '#a7aea5', '#e2ddd0', '#574e57']); g.fillRect(x, y, w, h); }
    }
    g.font = '11px monospace'; for (let i = 0; i < 320; i++) { g.fillStyle = i % 3 ? '#101918' : '#e5dfc8'; g.fillText(digits.string(Math.floor(rr(2, 8))), rr(0, 495), rr(0, 1024)); }
  });
  const tex = new THREE.CanvasTexture(tc); tex.encoding = THREE.sRGBEncoding; tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const shape = new THREE.Shape(); shape.moveTo(-1.02, .06); shape.lineTo(1.02, .06); shape.lineTo(1.02, 3.24); shape.lineTo(-.59, 3.24); shape.lineTo(-.59, 2.81); shape.lineTo(-.12, 2.81); shape.lineTo(-.12, 1.07); shape.lineTo(-1.02, 1.07); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: .36, bevelEnabled: false, steps: 1 }); geo.translate(0, 0, -.18);
  const pos = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + 1.02) / 2.04, pos.getY(i) / 3.24);
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, alphaTest: .12, color: 0xe2dfd3 }); mat.userData.novaNoPattern = true;
  ent.add(new THREE.Mesh(geo, mat));
  const bands = [], rnd = mulberry(99);
  for (let i = 0; i < 15; i++) {
    const y = .16 + i * .205, left = y < 1.07 ? -1.02 : y > 2.81 ? -.59 : -.12, width = 1.02 - left;
    const gb = new THREE.PlaneGeometry(width, .022 + rnd() * .053), ub = gb.attributes.uv;
    for (let j = 0; j < ub.count; j++) ub.setXY(j, (left + 1.02 + ub.getX(j) * width) / 2.04, (y + (ub.getY(j) - .5) * .06) / 3.24);
    const m = new THREE.Mesh(gb, mat); m.position.set(left + width / 2, y, .187 + i * .001); ent.add(m); bands.push({ mesh: m, x: m.position.x });
  }
  mn = { ent, tc, base, tex, geo, rest: geo.attributes.position.array.slice(), bands };
  mnVisuals.add(mn); mnTexture(0); return mn;
}
function mnTexture(intensity) {
  const g = mn.tc.getContext('2d'); g.globalAlpha = 1; g.drawImage(mn.base, 0, 0);
  for (let row = 0; row < 23; row++) {
    const y = 22 + row * 44, x = row % 3 === 0 ? 10 : Math.floor(Math.random() * 130), words = markov.phrase(3 + Math.floor(Math.random() * 4));
    g.fillStyle = row % 4 === 0 ? '#d1c7b7' : '#23302a'; g.fillRect(x - 4, y - 18, Math.min(500 - x, words.length * 10 + 6), 23);
    g.font = (row % 4 === 0 ? 'bold 21px' : '18px') + ' monospace'; g.fillStyle = row % 4 === 0 ? '#24302a' : '#d6d8bf'; g.fillText(words, x, y);
  }
  for (let n = 0; n < 24 + intensity * 55; n++) { g.font = '12px monospace'; g.fillStyle = Math.random() > .5 ? '#dcd8c4' : '#222225'; g.fillText(digits.string(2 + Math.floor(Math.random() * 5)), Math.random() * 510, Math.random() * 1024); }
  for (let i = 0; i < 9; i++) g.clearRect(Math.random() * 500, Math.random() * 1024, Math.random() * 37 + 4, Math.random() * 9 + 2);
  mn.tex.needsUpdate = true;
}
function mnCrawl() {
  const cycle = sim.crawlDistance * 9, positions = mn.geo.attributes.position, rest = mn.rest;
  for (let i = 0; i < positions.count; i++) { const j = i * 3, x = rest[j], y = rest[j + 1], z = rest[j + 2], hh = y / 3.24; positions.setXYZ(i, x + Math.sin(cycle - hh * 2.7) * .085 * hh, y * (1 - .025 * (.5 + .5 * Math.sin(cycle))), z + Math.sin(cycle - hh * 2) * .026 * hh); }
  positions.needsUpdate = true;
  for (const b of mn.bands) { const hh = b.mesh.position.y / 3.24; b.mesh.position.x = b.x + Math.sin(cycle - hh * 2.7) * .085 * hh; b.mesh.position.z = .2 + Math.sin(cycle - hh * 2) * .026 * hh; }
}
function disposeMissingNo(visual) {
  if (!visual) return; visual.ent.parent?.remove(visual.ent); visual.ent.traverse(o=>{if(o.geometry)o.geometry.dispose();});
  visual.ent.children[0]?.material.dispose(); visual.tex.dispose(); mnVisuals.delete(visual);
}
function setupEffects() {
  psilo = NovaMissingNoBase.create(THREE); NovaMissingNoPsilo.install(psilo); focus = NovaMissingNoBase.createFocus();
  const target = new THREE.WebGLRenderTarget(800, 600, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, depthBuffer: true }); target.texture.encoding = THREE.sRGBEncoding;
  const scn = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mat = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: target.texture }, uTime: { value: 0 }, uStrength: { value: 0 }, uPatternVisibility: { value: 0 }, uResolution: { value: new THREE.Vector2(800, 600) } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: `precision highp float;
uniform sampler2D tDiffuse;uniform float uTime;uniform float uStrength;uniform float uPatternVisibility;uniform vec2 uResolution;varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 float frame=floor(uTime*18.);float band=floor(vUv.y*64.);float randomBand=hash(vec2(band,frame));
 float tear=step(1.-uStrength*.2,randomBand)*(hash(vec2(frame,band))-0.5)*uStrength*.11;
 vec2 p=clamp(vUv+vec2(tear,0.),.001,.999);
 float chroma=uStrength*uStrength*.009;vec3 c=texture2D(tDiffuse,p).rgb;
 c.r=texture2D(tDiffuse,clamp(p+vec2(chroma,0.),.001,.999)).r;c.b=texture2D(tDiffuse,clamp(p-vec2(chroma,0.),.001,.999)).b;
 float noise=hash(floor(vUv*uResolution*.75)+vec2(frame*17.,frame*3.));
 c=mix(c,vec3(noise*.69),(uStrength*.1+uStrength*uStrength*.5)*mix(1.,.30,uPatternVisibility));
 float line=step(.996,hash(vec2(floor(vUv.y*uResolution.y),frame)));c=mix(c,vec3(.08),line*uStrength*.65);
 c*=1.-.035*uStrength*(.5+.5*sin(vUv.y*uResolution.y*3.14159));
 gl_FragColor=vec4(c,1.);
}` });
  scn.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  post = { target, scn, cam, mat };

}

let time=0,lastWorld=null,wasTripping=false;
const look=new THREE.Vector3();
function reset(){lastWorld=null;wasTripping=false;if(psilo){psilo.release();psilo.uniforms.uNovaPattern.value=0;focus.reset();}}
return {
 create:makeMissingNo,dispose:disposeMissingNo,reset,
 update(visual,encounter,dt,y){
  mn=visual;sim=encounter;visual.ent.position.set(sim.entity.x,y,sim.entity.z);visual.ent.rotation.y=sim.entity.yaw;mnCrawl();
  visual.clock=(visual.clock||0)+dt;const frame=Math.floor(visual.clock*(3+sim.intensity*10));
  if(visual.lastFrame!==frame){visual.lastFrame=frame;mnTexture(sim.intensity);}
 },
 render(renderer,world,camera,record,dt,playing,mainPsilo){
  const distance=record?.visibleToPlayer!==false&&record?.sim.active?record.sim.distance():Infinity;
  const prox=NovaMissingNoPsilo.profile(distance);
  if(!prox.active){if(wasTripping)reset();return false;}
  if(!psilo)setupEffects();
  if(world!==lastWorld){reset();lastWorld=world;}
  wasTripping=true;if(playing)time+=dt;
  psilo.prepare(world);
  // Existing main-game materials keep their shader; drive its surface uniforms
  // while the sandbox's separately namespaced optics handle this encounter.
  for(const effect of [psilo,mainPsilo])if(effect){effect.uniforms.uNovaTime.value=time;camera.getWorldPosition(effect.uniforms.uNovaEye.value);effect.uniforms.uNovaPattern.value=prox.pattern;}
  if(playing)focus.update(dt,true,camera.position,camera.getWorldDirection(look),6);
  const f=focus.state,size=renderer.getDrawingBufferSize(drawSize);
  if(post.target.width!==size.x||post.target.height!==size.y)post.target.setSize(size.x,size.y);
  NovaMissingNoPsilo.apply(psilo,prox);
  post.mat.uniforms.uResolution.value.copy(size);post.mat.uniforms.uTime.value=time;
  post.mat.uniforms.uStrength.value=record.sim.phase==='dead'?.97:record.sim.intensity;
  post.mat.uniforms.uPatternVisibility.value=prox.coverage;
  const previous=renderer.getRenderTarget();
  try{
   renderer.setRenderTarget(post.target);renderer.render(world,camera);
   post.mat.uniforms.tDiffuse.value=psilo.process(renderer,post.target.texture,{width:size.x,height:size.y,dt:playing?dt:0,time,level:prox.level,fade:prox.onset,dose:6,mirror:prox.mirror,echo:Math.max(f.echo,prox.echo),justMoved:f.justMoved,stage4:prox.stage4,stage6:prox.stage6,stage12:prox.stage12,stage16:prox.stage16,stage20:prox.stage20});
   renderer.setRenderTarget(previous);renderer.render(post.scn,post.cam);
  }finally{renderer.setRenderTarget(previous);}
  return true;
 },get optics(){if(!psilo)setupEffects();return{psilo,post};}
};

}};
