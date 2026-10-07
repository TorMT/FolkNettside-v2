import {extension} from "./utils.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),docx:()=>import("./adapters/office.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),xlsx:()=>import("./adapters/office.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),pptx:()=>import("./adapters/office.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),csv:()=>import("./adapters/csv.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),
  html:()=>import("./adapters/html.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),htm:()=>import("./adapters/html.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),
  ipynb:()=>import("./adapters/notebook.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),tex:()=>import("./adapters/latex.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),
  mp4:()=>import("./adapters/video.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),webm:()=>import("./adapters/video.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),mkv:()=>import("./adapters/video.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),
  stl:()=>import("./adapters/stl.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),"3mf":()=>import("./adapters/three-mf.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),
  md:()=>import("./adapters/text.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),txt:()=>import("./adapters/text.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),py:()=>import("./adapters/text.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),
  js:()=>import("./adapters/text.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),mjs:()=>import("./adapters/text.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),ts:()=>import("./adapters/text.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),
  tsx:()=>import("./adapters/text.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),jsx:()=>import("./adapters/text.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),json:()=>import("./adapters/text.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),
  yaml:()=>import("./adapters/text.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),yml:()=>import("./adapters/text.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),c:()=>import("./adapters/text.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),
  cpp:()=>import("./adapters/text.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),h:()=>import("./adapters/text.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),hpp:()=>import("./adapters/text.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),
  cs:()=>import("./adapters/text.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681"),java:()=>import("./adapters/text.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
