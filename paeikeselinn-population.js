/* Stable spatial population. Homes are jittered triangular cells, not distance timers. */
(function(root){
'use strict';
const Core=typeof module==='object'?require('./missingno-core.js'):root.NovaEncounter;
const hash=(x,z,s)=>{let h=Math.imul(x|0,374761393)^Math.imul(z|0,668265263)^s;h=Math.imul(h^(h>>>13),1274126177);return(h^(h>>>16))>>>0;};
function home(col,row,seed,origin={x:0,z:0},spacing=250){
 const random=Core.seeded(hash(col,row,seed)),jitter=spacing*.048;
 return {id:col+','+row,col,row,seed:hash(col,row,seed),x:origin.x+col*spacing+((row%2+2)%2)*spacing*.5+(col||row?(random()-.5)*jitter*2:0),z:origin.z+row*spacing*Math.sqrt(3)/2+(col||row?(random()-.5)*jitter*2:0)};
}
function homes(x,z,radius,seed,origin,spacing=250){
 const row0=Math.round((z-origin.z)/(spacing*Math.sqrt(3)/2)),out=[],n=Math.ceil(radius/(spacing*.866))+1;
 for(let row=row0-n;row<=row0+n;row++){const col0=Math.round((x-origin.x)/spacing-((row%2+2)%2)*.5);for(let col=col0-n;col<=col0+n;col++){const p=home(col,row,seed,origin,spacing);if(Math.hypot(p.x-x,p.z-z)<=radius)out.push(p);}}
 return out;
}
class Population{
 constructor(){this.records=new Map();this.seed=1;this.origin={x:0,z:0};this.spacing=250;this.selected=null;this.muted=new Set();}
 reset(seed,origin,spacing=250){this.records.clear();this.muted.clear();this.seed=seed;this.origin={...origin};this.spacing=spacing;this.selected=null;}
 sync(player){
  const added=[],removed=[];
  for(const h of homes(player.x,player.z,375,this.seed,this.origin,this.spacing))if(!this.records.has(h.id)&&!this.muted.has(h.id)){
   const encounter=new Core.Encounter();encounter.relocate(h.x,h.z,h.seed);encounter.player={x:player.x,z:player.z};const record={home:h,sim:encounter,visual:null};this.records.set(h.id,record);added.push(record);
  }
  for(const [id,record]of this.records)if(record.sim.phase==='free'&&Math.hypot(player.x-record.home.x,player.z-record.home.z)>460){this.records.delete(id);removed.push(record);}
  this.select(player);return{added,removed};
 }
 select(player){
  let nearest=null,distance=Infinity;
  for(const record of this.records.values()){const s=record.sim;s.player.x=player.x;s.player.z=player.z;if(!s.active)continue;if(s.phase!=='free'){nearest=record;break;}const d=s.distance();if(d<distance){distance=d;nearest=record;}}
  this.selected=nearest;return nearest;
 }
 update(dt,player,deadly=true){
  for(const {sim}of this.records.values()){sim.player.x=player.x;sim.player.z=player.z;sim.triggerRadius=deadly?5:.001;sim.update(dt);}
  return this.select(player);
 }
 move(from,to,deadly=true){
  const record=this.select(from);if(!record||!deadly)return to;const e=record.sim;e.move(to.x-from.x,to.z-from.z);return{x:e.player.x,z:e.player.z};
 }
 silence(){if(this.selected){this.muted.add(this.selected.home.id);this.selected.sim.deactivate();this.selected.sim.phase='free';}this.selected=null;}
 snapshot(){return [...this.records.values()].map(r=>({id:r.home.id,home:{...r.home},active:r.sim.active,distance:r.sim.distance(),phase:r.sim.phase}));}
}
const api={hash,home,homes,Population};if(typeof module==='object')module.exports=api;root.NovaCorruption=api;
})(typeof window==='undefined'?globalThis:window);
