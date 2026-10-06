import {extension} from "./utils.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),docx:()=>import("./adapters/office.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),xlsx:()=>import("./adapters/office.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),pptx:()=>import("./adapters/office.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),csv:()=>import("./adapters/csv.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),
  html:()=>import("./adapters/html.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),htm:()=>import("./adapters/html.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),
  ipynb:()=>import("./adapters/notebook.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),tex:()=>import("./adapters/latex.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),
  mp4:()=>import("./adapters/video.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),webm:()=>import("./adapters/video.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),mkv:()=>import("./adapters/video.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),
  stl:()=>import("./adapters/stl.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),"3mf":()=>import("./adapters/three-mf.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),
  md:()=>import("./adapters/text.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),txt:()=>import("./adapters/text.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),py:()=>import("./adapters/text.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),
  js:()=>import("./adapters/text.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),mjs:()=>import("./adapters/text.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),ts:()=>import("./adapters/text.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),
  tsx:()=>import("./adapters/text.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),jsx:()=>import("./adapters/text.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),json:()=>import("./adapters/text.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),
  yaml:()=>import("./adapters/text.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),yml:()=>import("./adapters/text.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),c:()=>import("./adapters/text.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),
  cpp:()=>import("./adapters/text.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),h:()=>import("./adapters/text.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),hpp:()=>import("./adapters/text.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),
  cs:()=>import("./adapters/text.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295"),java:()=>import("./adapters/text.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295")
};
export async function loadAdapter(resource){
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
