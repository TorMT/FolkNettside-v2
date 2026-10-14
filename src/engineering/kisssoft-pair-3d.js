import {getThreeRuntime} from "../model/three-runtime.js?v=bcbda2770f311c5ecf06e6b0fcbdc44951da6c2e";
import {mountStandaloneCADNavigation} from "../model/standalone-cad-navigation.js?v=bcbda2770f311c5ecf06e6b0fcbdc44951da6c2e";
import {externalGearPair} from "./gear-pitch-checks.js?v=bcbda2770f311c5ecf06e6b0fcbdc44951da6c2e";
import {conceptualHelicalToothGeometry} from "./gear-visual-shape.js?v=bcbda2770f311c5ecf06e6b0fcbdc44951da6c2e";
import {gearPairFraming} from "./gear-pair-camera.js?v=bcbda2770f311c5ecf06e6b0fcbdc44951da6c2e";

/** Visual approximation for a non-planetary external pair; not KISSsoft CAD. */
export async function mountKisssoftPair3D(target,model){
 const pair=externalGearPair(model);
 if(!pair)return ()=>{};
 const {THREE,OrbitControls}=await getThreeRuntime();
 if(!target.isConnected)return ()=>{};
 const canvas=document.createElement("canvas");
 canvas.dataset.helixBeta=String(Number(model.beta||0));
 canvas.style.cssText="display:block;width:100%;height:400px;border-radius:10px;background:#081820";
 const panel=document.createElement("div");
 panel.className="kisssoft-assembly-controls";
 panel.innerHTML='<button type="button" class="btn" data-gear-play>Pause motion</button>'+
   '<label>Speed <input data-gear-speed type="range" min=".25" max="2" step=".25" value=".75"></label>'+
   '<label>Explode pair <input data-pair-explode type="range" min="0" max="100" value="0"></label>'+
   '<span>'+(pair.internal?'Internal ring/pinion':'External pair')+' · Driver +1× · Driven '+pair.velocityRatio.toFixed(3)+'× · schematic teeth</span>';
 target.replaceChildren(canvas,panel);
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x081820);
 scene.add(new THREE.HemisphereLight(0xd8ecf7,0x243e52,2.1));
 const sunLight=new THREE.DirectionalLight(0xffffff,2.5);
 sunLight.position.set(100,130,240);scene.add(sunLight);
 const framing=gearPairFraming(pair,{aspect:Math.max(.4,target.clientWidth||600)/400});
 const camera=new THREE.PerspectiveCamera(40,1,framing.near,framing.far);
 camera.up.set(0,0,1);
 camera.position.set(
   framing.center[0]+framing.direction[0]*framing.distance/Math.hypot(...framing.direction),
   framing.center[1]+framing.direction[1]*framing.distance/Math.hypot(...framing.direction),
   framing.center[2]+framing.direction[2]*framing.distance/Math.hypot(...framing.direction)
 );
 const orbit=new OrbitControls(camera,canvas);
 orbit.target.set(...framing.center);orbit.update();
 canvas.dataset.cameraFar=String(camera.far);
 canvas.dataset.cameraDistance=String(camera.position.distanceTo(orbit.target));
 canvas.dataset.meshKind=pair.internal?"internal":"external";
 const gears=[],materials=[],geometries=[];
 function makeGear(geometry,faceWidth,centerX,color,angle){
   const group=new THREE.Group();group.position.x=centerX;scene.add(group);gears.push(group);
   const material=new THREE.MeshStandardMaterial({color,metalness:.48,roughness:.42});
   materials.push(material);
   const baseRadius=Math.max(1,geometry.pitchRadius-.95*model.module);
   const hubGeom=new THREE.CylinderGeometry(baseRadius,baseRadius,faceWidth,Math.min(160,Math.max(48,geometry.teeth*2)));
   geometries.push(hubGeom);
   const hub=new THREE.Mesh(hubGeom,material);hub.rotation.x=Math.PI/2;hub.position.z=faceWidth/2;group.add(hub);
   const tooth=conceptualHelicalToothGeometry(THREE,{
     pitchRadius:baseRadius,radialSize:model.module*1.8,
     tangentialSize:Math.PI*geometry.transverseModule*.43,width:faceWidth,helixAngleDeg:angle
   });
   geometries.push(tooth);
   for(let i=0;i<geometry.teeth;i++){
     const mesh=new THREE.Mesh(tooth,material);
     mesh.position.z=faceWidth/2;
     mesh.rotation.z=i*2*Math.PI/geometry.teeth;
     group.add(mesh);
   }
 }
 function makeInternalRing(){
   const rp=pair.b.pitchRadius,m=pair.b.normalModule;
   const group=new THREE.Group();
   scene.add(group);gears.push(group);
   const material=new THREE.MeshStandardMaterial({color:0x96a9c8,metalness:.46,roughness:.52,side:THREE.DoubleSide});
   materials.push(material);
   const outer=rp+4*m,inner=rp+.45*m;
   const shape=new THREE.Shape();
   shape.absarc(0,0,outer,0,Math.PI*2,false);
   const hole=new THREE.Path();
   hole.absarc(0,0,inner,0,Math.PI*2,true);
   shape.holes.push(hole);
   const rim=new THREE.ExtrudeGeometry(shape,{depth:pair.shaft2Width,bevelEnabled:false,curveSegments:128});
   geometries.push(rim);group.add(new THREE.Mesh(rim,material));
   const tooth=conceptualHelicalToothGeometry(THREE,{
     pitchRadius:rp,radialSize:m*1.8,
     tangentialSize:Math.PI*pair.b.transverseModule*.43,
     width:pair.shaft2Width,
     helixAngleDeg:pair.a.helixAngleDeg // internal mesh: same helix hand
   });
   geometries.push(tooth);
   for(let i=0;i<pair.b.teeth;i++){
     const mesh=new THREE.Mesh(tooth,material);
     mesh.position.z=pair.shaft2Width/2;
     mesh.rotation.z=i*2*Math.PI/pair.b.teeth;
     group.add(mesh);
   }
 }
 if(pair.internal){
   makeGear(pair.a,pair.shaft1Width,pair.centerDistance,0x65d0c1,pair.a.helixAngleDeg);
   makeInternalRing();
 }else{
   makeGear(pair.a,pair.shaft1Width,-pair.b.pitchRadius,0x65d0c1,pair.a.helixAngleDeg);
   makeGear(pair.b,pair.shaft2Width,pair.a.pitchRadius,0xdfb66a,-pair.b.helixAngleDeg);
 }
 let viewportWidth=0,disposed=false,frame=0,phase=0,previous=null;
 const play=panel.querySelector("[data-gear-play]"),speed=panel.querySelector("[data-gear-speed]");
 let playing=!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
 const explode=panel.querySelector("[data-pair-explode]");
 const draw=()=>{
   if(disposed)return;
   const width=Math.max(280,target.clientWidth);
   if(width!==viewportWidth){
     viewportWidth=width;renderer.setSize(width,400,false);camera.aspect=width/400;
     const next=gearPairFraming(pair,{aspect:camera.aspect});
     const direction=camera.position.clone().sub(orbit.target).normalize();
     const distance=camera.position.distanceTo(orbit.target);
     // Keep the user's zoom after the first fit; only re-fit when the canvas changes size.
     if(!canvas.dataset.firstFit){
       camera.position.copy(orbit.target).addScaledVector(direction,next.distance);
       canvas.dataset.firstFit="true";
     }else if(distance>next.far*.7){
       camera.position.copy(orbit.target).addScaledVector(direction,next.distance);
     }
     camera.far=next.far;camera.near=next.near;
     canvas.dataset.cameraDistance=String(camera.position.distanceTo(orbit.target));
     canvas.dataset.cameraFar=String(camera.far);
     camera.updateProjectionMatrix();
   }
   renderer.render(scene,camera);
 };
 const explodePair=()=>{
   const amount=Number(explode.value)/100;
   gears[0].position.z=amount*pair.shaft1Width*1.4;
   gears[1].position.z=-amount*pair.shaft2Width*1.4;
   draw();
 };
 explode.addEventListener("input",explodePair);
 const cameraNav=mountStandaloneCADNavigation({
   THREE,camera,controls:orbit,canvas,toolbar:panel,draw,
   onExplode:restore=>{
     explode.value=restore?"0":Number(explode.value)>0?"0":"60";
     explodePair();
   }
 });
 const spin=time=>{
   frame=0;
   if(disposed||!playing||document.hidden)return;
   const delta=previous===null?0:Math.max(0,Math.min(.08,(time-previous)/1000));
   previous=time;
   phase+=delta*.9*Number(speed.value);
   gears[0].rotation.z=phase;
   gears[1].rotation.z=phase*pair.velocityRatio;
   canvas.dataset.driverAngle=String(phase);
   canvas.dataset.drivenAngle=String(gears[1].rotation.z);
   draw();
   frame=requestAnimationFrame(spin);
 };
 const stop=()=>{if(frame)cancelAnimationFrame(frame);frame=0;previous=null};
 const start=()=>{if(!disposed&&playing&&!document.hidden&&!frame)frame=requestAnimationFrame(spin)};
 const sync=()=>{play.textContent=playing?"Pause motion":"Play motion";play.setAttribute("aria-pressed",String(playing));if(playing)start();else stop()};
 const onClick=()=>{playing=!playing;sync()};
 const visibility=()=>{if(document.hidden)stop();else start()};
 play.addEventListener("click",onClick);
 document.addEventListener("visibilitychange",visibility);
 orbit.addEventListener("change",draw);
 const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(draw):null;
 observer?.observe(target);draw();sync();
 return ()=>{
   disposed=true;stop();observer?.disconnect();
   document.removeEventListener("visibilitychange",visibility);
   play.removeEventListener("click",onClick);
   cameraNav.dispose();
   orbit.removeEventListener("change",draw);orbit.dispose();
   geometries.forEach(geo=>geo.dispose());materials.forEach(mat=>mat.dispose());
   renderer.dispose();renderer.forceContextLoss();
 };
}
