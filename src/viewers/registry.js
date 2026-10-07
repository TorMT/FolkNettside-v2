import {extension} from "./utils.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),docx:()=>import("./adapters/office.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),xlsx:()=>import("./adapters/office.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),pptx:()=>import("./adapters/office.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),csv:()=>import("./adapters/csv.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),
  html:()=>import("./adapters/html.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),htm:()=>import("./adapters/html.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),
  ipynb:()=>import("./adapters/notebook.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),tex:()=>import("./adapters/latex.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),
  mp4:()=>import("./adapters/video.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),webm:()=>import("./adapters/video.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),mkv:()=>import("./adapters/video.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),
  stl:()=>import("./adapters/stl.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),"3mf":()=>import("./adapters/three-mf.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),
  md:()=>import("./adapters/text.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),txt:()=>import("./adapters/text.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),py:()=>import("./adapters/text.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),
  js:()=>import("./adapters/text.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),mjs:()=>import("./adapters/text.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),ts:()=>import("./adapters/text.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),
  tsx:()=>import("./adapters/text.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),jsx:()=>import("./adapters/text.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),json:()=>import("./adapters/text.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),
  yaml:()=>import("./adapters/text.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),yml:()=>import("./adapters/text.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),c:()=>import("./adapters/text.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),
  cpp:()=>import("./adapters/text.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),h:()=>import("./adapters/text.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),hpp:()=>import("./adapters/text.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),
  cs:()=>import("./adapters/text.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890"),java:()=>import("./adapters/text.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
