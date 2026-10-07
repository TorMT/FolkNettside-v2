import {extension} from "./utils.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),docx:()=>import("./adapters/office.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),xlsx:()=>import("./adapters/office.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),pptx:()=>import("./adapters/office.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),csv:()=>import("./adapters/csv.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),
  html:()=>import("./adapters/html.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),htm:()=>import("./adapters/html.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),
  ipynb:()=>import("./adapters/notebook.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),tex:()=>import("./adapters/latex.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),
  mp4:()=>import("./adapters/video.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),webm:()=>import("./adapters/video.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),mkv:()=>import("./adapters/video.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),
  stl:()=>import("./adapters/stl.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),"3mf":()=>import("./adapters/three-mf.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),
  md:()=>import("./adapters/text.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),txt:()=>import("./adapters/text.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),py:()=>import("./adapters/text.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),
  js:()=>import("./adapters/text.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),mjs:()=>import("./adapters/text.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),ts:()=>import("./adapters/text.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),
  tsx:()=>import("./adapters/text.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),jsx:()=>import("./adapters/text.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),json:()=>import("./adapters/text.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),
  yaml:()=>import("./adapters/text.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),yml:()=>import("./adapters/text.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),c:()=>import("./adapters/text.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),
  cpp:()=>import("./adapters/text.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),h:()=>import("./adapters/text.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),hpp:()=>import("./adapters/text.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),
  cs:()=>import("./adapters/text.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6"),java:()=>import("./adapters/text.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
