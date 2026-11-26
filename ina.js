// The imported collector and German Markov dialogue, integrated into the forest.
(() => {
'use strict';
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function create(THREE,scene,texture,environment){
 const {blocked,ground,habitat}=environment,T=window.NovaTerrain,random=T.rng(0x494e41);
 const model=window.MossCollector.createCollector(texture),brain=window.NovaFlyBrain.create(0x494e41);scene.add(model.group);
 const actor={name:'Ina',model,brain,x:0,z:0,yaw:0,speed:0,angularVelocity:0,walked:0,mode:'idle'};
 let time=0,stepTime=0,rest=0,untilRest=24;
 function solid(x,z){return !habitat(x,z)||[[0,0],[.42,0],[-.42,0],[0,.42],[0,-.42]].some(([dx,dz])=>blocked(x+dx,z+dz)||Math.abs(ground(x+dx,z+dz)-ground(x,z))>.30);}
 function pose(mode){
  window.MossCollector.animate(model,mode==='walk'?stepTime:time,mode);
  actor.head?.update(mode==='walk'?stepTime:time,mode);
  // The original animation restores its own root transform on each frame.
  model.group.position.set(actor.x,ground(actor.x,actor.z),actor.z);
  model.group.rotation.y=actor.yaw+Math.PI;actor.mode=mode;
 }
 function reset(){
  const x=T.pathX(177)+9,z=177;let spawn=null;
  for(let radius=0;radius<110&&!spawn;radius+=2)for(let i=0;i<24;i++){const a=i*Math.PI/12,px=x+Math.sin(a)*radius,pz=z+Math.cos(a)*radius;if(!solid(px,pz)){spawn={x:px,z:pz};break;}}
  if(!spawn)throw new Error('No forest position for Ina.');
  Object.assign(actor,spawn,{yaw:random()*Math.PI*2,speed:0,angularVelocity:0,walked:0});brain.reset(actor.yaw);time=stepTime=rest=0;untilRest=24;pose('idle');
 }
 function sensor(angle){let value=0;for(const [d,w]of [[.9,.5],[2.1,1]])if(solid(actor.x-Math.sin(actor.yaw+angle)*d,actor.z-Math.cos(actor.yaw+angle)*d))value=w;return value;}
 function update(dt,player,active,talking=false,observer=player,ignorePlayer=false){
  model.group.visible=Math.hypot(actor.x-observer.x,actor.z-observer.z)<105;
  if(!active&&!talking)return;dt=Math.max(0,Math.min(.05,dt));time+=dt;
  if(talking){const target=Math.atan2(actor.x-player.x,actor.z-player.z);actor.yaw=wrap(actor.yaw+wrap(target-actor.yaw)*(1-Math.exp(-dt*3)));actor.speed=0;pose('talk');return;}
  untilRest-=dt;if(untilRest<=0&&rest<=0){rest=6;untilRest=22+random()*30;}
  if(rest>0){rest=Math.max(0,rest-dt);actor.speed=0;pose('gather');return;}
  // A nearby visitor gives her time to stop before opening the conversation.
  if(!ignorePlayer&&Math.hypot(actor.x-player.x,actor.z-player.z)<2.4){actor.speed=0;pose('idle');return;}
  const front=sensor(0),left=sensor(-.65),right=sensor(.65);
  const out=brain.update(dt,{x:actor.x,z:actor.z,yaw:actor.yaw,angularVelocity:actor.angularVelocity,ignorePlayer:true,playerSideLeft:0,playerSideRight:0,obstacleFront:front,obstacleLeft:left,obstacleRight:right});
  let turn=out.turn,wanted=out.forward*.85;if(front>.4){turn+=(left>right?1:-1)*2.4;wanted=Math.min(wanted,.12);}
  const oldYaw=actor.yaw;actor.yaw=wrap(actor.yaw+turn*dt);actor.angularVelocity=wrap(actor.yaw-oldYaw)/Math.max(dt,.001);actor.speed+=(wanted-actor.speed)*(1-Math.exp(-dt*5));
  const dx=-Math.sin(actor.yaw)*actor.speed*dt,dz=-Math.cos(actor.yaw)*actor.speed*dt,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.05));let moved=0;
  for(let i=0;i<steps;i++){const x=actor.x+dx/steps,z=actor.z+dz/steps;if(solid(x,z)){actor.speed=0;break;}moved+=Math.hypot(x-actor.x,z-actor.z);actor.x=x;actor.z=z;}
  actor.walked+=moved;stepTime+=moved/.65;pose(moved>.0005?'walk':'idle');
 }
 function canTalk(player,eye,direction){
  const dx=actor.x-player.x,dz=actor.z-player.z,d=Math.hypot(dx,dz);if(d>3.8||Math.abs(player.walkY-ground(actor.x,actor.z))>1)return false;
  const v=new THREE.Vector3(actor.x-eye.x,ground(actor.x,actor.z)+1.15-eye.y,actor.z-eye.z),length=v.length();if(length>.1&&v.dot(direction)/length<.91)return false;
  const n=Math.max(1,Math.ceil(d/.3));for(let i=1;i<n;i++){const t=i/n,x=player.x+dx*t,z=player.z+dz*t;if(blocked(x,z)||ground(x,z)>eye.y+(ground(actor.x,actor.z)+1.15-eye.y)*t)return false;}
  return true;
 }
 reset();return{actor,update,reset,canTalk,solid,get state(){return{name:'Ina',x:actor.x,z:actor.z,yaw:actor.yaw,mode:actor.mode,walked:actor.walked};}};
}

