/* Optional scene-switch adapter for an existing Three.js game.
   The host keeps its world camera/player untouched while an eye room is active. */
(function(root){
'use strict';
root.createEyeRoomAdapter=function({THREE,renderer,images,onEnter=()=>{},onLeave=()=>{}}){
 const camera=new THREE.PerspectiveCamera(62,1,.06,1200);camera.rotation.order='YXZ';
 let rendererState=null,hostState=null;
 const room=EyeRooms.create({THREE,images,anisotropy:Math.min(8,(renderer.capabilities.getMaxAnisotropy?.()||1)),onExit:()=>exit()});
 function enter(kind,savedHostState,options={}){
   if(room.active)return;
   hostState=savedHostState;
   rendererState={toneMapping:renderer.toneMapping,outputEncoding:renderer.outputEncoding,autoClear:renderer.autoClear};
   renderer.toneMapping=THREE.NoToneMapping;renderer.outputEncoding=THREE.LinearEncoding;renderer.autoClear=true;
   room.enter(camera,{kind,...options});onEnter(kind);
 }
 function exit(){
   if(!rendererState)return;
   room.leave(camera,{restore:false});Object.assign(renderer,rendererState);rendererState=null;
   const state=hostState;hostState=null;onLeave(state);
 }
 const next=new THREE.Vector3();
 return{
   enter,exit,camera,room,
   get active(){return room.active},
   update(dt,{forward=0,right=0,running=false,yaw=camera.rotation.y,pitch=camera.rotation.x}={}){
     if(!room.active)return;
     dt=Math.min(Math.max(dt,0),.05);camera.rotation.set(Math.max(-1.38,Math.min(1.38,pitch)),yaw,0);
     const n=Math.hypot(forward,right)||1,d=(running?7:3.2)*dt/n;
     next.copy(camera.position);next.x+=(-Math.sin(yaw)*forward+Math.cos(yaw)*right)*d;next.z+=(-Math.cos(yaw)*forward-Math.sin(yaw)*right)*d;
     room.resolveMovement(camera.position,next);camera.position.copy(next);room.update(camera,dt);
   },
   render(width,height){if(room.active){if(width&&height&&camera.aspect!==width/height){camera.aspect=width/height;camera.updateProjectionMatrix()}renderer.render(room.scene,camera)}},
   dispose(){exit();room.dispose()}
 };
};
})(typeof window!=='undefined'?window:globalThis);
