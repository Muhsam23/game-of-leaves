// Distance-driven encounter adaptation of the original Psilo Labor effect.
// Its lattice, Voronoi shards and local reflections remain the original algorithms.
(function(root){
'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),smooth=x=>x*x*(3-2*x);
function profile(distance){
 const active=Number.isFinite(distance)&&distance<=10;
 const progress=active?clamp((10-distance)/8,0,1):0;
 // Short, spatial fade-in at the boundary avoids a one-frame colour flash.
 const onset=active?smooth(clamp((10-distance)/.35,0,1)):0;
 const coverage=smooth(progress);
 return {active,dose:active?6:0,progress,onset,coverage,density:1+.55*progress,
  level:1.23*onset,pattern:1.05*(.4+1.2*progress)*onset,
  mirror:(.25+.75*coverage),echo:(.25+.55*progress),
  stage4:clamp(progress*1.8,0,1),stage6:clamp(progress*1.6,0,1),
  stage12:clamp(progress*1.4,0,1),stage16:clamp(progress*1.2,0,1),stage20:progress};
}
function install(effect){
 const shard=effect.materials.shard;
 if(shard.userData.missingNoDistance)return;
 let source=shard.fragmentShader;
 const replace=(from,to)=>{if(source.split(from).length!==2)throw new Error('Unrecognised Psilo Labor shader; encounter adaptation stopped.');source=source.replace(from,to);};
 replace('const float TAU=6.283185307179586;','uniform float uMissingNoCoverage,uMissingNoDensity;\nconst float TAU=6.283185307179586;');
 // At full coverage every shard uses the existing local kaleidoscope branch.
 replace('if(h.y<mix(.45,.15,cx/3.)){','if(h.y<mix(.45,.15,cx/3.)*(1.-uMissingNoCoverage)){');
 replace('th=atan(q.y,max(q.x,0.))*.75','th=atan(q.y,max(q.x,1e-5))*.75');
 // Close the protected centre and gradually fill the original transparent gaps.
 replace('reveal*=smoothstep(inner,outer,ecc-wob);','reveal=mix(reveal*smoothstep(inner,outer,ecc-wob),1.,uMissingNoCoverage);');
 replace('D=mix(5.5,13.,cx/3.)*mix(1.3,1.,smoothstep(.2,1.,fold));','D=mix(5.5,13.,cx/3.)*mix(1.3,1.,smoothstep(.2,1.,fold))*uMissingNoDensity;');
 replace('reveal*m.a*smoothstep(0.,24.,abs(seam)*res.y)*mix(.7,.9,novaNoise(q*2.3+time*.02))',
  'reveal*mix(m.a*smoothstep(0.,24.,abs(seam)*res.y)*mix(.7,.9,novaNoise(q*2.3+time*.02)),1.,uMissingNoCoverage)');
 shard.fragmentShader=source;shard.uniforms.uMissingNoCoverage={value:0};shard.uniforms.uMissingNoDensity={value:1};shard.userData.missingNoDistance=true;shard.needsUpdate=true;
}
function apply(effect,p){effect.materials.shard.uniforms.uMissingNoCoverage.value=p.coverage;effect.materials.shard.uniforms.uMissingNoDensity.value=p.density;}
const api={profile,install,apply};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.NovaMissingNoPsilo=api;
})(typeof window==='undefined'?globalThis:window);
