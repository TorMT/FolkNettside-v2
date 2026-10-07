import {extension} from "./utils.js?v=cc845614f295871cd6b7894410ca75b907a64d48";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),docx:()=>import("./adapters/office.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),xlsx:()=>import("./adapters/office.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),pptx:()=>import("./adapters/office.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),csv:()=>import("./adapters/csv.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),
  html:()=>import("./adapters/html.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),htm:()=>import("./adapters/html.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),
  ipynb:()=>import("./adapters/notebook.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),tex:()=>import("./adapters/latex.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),
  mp4:()=>import("./adapters/video.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),webm:()=>import("./adapters/video.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),mkv:()=>import("./adapters/video.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),
  stl:()=>import("./adapters/stl.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),"3mf":()=>import("./adapters/three-mf.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),
  md:()=>import("./adapters/text.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),txt:()=>import("./adapters/text.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),py:()=>import("./adapters/text.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),
  js:()=>import("./adapters/text.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),mjs:()=>import("./adapters/text.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),ts:()=>import("./adapters/text.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),
  tsx:()=>import("./adapters/text.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),jsx:()=>import("./adapters/text.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),json:()=>import("./adapters/text.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),
  yaml:()=>import("./adapters/text.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),yml:()=>import("./adapters/text.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),c:()=>import("./adapters/text.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),
  cpp:()=>import("./adapters/text.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),h:()=>import("./adapters/text.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),hpp:()=>import("./adapters/text.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),
  cs:()=>import("./adapters/text.js?v=cc845614f295871cd6b7894410ca75b907a64d48"),java:()=>import("./adapters/text.js?v=cc845614f295871cd6b7894410ca75b907a64d48")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=cc845614f295871cd6b7894410ca75b907a64d48");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=cc845614f295871cd6b7894410ca75b907a64d48");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
