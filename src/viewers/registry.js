import {extension} from "./utils.js?v=73652eb6800cc048b595e897ff33a9cab9872478";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),docx:()=>import("./adapters/office.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),xlsx:()=>import("./adapters/office.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),pptx:()=>import("./adapters/office.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),csv:()=>import("./adapters/csv.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),
  html:()=>import("./adapters/html.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),htm:()=>import("./adapters/html.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),
  ipynb:()=>import("./adapters/notebook.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),tex:()=>import("./adapters/latex.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),
  mp4:()=>import("./adapters/video.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),webm:()=>import("./adapters/video.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),mkv:()=>import("./adapters/video.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),
  stl:()=>import("./adapters/stl.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),"3mf":()=>import("./adapters/three-mf.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),
  md:()=>import("./adapters/text.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),txt:()=>import("./adapters/text.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),py:()=>import("./adapters/text.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),
  js:()=>import("./adapters/text.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),mjs:()=>import("./adapters/text.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),ts:()=>import("./adapters/text.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),
  tsx:()=>import("./adapters/text.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),jsx:()=>import("./adapters/text.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),json:()=>import("./adapters/text.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),
  yaml:()=>import("./adapters/text.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),yml:()=>import("./adapters/text.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),c:()=>import("./adapters/text.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),
  cpp:()=>import("./adapters/text.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),h:()=>import("./adapters/text.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),hpp:()=>import("./adapters/text.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),
  cs:()=>import("./adapters/text.js?v=73652eb6800cc048b595e897ff33a9cab9872478"),java:()=>import("./adapters/text.js?v=73652eb6800cc048b595e897ff33a9cab9872478")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=73652eb6800cc048b595e897ff33a9cab9872478");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=73652eb6800cc048b595e897ff33a9cab9872478");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
