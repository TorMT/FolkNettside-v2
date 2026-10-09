import {getThreeRuntime} from "../model/three-runtime.js";
/** Concept-only mesh. Tooth blocks are schematic, not involute teeth. */
export async function mountKisssoft3D(target,model){
 if(!model.planetary||!model.consistent)return ()=>{};
 const {THREE,OrbitControls}=await getThreeRuntime();
 if(!target.isConnected)return ()=>{};
 const canvas=document.createElement("canvas");
 canvas.style.cssText="display:block;width:100%;height:400px;border-radius:12px;background:#081820";
 target.replaceChildren(canvas);
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
 const [sun,planet,ring]=model.gears.map(g=>Math.abs(g.teeth));
 const m=model.module,dist=m*(sun+planet)/2;
 const width=model.gears[0].width>0?model.gears[0].width:35;
 const add=(geometry,mat,x=0,y=0,z=0,rotation=0)=>{
   const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.rotation.z=rotation;scene.add(mesh);solids.push(mesh);return mesh;
 };
 function external(z,x,y,mat,phase){
   const pitch=m*z/2,base=Math.max(1,pitch-.95*m),count=Math.round(z);
   const hub=add(new THREE.CylinderGeometry(base,base,width,Math.max(48,Math.min(180,count*2))),mat,x,y,width/2);hub.rotation.x=Math.PI/2;
   const radial=m*1.8,tangential=Math.max(.4,2*Math.PI*pitch/count*.47);
   const geo=new THREE.BoxGeometry(radial,tangential,width);
   for(let i=0;i<count;i++){
     const theta=phase+2*Math.PI*i/count;
     add(geo,mat,x+(base+radial*.29)*Math.cos(theta),y+(base+radial*.29)*Math.sin(theta),width/2,theta);
   }
 }
 const ringPitch=m*ring/2,outer=ringPitch+2.5*m,inner=ringPitch-1.2*m;
 const ringShape=new THREE.Shape();
 ringShape.absarc(0,0,outer,0,Math.PI*2,false);
 const hole=new THREE.Path();
 hole.absarc(0,0,inner,0,Math.PI*2,true);
 ringShape.holes.push(hole);
 const ringMesh=new THREE.ExtrudeGeometry(ringShape,{depth:width,bevelEnabled:false,curveSegments:160});
 add(ringMesh,paints[2]);
 const toothGeo=new THREE.BoxGeometry(1.6*m,Math.max(.3,Math.PI*m*.48),width);
 for(let i=0;i<ring;i++){
   const theta=2*Math.PI*i/ring;
   add(toothGeo,paints[2],0,0,0);
   const tooth=solids[solids.length-1];
   tooth.position.set((inner-.35*m)*Math.cos(theta),(inner-.35*m)*Math.sin(theta),width/2);
   tooth.rotation.z=theta;
 }
 external(sun,0,0,paints[0],0);
 for(const a of [0,2*Math.PI/3,4*Math.PI/3])
   external(planet,dist*Math.cos(a),dist*Math.sin(a),paints[1],a*.2);
 const ground=new THREE.GridHelper(2.5*outer,10,0x355269,0x294154);
 ground.rotation.x=Math.PI/2;ground.position.z=-1.5;scene.add(ground);
 let disposed=false;
 const draw=()=>{
   if(disposed)return;
   const w=Math.max(target.clientWidth,270),h=400;
   renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
   renderer.render(scene,camera);
 };
 controls.addEventListener("change",draw);
 const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(draw):null;
 observer?.observe(target);
 draw();
 return ()=>{
   disposed=true;observer?.disconnect();controls.removeEventListener("change",draw);controls.dispose();
   for(const item of solids)scene.remove(item);
   for(const geometry of new Set(solids.map(item=>item.geometry)))geometry.dispose();
   paints.forEach(mat=>mat.dispose());renderer.dispose();renderer.forceContextLoss();
 };
}
