/**
 * Local browser-only SpaceMouse preferences. WebHID cannot access driver
 * application profiles, so "fusion-object" is a documented approximation of
 * the object-navigation convention, not an export of 3DxWare settings.
 */
const KEY="folk-v2-spacemouse:v1";
export const SPACE_MOUSE_DEFAULTS=Object.freeze({
  profile:"fusion-object",navigation:"object",
  sensitivity:0.6,panSpeed:1,rotationSpeed:1,deadzone:0.035,
  panZoom:true,rotation:true,roll:true,
  invertPanX:false,invertPanY:false,invertZoom:false,
  invertTilt:false,invertSpin:false,invertRoll:false
});
const booleanKeys=["panZoom","rotation","roll","invertPanX","invertPanY","invertZoom","invertTilt","invertSpin","invertRoll"];
const numeric={sensitivity:[.2,2],panSpeed:[.2,2],rotationSpeed:[.2,2],deadzone:[0,.35]};
export function normaliseSpaceMouseSettings(value={}){
  const obj=value&&typeof value==="object"?value:{};
  const state={...SPACE_MOUSE_DEFAULTS};
  state.profile=obj.profile==="custom"?"custom":"fusion-object";
  state.navigation=obj.navigation==="camera"?"camera":"object";
  for(const [key,[min,max]] of Object.entries(numeric)){
    const candidate=Number(obj[key]);
    if(obj[key]!==undefined&&Number.isFinite(candidate))
      state[key]=Math.max(min,Math.min(max,candidate));
  }
  for(const key of booleanKeys)if(typeof obj[key]==="boolean")state[key]=obj[key];
  return state;
}
export function readSpaceMouseSettings(storage=globalThis.localStorage){
  try{return normaliseSpaceMouseSettings(JSON.parse(storage?.getItem(KEY)||"{}"))}
  catch{return normaliseSpaceMouseSettings()}
}
export function writeSpaceMouseSettings(patch,storage=globalThis.localStorage){
  const next=normaliseSpaceMouseSettings({...readSpaceMouseSettings(storage),...patch});
  try{storage?.setItem(KEY,JSON.stringify(next))}catch{}
  if(typeof window!=="undefined"&&typeof CustomEvent!=="undefined")
    window.dispatchEvent(new CustomEvent("folk:spacemouse-settings",{detail:next}));
  return next;
}
export function resetSpaceMouseSettings(storage=globalThis.localStorage){
  try{storage?.removeItem(KEY)}catch{}
  if(typeof window!=="undefined"&&typeof CustomEvent!=="undefined")
    window.dispatchEvent(new CustomEvent("folk:spacemouse-settings",{
      detail:normaliseSpaceMouseSettings()
    }));
  return normaliseSpaceMouseSettings();
}
