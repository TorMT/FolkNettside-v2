import {getThreeRuntime} from "./three-runtime.js?v=a435f153ef7e9408be42556149dd61c3928ec506";

export async function mountModelScene(container,documentModel,options={}){
  const {showSidebar=true,onSelect=null,onMeasurements=null,selectedComponentId=null}=options;
  const {THREE,OrbitControls}=await getThreeRuntime();

  const stage=document.createElement("div");
  stage.className="three-stage"+(showSidebar?"":" three-stage-no-sidebar");
  const canvas=document.createElement("canvas");
  canvas.className="three-canvas";
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
  scene.add(new THREE.HemisphereLight(0xd8edf5,0x24313a,2.2));
  const key=new THREE.DirectionalLight(0xffffff,2.4);
  key.position.set(4,6,8);
  scene.add(key);

  const alignmentGroup=new THREE.Group();
  const attitudeGroup=new THREE.Group();
  const root=new THREE.Group();
  scene.add(alignmentGroup);
  alignmentGroup.add(attitudeGroup);
  attitudeGroup.add(root);
  const meshes=[];
  const scale=documentModel.unitScaleToMeters||1;
  const baseColor=new THREE.Color(0x8aa7b5);
  let appearanceOpacity=1;
  let selectedMesh=null;

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
    meshes.push(mesh);
  }

  function bounds(){
    root.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(root);
    const center=box.getCenter(new THREE.Vector3());
    const size=box.getSize(new THREE.Vector3());
    const radius=Math.max(size.length()/2,.1);
    return {box,center,size,radius};
  }

  let currentBounds=bounds();
  const canonicalDirection=new THREE.Vector3(1.7,-1.8,1.25).normalize();

  function draw(){renderer.render(scene,camera)}

  function placeCamera(direction,distanceFactor=2.75){
    currentBounds=bounds();
    const dir=direction.clone().normalize();
    controls.target.copy(currentBounds.center);
    camera.position.copy(currentBounds.center).add(dir.multiplyScalar(currentBounds.radius*distanceFactor));
    camera.near=Math.max(currentBounds.radius/1000,.001);
    camera.far=Math.max(currentBounds.radius*100,100);
    camera.updateProjectionMatrix();
    controls.update();
    draw();
  }

  function resetView(){placeCamera(canonicalDirection,2.75)}

  function fitView(){
    currentBounds=bounds();
    const direction=camera.position.clone().sub(controls.target);
    if(direction.lengthSq()<1e-12)direction.copy(canonicalDirection);
    direction.normalize();
    const fov=THREE.MathUtils.degToRad(camera.fov);
    const distance=Math.max(currentBounds.radius/Math.sin(fov/2)*1.12,currentBounds.radius*1.2);
    controls.target.copy(currentBounds.center);
    camera.position.copy(currentBounds.center).add(direction.multiplyScalar(distance));
    controls.update();
    draw();
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
    front:new THREE.Vector3(0,-1,.15),
    rear:new THREE.Vector3(0,1,.15),
    port:new THREE.Vector3(-1,0,.15),
    starboard:new THREE.Vector3(1,0,.15),
    top:new THREE.Vector3(0,-.001,1)
  };
  function setView(name){placeCamera((viewDirections[name]||canonicalDirection).clone(),2.75)}

  function select(mesh,notify=true){
    selectedMesh=mesh||null;
    for(const item of meshes){
      const isOther=Boolean(mesh)&&item!==mesh;
      item.material.color.copy(item===mesh?new THREE.Color(0xb3157a):baseColor);
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
  function setWaterline({visible=true,z=0}={}){
    updateWaterlineSize();
    waterlineMesh.visible=Boolean(visible);
    waterlineMesh.position.set(0,0,Number(z)||0);
    draw();
  }

  function resetAlignment(){
    alignmentGroup.rotation.set(0,0,0);
    alignmentGroup.quaternion.identity();
    alignmentGroup.updateMatrixWorld(true);
    fitView();
  }

  function swapAxes(type){
    const euler=type==="yz"?new THREE.Euler(Math.PI/2,0,0):type==="xz"?new THREE.Euler(0,Math.PI/2,0):new THREE.Euler(0,0,Math.PI/2);
    const q=new THREE.Quaternion().setFromEuler(euler);
    alignmentGroup.quaternion.premultiply(q);
    alignmentGroup.updateMatrixWorld(true);
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
    fitView();
    return best.score;
  }

  function setRotation({x=0,y=0,z=0}={}){
    attitudeGroup.rotation.set(THREE.MathUtils.degToRad(Number(x)||0),THREE.MathUtils.degToRad(Number(y)||0),THREE.MathUtils.degToRad(Number(z)||0));
    attitudeGroup.updateMatrixWorld(true);
    fitView();
  }

  function resetAttitude(){
    attitudeGroup.rotation.set(0,0,0);
    attitudeGroup.quaternion.identity();
    attitudeGroup.updateMatrixWorld(true);
    fitView();
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
    clearMeasurements();
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
      setAppearance,
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
      screenshot,
      getBounds(){
        const value=bounds();
        return {min:value.box.min.toArray(),max:value.box.max.toArray(),size:value.size.toArray(),center:value.center.toArray()};
      }
    },
    info:documentModel.format+" · "+documentModel.components.length+" component(s) · "+documentModel.unit
  };
}