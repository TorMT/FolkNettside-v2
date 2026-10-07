import {extension} from "./utils.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),docx:()=>import("./adapters/office.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),xlsx:()=>import("./adapters/office.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),pptx:()=>import("./adapters/office.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),csv:()=>import("./adapters/csv.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),
  html:()=>import("./adapters/html.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),htm:()=>import("./adapters/html.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),
  ipynb:()=>import("./adapters/notebook.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),tex:()=>import("./adapters/latex.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),
  mp4:()=>import("./adapters/video.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),webm:()=>import("./adapters/video.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),mkv:()=>import("./adapters/video.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),
  stl:()=>import("./adapters/stl.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),"3mf":()=>import("./adapters/three-mf.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),
  md:()=>import("./adapters/text.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),txt:()=>import("./adapters/text.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),py:()=>import("./adapters/text.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),
  js:()=>import("./adapters/text.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),mjs:()=>import("./adapters/text.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),ts:()=>import("./adapters/text.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),
  tsx:()=>import("./adapters/text.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),jsx:()=>import("./adapters/text.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),json:()=>import("./adapters/text.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),
  yaml:()=>import("./adapters/text.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),yml:()=>import("./adapters/text.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),c:()=>import("./adapters/text.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),
  cpp:()=>import("./adapters/text.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),h:()=>import("./adapters/text.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),hpp:()=>import("./adapters/text.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),
  cs:()=>import("./adapters/text.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99"),java:()=>import("./adapters/text.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
