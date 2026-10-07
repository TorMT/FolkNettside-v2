import {extension} from "./utils.js?v=1b2df9871b099337e2126a52144046d1147577a7";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=1b2df9871b099337e2126a52144046d1147577a7"),docx:()=>import("./adapters/office.js?v=1b2df9871b099337e2126a52144046d1147577a7"),xlsx:()=>import("./adapters/office.js?v=1b2df9871b099337e2126a52144046d1147577a7"),pptx:()=>import("./adapters/office.js?v=1b2df9871b099337e2126a52144046d1147577a7"),csv:()=>import("./adapters/csv.js?v=1b2df9871b099337e2126a52144046d1147577a7"),
  html:()=>import("./adapters/html.js?v=1b2df9871b099337e2126a52144046d1147577a7"),htm:()=>import("./adapters/html.js?v=1b2df9871b099337e2126a52144046d1147577a7"),
  ipynb:()=>import("./adapters/notebook.js?v=1b2df9871b099337e2126a52144046d1147577a7"),tex:()=>import("./adapters/latex.js?v=1b2df9871b099337e2126a52144046d1147577a7"),
  mp4:()=>import("./adapters/video.js?v=1b2df9871b099337e2126a52144046d1147577a7"),webm:()=>import("./adapters/video.js?v=1b2df9871b099337e2126a52144046d1147577a7"),mkv:()=>import("./adapters/video.js?v=1b2df9871b099337e2126a52144046d1147577a7"),
  stl:()=>import("./adapters/stl.js?v=1b2df9871b099337e2126a52144046d1147577a7"),"3mf":()=>import("./adapters/three-mf.js?v=1b2df9871b099337e2126a52144046d1147577a7"),
  md:()=>import("./adapters/text.js?v=1b2df9871b099337e2126a52144046d1147577a7"),txt:()=>import("./adapters/text.js?v=1b2df9871b099337e2126a52144046d1147577a7"),py:()=>import("./adapters/text.js?v=1b2df9871b099337e2126a52144046d1147577a7"),
  js:()=>import("./adapters/text.js?v=1b2df9871b099337e2126a52144046d1147577a7"),mjs:()=>import("./adapters/text.js?v=1b2df9871b099337e2126a52144046d1147577a7"),ts:()=>import("./adapters/text.js?v=1b2df9871b099337e2126a52144046d1147577a7"),
  tsx:()=>import("./adapters/text.js?v=1b2df9871b099337e2126a52144046d1147577a7"),jsx:()=>import("./adapters/text.js?v=1b2df9871b099337e2126a52144046d1147577a7"),json:()=>import("./adapters/text.js?v=1b2df9871b099337e2126a52144046d1147577a7"),
  yaml:()=>import("./adapters/text.js?v=1b2df9871b099337e2126a52144046d1147577a7"),yml:()=>import("./adapters/text.js?v=1b2df9871b099337e2126a52144046d1147577a7"),c:()=>import("./adapters/text.js?v=1b2df9871b099337e2126a52144046d1147577a7"),
  cpp:()=>import("./adapters/text.js?v=1b2df9871b099337e2126a52144046d1147577a7"),h:()=>import("./adapters/text.js?v=1b2df9871b099337e2126a52144046d1147577a7"),hpp:()=>import("./adapters/text.js?v=1b2df9871b099337e2126a52144046d1147577a7"),
  cs:()=>import("./adapters/text.js?v=1b2df9871b099337e2126a52144046d1147577a7"),java:()=>import("./adapters/text.js?v=1b2df9871b099337e2126a52144046d1147577a7")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=1b2df9871b099337e2126a52144046d1147577a7");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=1b2df9871b099337e2126a52144046d1147577a7");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
