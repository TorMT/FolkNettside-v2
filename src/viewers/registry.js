import {extension} from "./utils.js";

/**
 * Single dispatch table for every file in the Courses library. Unknown
 * binaries NEVER fall through to the UTF-8 source viewer. There is always
 * an actionable download/open-original screen when browser preview is absent.
 */
const adapters={
  pdf:"pdf",
  docx:"office",xlsx:"office",pptx:"office",
  csv:"csv",tsv:"csv",psv:"csv",
  html:"html",htm:"html",ipynb:"notebook",tex:"latex",
  mp4:"video",webm:"video",mkv:"video",mov:"video",m4v:"video",ogv:"video",
  stl:"stl","3mf":"three-mf",f3z:"fusion",f3d:"fusion",
  glb:"gltf",gltf:"gltf",obj:"obj",
  jpg:"image",jpeg:"image",png:"image",webp:"image",gif:"image",
  svg:"image",bmp:"image",avif:"image",ico:"image",tif:"image",tiff:"image",
  mp3:"audio",wav:"audio",wave:"audio",ogg:"audio",oga:"audio",
  flac:"audio",m4a:"audio",aac:"audio",opus:"audio",
  zip:"archive",cbz:"archive",jar:"archive",
  md:"text",txt:"text",py:"python",
  js:"text",mjs:"text",cjs:"text",ts:"text",tsx:"text",jsx:"text",
  json:"text",jsonl:"text",ndjson:"text",geojson:"text",
  yaml:"text",yml:"text",toml:"text",ini:"text",cfg:"text",conf:"text",
  c:"text",cc:"text",cpp:"text",cxx:"text",h:"text",hpp:"text",
  cs:"text",java:"text",kt:"text",rs:"text",go:"text",rb:"text",php:"text",
  swift:"text",r:"text",m:"text",sql:"text",sh:"text",bash:"text",zsh:"text",
  bat:"text",ps1:"text",xml:"text",css:"text",scss:"text",less:"text",
  log:"text",dat:"text",bib:"text",sty:"text",cls:"text",ipynb_checkpoints:"text",
  srt:"text",vtt:"text",ass:"text",drawio:"text",mmd:"text",mermaid:"text",
  rst:"text",adoc:"text",env:"text",gitignore:"text",
  step:"conversion",stp:"conversion",iges:"conversion",igs:"conversion",
  dwg:"conversion",dxf:"conversion",sat:"conversion",x_t:"conversion",
  x_b:"conversion",sldprt:"conversion",sldasm:"conversion",ipt:"conversion",
  iam:"conversion",catpart:"conversion",catproduct:"conversion",
  fbm:"conversion",blend:"conversion",skp:"conversion",
  doc:"conversion",xls:"conversion",ppt:"conversion",odt:"conversion",
  ods:"conversion",odp:"conversion",pages:"conversion",numbers:"conversion",
  key:"conversion",heic:"conversion",heif:"conversion",
  rar:"unsupported", "7z":"unsupported",tar:"unsupported",gz:"unsupported",
  bz2:"unsupported",xz:"unsupported",exe:"unsupported",dll:"unsupported",
  bin:"unsupported",iso:"unsupported"
};
const moduleCache=new Map();
export function viewerKind(resource={}){
  const kind=String(resource.kind||"").toUpperCase();
  if(kind==="YOUTUBE")return "youtube";
  if(kind==="QUIZ")return "quiz";
  const ext=extension(resource.path||resource.url||resource.name||"");
  return adapters[ext] || "unsupported";
}
export function viewerFormatCoverage(){
  return Object.freeze({...adapters});
}
export async function loadAdapter(resource){
  const kind=viewerKind(resource);
  let promise=moduleCache.get(kind);
  if(!promise){
    promise=import("./adapters/"+kind+".js");
    moduleCache.set(kind,promise);
  }
  const module=await promise;
  if(typeof module.render!=="function")
    throw new Error("Viewer adapter "+kind+" has no render() export");
  return {extension:viewerKind(resource)==="unsupported"?
      extension(resource.path||resource.url||resource.name||""):extension(resource.path||resource.url||resource.name||"")||kind,
    kind,render:module.render};
}
