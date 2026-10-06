import {getThreeRuntime} from "./three-runtime.js?v=fc6088e97be38f728db2b9e6a89d92c339303629";

export async function mountModelScene(container,documentModel,options={}){
  const {showSidebar=true,onSelect=null,selectedComponentId=null}=options;
  const {THREE,OrbitControls}=await getThreeRuntime();

  const stage=document.createElement("div");
  stage.className="three-stage"+(showSidebar?"":" three-stage-no-sidebar");
  const canvas=document.createElement("canvas");canvas.className="three-canvas";
  const sidebar=showSidebar?document.createElement("div"):null;
  if(sidebar)sidebar.className="three-components";
  stage.append(canvas);
  if(sidebar)stage.append(sidebar);
  container.replaceChildren(stage);

  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x081820);
  const camera=new THREE.PerspectiveCamera(45,1,0.001,100000);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=false;
  scene.add(new THREE.HemisphereLight(0xd8edf5,0x24313a,2.2));
  const key=new THREE.DirectionalLight(0xffffff,2.4);key.position.set(4,6,8);scene.add(key);
  const root=new THREE.Group();scene.add(root);
  const meshes=[];const scale=documentModel.unitScaleToMeters||1;

  for(const component of documentModel.components){
    if(!component.geometry)continue;
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.BufferAttribute(new Float32Array(component.geometry.positions.map(value=>value*scale)),3));
    if(component.geometry.indices?.length)geometry.setIndex(component.geometry.indices);
    geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
    const material=new THREE.MeshStandardMaterial({color:0x8aa7b5,roughness:.72,metalness:.06});
    const mesh=new THREE.Mesh(geometry,material);mesh.userData.component=component;
    if(component.transform){
      const matrix=new THREE.Matrix4().fromArray(component.transform);
      matrix.elements[12]*=scale;matrix.elements[13]*=scale;matrix.elements[14]*=scale;
      mesh.applyMatrix4(matrix);
    }
    root.add(mesh);meshes.push(mesh);
  }

  const box=new THREE.Box3().setFromObject(root),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  const radius=Math.max(size.length()/2,0.1);
  controls.target.copy(center);
  camera.position.copy(center).add(new THREE.Vector3(radius*1.7,-radius*1.8,radius*1.25));
  camera.near=Math.max(radius/1000,0.001);camera.far=Math.max(radius*100,100);camera.updateProjectionMatrix();controls.update();

  function draw(){renderer.render(scene,camera)}
  function select(mesh,notify=true){
    for(const item of meshes){
      const isOther=Boolean(mesh)&&item!==mesh;
      item.material.color.set(item===mesh?0xb3157a:0x8aa7b5);
      item.material.transparent=isOther;
      item.material.opacity=isOther ? .32 : 1;
    }
    if(sidebar)sidebar.querySelectorAll("[data-component]").forEach(button=>button.classList.toggle("active",button.dataset.component===mesh?.userData.component.id));
    if(notify)onSelect?.(mesh?.userData.component||null);
    draw();
  }

  if(sidebar){
    sidebar.innerHTML=`<div class="three-components-title">Components</div>${documentModel.components.map(component=>`
      <button data-component="${component.id}"><span>${component.geometry?"○":"▾"}</span><span>${component.name}</span></button>`).join("")}`;
    sidebar.querySelectorAll("[data-component]").forEach(button=>button.onclick=()=>{
      const mesh=meshes.find(item=>item.userData.component.id===button.dataset.component);
      if(mesh)select(mesh);
    });
  }

  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  canvas.addEventListener("pointerdown",event=>{
    const rect=canvas.getBoundingClientRect();
    pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
    pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(pointer,camera);
    select(raycaster.intersectObjects(meshes,false)[0]?.object||null);
  });

  function resize(){
    const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
    renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.updateProjectionMatrix();draw();
  }
  controls.addEventListener("change",draw);
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();

  if(selectedComponentId){
    const initial=meshes.find(mesh=>mesh.userData.component.id===selectedComponentId);
    if(initial)select(initial,false);
  }

  const cleanup=()=>{
    observer.disconnect();controls.dispose();
    for(const mesh of meshes){mesh.geometry.dispose();mesh.material.dispose()}
    renderer.dispose();
  };
  return {
    cleanup,
    selectById(id){select(meshes.find(mesh=>mesh.userData.component.id===id)||null,false)},
    info:`${documentModel.format} · ${documentModel.components.length} component(s) · ${documentModel.unit}`
  };
}
