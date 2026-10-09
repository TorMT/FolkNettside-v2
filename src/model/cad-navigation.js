/**
 * Focus-scoped CAD navigation. Fusion-inspired shortcuts (not a claim that
 * every Fusion-specific OS shortcut is identical):
 * F fit, I iso, T top, 1-5 standard views; arrows pan, Shift arrows orbit,
 * +/- zoom, X explode, Escape restore assembled view.
 */
export function cadShortcut(event){
 if(event.altKey||event.ctrlKey||event.metaKey)return null;
 const key=String(event.key||"").toLowerCase();
 if(key==="f")return {action:"fit"};
 if(key==="i")return {action:"iso"};
 if(key==="t")return {action:"top"};
 if(key==="1")return {action:"front"};
 if(key==="2")return {action:"rear"};
 if(key==="3")return {action:"port"};
 if(key==="4")return {action:"starboard"};
 if(key==="5")return {action:"top"};
 if(key==="="||key==="+")return {action:"zoom",factor:.83};
 if(key==="-"||key==="_")return {action:"zoom",factor:1.2};
 if(key==="x")return {action:"toggle-explode"};
 if(key==="escape")return {action:"restore"};
 const arrows={arrowup:[0,1],arrowdown:[0,-1],arrowleft:[-1,0],arrowright:[1,0]};
 if(arrows[key]){
   const [x,y]=arrows[key];
   return event.shiftKey?
     {action:"orbit",yaw:x*.1,pitch:y*.1}:
     {action:"pan",x:-x*.065,y:y*.065};
 }
 return null;
}
export function connectCADKeyboard(canvas,actions,{onExplode=()=>{}}={}){
 const handler=event=>{
   if(event.target!==canvas)return;
   const command=cadShortcut(event);
   if(!command)return;
   event.preventDefault();
   switch(command.action){
   case "fit":actions.fit();break;
   case "iso":actions.resetZoom();break;
   case "top":actions.setView("top");break;
   case "front":case "rear":case "port":case "starboard":
     actions.setView(command.action);break;
   case "zoom":actions.navigate3D({zoom:command.factor});break;
   case "pan":actions.navigate3D({pan:[command.x,command.y,0]});break;
   case "orbit":actions.navigate3D({orbit:[command.pitch,command.yaw,0]});break;
   case "toggle-explode":onExplode();break;
   case "restore":onExplode(true);actions.setIsolation(null);
     actions.setScopedExplode({ids:[],amount:0});break;
   }
 };
 canvas.addEventListener("keydown",handler);
 return ()=>canvas.removeEventListener("keydown",handler);
}
