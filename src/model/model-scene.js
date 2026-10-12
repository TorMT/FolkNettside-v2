import {getThreeRuntime} from "./three-runtime.js?v=14a9d4ba470b2c648034ccaade17875ed0a07cac";
import {modelWaterlineContours} from "./waterline-preview.js?v=14a9d4ba470b2c648034ccaade17875ed0a07cac";
import {normaliseWaveCase,waveElevation} from "./wave-core.js?v=14a9d4ba470b2c648034ccaade17875ed0a07cac";
import {waveModelPose} from "./wave-model-motion.js?v=14a9d4ba470b2c648034ccaade17875ed0a07cac";
import {interpolateMotionRAO,motionFromRAO} from "./motion-rao.js?v=14a9d4ba470b2c648034ccaade17875ed0a07cac";
import {stressAtHullPoint,stressRGB,stressLegend} from "../structure/hull-contours.js?v=14a9d4ba470b2c648034ccaade17875ed0a07cac";
import {createThrusterFlowRings} from "./thruster-flow-rings.js?v=14a9d4ba470b2c648034ccaade17875ed0a07cac";
import {explodeOffsets} from "./explode-layout.js?v=14a9d4ba470b2c648034ccaade17875ed0a07cac";
import {connectCADKeyboard} from "./cad-navigation.js?v=14a9d4ba470b2c648034ccaade17875ed0a07cac";
import {fitDistanceForBox} from "./cad-camera-fit.js?v=14a9d4ba470b2c648034ccaade17875ed0a07cac";

