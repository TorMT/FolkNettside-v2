const KEY="folk-v2-settings";
const DEFAULTS={mode:"system",accent:"magenta",density:"comfortable",motion:"system",contrast:"standard"};
let state=load();
function load(){try{return {...DEFAULTS,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return {...DEFAULTS}}}
function resolvedMode(){if(state.mode!=="system")return state.mode;return matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}
function apply(){
 const root=document.documentElement;
 root.dataset.mode=resolvedMode();root.dataset.accent=state.accent;root.dataset.density=state.density;root.dataset.motion=state.motion;root.dataset.contrast=state.contrast;
 window.dispatchEvent(new CustomEvent("folk:settings",{detail:{...state,resolvedMode:resolvedMode()}}));
}
export function getSettings(){return {...state}}
export function setSetting(key,value){state={...state,[key]:value};localStorage.setItem(KEY,JSON.stringify(state));apply()}
export function initSettings(){apply();matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>{if(state.mode==="system")apply()})}
