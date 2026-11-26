// Reduced Drosophila-inspired sensorimotor controller for the Vermesser.
// This is NOT a simulation of the complete MaleCNS connectome. It keeps a
// small set of experimentally grounded motifs: an E-PG-like heading ring,
// P-EN-like heading-shift dynamics, PFL3/DNa02-like steering output and
// LC16/LPLC2 -> MDN-like looming/retreat pathways.
(() => {
'use strict';
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wrap=a=>{a=(a+Math.PI)%TAU;if(a<0)a+=TAU;return a-Math.PI;};
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

function create(seed=0x4e4f5641){
 const N=24,random=rng(seed),epg=new Float32Array(N),penL=new Float32Array(N),penR=new Float32Array(N),ringInput=new Float32Array(N);
 let heading=0,goal=(random()-.5)*TAU,goalTimer=8+random()*16,noise=0,noiseTarget=0,noiseTimer=0;
 let lastPlayerDistance=Infinity,loom=0,arousal=.16,reverse=0,freeze=0,lastTurn=0,lastForward=0;
 const activityAngle=arr=>{let x=0,y=0,total=0;for(let i=0;i<N;i++){const a=i/N*TAU-Math.PI,w=Math.max(0,arr[i]);x+=Math.cos(a)*w;y+=Math.sin(a)*w;total+=w;}return total>.0001?Math.atan2(y,x):heading;};
 const bump=(arr,angle,width=1.65,gain=1)=>{for(let i=0;i<N;i++){const a=i/N*TAU-Math.PI,d=wrap(a-angle);arr[i]+=Math.exp(-d*d*width)*gain;}};
 function reset(x=0){heading=x;goal=wrap(x+(random()-.5)*2.5);goalTimer=7+random()*18;epg.fill(0);bump(epg,heading,2.2,1);lastPlayerDistance=Infinity;loom=0;arousal=.16;reverse=freeze=0;lastTurn=lastForward=0;}
 reset(0);
 function update(dt,s){
  dt=clamp(dt,0,.08);
  const hasPlayer=!s.ignorePlayer;
  const dx=hasPlayer?s.playerX-s.x:0,dz=hasPlayer?s.playerZ-s.z:999,distance=hasPlayer?Math.max(.001,Math.hypot(dx,dz)):999,bearing=hasPlayer?Math.atan2(-dx,-dz):s.yaw,relative=hasPlayer?wrap(bearing-s.yaw):0;
  const visualFront=hasPlayer?Math.max(0,Math.cos(relative)):0;
  // Angular expansion is a simple real-time proxy for looming. Near obstacles
  // are fed through the same threat pathway but remain side-specific.
  const closing=hasPlayer&&Number.isFinite(lastPlayerDistance)?Math.max(0,(lastPlayerDistance-distance)/Math.max(dt,.001)):0;
  lastPlayerDistance=distance;
  const apparent=clamp((22-distance)/20,0,1)*visualFront;
  const loomingNow=clamp(apparent*.55+closing*.075*visualFront,0,1);
  loom+=(loomingNow-loom)*(1-Math.exp(-dt*9));
  const obstacleL=clamp(s.obstacleLeft||0,0,1),obstacleR=clamp(s.obstacleRight||0,0,1),obstacleF=clamp(s.obstacleFront||0,0,1);
  const threatL=clamp(loom*s.playerSideLeft+obstacleL*.9+obstacleF*.5,0,1);
  const threatR=clamp(loom*s.playerSideRight+obstacleR*.9+obstacleF*.5,0,1);
  const mdnL=smooth(.2,.85,threatL),mdnR=smooth(.2,.85,threatR);
  reverse+=(Math.max(mdnL,mdnR)-reverse)*(1-Math.exp(-dt*8));
  freeze+=(smooth(.68,1,loom)-freeze)*(1-Math.exp(-dt*5));
  arousal+=(clamp(.12+loom*.75+obstacleF*.2,0,1)-arousal)*(1-Math.exp(-dt*2.2));

  goalTimer-=dt;if(goalTimer<=0){goalTimer=6+random()*21;goal=wrap(goal+(random()-.5)*(1.2+random()*1.9));}
  // Threat does not turn into pursuit. Strong player salience nudges the
  // internally generated goal away from the stimulus, then lets it drift on.
  if(loom>.2)goal=wrap(goal-wrap(relative)*dt*.22 + (relative>=0?-.22:.22)*loom*dt);
  noiseTimer-=dt;if(noiseTimer<=0){noiseTimer=.45+random()*1.7;noiseTarget=(random()-.5)*(.5+arousal*.8);}noise+=(noiseTarget-noise)*(1-Math.exp(-dt*2.4));

  // E-PG-like compass bump. Angular velocity shifts the represented heading;
  // a weak visual/proprioceptive anchor keeps the bump aligned with the body.
  const omega=s.angularVelocity||0;
  heading=wrap(heading+omega*dt*.82);
  heading=wrap(heading+wrap(s.yaw-heading)*(1-Math.exp(-dt*1.7)));
  ringInput.fill(0);bump(ringInput,heading,2.35,1.0);
  const old=Float32Array.from(epg),omegaNorm=clamp(omega/2.5,-1,1),rate=1-Math.exp(-dt*8.5);
  for(let i=0;i<N;i++){
   const left=old[(i+1)%N],right=old[(i+N-1)%N];
   penL[i]=Math.max(0,left*(.18+.42*Math.max(0,-omegaNorm)));
   penR[i]=Math.max(0,right*(.18+.42*Math.max(0,omegaNorm)));
   const target=clamp(ringInput[i]*.88+(penL[i]+penR[i])*.12,0,1.25);
   epg[i]+= (target-epg[i])*rate;
  }
  heading=activityAngle(epg);

  // PFL3-like steering compares the compass to a slowly wandering goal.
  // DNa02-like left/right outputs are antagonistic steering channels.
  const goalError=wrap(goal-heading);
  let pflL=Math.max(0,-goalError)*.72,pflR=Math.max(0,goalError)*.72;
  pflL+=obstacleR*1.55+threatR*.65; pflR+=obstacleL*1.55+threatL*.65;
  let dNaL=clamp(.08+pflL+Math.max(0,-noise),0,1.8),dNaR=clamp(.08+pflR+Math.max(0,noise),0,1.8);
  let turn=clamp((dNaR-dNaL)*1.18,-1,1);
  if(obstacleF>.45)turn+=((obstacleL>obstacleR)?1:-1)*(.45+obstacleF*.55);
  turn=clamp(turn,-1,1);
  const walkDrive=clamp(.58+noise*.09-arousal*.08,0,1);
  let forward=walkDrive*(1-freeze*.88)-reverse*1.05;
  if(obstacleF>.72)forward=Math.min(forward,-.22);
  lastTurn+=(turn-lastTurn)*(1-Math.exp(-dt*5.2));lastForward+=(forward-lastForward)*(1-Math.exp(-dt*4.2));
  return{turn:lastTurn,forward:clamp(lastForward,-.75,1),loom,arousal,reverse,freeze,heading,goal,goalError,dNaL,dNaR,mdnL,mdnR,relative,distance};
 }
 return{update,reset,getState:()=>({heading,goal,loom,arousal,reverse,freeze,turn:lastTurn,forward:lastForward,epg:Array.from(epg)})};
}
window.NovaFlyBrain={create};
})();
