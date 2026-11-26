// Presentation settings only: world objects, collisions and pickups retain their identities.
window.NovaPerformance=(()=>{
 'use strict';
 const defaults={resolution:1,distance:1,density:1,shadows:2},settings={...defaults};
 const ranges={resolution:[.5,1],distance:[.4,1],density:[.25,1],shadows:[0,2]};
 let storage,change=()=>{},frames=0,time=0,fps=0;
 function valid(values){for(const key of Object.keys(defaults)){const v=Number(values?.[key]);if(Number.isFinite(v)){const [lo,hi]=ranges[key];settings[key]=Math.max(lo,Math.min(hi,key==='shadows'?Math.round(v):v));}}}
 try{storage=localStorage;const saved=JSON.parse(storage.getItem('nova.performance.v1')||'null');if(saved)valid(saved);}catch{}
 const ids={resolution:'perfResolution',distance:'perfDistance',density:'perfDensity',shadows:'perfShadows'},$=id=>document.getElementById(id);
 function show(){for(const [key,id]of Object.entries(ids)){const value=key==='shadows'?settings[key]:Math.round(settings[key]*100);$(id).value=String(value);$(id+'Value').textContent=key==='shadows'?['Aus','Reduziert','Standard'][value]:value+'%';}}
 function set(values){valid(values);show();try{storage?.setItem('nova.performance.v1',JSON.stringify(settings));}catch{}change(settings);}
 function bind(callback){change=callback;for(const [key,id]of Object.entries(ids))$(id).addEventListener('input',()=>set({[key]:Number($(id).value)/(key==='shadows'?1:100)}));$('perfLow').addEventListener('click',()=>set({resolution:.75,distance:.65,density:.5,shadows:0}));$('perfReset').addEventListener('click',()=>set(defaults));show();change(settings);}
 function sample(dt,renderer){if(!(dt>0)||document.hidden)return;time+=Math.min(dt,1);frames++;if(time<.75)return;fps=frames/time;frames=time=0;const c=renderer.domElement;if(c)$('perfStats').textContent=Math.round(fps)+' FPS · '+c.width+' × '+c.height;}
 return{settings,bind,set,sample,get state(){return{...settings,fps:Math.round(fps)};}};
})();
