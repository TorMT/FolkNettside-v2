import {extension} from "./utils.js?v=736846c68df99c645bae84f521ba552176960f68";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=736846c68df99c645bae84f521ba552176960f68"),docx:()=>import("./adapters/office.js?v=736846c68df99c645bae84f521ba552176960f68"),xlsx:()=>import("./adapters/office.js?v=736846c68df99c645bae84f521ba552176960f68"),pptx:()=>import("./adapters/office.js?v=736846c68df99c645bae84f521ba552176960f68"),csv:()=>import("./adapters/csv.js?v=736846c68df99c645bae84f521ba552176960f68"),
  html:()=>import("./adapters/html.js?v=736846c68df99c645bae84f521ba552176960f68"),htm:()=>import("./adapters/html.js?v=736846c68df99c645bae84f521ba552176960f68"),
  ipynb:()=>import("./adapters/notebook.js?v=736846c68df99c645bae84f521ba552176960f68"),tex:()=>import("./adapters/latex.js?v=736846c68df99c645bae84f521ba552176960f68"),
  mp4:()=>import("./adapters/video.js?v=736846c68df99c645bae84f521ba552176960f68"),webm:()=>import("./adapters/video.js?v=736846c68df99c645bae84f521ba552176960f68"),mkv:()=>import("./adapters/video.js?v=736846c68df99c645bae84f521ba552176960f68"),
  stl:()=>import("./adapters/stl.js?v=736846c68df99c645bae84f521ba552176960f68"),"3mf":()=>import("./adapters/three-mf.js?v=736846c68df99c645bae84f521ba552176960f68"),
  md:()=>import("./adapters/text.js?v=736846c68df99c645bae84f521ba552176960f68"),txt:()=>import("./adapters/text.js?v=736846c68df99c645bae84f521ba552176960f68"),py:()=>import("./adapters/text.js?v=736846c68df99c645bae84f521ba552176960f68"),
  js:()=>import("./adapters/text.js?v=736846c68df99c645bae84f521ba552176960f68"),mjs:()=>import("./adapters/text.js?v=736846c68df99c645bae84f521ba552176960f68"),ts:()=>import("./adapters/text.js?v=736846c68df99c645bae84f521ba552176960f68"),
  tsx:()=>import("./adapters/text.js?v=736846c68df99c645bae84f521ba552176960f68"),jsx:()=>import("./adapters/text.js?v=736846c68df99c645bae84f521ba552176960f68"),json:()=>import("./adapters/text.js?v=736846c68df99c645bae84f521ba552176960f68"),
  yaml:()=>import("./adapters/text.js?v=736846c68df99c645bae84f521ba552176960f68"),yml:()=>import("./adapters/text.js?v=736846c68df99c645bae84f521ba552176960f68"),c:()=>import("./adapters/text.js?v=736846c68df99c645bae84f521ba552176960f68"),
  cpp:()=>import("./adapters/text.js?v=736846c68df99c645bae84f521ba552176960f68"),h:()=>import("./adapters/text.js?v=736846c68df99c645bae84f521ba552176960f68"),hpp:()=>import("./adapters/text.js?v=736846c68df99c645bae84f521ba552176960f68"),
  cs:()=>import("./adapters/text.js?v=736846c68df99c645bae84f521ba552176960f68"),java:()=>import("./adapters/text.js?v=736846c68df99c645bae84f521ba552176960f68")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=736846c68df99c645bae84f521ba552176960f68");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=736846c68df99c645bae84f521ba552176960f68");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