export async function mountModelScene(container,documentModel,options={}){
  const {showSidebar=true,onSelect=null,onMeasurements=null,selectedComponentId=null}=options;
  const {THREE,OrbitControls}=await getThreeRuntime();

  const stage=document.createElement("div");
  stage.className="three-stage"+(showSidebar?"":" three-stage-no-sidebar");
  const canvas=document.createElement("canvas");
  canvas.className="three-canvas";
  canvas.tabIndex=0;
  canvas.setAttribute("aria-label","3D CAD viewer. Left drag orbit, middle drag pan, Shift-middle drag orbit; press F to fit and I for isometric view.");
  const sidebar=showSidebar?document.createElement("div"):null;
  if(sidebar)sidebar.className="three-components";
  stage.append(canvas);
  if(sidebar)stage.append(sidebar);
  container.replaceChildren(stage);

  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.localClippingEnabled=true;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x081820);
  scene.up.set(0,0,1);
  const camera=new THREE.PerspectiveCamera(45,1,0.001,100000);
  camera.up.set(0,0,1);
  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=false;
  controls.screenSpacePanning=true;
  // Fusion-style navigation preset: middle mouse pans, Shift + middle orbits.
  controls.mouseButtons.MIDDLE=THREE.MOUSE.PAN;
  scene.add(new THREE.HemisphereLight(0xd8edf5,0x24313a,2.2));
  const key=new THREE.DirectionalLight(0xffffff,2.4);
  key.position.set(4,6,8);
  scene.add(key);

  const alignmentGroup=new THREE.Group();
  const waveMotionGroup=new THREE.Group();
  const attitudeGroup=new THREE.Group();
  const root=new THREE.Group();
  scene.add(alignmentGroup);
  alignmentGroup.add(waveMotionGroup);
  waveMotionGroup.add(attitudeGroup);
  attitudeGroup.add(root);
  const meshes=[];
  const scale=documentModel.unitScaleToMeters||1;
  const baseColor=new THREE.Color(0x8aa7b5);
  let appearanceOpacity=1;
  let selectedMesh=null;
  let hullContourOn=false;

  for(const component of documentModel.components){
    if(!component.geometry)continue;
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.BufferAttribute(new Float32Array(component.geometry.positions.map(value=>value*scale)),3));
    if(component.geometry.indices?.length)geometry.setIndex(component.geometry.indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const material=new THREE.MeshStandardMaterial({color:baseColor.clone(),roughness:.72,metalness:.06});
    const mesh=new THREE.Mesh(geometry,material);
    mesh.userData.component=component;
    if(component.transform){
      const matrix=new THREE.Matrix4().fromArray(component.transform);
      matrix.elements[12]*=scale;
      matrix.elements[13]*=scale;
      matrix.elements[14]*=scale;
      mesh.applyMatrix4(matrix);
    }
    root.add(mesh);
    mesh.userData.restPosition=mesh.position.clone();
    meshes.push(mesh);
  }

  const thrusterFlows=createThrusterFlowRings(THREE,root,{draw});
  function bounds(){
    root.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(root);
    const center=box.getCenter(new THREE.Vector3());
    const size=box.getSize(new THREE.Vector3());
    const radius=Math.max(size.length()/2,.1);
    return {box,center,size,radius};
  }

  // Rotate visual heel and trim about the imported hull rather than (0,0,0).
  const attitudePivot=bounds().center.clone();
  let explodedFactor=0,scopedExplodeFactor=0,scopedExplodeIds=[];
  let isolatedIds=null;
  const axesHelper=new THREE.AxesHelper(Math.max(bounds().radius*.55,.5));
  axesHelper.visible=false;scene.add(axesHelper);
  const boxHelper=new THREE.Box3Helper(bounds().box.clone(),0xe3b25f);
  boxHelper.visible=false;scene.add(boxHelper);
  const edgeLines=[];
  for(const mesh of meshes){
    const geometry=new THREE.EdgesGeometry(mesh.geometry,25);
    const material=new THREE.LineBasicMaterial({color:0x3ee4ed,transparent:true,opacity:.5});
    const edges=new THREE.LineSegments(geometry,material);
    edges.visible=false;mesh.add(edges);edgeLines.push(edges);
  }
  function updateBoxHelper(){
    if(boxHelper.visible){
      boxHelper.box.copy(bounds().box);boxHelper.updateMatrixWorld(true);
    }
  }
  function setAxes(visible=false){axesHelper.visible=Boolean(visible);draw()}
  function setBoundingBox(visible=false){
    boxHelper.visible=Boolean(visible);updateBoxHelper();draw();
  }
  function setEdges(visible=false){edgeLines.forEach(line=>line.visible=Boolean(visible));draw()}
  function setShading(mode="smooth"){
    if(!["smooth","flat"].includes(mode))throw new Error("Unsupported 3D shading");
    for(const mesh of meshes){mesh.material.flatShading=mode==="flat";mesh.material.needsUpdate=true}
    draw();
  }
  function hydroVisualState(){
    if(explodedFactor>0||scopedExplodeFactor>0||isolatedIds!==null){
      clearContours();
      contourGroup.visible=false;waterlineMesh.visible=false;
      waterlineInfo={status:"visual-only",loops:[],segments:0,
        reason:"Exploded/isolated view is visual only. Reset assembly for original-hull Hydro."};
    }else{
      contourGroup.visible=!waveMesh.visible;
      waterlineMesh.visible=waterlineState.visible&&!waveMesh.visible;
      refreshWaterlineContours();
    }
  }
  function refreshExplodedMeshes(){
    // Always start with immutable CAD transforms; the model document and
    // numerical Hydro/FEM inputs are never modified by this visual control.
    for(const mesh of meshes)mesh.position.copy(mesh.userData.restPosition);
    root.updateMatrixWorld(true);
    const boxes=meshes.map(mesh=>new THREE.Box3().setFromObject(mesh));
    const box=new THREE.Box3();
    for(const b of boxes)box.union(b);
    const span=Math.max(box.getSize(new THREE.Vector3()).length(),.1);
    const centres=boxes.map(b=>b.getCenter(new THREE.Vector3()).toArray());
    const global=explodeOffsets(centres,explodedFactor,{span});
    meshes.forEach((mesh,i)=>mesh.position.add(new THREE.Vector3(...global[i])));
    const chosen=meshes.map((mesh,i)=>({mesh,i}))
      .filter(x=>scopedExplodeIds.includes(x.mesh.userData.component.id));
    if(chosen.length&&scopedExplodeFactor>0){
      const offsets=explodeOffsets(chosen.map(x=>centres[x.i]),scopedExplodeFactor,{span});
      chosen.forEach(({mesh},i)=>mesh.position.add(new THREE.Vector3(...offsets[i])));
    }
    root.updateMatrixWorld(true);updateBoxHelper();
    hydroVisualState();draw();
  }
  function setExplode(value=0){
    const n=Number(value);
    if(!Number.isFinite(n)||n<0||n>3)throw Error("Explode factor must be in [0,3]");
    explodedFactor=n;refreshExplodedMeshes();
    return {factor:n,components:meshes.length};
  }
  function setScopedExplode({ids=[],amount=0}={}){
    const factor=Number(amount);
    const valid=new Set(meshes.map(mesh=>mesh.userData.component.id));
    if(!Number.isFinite(factor)||factor<0||factor>3)throw Error("Scoped explode factor must be in [0,3]");
    if(!Array.isArray(ids)||ids.some(id=>!valid.has(id)))throw Error("Unknown CAD components for scoped explode");
    scopedExplodeFactor=factor;scopedExplodeIds=[...new Set(ids)];
    refreshExplodedMeshes();return {factor,components:scopedExplodeIds.length};
  }
  function setIsolation(ids=null){
    const valid=new Set(meshes.map(mesh=>mesh.userData.component.id));
    if(ids!==null&&(!Array.isArray(ids)||ids.some(id=>!valid.has(id))))
      throw Error("Unknown CAD components for isolation");
    isolatedIds=ids===null?null:new Set(ids);
    for(const mesh of meshes)mesh.visible=isolatedIds===null||
      isolatedIds.has(mesh.userData.component.id);
    hydroVisualState();draw();
    return {isolated:isolatedIds!==null,visible:meshes.filter(mesh=>mesh.visible).length};
  }
  function focusComponents(ids=[]){
    const selection=new Set(ids);
    const box=new THREE.Box3();
    let count=0;
    for(const mesh of meshes){
      if(!selection.has(mesh.userData.component.id))continue;
      box.expandByObject(mesh);count++;
    }
    if(!count||box.isEmpty())return null;
    const target=box.getCenter(new THREE.Vector3());
    const radius=Math.max(box.getSize(new THREE.Vector3()).length()/2,.02);
    const direction=camera.position.clone().sub(controls.target).normalize();
    controls.target.copy(target);
    const size=box.getSize(new THREE.Vector3());
    const aspect=Math.max(.15,(canvas.clientWidth||800)/(canvas.clientHeight||540));
    const distance=fitDistanceForBox(size.toArray(),direction.toArray(),{aspect,fovDeg:camera.fov});
    camera.position.copy(target).addScaledVector(direction,distance);
    controls.update();draw();
    return {count,center:target.toArray()};
  }
  const markerGroup=new THREE.Group();scene.add(markerGroup);
  function setMarkers({cg=null,cb=null}={}){
    for(const marker of [...markerGroup.children]){
      markerGroup.remove(marker);marker.geometry.dispose();marker.material.dispose();
    }
    const size=Math.max(bounds().radius/45,.03);
    for(const [name,coord,color] of [["CG",cg,0xe8ab46],["CB",cb,0x20d4d9]]){
      if(!Array.isArray(coord)||coord.length!==3||!coord.every(Number.isFinite))continue;
      const sphere=new THREE.Mesh(new THREE.SphereGeometry(size,14,10),
        new THREE.MeshBasicMaterial({color,depthTest:false}));
      sphere.name=name;sphere.position.set(...coord);markerGroup.add(sphere);
    }
    draw();
  }

  let currentBounds=bounds();
  const canonicalDirection=new THREE.Vector3(1.7,-1.8,1.25).normalize();

  function draw(){renderer.render(scene,camera)}

  function placeCamera(direction){
    currentBounds=bounds();
    const dir=direction.clone().normalize();
    // SpaceMouse roll changes camera.up. Restore a deterministic up vector for
    // named views; near-vertical Top needs Y-up to avoid an undefined basis.
    camera.up.set(0,Math.abs(dir.z)>.98?1:0,Math.abs(dir.z)>.98?0:1);
    const aspect=Math.max(.15,(canvas.clientWidth||800)/(canvas.clientHeight||540));
    const distance=fitDistanceForBox(currentBounds.size.toArray(),dir.toArray(),
      {aspect,fovDeg:camera.fov});
    controls.target.copy(currentBounds.center);
    camera.position.copy(currentBounds.center).add(dir.multiplyScalar(distance));
    camera.near=Math.max(.0001,Math.min(currentBounds.radius/1000,distance/5000));
    camera.far=Math.max(currentBounds.radius*100,distance*50,100);
    camera.updateProjectionMatrix();
    controls.update();
    draw();
  }

  function resetView(){placeCamera(canonicalDirection)}

  function fitView(){
    const direction=camera.position.clone().sub(controls.target);
    if(direction.lengthSq()<1e-12)direction.copy(canonicalDirection);
    placeCamera(direction);
  }

  function navigate3D({pan=[0,0,0],orbit=[0,0,0],zoom:zoomFactor=1}={}){
    if(![...pan,...orbit,zoomFactor].every(Number.isFinite))
      throw Error("CAD camera values must be finite");
    // Camera-relative translation and rotation, not physical model transforms.
    camera.updateMatrixWorld(true);
    const distance=Math.max(camera.position.distanceTo(controls.target),.05);
    const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0).normalize();
    const up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1).normalize();
    const forward=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,2).negate().normalize();
    const shift=right.clone().multiplyScalar(pan[0]*distance)
      .addScaledVector(up,pan[1]*distance)
      .addScaledVector(forward,pan[2]*distance);
    camera.position.add(shift);controls.target.add(shift);
    const offset=camera.position.clone().sub(controls.target);
    if(orbit[1])offset.applyAxisAngle(camera.up.clone().normalize(),orbit[1]);
    if(orbit[0])offset.applyAxisAngle(right,orbit[0]);
    if(orbit[2]){
      // SpaceMouse sixth axis: roll around optical axis changes camera up.
      camera.up.applyAxisAngle(forward,orbit[2]).normalize();
    }
    if(!(zoomFactor>0))throw Error("CAD zoom must be positive");
    offset.multiplyScalar(Math.max(.08,Math.min(12,zoomFactor)));
    const min=Math.max(currentBounds.radius*.01,.005);
    if(offset.length()<min)offset.setLength(min);
    camera.position.copy(controls.target).add(offset);
    controls.update();draw();
    return {position:camera.position.toArray(),target:controls.target.toArray(),up:camera.up.toArray()};
  }
  function cameraState(){
    return {position:camera.position.toArray(),target:controls.target.toArray(),up:camera.up.toArray()};
  }

  function zoom(factor){
    const delta=camera.position.clone().sub(controls.target);
    const length=Math.max(.001,delta.length()*Number(factor||1));
    delta.normalize().multiplyScalar(length);
    camera.position.copy(controls.target).add(delta);
    controls.update();
    draw();
  }

  const viewDirections={
    iso:canonicalDirection,
    front:new THREE.Vector3(0,-1,0),
    rear:new THREE.Vector3(0,1,0),
    port:new THREE.Vector3(-1,0,0),
    starboard:new THREE.Vector3(1,0,0),
    top:new THREE.Vector3(0,0,1)
  };
  function setView(name){placeCamera((viewDirections[name]||canonicalDirection).clone())}

  function select(mesh,notify=true){
    selectedMesh=mesh||null;
    for(const item of meshes){
      const isOther=Boolean(mesh)&&item!==mesh;
      item.material.color.copy(hullContourOn?new THREE.Color(0xffffff):item===mesh?new THREE.Color(0xb3157a):baseColor);
      item.material.opacity=isOther?Math.min(appearanceOpacity,.32):appearanceOpacity;
      item.material.transparent=item.material.opacity<1;
    }
    if(sidebar)sidebar.querySelectorAll("[data-component]").forEach(button=>button.classList.toggle("active",button.dataset.component===mesh?.userData.component.id));
    if(notify)onSelect?.(mesh?.userData.component||null);
    draw();
  }

  if(sidebar){
    const title=document.createElement("div");
    title.className="three-components-title";
    title.textContent="Components";
    sidebar.append(title);
    for(const component of documentModel.components){
      const button=document.createElement("button");
      button.dataset.component=component.id;
      const icon=document.createElement("span");
      icon.textContent=component.geometry?"○":"▾";
      const label=document.createElement("span");
      label.textContent=component.name;
      button.append(icon,label);
      button.addEventListener("click",()=>{
        const mesh=meshes.find(item=>item.userData.component.id===button.dataset.component);
        if(mesh)select(mesh);
      });
      sidebar.append(button);
    }
  }

  const measurementGroup=new THREE.Group();
  scene.add(measurementGroup);
  const measurements=[];
  let measureEnabled=false;
  let measureSnapMode="none";
  let measureSnapTolerance=0.01;
  let firstMeasurePoint=null;
  function emitMeasurements(){
    onMeasurements?.(measurements.map(item=>({a:item.a.toArray(),b:item.b.toArray(),distance:item.distance})));
  }
  function addMeasurement(a,b){
    const geometry=new THREE.BufferGeometry().setFromPoints([a,b]);
    const material=new THREE.LineBasicMaterial({color:0xf2b84b});
    const line=new THREE.Line(geometry,material);
    measurementGroup.add(line);
    measurements.push({a:a.clone(),b:b.clone(),distance:a.distanceTo(b),line,material});
    emitMeasurements();
    draw();
  }
  function clearMeasurements(){
    firstMeasurePoint=null;
    while(measurements.length){
      const item=measurements.pop();
      measurementGroup.remove(item.line);
      item.line.geometry.dispose();
      item.material.dispose();
    }
    emitMeasurements();
    draw();
  }
  function undoMeasurement(){
    firstMeasurePoint=null;
    const item=measurements.pop();
    if(item){
      measurementGroup.remove(item.line);
      item.line.geometry.dispose();
      item.material.dispose();
    }
    emitMeasurements();
    draw();
  }

  const waterlineMaterial=new THREE.MeshBasicMaterial({color:0x55b8e6,transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false});
  const waterlineGeometry=new THREE.PlaneGeometry(1,1);
  const waterlineMesh=new THREE.Mesh(waterlineGeometry,waterlineMaterial);
  waterlineMesh.visible=false;
  scene.add(waterlineMesh);
  function updateWaterlineSize(){
    currentBounds=bounds();
    const span=Math.max(currentBounds.size.x,currentBounds.size.y,currentBounds.radius*2,1)*1.35;
    waterlineMesh.scale.set(span,span,1);
  }
  // The contour is the actual triangle/plane intersection, using Hydro's
  // shared clipping + stitching algorithms, not a 2D line over the screenshot.
  const contourGroup=new THREE.Group();
  scene.add(contourGroup);
  const contourMaterial=new THREE.LineBasicMaterial({
    color:0x09d9ec,transparent:true,opacity:.95,depthTest:false,depthWrite:false
  });
  let waterlineState={visible:false,z:0};
  let waterlineInfo={status:"hidden",loops:[],segments:0,triangles:0};
  function clearContours(){
    while(contourGroup.children.length){
      const child=contourGroup.children[0];contourGroup.remove(child);
      child.geometry.dispose();
    }
  }
  function transformedContourMeshes(){
    alignmentGroup.updateMatrixWorld(true);
    const hullMeshes=meshes.filter(mesh=>mesh.userData.component?.metadata?.hydro===true);
    const targets=hullMeshes.length?hullMeshes:meshes;
    return targets.map(mesh=>{
      const position=mesh.geometry.getAttribute("position");
      const indices=mesh.geometry.index;
      const points=new Float64Array(position.count*3);
      const vector=new THREE.Vector3();
      for(let i=0;i<position.count;i++){
        vector.fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld);
        points[3*i]=vector.x;points[3*i+1]=vector.y;points[3*i+2]=vector.z;
      }
      return {positions:points,indices:indices?indices.array:null};
    });
  }
  function refreshWaterlineContours(){
    clearContours();
    if(!waterlineState.visible){
      waterlineInfo={status:"hidden",loops:[],segments:0,triangles:0};
      return waterlineInfo;
    }
    const target=meshes.filter(m=>m.userData.component?.metadata?.hydro===true);
    const drawMeshes=target.length?target:meshes;
    const count=drawMeshes.reduce((n,m)=>n+
      Math.floor((m.geometry.index?.count||m.geometry.getAttribute("position").count)/3),0);
    if(count>350000){
      waterlineInfo={status:"too-large",loops:[],segments:0,triangles:count,
        reason:"Mesh too large for interactive contour overlay; use Hydro Worker for calculations"};
      return waterlineInfo;
    }
    try{
      waterlineInfo=modelWaterlineContours(transformedContourMeshes(),waterlineState.z);
      for(const loop of waterlineInfo.loops){
        const geometry=new THREE.BufferGeometry().setFromPoints(
          loop.map(p=>new THREE.Vector3(p[0],p[1],waterlineState.z+0.002)));
        const curve=new THREE.LineLoop(geometry,contourMaterial);
        curve.renderOrder=6;contourGroup.add(curve);
      }
    }catch(error){
      waterlineInfo={status:"invalid",loops:[],segments:0,triangles:count,
        reason:String(error?.message||error)};
    }
    return waterlineInfo;
  }

  const waveGeometry=new THREE.PlaneGeometry(1,1,55,55);
  const waveMaterial=new THREE.MeshPhongMaterial({
    color:0x147cab,side:THREE.DoubleSide,transparent:true,opacity:.46,
    shininess:80,depthWrite:false
  });
  const waveMesh=new THREE.Mesh(waveGeometry,waveMaterial);
  waveMesh.visible=false;waveMesh.renderOrder=3;scene.add(waveMesh);
  let wave=null,waveAnimated=false,waveFrame=null,waveTimeS=0,lastWaveFrameMs=null;
  let waveMotionMode="anchored",activeRAO=null;
  let waveReference={world:new THREE.Vector3(),local:new THREE.Vector3()};
  let lastWavePose={surgeM:0,swayM:0,heaveM:0,rollRad:0,pitchRad:0,yawRad:0};
  const waveBaseXY=Float32Array.from(waveGeometry.getAttribute("position").array);
  function referenceForWave(){
    // The wave passes through the model centroid, not an arbitrary global origin.
    waveMotionGroup.position.set(0,0,0);
    waveMotionGroup.quaternion.identity();
    alignmentGroup.updateMatrixWorld(true);
    root.updateMatrixWorld(true);
    const world=new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
    return {world,local:alignmentGroup.worldToLocal(world.clone())};
  }
  function drawWave(timeS=0){
    if(!wave||!waveMesh.visible)return;
    const attribute=waveGeometry.getAttribute("position");
    const span=waveMesh.scale.x;
    for(let n=0;n<attribute.count;n++){
      const x=waveReference.world.x+waveBaseXY[n*3]*span;
      const y=waveReference.world.y+waveBaseXY[n*3+1]*span;
      attribute.setZ(n,waveElevation(wave,x,y,timeS));
    }
    attribute.needsUpdate=true;
    waveGeometry.computeVertexNormals();
    const pose=waveMotionMode==="rao"?
      motionFromRAO(activeRAO,wave,timeS,waveReference.world.x,waveReference.world.y):
      {surgeM:0,swayM:0,yawRad:0,...waveModelPose(wave,timeS,waveMotionMode,
        waveReference.world.x,waveReference.world.y)};
    lastWavePose=pose;
    // Prescribe illustrative attitude in world coordinates, transformed back
    // through optional CAD-axis alignment without altering mesh data.
    const parentQ=alignmentGroup.getWorldQuaternion(new THREE.Quaternion());
    const localQ=parentQ.clone().invert()
      .multiply(new THREE.Quaternion().setFromEuler(
        new THREE.Euler(pose.rollRad,pose.pitchRad,pose.yawRad,"XYZ")))
      .multiply(parentQ);
    waveMotionGroup.quaternion.copy(localQ);
    const pivot=waveReference.local;
    const translation=new THREE.Vector3(pose.surgeM,pose.swayM,pose.heaveM)
      .applyQuaternion(parentQ.clone().invert());
    waveMotionGroup.position.copy(pivot)
      .sub(pivot.clone().applyQuaternion(localQ)).add(translation);
    canvas.dataset.waveHeightM=String(wave.heightM);
    canvas.dataset.waveTimeS=String(timeS);
    canvas.dataset.waveHeaveM=String(pose.heaveM);
    canvas.dataset.waveSurgeM=String(pose.surgeM);
    canvas.dataset.waveSwayM=String(pose.swayM);
    canvas.dataset.waveYawDeg=String(pose.yawRad*180/Math.PI);
    canvas.dataset.waveRollDeg=String(pose.rollRad*180/Math.PI);
    canvas.dataset.wavePitchDeg=String(pose.pitchRad*180/Math.PI);
    draw();
  }
  function stopWaveLoop(){
    if(waveFrame!==null)cancelAnimationFrame(waveFrame);
    waveFrame=null;lastWaveFrameMs=null;
  }
  function startWaveLoop(){
    if(wave&&waveAnimated&&waveMesh.visible&&!document.hidden&&waveFrame===null)
      waveFrame=requestAnimationFrame(animateWave);
  }
  function animateWave(ms){
    waveFrame=null;
    if(!wave||!waveAnimated||!waveMesh.visible||document.hidden)return;
    if(lastWaveFrameMs===null)lastWaveFrameMs=ms;
    const dt=Math.max(0,(ms-lastWaveFrameMs)/1000);
    // At most ~30 mesh updates per second; pause cleanly in background tabs.
    if(dt>=1/30){
      waveTimeS=(waveTimeS+dt)%wave.periodS;
      lastWaveFrameMs=ms;
      drawWave(waveTimeS);
    }
    startWaveLoop();
  }
  function onWaveVisibility(){
    if(document.hidden)stopWaveLoop();else startWaveLoop();
  }
  document.addEventListener("visibilitychange",onWaveVisibility);
  function setWave({enabled=false,heightM=1,periodS=6,headingDeg=0,
    waterDepthM=Infinity,phaseDeg=0,animate=true,timeS=0,
    motionMode="anchored",raoTable=null}={}){
    stopWaveLoop();waveAnimated=false;
    if(!enabled){
      wave=null;activeRAO=null;waveMesh.visible=false;
      waveMotionGroup.position.set(0,0,0);
      waveMotionGroup.quaternion.identity();
      lastWavePose={surgeM:0,swayM:0,heaveM:0,rollRad:0,pitchRad:0,yawRad:0};
      waterlineMesh.visible=waterlineState.visible;
      contourGroup.visible=waterlineState.visible&&
        explodedFactor===0&&scopedExplodeFactor===0&&isolatedIds===null;
      draw();return null;
    }
    if(!["anchored","follow","follow-slope","rao"].includes(motionMode))
      throw new Error("Invalid wave motion mode");
    if(!Number.isFinite(timeS)||timeS<0)throw Error("Wave time must be nonnegative and finite");
    const pendingWave=normaliseWaveCase({heightM,periodS,headingDeg,waterDepthM,phaseDeg});
    // Validate imported frequency/heading coverage before altering the scene.
    const pendingRAO=motionMode==="rao"?
      interpolateMotionRAO(raoTable,pendingWave.omega,pendingWave.headingDeg):null;
    waveMotionMode=motionMode;
    wave=pendingWave;
    activeRAO=pendingRAO;
    waveReference=referenceForWave();
    updateWaterlineSize();
    const span=Math.max(currentBounds.size.x,currentBounds.size.y,currentBounds.radius*2,1)*1.35;
    waveMesh.scale.set(span,span,1);
    waveMesh.position.set(waveReference.world.x,waveReference.world.y,waterlineState.z);
    waveMesh.visible=true;
    waterlineMesh.visible=false;
    contourGroup.visible=false; // Fixed contours are not moving-wave intersections.
    waveTimeS=timeS%wave.periodS;
    drawWave(waveTimeS);
    waveAnimated=Boolean(animate);
    startWaveLoop();
    return {...wave,motionMode:waveMotionMode,raoSource:activeRAO?.sourceName||null};
  }

  function setWaterline({visible=true,z=0}={}){
    if(!Number.isFinite(Number(z)))throw new Error("Waterline elevation must be finite");
    waterlineState={visible:Boolean(visible),z:Number(z)};
    updateWaterlineSize();
    waterlineMesh.visible=waterlineState.visible&&!waveMesh.visible;
    waterlineMesh.position.set(0,0,waterlineState.z);
    waveMesh.position.z=waterlineState.z;
    if(explodedFactor>0||scopedExplodeFactor>0||isolatedIds!==null){
      waterlineMesh.visible=false;contourGroup.visible=false;
      draw();
      return {status:"exploded",loops:[],segments:0,
        reason:"Reset assembly explode/isolation before viewing waterline contours."};
    }
    const info=refreshWaterlineContours();
    if(waveMesh.visible)contourGroup.visible=false;
    draw();
    return info;
  }

  function resetAlignment(){
    alignmentGroup.rotation.set(0,0,0);
    alignmentGroup.quaternion.identity();
    alignmentGroup.updateMatrixWorld(true);
    refreshWaterlineContours();
    fitView();
  }

  function swapAxes(type){
    const euler=type==="yz"?new THREE.Euler(Math.PI/2,0,0):type==="xz"?new THREE.Euler(0,Math.PI/2,0):new THREE.Euler(0,0,Math.PI/2);
    const q=new THREE.Quaternion().setFromEuler(euler);
    alignmentGroup.quaternion.premultiply(q);
    alignmentGroup.updateMatrixWorld(true);
    refreshWaterlineContours();
    fitView();
  }

  function autoAlign(){
    const savedAlign=alignmentGroup.quaternion.clone();
    const savedAttitude=attitudeGroup.quaternion.clone();
    alignmentGroup.quaternion.identity();
    attitudeGroup.quaternion.identity();
    alignmentGroup.updateMatrixWorld(true);
    const base=bounds();
    const corners=[];
    for(const x of [base.box.min.x,base.box.max.x])for(const y of [base.box.min.y,base.box.max.y])for(const z of [base.box.min.z,base.box.max.z])corners.push(new THREE.Vector3(x,y,z).sub(base.center));
    let best={score:Infinity,q:new THREE.Quaternion()};
    const turns=[0,Math.PI/2,Math.PI,Math.PI*1.5];
    for(const rx of turns)for(const ry of turns)for(const rz of turns){
      const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz));
      const min=new THREE.Vector3(Infinity,Infinity,Infinity);
      const max=new THREE.Vector3(-Infinity,-Infinity,-Infinity);
      for(const corner of corners){
        const p=corner.clone().applyQuaternion(q);
        min.min(p);max.max(p);
      }
      const s=max.clone().sub(min);
      let score=0;
      if(s.x<s.y)score+=(s.y-s.x)/(s.x+s.y+1e-9);
      if(s.y<s.z)score+=(s.z-s.y)/(s.y+s.z+1e-9);
      score+=.35*(s.z+1e-9)/(s.x+1e-9);
      if(!(s.z<=s.x&&s.z<=s.y))score+=2;
      if(score<best.score)best={score,q};
    }
    alignmentGroup.quaternion.copy(best.q);
    attitudeGroup.quaternion.copy(savedAttitude);
    alignmentGroup.updateMatrixWorld(true);
    if(!Number.isFinite(best.score))alignmentGroup.quaternion.copy(savedAlign);
    refreshWaterlineContours();
    fitView();
    return best.score;
  }

  function setRotation({x=0,y=0,z=0}={}){
    for(const angle of [x,y,z])
      if(!Number.isFinite(Number(angle))||Math.abs(Number(angle))>360)
        throw Error("Attitude must be a finite angle within ±360°");
    attitudeGroup.rotation.set(
      THREE.MathUtils.degToRad(Number(x)),
      THREE.MathUtils.degToRad(Number(y)),
      THREE.MathUtils.degToRad(Number(z)));
    // Preserve hull centre in the same local frame during heel/trim/yaw.
    attitudeGroup.position.copy(attitudePivot).sub(
      attitudePivot.clone().applyQuaternion(attitudeGroup.quaternion));
    attitudeGroup.updateMatrixWorld(true);
    refreshWaterlineContours();
    draw(); // Do not unexpectedly reset the user's chosen side/camera.
  }

  function resetAttitude(){
    attitudeGroup.rotation.set(0,0,0);
    attitudeGroup.quaternion.identity();
    attitudeGroup.position.set(0,0,0);
    attitudeGroup.updateMatrixWorld(true);
    refreshWaterlineContours();
    draw();
  }

  const clipPlane=new THREE.Plane(new THREE.Vector3(1,0,0),0);
  let clippingEnabled=false;
  function setClipping({enabled=false,axis="x",offset=0,invert=false}={}){
    const vectors={
      x:new THREE.Vector3(1,0,0),
      y:new THREE.Vector3(0,1,0),
      z:new THREE.Vector3(0,0,1)
    };
    const normal=(vectors[axis]||vectors.x).clone();
    if(invert)normal.multiplyScalar(-1);
    clipPlane.normal.copy(normal);
    clipPlane.constant=-(Number(offset)||0)*(invert?-1:1);
    clippingEnabled=Boolean(enabled);
    for(const mesh of meshes){
      mesh.material.clippingPlanes=clippingEnabled?[clipPlane]:[];
      mesh.material.clipShadows=clippingEnabled;
      mesh.material.needsUpdate=true;
    }
    draw();
    return {enabled:clippingEnabled,axis,offset:Number(offset)||0,invert:Boolean(invert)};
  }

  function setAppearance({wireframe=null,opacity=null,modelColor=null,background=null}={}){
    if(background)scene.background.set(background);
    if(modelColor)baseColor.set(modelColor);
    if(opacity!==null)appearanceOpacity=Math.max(.05,Math.min(1,Number(opacity)||1));
    for(const mesh of meshes){
      if(wireframe!==null)mesh.material.wireframe=Boolean(wireframe);
      mesh.material.needsUpdate=true;
    }
    select(selectedMesh,false);
    draw();
  }

  function setHullGirderContour({girder=null,neutralZ=0,visible=true}={}){
    if(!visible||!girder){
      hullContourOn=false;
      for(const mesh of meshes){
        mesh.geometry.deleteAttribute("color");
        mesh.material.vertexColors=false;
        mesh.material.needsUpdate=true;
      }
      select(selectedMesh,false);
      draw();
      return {enabled:false};
    }
    root.updateMatrixWorld(true);
    const samples=[];
    const point=new THREE.Vector3();
    const neutral=Number(neutralZ);
    if(!Number.isFinite(neutral))throw new Error("Neutral axis elevation must be finite");
    for(const mesh of meshes){
      const position=mesh.geometry.getAttribute("position");
      const values=new Float64Array(position.count);
      for(let i=0;i<position.count;i++){
        point.fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld);
        values[i]=stressAtHullPoint(girder,point.x,point.z,{neutralZ:neutral});
        if(!Number.isFinite(values[i]))throw new Error("Non-finite global bending stress");
      }
      samples.push({mesh,values});
    }
    const max=Math.max(1,Math.abs(Number(girder.maxStressPa)||0));
    let range=max;
    for(const {values} of samples)for(const value of values)range=Math.max(range,Math.abs(value));
    hullContourOn=true;
    for(const {mesh,values} of samples){
      const colors=new Float32Array(values.length*3);
      for(let i=0;i<values.length;i++)colors.set(stressRGB(values[i],range),i*3);
      mesh.geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
      mesh.material.vertexColors=true;
      mesh.material.needsUpdate=true;
    }
    select(selectedMesh,false);draw();
    return {enabled:true,...stressLegend(range),rangePa:range};
  }

  function screenshot(filename="model.png"){
    draw();
    const url=canvas.toDataURL("image/png");
    const anchor=document.createElement("a");
    anchor.href=url;
    anchor.download=filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    return url;
  }

  const raycaster=new THREE.Raycaster();
  const pointer=new THREE.Vector2();
  function pointerHit(event){
    const rect=canvas.getBoundingClientRect();
    pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
    pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(pointer,camera);
    return raycaster.intersectObjects(meshes,false)[0]||null;
  }

  function nearestPointOnSegment(point,a,b){
    const ab=b.clone().sub(a);
    const lengthSq=Math.max(ab.lengthSq(),1e-16);
    const t=Math.max(0,Math.min(1,ab.dot(point.clone().sub(a))/lengthSq));
    return a.clone().addScaledVector(ab,t);
  }

  function snappedMeasurePoint(hit){
    if(!hit||measureSnapMode==="none")return hit?.point?.clone?.()||null;
    const mesh=hit.object;
    const geometry=mesh?.geometry;
    const position=geometry?.getAttribute?.("position");
    const faceIndex=Number(hit.faceIndex);
    if(!position||!Number.isInteger(faceIndex)||faceIndex<0)return hit.point.clone();

    const index=geometry.index;
    const tri=[];
    for(let corner=0;corner<3;corner++){
      const vertexIndex=index?index.getX(faceIndex*3+corner):faceIndex*3+corner;
      const point=new THREE.Vector3(
        position.getX(vertexIndex),
        position.getY(vertexIndex),
        position.getZ(vertexIndex)
      ).applyMatrix4(mesh.matrixWorld);
      tri.push(point);
    }

    const candidates=[];
    if(measureSnapMode==="vertex"||measureSnapMode==="both"){
      for(const point of tri)candidates.push(point);
    }
    if(measureSnapMode==="edge"||measureSnapMode==="both"){
      candidates.push(
        nearestPointOnSegment(hit.point,tri[0],tri[1]),
        nearestPointOnSegment(hit.point,tri[1],tri[2]),
        nearestPointOnSegment(hit.point,tri[2],tri[0])
      );
    }
    let best=null,bestDistance=Infinity;
    for(const point of candidates){
      const distance=point.distanceTo(hit.point);
      if(distance<bestDistance){best=point;bestDistance=distance}
    }
    return best&&bestDistance<=measureSnapTolerance?best.clone():hit.point.clone();
  }
  function onPointerDown(event){
    canvas.focus({preventScroll:true});
    if(event.button!==0)return;
    const hit=pointerHit(event);
    if(measureEnabled){
      if(!hit)return;
      const point=snappedMeasurePoint(hit);
      if(!point)return;
      if(!firstMeasurePoint)firstMeasurePoint=point;
      else{addMeasurement(firstMeasurePoint,point);firstMeasurePoint=null}
      return;
    }
    select(hit?.object||null);
  }
  // Capture phase runs before OrbitControls' pointerdown listener. Keep the
  // familiar middle-drag pan, but hold Shift + middle to orbit.
  const middleDown=event=>{
    if(event.button===1)controls.mouseButtons.MIDDLE=
      event.shiftKey?THREE.MOUSE.ROTATE:THREE.MOUSE.PAN;
  };
  const middleUp=()=>{controls.mouseButtons.MIDDLE=THREE.MOUSE.PAN};
  canvas.addEventListener("pointerdown",middleDown,true);
  canvas.addEventListener("pointerup",middleUp);
  canvas.addEventListener("pointercancel",middleUp);
  const offKeys=connectCADKeyboard(canvas,{
    fit:fitView,resetZoom:resetView,setView,
    navigate3D,setIsolation,setScopedExplode
  },{onExplode:restore=>{
    const next=restore?0:explodedFactor>0?0:1;
    setExplode(next);
  }});
  canvas.addEventListener("pointerdown",onPointerDown);

  function resize(){
    const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
    renderer.setSize(width,height,false);
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
    draw();
  }
  controls.addEventListener("change",draw);
  const observer=new ResizeObserver(resize);
  observer.observe(canvas);
  resetView();
  resize();

  if(selectedComponentId){
    const initial=meshes.find(mesh=>mesh.userData.component.id===selectedComponentId);
    if(initial)select(initial,false);
  }

  const cleanup=()=>{
    observer.disconnect();
    controls.dispose();
    canvas.removeEventListener("pointerdown",onPointerDown);
    canvas.removeEventListener("pointerdown",middleDown,true);
    canvas.removeEventListener("pointerup",middleUp);
    canvas.removeEventListener("pointercancel",middleUp);
    offKeys();
    clearMeasurements();
    for(const line of edgeLines){line.parent?.remove(line);line.geometry.dispose();line.material.dispose()}
    scene.remove(axesHelper);axesHelper.geometry.dispose();axesHelper.material.dispose();
    scene.remove(boxHelper);boxHelper.geometry.dispose();boxHelper.material.dispose();
    for(const marker of markerGroup.children){marker.geometry.dispose();marker.material.dispose()}
    scene.remove(markerGroup);
    stopWaveLoop();
    document.removeEventListener("visibilitychange",onWaveVisibility);
    clearContours();scene.remove(contourGroup);contourMaterial.dispose();
    thrusterFlows.dispose();
    scene.remove(waveMesh);waveGeometry.dispose();waveMaterial.dispose();
    waterlineGeometry.dispose();
    waterlineMaterial.dispose();
    for(const mesh of meshes){mesh.geometry.dispose();mesh.material.dispose()}
    renderer.dispose();
  };

  return {
    cleanup,
    selectById(id){select(meshes.find(mesh=>mesh.userData.component.id===id)||null,false)},
    actions:{
      fit:fitView,
      resetZoom:resetView,
      zoomIn:()=>zoom(.8),
      zoomOut:()=>zoom(1.25),
      setView,
      autoAlign,
      resetAlignment,
      swapAxes,
      setRotation,
      resetAttitude,
      getAttitude:()=>({
        heelDeg:THREE.MathUtils.radToDeg(attitudeGroup.rotation.x),
        trimDeg:THREE.MathUtils.radToDeg(attitudeGroup.rotation.y),
        yawDeg:THREE.MathUtils.radToDeg(attitudeGroup.rotation.z)
      }),
      setAppearance,
      setAxes,
      setBoundingBox,
      setEdges,
      setShading,
      setExplode,
      setScopedExplode,
      setIsolation,
      getVisibleComponentIds:()=>meshes.filter(mesh=>mesh.visible).map(mesh=>mesh.userData.component.id),
      getExplodeState:()=>({assembly:explodedFactor,selected:scopedExplodeFactor,ids:[...scopedExplodeIds]}),
      focusComponents,
      navigate3D,
      cameraState,
      setThrusterFlows:descriptors=>{thrusterFlows.update(descriptors);return thrusterFlows.count},
      playThrusterFlows:enabled=>thrusterFlows.setPlaying(enabled),
      getThrusterFlowCount:()=>thrusterFlows.count,
      setMarkers,
      setClipping,
      setMeasurement(enabled){measureEnabled=Boolean(enabled);firstMeasurePoint=null;return measureEnabled},
      setMeasurementSnap({mode="none",tolerance=.01}={}){
        const valid=["none","vertex","edge","both"];
        measureSnapMode=valid.includes(String(mode))?String(mode):"none";
        const value=Number(tolerance);
        measureSnapTolerance=Number.isFinite(value)&&value>=0?value:.01;
        return {mode:measureSnapMode,tolerance:measureSnapTolerance};
      },
      clearMeasurements,
      undoMeasurement,
      setWaterline,
      setHullGirderContour,
      getWaterlineInfo:()=>waterlineInfo,
      setWave,
      getWaveMotionOffset:()=>lastWavePose.heaveM,
      getWaveMotionPose:()=>({...lastWavePose,timeS:waveTimeS,mode:waveMotionMode}),
      screenshot,
      getBounds(){
        const value=bounds();
        return {min:value.box.min.toArray(),max:value.box.max.toArray(),size:value.size.toArray(),center:value.center.toArray()};
      }
    },
    info:documentModel.format+" · "+documentModel.components.length+" component(s) · "+documentModel.unit
  };
}