import {extension} from "./utils.js?v=3ff657a614118f56baf85028da874e0367774ebd";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=3ff657a614118f56baf85028da874e0367774ebd"),docx:()=>import("./adapters/office.js?v=3ff657a614118f56baf85028da874e0367774ebd"),xlsx:()=>import("./adapters/office.js?v=3ff657a614118f56baf85028da874e0367774ebd"),pptx:()=>import("./adapters/office.js?v=3ff657a614118f56baf85028da874e0367774ebd"),csv:()=>import("./adapters/csv.js?v=3ff657a614118f56baf85028da874e0367774ebd"),
  html:()=>import("./adapters/html.js?v=3ff657a614118f56baf85028da874e0367774ebd"),htm:()=>import("./adapters/html.js?v=3ff657a614118f56baf85028da874e0367774ebd"),
  ipynb:()=>import("./adapters/notebook.js?v=3ff657a614118f56baf85028da874e0367774ebd"),tex:()=>import("./adapters/latex.js?v=3ff657a614118f56baf85028da874e0367774ebd"),
  mp4:()=>import("./adapters/video.js?v=3ff657a614118f56baf85028da874e0367774ebd"),webm:()=>import("./adapters/video.js?v=3ff657a614118f56baf85028da874e0367774ebd"),mkv:()=>import("./adapters/video.js?v=3ff657a614118f56baf85028da874e0367774ebd"),
  stl:()=>import("./adapters/stl.js?v=3ff657a614118f56baf85028da874e0367774ebd"),"3mf":()=>import("./adapters/three-mf.js?v=3ff657a614118f56baf85028da874e0367774ebd"),
  md:()=>import("./adapters/text.js?v=3ff657a614118f56baf85028da874e0367774ebd"),txt:()=>import("./adapters/text.js?v=3ff657a614118f56baf85028da874e0367774ebd"),py:()=>import("./adapters/text.js?v=3ff657a614118f56baf85028da874e0367774ebd"),
  js:()=>import("./adapters/text.js?v=3ff657a614118f56baf85028da874e0367774ebd"),mjs:()=>import("./adapters/text.js?v=3ff657a614118f56baf85028da874e0367774ebd"),ts:()=>import("./adapters/text.js?v=3ff657a614118f56baf85028da874e0367774ebd"),
  tsx:()=>import("./adapters/text.js?v=3ff657a614118f56baf85028da874e0367774ebd"),jsx:()=>import("./adapters/text.js?v=3ff657a614118f56baf85028da874e0367774ebd"),json:()=>import("./adapters/text.js?v=3ff657a614118f56baf85028da874e0367774ebd"),
  yaml:()=>import("./adapters/text.js?v=3ff657a614118f56baf85028da874e0367774ebd"),yml:()=>import("./adapters/text.js?v=3ff657a614118f56baf85028da874e0367774ebd"),c:()=>import("./adapters/text.js?v=3ff657a614118f56baf85028da874e0367774ebd"),
  cpp:()=>import("./adapters/text.js?v=3ff657a614118f56baf85028da874e0367774ebd"),h:()=>import("./adapters/text.js?v=3ff657a614118f56baf85028da874e0367774ebd"),hpp:()=>import("./adapters/text.js?v=3ff657a614118f56baf85028da874e0367774ebd"),
  cs:()=>import("./adapters/text.js?v=3ff657a614118f56baf85028da874e0367774ebd"),java:()=>import("./adapters/text.js?v=3ff657a614118f56baf85028da874e0367774ebd")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=3ff657a614118f56baf85028da874e0367774ebd");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=3ff657a614118f56baf85028da874e0367774ebd");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
