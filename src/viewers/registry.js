import {extension} from "./utils.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),docx:()=>import("./adapters/office.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),xlsx:()=>import("./adapters/office.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),pptx:()=>import("./adapters/office.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),csv:()=>import("./adapters/csv.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),
  html:()=>import("./adapters/html.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),htm:()=>import("./adapters/html.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),
  ipynb:()=>import("./adapters/notebook.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),tex:()=>import("./adapters/latex.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),
  mp4:()=>import("./adapters/video.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),webm:()=>import("./adapters/video.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),mkv:()=>import("./adapters/video.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),
  stl:()=>import("./adapters/stl.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),"3mf":()=>import("./adapters/three-mf.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),
  md:()=>import("./adapters/text.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),txt:()=>import("./adapters/text.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),py:()=>import("./adapters/text.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),
  js:()=>import("./adapters/text.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),mjs:()=>import("./adapters/text.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),ts:()=>import("./adapters/text.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),
  tsx:()=>import("./adapters/text.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),jsx:()=>import("./adapters/text.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),json:()=>import("./adapters/text.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),
  yaml:()=>import("./adapters/text.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),yml:()=>import("./adapters/text.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),c:()=>import("./adapters/text.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),
  cpp:()=>import("./adapters/text.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),h:()=>import("./adapters/text.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),hpp:()=>import("./adapters/text.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),
  cs:()=>import("./adapters/text.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9"),java:()=>import("./adapters/text.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
