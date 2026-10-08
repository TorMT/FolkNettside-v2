import {extension} from "./utils.js?v=9ba544c6579d47d9412094088927a3839d39f7a0";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),docx:()=>import("./adapters/office.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),xlsx:()=>import("./adapters/office.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),pptx:()=>import("./adapters/office.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),csv:()=>import("./adapters/csv.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),
  html:()=>import("./adapters/html.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),htm:()=>import("./adapters/html.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),
  ipynb:()=>import("./adapters/notebook.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),tex:()=>import("./adapters/latex.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),
  mp4:()=>import("./adapters/video.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),webm:()=>import("./adapters/video.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),mkv:()=>import("./adapters/video.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),
  stl:()=>import("./adapters/stl.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),"3mf":()=>import("./adapters/three-mf.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),
  md:()=>import("./adapters/text.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),txt:()=>import("./adapters/text.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),py:()=>import("./adapters/text.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),
  js:()=>import("./adapters/text.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),mjs:()=>import("./adapters/text.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),ts:()=>import("./adapters/text.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),
  tsx:()=>import("./adapters/text.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),jsx:()=>import("./adapters/text.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),json:()=>import("./adapters/text.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),
  yaml:()=>import("./adapters/text.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),yml:()=>import("./adapters/text.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),c:()=>import("./adapters/text.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),
  cpp:()=>import("./adapters/text.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),h:()=>import("./adapters/text.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),hpp:()=>import("./adapters/text.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),
  cs:()=>import("./adapters/text.js?v=9ba544c6579d47d9412094088927a3839d39f7a0"),java:()=>import("./adapters/text.js?v=9ba544c6579d47d9412094088927a3839d39f7a0")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=9ba544c6579d47d9412094088927a3839d39f7a0");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=9ba544c6579d47d9412094088927a3839d39f7a0");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
