import {extension} from "./utils.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),docx:()=>import("./adapters/office.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),xlsx:()=>import("./adapters/office.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),pptx:()=>import("./adapters/office.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),csv:()=>import("./adapters/csv.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),
  html:()=>import("./adapters/html.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),htm:()=>import("./adapters/html.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),
  ipynb:()=>import("./adapters/notebook.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),tex:()=>import("./adapters/latex.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),
  mp4:()=>import("./adapters/video.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),webm:()=>import("./adapters/video.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),mkv:()=>import("./adapters/video.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),
  stl:()=>import("./adapters/stl.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),"3mf":()=>import("./adapters/three-mf.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),
  md:()=>import("./adapters/text.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),txt:()=>import("./adapters/text.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),py:()=>import("./adapters/text.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),
  js:()=>import("./adapters/text.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),mjs:()=>import("./adapters/text.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),ts:()=>import("./adapters/text.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),
  tsx:()=>import("./adapters/text.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),jsx:()=>import("./adapters/text.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),json:()=>import("./adapters/text.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),
  yaml:()=>import("./adapters/text.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),yml:()=>import("./adapters/text.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),c:()=>import("./adapters/text.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),
  cpp:()=>import("./adapters/text.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),h:()=>import("./adapters/text.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),hpp:()=>import("./adapters/text.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),
  cs:()=>import("./adapters/text.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c"),java:()=>import("./adapters/text.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
