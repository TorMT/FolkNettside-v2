/** Static Chromium WebHID / 3Dconnexion adapter.
 * No request for HID access until a user clicks Connect. Each report is
 * parsed as signed little-endian 16-bit axes, matching legacy SpaceMouse HID.
 * Vendor/product compatibility varies by OS driver and model.
 */
export const SPACE_MOUSE_VENDORS=[0x256f,0x046d];
export const SPACE_MOUSE_FILTERS=SPACE_MOUSE_VENDORS.map(vendorId=>({vendorId}));
export function decodeSpaceMouseReport(reportId,data,{deadzone=12/350}={}){
 if(reportId!==1&&reportId!==2)return null;
 if(!data||data.byteLength<6)return null;
 const values=[data.getInt16(0,true),data.getInt16(2,true),data.getInt16(4,true)];
 // Clamp hardware transients and software-neutral deadzone.
 return {kind:reportId===1?"translate":"rotate",
   values:values.map(v=>Math.abs(v/350)<deadzone?0:Math.max(-600,Math.min(600,v))/350)};
}
export async function connectSpaceMouse({hid=globalThis.navigator?.hid,
 onVector=()=>{},onStatus=()=>{},isActive=()=>true}={}){
 if(!hid?.requestDevice)throw Error("WebHID is unavailable. Use desktop Chrome/Edge over HTTPS.");
 const devices=await hid.requestDevice({filters:SPACE_MOUSE_FILTERS});
 const device=devices.find(item=>SPACE_MOUSE_VENDORS.includes(item.vendorId)&&
   (item.vendorId===0x256f||/3dconnexion|spacemouse|spacenavigator|spacepilot|spaceball|spaceexplorer/i.test(item.productName||"")));
 if(!device)throw Error("No supported SpaceMouse selected");
 const openedByUs=!device.opened;
 if(openedByUs)await device.open();
 let disposed=false;
 const onReport=event=>{
   if(disposed||!isActive()||(typeof document!=="undefined"&&document.visibilityState==="hidden"))return;
   const value=decodeSpaceMouseReport(event.reportId,event.data,{deadzone:0});
   if(value&&value.values.some(Math.abs))onVector(value);
 };
 const onDisconnect=event=>{
   if(event.device===device)onStatus("SpaceMouse disconnected");
 };
 device.addEventListener("inputreport",onReport);
 hid.addEventListener?.("disconnect",onDisconnect);
 onStatus("Connected: "+String(device.productName||"3Dconnexion SpaceMouse"));
 return {
   device,
   async disconnect(){
     if(disposed)return;
     disposed=true;
     device.removeEventListener("inputreport",onReport);
     hid.removeEventListener?.("disconnect",onDisconnect);
     if(openedByUs&&device.opened)try{await device.close()}catch{}
     onStatus("SpaceMouse disconnected");
   }
 };
}
