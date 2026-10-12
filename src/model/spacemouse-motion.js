import {normaliseSpaceMouseSettings} from "./spacemouse-settings.js?v=5e47924d6f048707c5a3d870121cf70c2cc9c6fc";

/**
 * Camera-space movement adapter for 6-DOF HID reports.
 * The "object" profile follows the usual model-on-cap convention; "camera"
 * reverses motion. These are app-level approximations, not 3DxWare settings.
 * All six input directions can be reversed independently in site Settings.
 */
export function spaceMouseMovement({kind,values}={},options={}){
 if(!["translate","rotate"].includes(kind)||!Array.isArray(values)||
   values.length!==3||!values.every(Number.isFinite))return null;
 const config=normaliseSpaceMouseSettings(options);
 const sensitivity=Number(options.sensitivity??config.sensitivity);
 if(!Number.isFinite(sensitivity)||sensitivity<=0||sensitivity>4)return null;
 const sign=config.navigation==="camera"?-1:1;
 const inputs=values.map(n=>Math.max(-2,Math.min(2,n)));
 const filtered=inputs.map(n=>Math.abs(n)<config.deadzone?0:n);
 if(kind==="translate"){
   if(!config.panZoom)return null;
   const [x,y,z]=filtered;
   const panSpeed=config.panSpeed*sensitivity*sign;
   const zoomSpeed=config.panSpeed*sensitivity*sign;
   return {
     pan:[x*(config.invertPanX?-1:1)*.005*panSpeed,
       -y*(config.invertPanY?-1:1)*.005*panSpeed,0],
     zoom:Math.exp(-z*(config.invertZoom?-1:1)*.035*zoomSpeed)
   };
 }
 if(!config.rotation)return null;
 const [tilt,spin,roll]=filtered;
 const rotate=config.rotationSpeed*sensitivity*sign;
 const orbit=[
   -tilt*(config.invertTilt?-1:1)*.016*rotate,
   spin*(config.invertSpin?-1:1)*.016*rotate,
   config.roll?roll*(config.invertRoll?-1:1)*.012*rotate:0
 ];
 return {orbit:orbit.map(v=>Math.abs(v)<1e-14?0:v)};
}
