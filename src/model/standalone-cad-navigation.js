import {connectCADKeyboard} from "./cad-navigation.js?v=d87ab3a7143f047a2d9885ac4c244af2dfe37378";
import {connectSpaceMouse} from "./spacemouse-webhid.js?v=d87ab3a7143f047a2d9885ac4c244af2dfe37378";
import {spaceMouseMovement} from "./spacemouse-motion.js?v=d87ab3a7143f047a2d9885ac4c244af2dfe37378";
import {readSpaceMouseSettings,writeSpaceMouseSettings} from "./spacemouse-settings.js?v=d87ab3a7143f047a2d9885ac4c244af2dfe37378";

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
   const directions={top:[0,0,1],front:[0,-1,0],rear:[0,1,0],
     port:[-1,0,0],starboard:[1,0,0]};
   const dir=new THREE.Vector3(...(directions[type]||[1,-1,1])).normalize();
   camera.up.set(0,dir.z>.98?1:0,dir.z>.98?0:1);
   controls.target.copy(originalTarget);
   camera.position.copy(originalTarget).add(dir.multiplyScalar(distance));
   controls.update();draw();
 };
 const views=document.createElement("div");
 views.className="cad-view-presets";
 for(const [name,title] of [["iso","Iso"],["top","Top"],["front","Front"],
   ["rear","Rear"],["port","Port"],["starboard","Starboard"]]){
   const button=document.createElement("button");
   button.type="button";button.className="btn";button.textContent=title;
   button.dataset.gearView=name;
   button.addEventListener("click",()=>{
     if(name==="iso")reset();else standardView(name);
   });
   views.append(button);
 }
 for(const [title,direction] of [["Tilt −",[.13,0,0]],["Tilt +",[-.13,0,0]]]){
   const button=document.createElement("button");button.type="button";
   button.className="btn";button.textContent=title;
   button.dataset.gearTilt=String(direction[0]);
   button.addEventListener("click",()=>navigate3D({orbit:direction}));
   views.append(button);
 }
 toolbar.append(views);
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
 const options=document.createElement("label");
 options.className="model-spacemouse-settings";
 options.textContent="3D mouse sensitivity ";
 const gain=document.createElement("input");
 gain.type="range";gain.min=".2";gain.max="2";gain.step=".1";gain.value=String(readSpaceMouseSettings().sensitivity);
 gain.setAttribute("aria-label","3D mouse sensitivity");
 const gainValue=document.createElement("output");
 gainValue.textContent=gain.value+"×";
 const sync3DMouse=()=>{
   gain.value=String(readSpaceMouseSettings().sensitivity);
   gainValue.textContent=gain.value+"×";
 };
 const change3DMouse=()=>sync3DMouse();
 window.addEventListener("folk:spacemouse-settings",change3DMouse);
 gain.addEventListener("input",()=>writeSpaceMouseSettings({sensitivity:Number(gain.value)}));
 options.append(gain,gainValue);
 const details=document.createElement("a");details.href="#/settings/engineering";
 details.textContent="All SpaceMouse axes";options.append(details);
 toolbar.append(connect,disconnect,status,options);
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
       onVector:sample=>{
         const motion=spaceMouseMovement(sample,readSpaceMouseSettings());
         if(motion)navigate3D(motion);
       }
     });
     if(disposed){await selected.disconnect();return}
     session=selected;disconnect.disabled=false;
     canvas.focus({preventScroll:true});
   }catch(e){if(!disposed)status.textContent=String(e?.message||e)}
   finally{connecting=false;if(!disposed&&!session)connect.disabled=!globalThis.navigator?.hid}
 });
 disconnect.addEventListener("click",()=>void stop());
 return {
   navigate3D,reset,
   dispose(){
     disposed=true;offKeys();void stop();
     window.removeEventListener("folk:spacemouse-settings",change3DMouse);
     canvas.removeEventListener("pointerdown",down,true);
     canvas.removeEventListener("pointerup",up);
     canvas.removeEventListener("pointercancel",up);
     connect.remove();disconnect.remove();status.remove();options.remove();views.remove();
   }
 };
}
