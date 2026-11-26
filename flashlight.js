// A run-local, physical torch. Its pickup and beam share the active world.
(() => {
'use strict';
function create(THREE,scene,factory,blocked=()=>false){
 const candidates=factory.plants.filter(p=>p.support==='factory-floor'&&p.x<-154&&p.z<198).map(p=>({x:p.x+.7,z:p.z+.65}));
 candidates.push({x:-169,z:185});candidates.sort((a,b)=>Math.hypot(a.x+169,a.z-185)-Math.hypot(b.x+169,b.z-185));
 const place=candidates.find(p=>!blocked(p.x,p.z,factory.floor));if(!place)throw Error('No clear floor by the factory plants for the torch.');
 const pickup={kind:'flashlight',id:'flashlight',...place,y:factory.floor},root=new THREE.Group();root.name='Taschenlampe · Fabrik hinten links';root.position.set(place.x,factory.floor+.076,place.z);root.rotation.y=.64;scene.add(root);
 const body=new THREE.MeshLambertMaterial({color:0x3d4438}),rubber=new THREE.MeshLambertMaterial({color:0x242725}),rim=new THREE.MeshPhongMaterial({color:0x858571,shininess:38}),glass=new THREE.MeshPhongMaterial({color:0xc2ccb7,specular:0xe4e1c8,shininess:90});
 function tube(radius,length,z,material){const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,length,12),material);m.rotation.x=Math.PI/2;m.position.z=z;m.castShadow=true;root.add(m);return m;}
 tube(.050,.29,0,body);tube(.059,.055,.145,rim);tube(.056,.06,-.15,rubber);tube(.066,.065,.194,body);tube(.059,.017,.23,rim);tube(.050,.008,.242,glass);
 for(let i=0;i<4;i++)tube(.052,.013,-.08+i*.04,rubber);
 const button=new THREE.Mesh(new THREE.BoxGeometry(.033,.012,.048),rubber);button.position.set(0,.053,.04);root.add(button);
 const strap=new THREE.Mesh(new THREE.TorusGeometry(.062,.006,5,12,Math.PI*1.75),rubber);strap.rotation.set(Math.PI/2,0,.1);strap.position.set(.03,-.055,-.23);root.add(strap);
 const light=new THREE.SpotLight(0xffe5ae,0,48,Math.PI/7,.55,1.35);light.name='Taschenlampenstrahl';light.castShadow=true;light.shadow.mapSize.set(512,512);light.shadow.camera.near=.15;light.shadow.camera.far=48;light.shadow.bias=-.00025;light.shadow.normalBias=.015;
 const direction=new THREE.Vector3(),right=new THREE.Vector3();let owned=false,on=false;
 function target(eye,look,player){if(owned)return null;const v=new THREE.Vector3(pickup.x-eye.x,pickup.y+.09-eye.y,pickup.z-eye.z),d=v.length();return d<3&&Math.abs(player.walkY-pickup.y)<1&&v.dot(look)/Math.max(.001,d)>.94?pickup:null;}
 function collect(){if(owned)return false;owned=true;on=false;root.visible=false;return true;}
 function toggle(){if(!owned)return false;on=!on;return on;}
 function update(world,eye,active){
  light.intensity=owned&&on&&active?3.4:0;light.visible=light.intensity>0;if(!light.visible)return;
  if(light.parent!==world){world.add(light);world.add(light.target);}
  eye.getWorldDirection(direction);right.set(1,0,0).applyQuaternion(eye.quaternion);light.position.copy(eye.position).addScaledVector(right,.14);light.position.y-=.10;light.target.position.copy(eye.position).addScaledVector(direction,32);light.target.updateMatrixWorld(true);light.updateMatrixWorld(true);
 }
 function reset(){owned=on=false;root.visible=true;light.intensity=0;light.visible=false;}
 reset();return{pickup,root,light,target,collect,toggle,update,reset,get state(){return{owned,on,position:{x:pickup.x,y:pickup.y,z:pickup.z}};}};
}
window.NovaFlashlight={create};
})();
