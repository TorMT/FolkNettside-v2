import {extension} from "./utils.js?v=634ad8a5914465c1e005c6866964328b8a95df46";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),docx:()=>import("./adapters/office.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),xlsx:()=>import("./adapters/office.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),pptx:()=>import("./adapters/office.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),csv:()=>import("./adapters/csv.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),
  html:()=>import("./adapters/html.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),htm:()=>import("./adapters/html.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),
  ipynb:()=>import("./adapters/notebook.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),tex:()=>import("./adapters/latex.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),
  mp4:()=>import("./adapters/video.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),webm:()=>import("./adapters/video.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),mkv:()=>import("./adapters/video.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),
  stl:()=>import("./adapters/stl.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),"3mf":()=>import("./adapters/three-mf.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),
  md:()=>import("./adapters/text.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),txt:()=>import("./adapters/text.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),py:()=>import("./adapters/text.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),
  js:()=>import("./adapters/text.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),mjs:()=>import("./adapters/text.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),ts:()=>import("./adapters/text.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),
  tsx:()=>import("./adapters/text.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),jsx:()=>import("./adapters/text.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),json:()=>import("./adapters/text.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),
  yaml:()=>import("./adapters/text.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),yml:()=>import("./adapters/text.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),c:()=>import("./adapters/text.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),
  cpp:()=>import("./adapters/text.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),h:()=>import("./adapters/text.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),hpp:()=>import("./adapters/text.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),
  cs:()=>import("./adapters/text.js?v=634ad8a5914465c1e005c6866964328b8a95df46"),java:()=>import("./adapters/text.js?v=634ad8a5914465c1e005c6866964328b8a95df46")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=634ad8a5914465c1e005c6866964328b8a95df46");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=634ad8a5914465c1e005c6866964328b8a95df46");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
