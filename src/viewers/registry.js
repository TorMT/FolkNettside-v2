import {extension} from "./utils.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),docx:()=>import("./adapters/office.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),xlsx:()=>import("./adapters/office.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),pptx:()=>import("./adapters/office.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),csv:()=>import("./adapters/csv.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),
  html:()=>import("./adapters/html.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),htm:()=>import("./adapters/html.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),
  ipynb:()=>import("./adapters/notebook.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),tex:()=>import("./adapters/latex.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),
  mp4:()=>import("./adapters/video.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),webm:()=>import("./adapters/video.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),mkv:()=>import("./adapters/video.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),
  stl:()=>import("./adapters/stl.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),"3mf":()=>import("./adapters/three-mf.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),
  md:()=>import("./adapters/text.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),txt:()=>import("./adapters/text.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),py:()=>import("./adapters/text.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),
  js:()=>import("./adapters/text.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),mjs:()=>import("./adapters/text.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),ts:()=>import("./adapters/text.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),
  tsx:()=>import("./adapters/text.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),jsx:()=>import("./adapters/text.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),json:()=>import("./adapters/text.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),
  yaml:()=>import("./adapters/text.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),yml:()=>import("./adapters/text.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),c:()=>import("./adapters/text.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),
  cpp:()=>import("./adapters/text.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),h:()=>import("./adapters/text.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),hpp:()=>import("./adapters/text.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),
  cs:()=>import("./adapters/text.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e"),java:()=>import("./adapters/text.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
