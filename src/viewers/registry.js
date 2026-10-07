import {extension} from "./utils.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),docx:()=>import("./adapters/office.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),xlsx:()=>import("./adapters/office.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),pptx:()=>import("./adapters/office.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),csv:()=>import("./adapters/csv.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),
  html:()=>import("./adapters/html.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),htm:()=>import("./adapters/html.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),
  ipynb:()=>import("./adapters/notebook.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),tex:()=>import("./adapters/latex.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),
  mp4:()=>import("./adapters/video.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),webm:()=>import("./adapters/video.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),mkv:()=>import("./adapters/video.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),
  stl:()=>import("./adapters/stl.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),"3mf":()=>import("./adapters/three-mf.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),
  md:()=>import("./adapters/text.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),txt:()=>import("./adapters/text.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),py:()=>import("./adapters/text.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),
  js:()=>import("./adapters/text.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),mjs:()=>import("./adapters/text.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),ts:()=>import("./adapters/text.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),
  tsx:()=>import("./adapters/text.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),jsx:()=>import("./adapters/text.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),json:()=>import("./adapters/text.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),
  yaml:()=>import("./adapters/text.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),yml:()=>import("./adapters/text.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),c:()=>import("./adapters/text.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),
  cpp:()=>import("./adapters/text.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),h:()=>import("./adapters/text.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),hpp:()=>import("./adapters/text.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),
  cs:()=>import("./adapters/text.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b"),java:()=>import("./adapters/text.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
