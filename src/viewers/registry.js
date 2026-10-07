import {extension} from "./utils.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),docx:()=>import("./adapters/office.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),xlsx:()=>import("./adapters/office.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),pptx:()=>import("./adapters/office.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),csv:()=>import("./adapters/csv.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),
  html:()=>import("./adapters/html.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),htm:()=>import("./adapters/html.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),
  ipynb:()=>import("./adapters/notebook.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),tex:()=>import("./adapters/latex.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),
  mp4:()=>import("./adapters/video.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),webm:()=>import("./adapters/video.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),mkv:()=>import("./adapters/video.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),
  stl:()=>import("./adapters/stl.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),"3mf":()=>import("./adapters/three-mf.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),
  md:()=>import("./adapters/text.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),txt:()=>import("./adapters/text.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),py:()=>import("./adapters/text.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),
  js:()=>import("./adapters/text.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),mjs:()=>import("./adapters/text.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),ts:()=>import("./adapters/text.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),
  tsx:()=>import("./adapters/text.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),jsx:()=>import("./adapters/text.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),json:()=>import("./adapters/text.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),
  yaml:()=>import("./adapters/text.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),yml:()=>import("./adapters/text.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),c:()=>import("./adapters/text.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),
  cpp:()=>import("./adapters/text.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),h:()=>import("./adapters/text.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),hpp:()=>import("./adapters/text.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),
  cs:()=>import("./adapters/text.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a"),java:()=>import("./adapters/text.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
