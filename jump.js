// Vertical player motion is separate from grounded path/stair collision.
// Portals, debug teleports and ladder/spectator modes cancel an airborne step.
window.NovaJump=(()=>{
'use strict';
function create(){
 let airborne=false,feet=0,velocity=0,height=0,world=null,lastX=0,lastZ=0;
 function reset(){airborne=false;velocity=height=0;world=null;}
 return{
  reset,
  start(ground,key,x,z){
   if(airborne||![ground,x,z].every(Number.isFinite))return false;
   airborne=true;feet=ground;velocity=4.6;height=0;world=key;lastX=x;lastZ=z;return true;
  },
  update(dt,{ground,key,x,z,enabled=true,ceiling=Infinity}){
   if(!enabled||!Number.isFinite(ground)||world!==key||Math.hypot(x-lastX,z-lastZ)>4){reset();return 0;}
   lastX=x;lastZ=z;if(!airborne)return 0;
   dt=Math.min(.1,Math.max(0,Number.isFinite(dt)?dt:0));
   feet+=velocity*dt-7.5*dt*dt;velocity-=15*dt;
   const top=ceiling-1.85;
   if(feet>top){feet=Math.max(ground,top);velocity=Math.min(0,velocity);}
   if(feet<=ground&&velocity<=0){reset();return 0;}
   height=Math.max(0,feet-ground);return height;
  },
  get state(){return{airborne,height,velocity};}
 };
}
return{create};
})();
