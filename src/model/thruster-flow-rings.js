/**
 * Illustration ONLY: rings move from +thrust-axis (intake) toward the propeller
 * and out along -thrust-axis (wake). This is not CFD, streamtube area,
 * induced-velocity computation or a cavitation prediction.
 */
export function createThrusterFlowRings(THREE,parent,{draw=()=>{}}={}){
 const entries=[];
 const up=new THREE.Vector3(0,0,1);
 let playing=false,frame=0,previous=null,time=0,disposed=false;
 const reduced=()=>typeof window!=="undefined"&&window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
 const clear=()=>{
   for(const item of entries){
     parent.remove(item.group);
     item.group.traverse(child=>{
       child.geometry?.dispose?.();
       if(Array.isArray(child.material))child.material.forEach(m=>m.dispose());
       else child.material?.dispose?.();
     });
   }
   entries.length=0;
 };
 const place=(item)=>{
   for(const [i,ring] of item.rings.entries()){
     const phase=(time*.30+i/3)%1;
     const distance=item.diameter*(1.3-phase*1.15);
     ring.position.copy(item.axis).multiplyScalar(distance);
     ring.material.opacity=.25+.62*Math.sin(Math.PI*phase);
   }
 };
 function update(items=[]){
   if(disposed)throw Error("Flow marker view has been disposed");
   clear();
   for(const item of items){
     if(!item?.position||!item.axis||!(item.diameterM>0))continue;
     const axis=new THREE.Vector3(...item.axis).normalize(),d=item.diameterM;
     const group=new THREE.Group();
     group.position.set(...item.position);parent.add(group);
     const diskMat=new THREE.MeshBasicMaterial({color:0x27cada,opacity:.40,transparent:true,side:THREE.DoubleSide,depthWrite:false});
     const disk=new THREE.Mesh(new THREE.RingGeometry(d*.47,d*.51,64),diskMat);
     disk.quaternion.setFromUnitVectors(up,axis);group.add(disk);
     const arrow=new THREE.ArrowHelper(axis.clone().negate(),
       axis.clone().multiplyScalar(d*.88),d*.62,0x27cada,d*.20,d*.09);
     group.add(arrow);
     const wake=new THREE.ArrowHelper(axis.clone().negate(),
       new THREE.Vector3(0,0,0).addScaledVector(axis,-d*.16),d*.56,0x6da8ff,d*.15,d*.07);
     group.add(wake);
     const rings=[];
     for(let i=0;i<3;i++){
       const geometry=new THREE.TorusGeometry(d*.49,Math.max(.003,d*.012),5,52);
       const material=new THREE.MeshBasicMaterial({color:0x28d6e4,transparent:true,opacity:.4,depthWrite:false});
       const ring=new THREE.Mesh(geometry,material);
       ring.quaternion.setFromUnitVectors(up,axis);
       group.add(ring);rings.push(ring);
     }
     entries.push({group,rings,axis:new THREE.Vector3(...item.axis).normalize(),diameter:d});
   }
   entries.forEach(place);
   draw();
   if(entries.length&&playing)start();
   if(!entries.length)stop();
 }
 function animate(timestamp){
   frame=0;
   if(disposed||!playing||document.hidden)return;
   const delta=previous==null?0:Math.max(0,Math.min(.075,(timestamp-previous)/1000));
   previous=timestamp;time+=delta;
   entries.forEach(place);
   draw();
   frame=requestAnimationFrame(animate);
 }
 function start(){
   if(!playing||disposed||!entries.length||frame||document.hidden)return;
   previous=null;frame=requestAnimationFrame(animate);
 }
 function stop(){
   if(frame)cancelAnimationFrame(frame);
   frame=0;previous=null;
 }
 function setPlaying(next){
   playing=Boolean(next)&&!reduced();
   if(playing)start();else stop();
   return playing;
 }
 function onVisibility(){if(document.hidden)stop();else start()}
 if(typeof document!=="undefined")document.addEventListener("visibilitychange",onVisibility);
 return {
   update,setPlaying,
   get count(){return entries.length},
   get playing(){return playing},
   dispose(){
     disposed=true;stop();clear();
     if(typeof document!=="undefined")document.removeEventListener("visibilitychange",onVisibility);
   }
 };
}
