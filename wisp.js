
/* NovaWisp: fixed-size, textured Three.js entity. The caller owns faceTexture. */
(() => {
  'use strict';
  const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  window.NovaWisp = class NovaWisp {
    constructor({scene,faceTexture,position=new THREE.Vector3(0,1.6,0),seed=2}) {
      this.home=position.clone();this.group=new THREE.Group();this.group.position.copy(position);scene.add(this.group);
      this.time=0;this.seed=seed;this.distance=20;this.textureReady=false;this.disposed=false;this.reveal=0;
      this.radiance={value:1};
      this.head=new THREE.Group();this.group.add(this.head);
      // A dark back surface, never a luminous sphere in front of the photograph.
      this.skullMaterial=new THREE.MeshBasicMaterial({color:0x030507});
      this.skull=new THREE.Mesh(new THREE.SphereGeometry(1,12,9),this.skullMaterial);
      this.skull.scale.set(.139,.137,.075);this.skull.position.z=-.035;this.head.add(this.skull);
      this.faceWidth=.34;this.faceHeight=this.faceWidth*262/297;
      const geo=new THREE.PlaneGeometry(this.faceWidth,this.faceHeight,10,12),p=geo.attributes.position;
      for(let i=0;i<p.count;i++){
        const x=p.getX(i)/(this.faceWidth*.5),y=p.getY(i)/(this.faceHeight*.5);
        p.setZ(i,.025+Math.sqrt(Math.max(0,1-x*x*.84-y*y*.74))*.071);
      }
      geo.computeVertexNormals();
      // Keep the loader-returned texture: an early r128 clone never gets its image.
      this.faceMap=faceTexture;
      this.faceMaterial=new THREE.MeshBasicMaterial({map:faceTexture,color:0xffffff,transparent:true,opacity:1,alphaTest:.02,depthWrite:true,side:THREE.DoubleSide});
      this.faceMaterial.onBeforeCompile=s=>{
        s.uniforms.wispRadiance=this.radiance;
        s.vertexShader='varying vec2 portraitUV;\n'+s.vertexShader;
        s.vertexShader=s.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nportraitUV=uv;');
        s.fragmentShader='varying vec2 portraitUV;uniform float wispRadiance;\n'+s.fragmentShader;
        s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`
          vec2 cropUV=vec2(74.0/371.0,49.0/319.0)+portraitUV*vec2(297.0/371.0,262.0/319.0);
          vec4 portrait=mapTexelToLinear(texture2D(map,cropUV));
          float gray=dot(portrait.rgb,vec3(.2126,.7152,.0722));
          vec3 faceColor=gray*.90*vec3(.72,.88,1.0);
          vec2 local=(portraitUV-.5)*2.;
          float softCenter=.90+.10*exp(-dot(local,local)*2.0);
          vec3 overexposed=vec3(.46,.76,1.18)*softCenter;
          diffuseColor.rgb*=mix(faceColor,overexposed,wispRadiance);
          diffuseColor.a*=portrait.a;
        `);
        s.fragmentShader=s.fragmentShader.replace('#include <alphatest_fragment>',`
          vec2 ellipse=(portraitUV-.5)*2.;
          float edge=length(ellipse*vec2(1.02,1.01));
          diffuseColor.a*=1.-smoothstep(.92,1.,edge);
          #include <alphatest_fragment>
        `);
      };
      this.face=new THREE.Mesh(geo,this.faceMaterial);this.face.renderOrder=3;this.head.add(this.face);
      // Fixed dimensions; only the blue-white radiance changes with distance.
      this.haloMaterial=new THREE.ShaderMaterial({
        uniforms:{strength:{value:.43},time:{value:0}},
        vertexShader:'varying vec2 vUv;void main(){vUv=uv;vec4 c=modelViewMatrix*vec4(0.,0.,0.,1.);c.xy+=position.xy;gl_Position=projectionMatrix*c;}',
        fragmentShader:'varying vec2 vUv;uniform float strength;uniform float time;void main(){vec2 p=(vUv-.5)*2.;p.x+=sin(p.y*6.+time*.2)*.025;float r=length(vec2(p.x,p.y*.95));float a=exp(-r*r*4.9)*(1.-smoothstep(.45,1.,r));gl_FragColor=vec4(.25,.59,1.,a*strength);}',
        transparent:true,depthWrite:false,blending:THREE.AdditiveBlending
      });
      this.halo=new THREE.Mesh(new THREE.PlaneGeometry(.60,.66),this.haloMaterial);this.halo.frustumCulled=false;this.halo.renderOrder=1;this.group.add(this.halo);
      this.light=new THREE.PointLight(0x74baff,.09,2.1,2);this.group.add(this.light);
      this.target=new THREE.Vector3();this.lookMatrix=new THREE.Matrix4();this.lookQuaternion=new THREE.Quaternion();this.up=new THREE.Vector3(0,1,0);
      this.face.visible=this.skull.visible=this.halo.visible=false;
    }
    update(dt,camera){
      if(this.disposed)return;this.time+=dt;const t=this.time;
      // Very small sideways/vertical drift. No forward-backward lurching.
      this.group.position.set(this.home.x+Math.sin(t*.17+this.seed)*.12,this.home.y+Math.sin(t*.50)*.047,this.home.z);
      this.distance=this.group.position.distanceTo(camera.position);
      this.reveal=1-smooth(.60,1.35,this.distance);
      this.radiance.value=1-this.reveal;
      this.haloMaterial.uniforms.strength.value=.065+.365*this.radiance.value;
      this.haloMaterial.uniforms.time.value=t;
      const im=this.faceMap.image;
      this.textureReady=!!(im&&(im.naturalWidth||im.width)>0&&(im.naturalHeight||im.height)>0);
      this.face.visible=this.skull.visible=this.halo.visible=this.textureReady;
      this.light.visible=this.textureReady;
      this.target.copy(camera.position);
      this.lookMatrix.lookAt(this.target,this.group.position,this.up);
      this.lookQuaternion.setFromRotationMatrix(this.lookMatrix);
      this.head.quaternion.copy(this.lookQuaternion);
    }
    reset(){this.time=0;this.group.position.copy(this.home);}
    getState(){return{position:this.group.position.toArray(),distance:this.distance,textureReady:this.textureReady,reveal:this.textureReady?this.reveal:0,radiance:this.radiance.value,faceSize:[this.faceWidth,this.faceHeight],scale:this.group.scale.toArray()};}
    dispose(){if(this.disposed)return;this.disposed=true;this.group.parent?.remove(this.group);this.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
  };
})();

