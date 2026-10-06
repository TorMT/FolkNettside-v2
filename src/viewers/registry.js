import {extension} from "./utils.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),docx:()=>import("./adapters/office.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),xlsx:()=>import("./adapters/office.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),pptx:()=>import("./adapters/office.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),csv:()=>import("./adapters/csv.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),
  html:()=>import("./adapters/html.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),htm:()=>import("./adapters/html.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),
  ipynb:()=>import("./adapters/notebook.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),tex:()=>import("./adapters/latex.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),
  mp4:()=>import("./adapters/video.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),webm:()=>import("./adapters/video.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),mkv:()=>import("./adapters/video.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),
  stl:()=>import("./adapters/stl.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),"3mf":()=>import("./adapters/three-mf.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),
  md:()=>import("./adapters/text.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),txt:()=>import("./adapters/text.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),py:()=>import("./adapters/text.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),
  js:()=>import("./adapters/text.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),mjs:()=>import("./adapters/text.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),ts:()=>import("./adapters/text.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),
  tsx:()=>import("./adapters/text.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),jsx:()=>import("./adapters/text.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),json:()=>import("./adapters/text.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),
  yaml:()=>import("./adapters/text.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),yml:()=>import("./adapters/text.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),c:()=>import("./adapters/text.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),
  cpp:()=>import("./adapters/text.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),h:()=>import("./adapters/text.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),hpp:()=>import("./adapters/text.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),
  cs:()=>import("./adapters/text.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe"),java:()=>import("./adapters/text.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe")
};
export async function loadAdapter(resource){
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