function createDialogue({onOpen,onClose,onReply,seed}){
 const $=id=>document.getElementById(id),panel=$('inaDialogue'),reply=$('inaReply'),question=$('inaQuestion'),more=$('inaMore'),leave=$('inaLeave'),ask=$('inaAsk');
 const generator=new window.MossMarkovDE.MarkovDialogue(window.NovaInaCorpus,seed);
 let open=false,lastReply=null,speaker='ina',wallVoice=null;
 function answer(input=''){
  if(!open)return false;
  try{
   const result=speaker==='wall'?{sentences:(wallVoice||(wallVoice=window.createWallMarkov(window.NovaWallCorpus))).speak('address').split(/\n+/).filter(Boolean)}:generator.reply(String(input).slice(0,240));lastReply=result;reply.replaceChildren();
   for(const sentence of result.sentences){const p=document.createElement('p');p.textContent=sentence;reply.appendChild(p);}
   onReply?.(result.sentences.join(' '),speaker);
   more.textContent='E · Weiter';panel.scrollTop=0;return true;
  }catch(error){more.textContent='Erneut versuchen';return false;}
 }
 function close(resume=true){if(!open)return;open=false;panel.hidden=true;document.body.classList.remove('dialogue-open');delete document.body.dataset.speaker;question.value='';onClose(resume);}
 const api={get isOpen(){return open;},get state(){return{open,speaker,turn:generator.turn,sentences:lastReply?.sentences.slice()||[]};},answer,close,
  open(who='ina'){if(open)return;speaker=who;document.body.dataset.speaker=speaker;open=true;panel.hidden=false;document.body.classList.add('dialogue-open');onOpen();answer();more.focus();},
  reset(){close(false);generator.recent=[];generator.turn=0;lastReply=null;reply.replaceChildren();question.value='';more.textContent='E · Weiter';}
 };
 $('inaQuestionForm').addEventListener('submit',e=>{e.preventDefault();if(!open)return;const input=String(question.value).trim().slice(0,240);if(!input)return;if(answer(input))question.value='';question.focus();});
 more.addEventListener('click',()=>answer());leave.addEventListener('click',()=>close());
 panel.addEventListener('keydown',e=>{if(e.key!=='Tab'&&e.code!=='Tab')return;const controls=[question,ask,more,leave],i=controls.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();leave.focus();}else if(!e.shiftKey&&(i===controls.length-1||i<0)){e.preventDefault();question.focus();}});
 return api;
}
window.NovaIna={create,createDialogue};
})();
