import {extension} from "./utils.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),docx:()=>import("./adapters/office.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),xlsx:()=>import("./adapters/office.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),pptx:()=>import("./adapters/office.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),csv:()=>import("./adapters/csv.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),
  html:()=>import("./adapters/html.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),htm:()=>import("./adapters/html.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),
  ipynb:()=>import("./adapters/notebook.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),tex:()=>import("./adapters/latex.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),
  mp4:()=>import("./adapters/video.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),webm:()=>import("./adapters/video.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),mkv:()=>import("./adapters/video.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),
  stl:()=>import("./adapters/stl.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),"3mf":()=>import("./adapters/three-mf.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),
  md:()=>import("./adapters/text.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),txt:()=>import("./adapters/text.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),py:()=>import("./adapters/text.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),
  js:()=>import("./adapters/text.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),mjs:()=>import("./adapters/text.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),ts:()=>import("./adapters/text.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),
  tsx:()=>import("./adapters/text.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),jsx:()=>import("./adapters/text.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),json:()=>import("./adapters/text.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),
  yaml:()=>import("./adapters/text.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),yml:()=>import("./adapters/text.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),c:()=>import("./adapters/text.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),
  cpp:()=>import("./adapters/text.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),h:()=>import("./adapters/text.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),hpp:()=>import("./adapters/text.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),
  cs:()=>import("./adapters/text.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d"),java:()=>import("./adapters/text.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
