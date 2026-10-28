import {getThreeRuntime} from "../model/three-runtime.js?v=378e192972d27ddaafe3f143f6db13b0a140e4c5";

/** Orbitable 3D visualisation of a *2D* Euler-Bernoulli frame.
 * Depth is purely illustrative; 2D FEM values are unchanged.
 */
export async function mountFrame3D(host,frame,result){
 if(!host)throw new Error("Frame viewport is missing");
 const {THREE,OrbitControls}=await getThreeRuntime();
 if(!host.isConnected)return ()=>{};
 const canvas=document.createElement("canvas");
 canvas.className="structure-3d-canvas";
 canvas.style.cssText="display:block;width:100%;height:100%;touch-action:none";
 host.replaceChildren(canvas);
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x102535);
 const light=new THREE.HemisphereLight(0xd9f7ff,0x1a2838,2.1);scene.add(light);
 const sun=new THREE.DirectionalLight(0xffffff,2.5);
 sun.position.set(8,-7,13);scene.add(sun);
 const nodes=frame.nodes,elems=frame.elements;
 if(!nodes?.length||!elems?.length)throw Error("Frame geometry is empty");
 const xmin=Math.min(...nodes.map(n=>n.x)),xmax=Math.max(...nodes.map(n=>n.x));
 const ymin=Math.min(...nodes.map(n=>n.y)),ymax=Math.max(...nodes.map(n=>n.y));
 const length=Math.max(xmax-xmin,ymax-ymin,1);
 const width=Math.max(.025,length*.035);
 const center=new THREE.Vector3((xmin+xmax)/2,0,(ymin+ymax)/2);
 const camera=new THREE.PerspectiveCamera(42,1,.01,Math.max(100,length*100));
 camera.up.set(0,0,1);
 camera.position.set(center.x+length*.85,-length*1.65,center.z+length*.95);
 const controls=new OrbitControls(camera,canvas);
 controls.enableDamping=false;
 controls.screenSpacePanning=true;
 controls.target.copy(center);
 controls.update();
 const disposables=[],materials=[],structures=[];
 const mat=color=>{
   const material=new THREE.MeshStandardMaterial({color,metalness:.32,roughness:.52});
   materials.push(material);
   return material;
 };
 const dark=mat(0x557891),originalMat=mat(0x7792a6),defMat=mat(0x56d2bd),nodeMat=mat(0xd8dfe8),loadMat=mat(0xe85875);
 const maxDisplacement=Math.max(...result.nodes.map(n=>Math.hypot(n.ux,n.uy)),1e-12);
 const magnification=Math.min(length*.15/maxDisplacement,500);
 const position=(node,deformed=false)=>{
   const computed=result.nodes.find(n=>String(n.id)===String(node.id));
   return new THREE.Vector3(node.x+(deformed?(computed?.ux||0)*magnification:0),
     0,node.y+(deformed?(computed?.uy||0)*magnification:0));
 };
 const beam=(a,b,thickness,material)=>{
   const lengthAB=a.distanceTo(b);
   if(lengthAB<1e-10)return null;
   const geometry=new THREE.BoxGeometry(lengthAB,thickness,thickness);
   disposables.push(geometry);
   const obj=new THREE.Mesh(geometry,material);
   obj.position.copy(a).add(b).multiplyScalar(.5);
   obj.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),b.clone().sub(a).normalize());
   scene.add(obj);structures.push(obj);
   return obj;
 };
 for(const element of elems){
   const a=nodes.find(n=>String(n.id)===String(element.n1));
   const b=nodes.find(n=>String(n.id)===String(element.n2));
   if(!a||!b)continue;
   beam(position(a),position(b),width*.48,originalMat);
   beam(position(a,true),position(b,true),width,defMat);
 }
 for(const node of nodes){
   const geometry=new THREE.SphereGeometry(width*.65,14,10);disposables.push(geometry);
   const point=new THREE.Mesh(geometry,nodeMat);
   point.position.copy(position(node,true));
   scene.add(point);structures.push(point);
 }
 for(const support of frame.supports||[]){
   const node=nodes.find(n=>String(n.id)===String(support.node));
   if(!node)continue;
   const geometry=new THREE.ConeGeometry(width*1.45,width*2.2,4);
   disposables.push(geometry);
   const mesh=new THREE.Mesh(geometry,dark);
   mesh.rotation.x=Math.PI/2;
   mesh.position.copy(position(node));mesh.position.z-=width*1.4;
   scene.add(mesh);structures.push(mesh);
 }
 for(const load of frame.pointLoads||[]){
   const element=elems.find(e=>String(e.id)===String(load.element));
   if(!element)continue;
   const a=nodes.find(n=>String(n.id)===String(element.n1));
   const b=nodes.find(n=>String(n.id)===String(element.n2));
   const len=Math.hypot(b.x-a.x,b.y-a.y);
   if(!len)continue;
   const p=position({x:a.x+(b.x-a.x)*(load.position/len),
       y:a.y+(b.y-a.y)*(load.position/len)});
   const sign=Math.sign(Number(load.fy))||-1;
   const origin=p.clone().add(new THREE.Vector3(0,0,-sign*width*6));
   const direction=new THREE.Vector3(0,0,sign);
   const arrow=new THREE.ArrowHelper(direction,origin,width*4,0xe85875,width*1.65,width*.8);
   scene.add(arrow);structures.push(arrow);
 }
 const guide=new THREE.GridHelper(Math.max(3,length*1.5),10,0x39546a,0x2a4156);
 guide.rotation.x=Math.PI/2;guide.position.z=ymin-width*2;
 scene.add(guide);
 let disposed=false,viewportWidth=0,viewportHeight=0;
 const draw=()=>{
   if(disposed||!canvas.isConnected)return;
   const w=Math.max(240,host.clientWidth),h=Math.max(240,host.clientHeight);
   if(w!==viewportWidth||h!==viewportHeight){
     viewportWidth=w;viewportHeight=h;
     renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
   }
   controls.update();
   renderer.render(scene,camera);
 };
 const onControl=()=>draw();
 const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(onControl):null;
 observer?.observe(host);
 const homePosition=camera.position.clone(),homeTarget=center.clone();
 const reset=()=>{
   camera.position.copy(homePosition);controls.target.copy(homeTarget);controls.update();draw();
 };
 controls.addEventListener("change",onControl);
 draw();
 return {
   reset,
   getView:()=>({position:camera.position.toArray(),target:controls.target.toArray()}),
   cleanup(){
     disposed=true;
     observer?.disconnect();
     controls.removeEventListener("change",onControl);
     controls.dispose();
     scene.remove(guide);
     guide.geometry.dispose();guide.material.dispose();
     for(const object of structures)scene.remove(object);
     for(const geometry of disposables)geometry.dispose();
     for(const material of materials)material.dispose();
     renderer.dispose();renderer.forceContextLoss();
   }
 };
}
