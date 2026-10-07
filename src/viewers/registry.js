import {extension} from "./utils.js?v=a9b99ee88974141a595afc683db34eea2547479f";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=a9b99ee88974141a595afc683db34eea2547479f"),docx:()=>import("./adapters/office.js?v=a9b99ee88974141a595afc683db34eea2547479f"),xlsx:()=>import("./adapters/office.js?v=a9b99ee88974141a595afc683db34eea2547479f"),pptx:()=>import("./adapters/office.js?v=a9b99ee88974141a595afc683db34eea2547479f"),csv:()=>import("./adapters/csv.js?v=a9b99ee88974141a595afc683db34eea2547479f"),
  html:()=>import("./adapters/html.js?v=a9b99ee88974141a595afc683db34eea2547479f"),htm:()=>import("./adapters/html.js?v=a9b99ee88974141a595afc683db34eea2547479f"),
  ipynb:()=>import("./adapters/notebook.js?v=a9b99ee88974141a595afc683db34eea2547479f"),tex:()=>import("./adapters/latex.js?v=a9b99ee88974141a595afc683db34eea2547479f"),
  mp4:()=>import("./adapters/video.js?v=a9b99ee88974141a595afc683db34eea2547479f"),webm:()=>import("./adapters/video.js?v=a9b99ee88974141a595afc683db34eea2547479f"),mkv:()=>import("./adapters/video.js?v=a9b99ee88974141a595afc683db34eea2547479f"),
  stl:()=>import("./adapters/stl.js?v=a9b99ee88974141a595afc683db34eea2547479f"),"3mf":()=>import("./adapters/three-mf.js?v=a9b99ee88974141a595afc683db34eea2547479f"),
  md:()=>import("./adapters/text.js?v=a9b99ee88974141a595afc683db34eea2547479f"),txt:()=>import("./adapters/text.js?v=a9b99ee88974141a595afc683db34eea2547479f"),py:()=>import("./adapters/text.js?v=a9b99ee88974141a595afc683db34eea2547479f"),
  js:()=>import("./adapters/text.js?v=a9b99ee88974141a595afc683db34eea2547479f"),mjs:()=>import("./adapters/text.js?v=a9b99ee88974141a595afc683db34eea2547479f"),ts:()=>import("./adapters/text.js?v=a9b99ee88974141a595afc683db34eea2547479f"),
  tsx:()=>import("./adapters/text.js?v=a9b99ee88974141a595afc683db34eea2547479f"),jsx:()=>import("./adapters/text.js?v=a9b99ee88974141a595afc683db34eea2547479f"),json:()=>import("./adapters/text.js?v=a9b99ee88974141a595afc683db34eea2547479f"),
  yaml:()=>import("./adapters/text.js?v=a9b99ee88974141a595afc683db34eea2547479f"),yml:()=>import("./adapters/text.js?v=a9b99ee88974141a595afc683db34eea2547479f"),c:()=>import("./adapters/text.js?v=a9b99ee88974141a595afc683db34eea2547479f"),
  cpp:()=>import("./adapters/text.js?v=a9b99ee88974141a595afc683db34eea2547479f"),h:()=>import("./adapters/text.js?v=a9b99ee88974141a595afc683db34eea2547479f"),hpp:()=>import("./adapters/text.js?v=a9b99ee88974141a595afc683db34eea2547479f"),
  cs:()=>import("./adapters/text.js?v=a9b99ee88974141a595afc683db34eea2547479f"),java:()=>import("./adapters/text.js?v=a9b99ee88974141a595afc683db34eea2547479f")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=a9b99ee88974141a595afc683db34eea2547479f");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=a9b99ee88974141a595afc683db34eea2547479f");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
