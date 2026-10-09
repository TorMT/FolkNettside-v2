/** Map 3Dconnexion 6-DoF reports to bounded, camera-relative movements.
 * Report units are arbitrary normalized HID axes, not world-space metres.
 * Translation Z controls dolly zoom rather than moving camera and target
 * together in parallel (which was almost imperceptible).
 */
export function spaceMouseMovement({kind,values},{sensitivity=1,invertZoom=false}={}){
 if(!["translate","rotate"].includes(kind)||!Array.isArray(values)||values.length!==3||
   !values.every(Number.isFinite)||!Number.isFinite(sensitivity)||sensitivity<=0||sensitivity>4)
   return null;
 const [x,y,z]=values.map(n=>Math.max(-2,Math.min(2,n)));
 if(kind==="translate"){
   // Small camera-relative increments. No acceleration on repeated reports.
   return {pan:[x*.005*sensitivity,-y*.005*sensitivity,0],
     zoom:Math.exp((invertZoom?1:-1)*z*.035*sensitivity)};
 }
 return {orbit:[-x*.016*sensitivity,y*.016*sensitivity,z*.012*sensitivity]};
}
