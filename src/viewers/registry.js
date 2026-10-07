import {extension} from "./utils.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),docx:()=>import("./adapters/office.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),xlsx:()=>import("./adapters/office.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),pptx:()=>import("./adapters/office.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),csv:()=>import("./adapters/csv.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),
  html:()=>import("./adapters/html.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),htm:()=>import("./adapters/html.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),
  ipynb:()=>import("./adapters/notebook.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),tex:()=>import("./adapters/latex.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),
  mp4:()=>import("./adapters/video.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),webm:()=>import("./adapters/video.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),mkv:()=>import("./adapters/video.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),
  stl:()=>import("./adapters/stl.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),"3mf":()=>import("./adapters/three-mf.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),
  md:()=>import("./adapters/text.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),txt:()=>import("./adapters/text.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),py:()=>import("./adapters/text.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),
  js:()=>import("./adapters/text.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),mjs:()=>import("./adapters/text.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),ts:()=>import("./adapters/text.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),
  tsx:()=>import("./adapters/text.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),jsx:()=>import("./adapters/text.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),json:()=>import("./adapters/text.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),
  yaml:()=>import("./adapters/text.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),yml:()=>import("./adapters/text.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),c:()=>import("./adapters/text.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),
  cpp:()=>import("./adapters/text.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),h:()=>import("./adapters/text.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),hpp:()=>import("./adapters/text.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),
  cs:()=>import("./adapters/text.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21"),java:()=>import("./adapters/text.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
