/* Reference-based boxy four-door sedan. Front is -Z, driver's side is -X.
   The aperture is built into the shell; every front-door surface moves with its hinge. */
(function(root){'use strict';
root.NovaEndingCar=function(T){
 const car=new T.Group();car.name='EndingSedan';
 const v=(x,y,z)=>new T.Vector3(x,y,z);
 const phong=(color,shininess=22)=>new T.MeshPhongMaterial({color,shininess,specular:0x777777});
 const paint=phong(0xd8d9cf,38),chrome=phong(0x9da5a5,85),black=phong(0x111615,8),rubber=phong(0x141716,3),seat=phong(0x282c2a,5);
 const glass=new T.MeshPhongMaterial({color:0x6c8386,transparent:true,opacity:.16,shininess:90,side:T.DoubleSide,depthWrite:false});
 const pane=new T.MeshPhongMaterial({color:0xc4c5ac,shininess:80}),amber=phong(0x9e5a14,32),red=phong(0x661d13,30);
 const unit=new T.BoxGeometry(1,1,1);
 function box(p,w,h,d,x,y,z,m,name=''){const o=new T.Mesh(unit,m);o.scale.set(w,h,d);o.position.set(x,y,z);o.name=name;p.add(o);return o;}
 function rod(p,a,b,r,m){const d=b.clone().sub(a),o=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),6),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(v(0,1,0),d.normalize());p.add(o);return o;}
 function poly(p,pts,faces,m,name=''){const g=new T.BufferGeometry(),a=[];for(const f of faces)for(const i of [...f].reverse())a.push(...pts[i]);g.setAttribute('position',new T.Float32BufferAttribute(a,3));g.computeVertexNormals();const o=new T.Mesh(g,m);o.name=name;p.add(o);return o;}
 function quad(p,pts,m,name=''){return poly(p,pts,[[0,1,2],[0,2,3]],m,name);}
 function profile(side){
  const s=new T.Shape();s.moveTo(-2.08,.43);s.lineTo(-2.08,.98);s.lineTo(-1.90,1.045);s.lineTo(-1.08,1.055);
  if(side<0){s.lineTo(-.92,1.025);s.lineTo(-.92,.425);s.lineTo(.265,.425);s.lineTo(.265,1.025);}
  s.lineTo(1.61,1.025);s.lineTo(2.07,.975);s.lineTo(2.07,.43);s.lineTo(1.705,.40);s.absarc(1.33,.40,.375,0,Math.PI,false);s.lineTo(-.935,.40);s.absarc(-1.31,.40,.375,0,Math.PI,false);s.lineTo(-2.08,.43);
  const g=new T.ExtrudeGeometry(s,{depth:.045,bevelEnabled:false,curveSegments:10});g.rotateY(-Math.PI/2);g.translate(side*.84+.0225,0,0);const m=new T.Mesh(g,paint);m.name=side<0?'DriverShellWithAperture':'PassengerShell';car.add(m);
 }
 profile(-1);profile(1);
 // The floor is a low, narrow tub, never a full-height solid body block.
 box(car,1.56,.07,2.22,0,.255,.13,black,'CabinFloor');
 box(car,.055,.10,2.11,-.806,.36,.17,paint,'DriverSill');box(car,.055,.10,2.11,.806,.36,.17,paint);
 box(car,1.57,.075,3.72,0,.22,0,black,'Undertray');
 box(car,1.65,.44,.055,0,.73,-2.06,paint);box(car,1.66,.43,.065,0,.72,2.045,paint);
 // Slightly crowned bonnet and boot, with separate fenders and panel seams.
 poly(car,[[-.83,1.005,-2.075],[.83,1.005,-2.075],[-.79,1.085,-1.04],[.79,1.085,-1.04],[-.71,1.06,-1.97],[.71,1.06,-1.97],[-.68,1.10,-1.055],[.68,1.10,-1.055]],[[0,1,5],[0,5,4],[4,5,7],[4,7,6],[0,4,6],[0,6,2],[1,3,7],[1,7,5],[2,6,7],[2,7,3]],paint,'Bonnet');
 box(car,1.68,.075,.80,0,1.005,1.65,paint,'BootLid');
 for(const x of [-.71,.71])rod(car,v(x,1.067,-1.95),v(x*.96,1.106,-1.07),.006,black);
 // Roof shoulders and pillars reproduce the tall, square cabin of the photo.
 poly(car,[[-.73,1.595,-.72],[.73,1.595,-.72],[-.73,1.595,1.05],[.73,1.595,1.05],[-.65,1.665,-.64],[.65,1.665,-.64],[-.65,1.665,.96],[.65,1.665,.96]],[[0,1,5],[0,5,4],[4,5,7],[4,7,6],[6,7,3],[6,3,2],[0,4,6],[0,6,2],[1,3,7],[1,7,5],[0,2,3],[0,3,1]],paint,'Roof');
 const wind=[[-.775,1.075,-1.02],[.775,1.075,-1.02],[.687,1.593,-.686],[-.687,1.593,-.686]];
 quad(car,wind,glass,'Windscreen');for(let i=0;i<4;i++)rod(car,v(...wind[i]),v(...wind[(i+1)%4]),.024,black);
 const rear=[[-.78,1.055,1.31],[-.68,1.59,1.02],[.68,1.59,1.02],[.78,1.055,1.31]];
 quad(car,rear,glass);for(let i=0;i<4;i++)rod(car,v(...rear[i]),v(...rear[(i+1)%4]),.025,black);
 for(const s of [-1,1]){
  rod(car,v(s*.825,1.035,-.945),v(s*.715,1.608,-.666),.034,paint);
  rod(car,v(s*.826,1.035,1.30),v(s*.709,1.609,1.012),.048,paint);
  rod(car,v(s*.832,1.03,.282),v(s*.719,1.60,.282),.029,paint);
  const rw=[[s*.829,1.055,.319],[s*.825,1.055,1.23],[s*.717,1.572,.98],[s*.717,1.572,.319]];
  quad(car,rw,glass);for(let j=0;j<4;j++)rod(car,v(...rw[j]),v(...rw[(j+1)%4]),.011,chrome);
  // Front belt and lower trim on the driver side are on the moving door only.
  for(const [a,b] of s<0?[[-2,-.945],[.284,2]]:[[-2,2]]){
   box(car,.023,.033,b-a,s*.867,.47,(a+b)/2,black);
   box(car,.020,.022,b-a,s*.861,1.023,(a+b)/2,chrome);
  }
  // Rear door seam and recessed handle.
  rod(car,v(s*.868,.465,.295),v(s*.868,1.018,.295),.005,black);
  rod(car,v(s*.869,.77,1.12),v(s*.869,1.015,1.15),.005,black);
  box(car,.013,.073,.155,s*.87,.931,.99,chrome);box(car,.019,.045,.120,s*.883,.938,.99,black);
  box(car,.020,.088,.23,s*.781,1.105,1.205,black);
  for(let i=0;i<5;i++)box(car,.023,.006,.19,s*.796,1.072+i*.013,1.205,chrome);
  // Black mudflaps and compact side indicators.
  box(car,.21,.24,.025,s*.805,.30,1.70,rubber);
  box(car,.020,.07,.092,s*.87,.925,-1.73,amber);
 }
 const sidePane=[[.841,1.055,-.91],[.841,1.055,.244],[.726,1.577,.244],[.726,1.577,-.627]];
 quad(car,sidePane,glass);for(let i=0;i<4;i++)rod(car,v(...sidePane[i]),v(...sidePane[(i+1)%4]),.012,chrome);
 box(car,.013,.075,.155,.870,.933,.085,chrome);box(car,.019,.044,.120,.882,.940,.085,black);
 // Only this assembly closes the aperture. No painted plane remains behind it.
 const door=new T.Group();door.name='DriverDoor';door.position.set(-.852,0,-.917);car.add(door);
 poly(door,[[.018,.437,.020],[.018,.437,1.153],[-.005,1.026,.025],[-.005,1.026,1.153],[.062,.437,.020],[.062,.437,1.153],[.060,1.026,.025],[.060,1.026,1.153]],[[0,2,3],[0,3,1],[4,5,7],[4,7,6],[0,4,6],[0,6,2],[1,3,7],[1,7,5],[2,6,7],[2,7,3],[0,1,5],[0,5,4]],paint,'DoorSkin');
 box(door,.025,.36,1.03,.073,.735,.595,black,'DoorInterior');box(door,.090,.065,.41,.112,.855,.60,black);
 const dw=[[.003,1.055,.025],[.003,1.055,1.154],[.124,1.577,1.154],[.124,1.577,.286]];
 quad(door,dw,glass,'DoorGlass');for(let i=0;i<4;i++){rod(door,v(...dw[i]),v(...dw[(i+1)%4]),.019,paint);rod(door,v(...dw[i]).add(v(-.009,0,0)),v(...dw[(i+1)%4]).add(v(-.009,0,0)),.008,chrome);}
 box(door,.025,.033,1.13,-.014,.47,.587,black);box(door,.026,.022,1.14,-.015,1.025,.583,chrome);
 box(door,.02,.075,.157,-.026,.933,1.004,chrome);box(door,.025,.044,.121,-.041,.941,1.004,black);
 rod(door,v(-.023,1.072,.13),v(-.17,1.11,.13),.020,black);box(door,.15,.11,.21,-.19,1.135,.145,black);box(door,.013,.073,.165,-.272,1.139,.145,chrome);
 box(car,.15,.11,.21,1.04,1.135,-.772,black);
 // Cloth seats and a closed footwell sized to the seated rig.
 for(const x of [-.40,.40]){
  box(car,.57,.16,.60,x,.52,.13,seat);const back=box(car,.57,.59,.13,x,.90,.45,seat);back.rotation.x=-.13;box(car,.34,.18,.13,x,1.244,.48,seat);
  for(let k=-2;k<=2;k++)box(car,.015,.011,.51,x+k*.085,.606,.115,black);
 }
 box(car,1.40,.16,.49,0,.55,.98,seat);box(car,1.40,.40,.12,0,.82,1.18,seat);
 box(car,1.53,.17,.29,0,1.014,-.856,black,'Dashboard');box(car,1.53,.62,.048,0,.58,-.96,black,'Firewall');
 box(car,.15,.14,.70,0,.345,-.04,black,'TransmissionTunnel');
 const steering=new T.Mesh(new T.TorusGeometry(.166,.021,6,20),black);steering.position.set(-.4,1.07,-.493);steering.rotation.x=-.38;car.add(steering);
 rod(car,v(-.4,.89,-.79),v(-.4,1.07,-.493),.022,black);for(const dx of [-.14,.14])rod(car,v(-.4,1.07,-.493),v(-.4+dx,1.07,-.493),.014,chrome);
 box(car,.26,.11,.016,-.40,1.078,-.701,black);for(const x of [-.47,-.34]){const dial=new T.Mesh(new T.CircleGeometry(.041,16),pane);dial.position.set(x,1.083,-.69);car.add(dial);}
 rod(car,v(.05,.39,-.18),v(.05,.66,-.15),.012,chrome);box(car,.045,.045,.055,.05,.675,-.15,black);
 // Pressed steel rims, recessed ventilation holes, sidewalls and wheel arches.
 const wheels=[];for(const s of [-1,1])for(const z of [-1.31,1.33]){
  const wheel=new T.Group();wheel.position.set(s*.826,.35,z);wheel.name='Wheel';car.add(wheel);
  function disc(r,w,m,x=0,segments=24){const o=new T.Mesh(new T.CylinderGeometry(r,r,w,segments),m);o.rotation.z=Math.PI/2;o.position.x=x;wheel.add(o);return o;}
  disc(.335,.192,rubber);disc(.228,.015,black,s*.105);disc(.208,.018,chrome,s*.117);disc(.082,.028,chrome,s*.132);
  for(let k=0;k<12;k++){const a=k*Math.PI/6;const h=disc(.017,.003,black,s*.128,7);h.position.y=Math.cos(a)*.166;h.position.z=Math.sin(a)*.166;}
  for(let k=0;k<5;k++){const a=k*Math.PI*.4;const h=disc(.011,.016,black,s*.150,6);h.position.x=s*.150;h.position.y=Math.cos(a)*.055;h.position.z=Math.sin(a)*.055;}
  wheels.push(wheel);
 }
 // Broad black bumper bars with narrow chrome caps and blank plates.
 for(const z of [-2.135,2.13]){box(car,1.81,.15,.17,0,.478,z,black);box(car,1.65,.022,.175,0,.559,z,chrome);box(car,.48,.156,.023,0,.44,z+(z<0?-.094:.094),paint);}
 box(car,.91,.377,.077,0,.828,-2.084,chrome,'RaisedChromeGrille');box(car,.848,.320,.083,0,.83,-2.094,black);
 for(let i=0;i<7;i++)box(car,.830,.014,.010,0,.692+i*.044,-2.141,chrome);
 for(let i=0;i<9;i++)box(car,.009,.295,.012,-.376+i*.094,.83,-2.147,chrome);
 box(car,.064,.105,.018,0,.831,-2.16,chrome);
 const lamps=[];for(const s of [-1,1]){
  box(car,.365,.292,.036,s*.657,.80,-2.087,black);
  const m=new T.MeshBasicMaterial({color:0x8d9084});lamps.push(m);box(car,.259,.216,.019,s*.613,.806,-2.111,m);
  box(car,.066,.216,.024,s*.790,.806,-2.113,amber);
  for(let i=0;i<7;i++)box(car,.006,.204,.021,s*.613-.11+i*.036,.806,-2.124,chrome);
  box(car,.40,.202,.026,s*.601,.783,2.086,black);box(car,.25,.17,.026,s*.557,.783,2.106,red);box(car,.103,.17,.026,s*.739,.783,2.106,amber);
 }
 // Two wipers and rear-view mirror finish the silhouette without text or badges.
 for(const x of [-.43,.28]){rod(car,v(x,1.086,-1.034),v(x-.16,1.153,-.985),.010,black);rod(car,v(x-.36,1.173,-.973),v(x+.045,1.153,-.985),.014,black);}
 box(car,.22,.072,.043,0,1.457,-.694,black);
 return {car,door,wheels,lamps,interior:{floorY:.29,seatX:-.40,seatZ:.12},materials:{paint,chrome,black,seat}};
};
})(window);
