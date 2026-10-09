import {connectCADKeyboard} from "./cad-navigation.js";
import {connectSpaceMouse} from "./spacemouse-webhid.js";

/** Attach the same desktop CAD navigation to standalone WebGL gear views.
 * This does not rotate actual design objects, only the display camera.
 */
export function mountStandaloneCADNavigation({
 THREE,camera,controls,canvas,toolbar,draw,onExplode=()=>{}
}){
 canvas.tabIndex=0;
 canvas.style.touchAction="none";
 canvas.setAttribute("aria-label","3D gearbox: left drag orbit; middle drag pan; Shift-middle drag orbit; Fusion keyboard controls and optional 3D mouse");
 controls.mouseButtons.MIDDLE=THREE.MOUSE.PAN;
 const originalPosition=camera.position.clone(),originalTarget=controls.target.clone(),originalUp=camera.up.clone();
 let disposed=false,session=null,connecting=false;
 const navigate3D=({pan=[0,0,0],orbit=[0,0,0],zoom=1}={})=>{
   if(![...pan,...orbit,zoom].every(Number.isFinite)||zoom<=0)
     throw Error("Invalid CAD camera movement");
   camera.updateMatrixWorld(true);
   const distance=Math.max(.05,camera.position.distanceTo(controls.target));
   const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0).normalize();
   const up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1).normalize();
   const forward=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,2).negate().normalize();
   const shift=right.multiplyScalar(pan[0]*distance)
     .addScaledVector(up,pan[1]*distance).addScaledVector(forward,pan[2]*distance);
   camera.position.add(shift);controls.target.add(shift);
   const direction=camera.position.clone().sub(controls.target);
   if(orbit[1])direction.applyAxisAngle(camera.up,orbit[1]);
   if(orbit[0])direction.applyAxisAngle(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0).normalize(),orbit[0]);
   if(orbit[2])camera.up.applyAxisAngle(forward,orbit[2]).normalize();
   camera.position.copy(controls.target).add(direction.multiplyScalar(Math.max(.08,Math.min(12,zoom))));
   controls.update();draw();
 };
 const reset=()=>{
   camera.position.copy(originalPosition);controls.target.copy(originalTarget);camera.up.copy(originalUp);
   controls.update();draw();
 };
 const standardView=type=>{
   const distance=originalPosition.distanceTo(originalTarget);
   const directions={top:[0,-.001,1],front:[0,-1,.1],rear:[0,1,.1],
     port:[-1,0,.1],starboard:[1,0,.1]};
   const dir=new THREE.Vector3(...(directions[type]||[1,-1,1])).normalize();
   controls.target.copy(originalTarget);
   camera.position.copy(originalTarget).add(dir.multiplyScalar(distance));
   controls.update();draw();
 };
 const offKeys=connectCADKeyboard(canvas,{
   fit:reset,resetZoom:reset,setView:standardView,navigate3D,
   setIsolation:()=>{},setScopedExplode:()=>{}
 },{onExplode});
 const down=e=>{
   canvas.focus({preventScroll:true});
   if(e.button===1)controls.mouseButtons.MIDDLE=e.shiftKey?THREE.MOUSE.ROTATE:THREE.MOUSE.PAN;
 };
 const up=()=>{controls.mouseButtons.MIDDLE=THREE.MOUSE.PAN};
 canvas.addEventListener("pointerdown",down,true);
 canvas.addEventListener("pointerup",up);
 canvas.addEventListener("pointercancel",up);
 const connect=document.createElement("button");
 connect.className="btn";connect.type="button";connect.textContent="Connect 3D mouse";
 connect.dataset.gearSpacemouse="";
 const disconnect=document.createElement("button");
 disconnect.className="btn";disconnect.type="button";disconnect.textContent="Disconnect";disconnect.disabled=true;
 const status=document.createElement("span");
 status.className="muted";status.dataset.gearSpacemouseStatus="";
 status.textContent="Optional WebHID · desktop Chrome/Edge";
 toolbar.append(connect,disconnect,status);
 if(!globalThis.navigator?.hid)connect.disabled=true;
 const stop=async()=>{
   if(session){const local=session;session=null;await local.disconnect()}
   disconnect.disabled=true;connect.disabled=!globalThis.navigator?.hid;
 };
 connect.addEventListener("click",async()=>{
   if(connecting||session)return;
   connecting=true;connect.disabled=true;
   try{
     const selected=await connectSpaceMouse({
       isActive:()=>{
         const active=document.activeElement;
         return !disposed&&document.hasFocus()&&
           canvas.parentElement?.contains(active)&&
           !["INPUT","SELECT","TEXTAREA"].includes(active?.tagName);
       },
       onStatus:message=>{if(!disposed)status.textContent=message},
       onVector:({kind,values})=>{
         if(kind==="translate")navigate3D({pan:[values[0]*.014,-values[1]*.014,-values[2]*.014]});
         else navigate3D({orbit:[-values[0]*.025,values[1]*.025,values[2]*.025]});
       }
     });
     if(disposed){await selected.disconnect();return}
     session=selected;disconnect.disabled=false;
   }catch(e){if(!disposed)status.textContent=String(e?.message||e)}
   finally{connecting=false;if(!disposed&&!session)connect.disabled=!globalThis.navigator?.hid}
 });
 disconnect.addEventListener("click",()=>void stop());
 return {
   navigate3D,reset,
   dispose(){
     disposed=true;offKeys();void stop();
     canvas.removeEventListener("pointerdown",down,true);
     canvas.removeEventListener("pointerup",up);
     canvas.removeEventListener("pointercancel",up);
     connect.remove();disconnect.remove();status.remove();
   }
 };
}
