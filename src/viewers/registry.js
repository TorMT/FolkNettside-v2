import {extension} from "./utils.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),docx:()=>import("./adapters/office.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),xlsx:()=>import("./adapters/office.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),pptx:()=>import("./adapters/office.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),csv:()=>import("./adapters/csv.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),
  html:()=>import("./adapters/html.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),htm:()=>import("./adapters/html.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),
  ipynb:()=>import("./adapters/notebook.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),tex:()=>import("./adapters/latex.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),
  mp4:()=>import("./adapters/video.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),webm:()=>import("./adapters/video.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),mkv:()=>import("./adapters/video.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),
  stl:()=>import("./adapters/stl.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),"3mf":()=>import("./adapters/three-mf.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),
  md:()=>import("./adapters/text.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),txt:()=>import("./adapters/text.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),py:()=>import("./adapters/text.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),
  js:()=>import("./adapters/text.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),mjs:()=>import("./adapters/text.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),ts:()=>import("./adapters/text.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),
  tsx:()=>import("./adapters/text.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),jsx:()=>import("./adapters/text.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),json:()=>import("./adapters/text.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),
  yaml:()=>import("./adapters/text.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),yml:()=>import("./adapters/text.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),c:()=>import("./adapters/text.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),
  cpp:()=>import("./adapters/text.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),h:()=>import("./adapters/text.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),hpp:()=>import("./adapters/text.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),
  cs:()=>import("./adapters/text.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8"),java:()=>import("./adapters/text.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
