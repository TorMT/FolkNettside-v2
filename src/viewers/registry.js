import {extension} from "./utils.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),docx:()=>import("./adapters/office.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),xlsx:()=>import("./adapters/office.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),pptx:()=>import("./adapters/office.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),csv:()=>import("./adapters/csv.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),
  html:()=>import("./adapters/html.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),htm:()=>import("./adapters/html.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),
  ipynb:()=>import("./adapters/notebook.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),tex:()=>import("./adapters/latex.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),
  mp4:()=>import("./adapters/video.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),webm:()=>import("./adapters/video.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),mkv:()=>import("./adapters/video.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),
  stl:()=>import("./adapters/stl.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),"3mf":()=>import("./adapters/three-mf.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),
  md:()=>import("./adapters/text.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),txt:()=>import("./adapters/text.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),py:()=>import("./adapters/text.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),
  js:()=>import("./adapters/text.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),mjs:()=>import("./adapters/text.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),ts:()=>import("./adapters/text.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),
  tsx:()=>import("./adapters/text.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),jsx:()=>import("./adapters/text.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),json:()=>import("./adapters/text.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),
  yaml:()=>import("./adapters/text.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),yml:()=>import("./adapters/text.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),c:()=>import("./adapters/text.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),
  cpp:()=>import("./adapters/text.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),h:()=>import("./adapters/text.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),hpp:()=>import("./adapters/text.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),
  cs:()=>import("./adapters/text.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf"),java:()=>import("./adapters/text.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
