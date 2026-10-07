import {extension} from "./utils.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),docx:()=>import("./adapters/office.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),xlsx:()=>import("./adapters/office.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),pptx:()=>import("./adapters/office.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),csv:()=>import("./adapters/csv.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),
  html:()=>import("./adapters/html.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),htm:()=>import("./adapters/html.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),
  ipynb:()=>import("./adapters/notebook.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),tex:()=>import("./adapters/latex.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),
  mp4:()=>import("./adapters/video.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),webm:()=>import("./adapters/video.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),mkv:()=>import("./adapters/video.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),
  stl:()=>import("./adapters/stl.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),"3mf":()=>import("./adapters/three-mf.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),
  md:()=>import("./adapters/text.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),txt:()=>import("./adapters/text.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),py:()=>import("./adapters/text.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),
  js:()=>import("./adapters/text.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),mjs:()=>import("./adapters/text.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),ts:()=>import("./adapters/text.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),
  tsx:()=>import("./adapters/text.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),jsx:()=>import("./adapters/text.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),json:()=>import("./adapters/text.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),
  yaml:()=>import("./adapters/text.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),yml:()=>import("./adapters/text.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),c:()=>import("./adapters/text.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),
  cpp:()=>import("./adapters/text.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),h:()=>import("./adapters/text.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),hpp:()=>import("./adapters/text.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),
  cs:()=>import("./adapters/text.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10"),java:()=>import("./adapters/text.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
