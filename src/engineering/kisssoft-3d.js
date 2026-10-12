import {getThreeRuntime} from "../model/three-runtime.js?v=468cf42af4c1c5caa1a94dfe6479885dd70b7773";
import {mountStandaloneCADNavigation} from "../model/standalone-cad-navigation.js?v=468cf42af4c1c5caa1a94dfe6479885dd70b7773";
import {conceptualHelicalToothGeometry} from "./gear-visual-shape.js?v=468cf42af4c1c5caa1a94dfe6479885dd70b7773";
import {checkPlanetaryPitch} from "./gear-pitch-checks.js?v=468cf42af4c1c5caa1a94dfe6479885dd70b7773";
import {planetaryRates} from "./kisssoft-motion.js?v=468cf42af4c1c5caa1a94dfe6479885dd70b7773";
/** Concept-only mesh. Tooth blocks are schematic, not involute teeth. */
export async function mountKisssoft3D(target,model){
 if(!model.planetary||!model.consistent)return ()=>{};
 const {THREE,OrbitControls}=await getThreeRuntime();
 if(!target.isConnected)return ()=>{};
 const canvas=document.createElement("canvas");
 canvas.style.cssText="display:block;width:100%;height:400px;border-radius:12px;background:#081820";
 const controlsUI=document.createElement("div");
 controlsUI.className="kisssoft-assembly-controls";
 controlsUI.innerHTML='<label><input type="checkbox" data-gear-housing checked> Show housing</label>'+
  '<label><input type="checkbox" data-gear-carrier checked> Show carrier / shafts</label>'+
  '<label>Explode assembly <input type="range" data-gear-explode min="0" max="100" value="0"></label>'+
  '<label>Boundary condition <select data-gear-boundary aria-label="Ideal planetary boundary condition">'+
  '<option value="ring-fixed" selected>Ring fixed · sun drives</option>'+
  '<option value="sun-fixed">Sun fixed · ring drives</option>'+
  '<option value="carrier-fixed">Carrier fixed · sun drives</option></select></label>'+
  '<button class="btn" type="button" data-gear-play aria-pressed="true">Pause motion</button>'+
  '<label>Speed <input type="range" data-gear-speed min="0.25" max="2" step="0.25" value="0.75"></label>'+
  '<span data-gear-motion-hint>Sun 1× · Ring fixed · Carrier zₛ/(zₛ+zᵣ)×</span>';
 target.replaceChildren(canvas,controlsUI);
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
 const scene=new THREE.Scene();
 scene.background=new THREE.Color(0x081820);
 scene.add(new THREE.HemisphereLight(0xe4f5ff,0x284a64,2.2));
 const directional=new THREE.DirectionalLight(0xffffff,2.5);
 directional.position.set(100,100,160);scene.add(directional);
 const camera=new THREE.PerspectiveCamera(40,1,0.1,3000);
 camera.up.set(0,0,1);
 camera.position.set(245,-265,210);
 const controls=new OrbitControls(camera,canvas);
 controls.target.set(0,0,10);
 controls.enableDamping=false;
 controls.update();
 const solids=[];
 const material=c=>new THREE.MeshStandardMaterial({color:c,metalness:0.45,roughness:0.46,side:THREE.DoubleSide});
 const paints=[material(0x58c4b6),material(0xe3b65b),material(0x8297b0)];
 const carrierPaint=material(0xe8e8ed);
 const housingPaint=new THREE.MeshStandardMaterial({
   color:0x5683a4,metalness:0.3,roughness:0.68,transparent:true,opacity:0.22,
   depthWrite:false,side:THREE.DoubleSide
 });
 paints.push(carrierPaint,housingPaint);
 const layers={
   sun:new THREE.Group(),planets:new THREE.Group(),ring:new THREE.Group(),
   carrier:new THREE.Group(),housing:new THREE.Group()
 };
 Object.values(layers).forEach(group=>scene.add(group));
 const [sun,planet,ring]=model.gears.map(g=>Math.abs(g.teeth));
 const pitch=checkPlanetaryPitch(model);
 const m=model.module,dist=pitch.sunPlanetCenterDistance;
 const beta=Number(model.beta||0);
 canvas.dataset.helixBeta=String(beta);
 let rates=planetaryRates(sun,planet,ring,{mode:"ring-fixed"});
 const planetGroups=[];
 const width=model.gears[0].width>0?model.gears[0].width:35;
 const add=(geometry,mat,x=0,y=0,z=0,rotation=0,part="ring",parent=layers[part])=>{
   const mesh=new THREE.Mesh(geometry,mat);
   mesh.position.set(x,y,z);
   mesh.rotation.z=rotation;
   parent.add(mesh);
   solids.push(mesh);
   return mesh;
 };
 function external(z,x,y,mat,phase,part,hand=beta){
   // Each gear is a separate transform origin. Planet groups orbit with the
   // carrier, while their own local rotation models spin relative to it.
   const gearRoot=new THREE.Group();
   gearRoot.position.set(x,y,0);
   layers[part].add(gearRoot);
   const pitchR=m*z/(2*Math.cos(beta*Math.PI/180)),base=Math.max(1,pitchR-.95*m),count=Math.round(z);
   const hub=add(new THREE.CylinderGeometry(base,base,width,Math.max(48,Math.min(180,count*2))),mat,0,0,width/2,0,part,gearRoot);
   hub.rotation.x=Math.PI/2;
   const radial=m*1.8,tangential=Math.max(.4,2*Math.PI*pitchR/count*.47);
   const geo=conceptualHelicalToothGeometry(THREE,{
     pitchRadius:base+radial*.29,radialSize:radial,
     tangentialSize:tangential,width,helixAngleDeg:hand
   });
   for(let i=0;i<count;i++){
     const theta=phase+2*Math.PI*i/count;
     add(geo,mat,0,0,width/2,theta,part,gearRoot);
   }
   return gearRoot;
 }
 const ringPitch=pitch.ring.pitchRadius,outer=ringPitch+2.5*m,inner=ringPitch-1.2*m;
 const ringShape=new THREE.Shape();
 ringShape.absarc(0,0,outer,0,Math.PI*2,false);
 const hole=new THREE.Path();
 hole.absarc(0,0,inner,0,Math.PI*2,true);
 ringShape.holes.push(hole);
 const ringMesh=new THREE.ExtrudeGeometry(ringShape,{depth:width,bevelEnabled:false,curveSegments:160});
 add(ringMesh,paints[2]);
 const toothGeo=conceptualHelicalToothGeometry(THREE,{
   pitchRadius:inner-.35*m,radialSize:1.6*m,
   tangentialSize:Math.max(.3,Math.PI*m*.48),width,helixAngleDeg:-beta
 });
 for(let i=0;i<ring;i++){
   const theta=2*Math.PI*i/ring;
   add(toothGeo,paints[2],0,0,0);
   const tooth=solids[solids.length-1];
   tooth.position.set(0,0,width/2);
   tooth.rotation.z=theta;
 }
 external(sun,0,0,paints[0],0,"sun",beta);
 for(const a of [0,2*Math.PI/3,4*Math.PI/3])
   planetGroups.push(external(planet,dist*Math.cos(a),dist*Math.sin(a),paints[1],a*.2,"planets",-beta));
 // The following casing, bearings and shafts are illustrative only. KISSsoft
 // parameters do not specify their actual dimensions or assembly layout.
 const plateRadius=dist+Math.max(2,m);
 for(const z of [-m,width+m]){
   add(new THREE.TorusGeometry(plateRadius,Math.max(1,m*1.15),10,96),carrierPaint,0,0,z,0,"carrier");
 }
 for(const angle of [0,2*Math.PI/3,4*Math.PI/3]){
   const x=dist*Math.cos(angle),y=dist*Math.sin(angle);
   const bearing=add(new THREE.CylinderGeometry(Math.max(2,m*2),Math.max(2,m*2),width+5*m,20),
      carrierPaint,x,y,width/2,0,"carrier");
   bearing.rotation.x=Math.PI/2;
 }
 const shaft=add(new THREE.CylinderGeometry(Math.max(3,m*3),Math.max(3,m*3),width+14*m,36),
   carrierPaint,0,0,width/2,0,"carrier");
 shaft.rotation.x=Math.PI/2;
 for(const z of [-2*m,width+2*m]){
   add(new THREE.TorusGeometry(outer+4*m,Math.max(2,m*2),12,96),
       housingPaint,0,0,z,0,"housing");
 }
 const housingBarrel=add(
   new THREE.CylinderGeometry(outer+4*m,outer+4*m,width+8*m,96,1,true),
   housingPaint,0,0,width/2,0,"housing");
 housingBarrel.rotation.x=Math.PI/2;
 const showHousing=controlsUI.querySelector("[data-gear-housing]");
 const showCarrier=controlsUI.querySelector("[data-gear-carrier]");
 const explode=controlsUI.querySelector("[data-gear-explode]");
 const playButton=controlsUI.querySelector("[data-gear-play]");
 const speedInput=controlsUI.querySelector("[data-gear-speed]");
 const boundary=controlsUI.querySelector("[data-gear-boundary]");
 const motionHint=controlsUI.querySelector("[data-gear-motion-hint]");
 const updateHint=()=>{
   motionHint.textContent=`Illustrative ${boundary.value} · sun ${rates.sun.toFixed(3)}× · ring ${rates.ring.toFixed(3)}× · carrier ${rates.carrier.toFixed(3)}× · planet ${rates.planet.toFixed(3)}× · Willis residual ${rates.closureResidual.toExponential(1)}`;
 };
 updateHint();
 const updateAssembly=()=>{
   layers.housing.visible=showHousing.checked;
   layers.carrier.visible=showCarrier.checked;
   const amount=Number(explode.value)/100;
   layers.sun.position.z=amount*width*.6;
   layers.planets.position.z=-amount*width*.2;
   layers.ring.position.z=-amount*width*.52;
   layers.carrier.position.z=amount*width*1.05;
   layers.housing.position.z=-amount*width*1.35;
   draw();
 };
 const ground=new THREE.GridHelper(2.5*outer,10,0x355269,0x294154);
 ground.rotation.x=Math.PI/2;ground.position.z=-1.5;scene.add(ground);
 let disposed=false;
 let viewportWidth=0;
 const draw=()=>{
   if(disposed)return;
   const w=Math.max(target.clientWidth,270),h=400;
   if(w!==viewportWidth){
     viewportWidth=w;
     renderer.setSize(w,h,false);
     camera.aspect=w/h;
     camera.updateProjectionMatrix();
   }
   renderer.render(scene,camera);
 };
 const cameraNav=mountStandaloneCADNavigation({
   THREE,camera,controls,canvas,toolbar:controlsUI,draw,
   onExplode:restore=>{
     explode.value=restore?"0":Number(explode.value)>0?"0":"55";
     updateAssembly();
   }
 });
 // A purely illustrative constant-speed animation. The tooth-count ratios
 // follow the selected ideal boundary condition; RPM is normalized and
 // neither loads nor measured KISSsoft speeds are implied.
 const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches||false;
 let playing=!reducedMotion;
 let previousFrame=null;
 let phase=0;
 let animationFrame=0;
 const updatePhase=()=>{
   layers.sun.rotation.z=rates.sun*phase;
   layers.ring.rotation.z=rates.ring*phase;
   layers.carrier.rotation.z=rates.carrier*phase;
   layers.planets.rotation.z=rates.carrier*phase;
   for(const gear of planetGroups)gear.rotation.z=rates.planetRelativeCarrier*phase;
   // Expose model-space angles for deterministic browser regression checks.
   canvas.dataset.sunAngle=String(rates.sun*phase);
   canvas.dataset.ringAngle=String(rates.ring*phase);
   canvas.dataset.carrierAngle=String(rates.carrier*phase);
   canvas.dataset.planetSpin=String(rates.planetRelativeCarrier*phase);
 };
 const stopLoop=()=>{
   if(animationFrame)cancelAnimationFrame(animationFrame);
   animationFrame=0;
   previousFrame=null;
 };
 const loop=now=>{
   animationFrame=0;
   if(disposed||!playing||document.hidden)return;
   const dt=previousFrame===null?0:Math.min(.075,Math.max(0,(now-previousFrame)/1000));
   previousFrame=now;
   phase+=dt*0.82*Number(speedInput.value);
   updatePhase();
   draw();
   animationFrame=requestAnimationFrame(loop);
 };
 const startLoop=()=>{
   if(disposed||!playing||document.hidden||animationFrame)return;
   previousFrame=null;
   animationFrame=requestAnimationFrame(loop);
 };
 const setPlaying=value=>{
   playing=Boolean(value);
   playButton.setAttribute("aria-pressed",String(playing));
   playButton.textContent=playing?"Pause motion":"Play motion";
   if(playing)startLoop();else stopLoop();
 };
 playButton.addEventListener("click",()=>setPlaying(!playing));
 boundary.addEventListener("change",()=>{
   rates=planetaryRates(sun,planet,ring,{mode:boundary.value});
   phase=0;previousFrame=null;updatePhase();updateHint();draw();
 });
 const visibility=()=>{if(document.hidden)stopLoop();else startLoop();};
 document.addEventListener("visibilitychange",visibility);
 controls.addEventListener("change",draw);
 for(const control of [showHousing,showCarrier,explode])
   control.addEventListener("input",updateAssembly);
 const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(draw):null;
 observer?.observe(target);
 updatePhase();
 draw();
 setPlaying(playing);
 return ()=>{
   disposed=true;
   stopLoop();
   document.removeEventListener("visibilitychange",visibility);
   observer?.disconnect();
   cameraNav.dispose();
   controls.removeEventListener("change",draw);
   controls.dispose();
   for(const item of solids)item.parent?.remove(item);
   for(const geometry of new Set(solids.map(item=>item.geometry)))geometry.dispose();
   paints.forEach(mat=>mat.dispose());renderer.dispose();renderer.forceContextLoss();
 };
}
