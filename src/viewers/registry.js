import {extension} from "./utils.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),docx:()=>import("./adapters/office.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),xlsx:()=>import("./adapters/office.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),pptx:()=>import("./adapters/office.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),csv:()=>import("./adapters/csv.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),
  html:()=>import("./adapters/html.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),htm:()=>import("./adapters/html.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),
  ipynb:()=>import("./adapters/notebook.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),tex:()=>import("./adapters/latex.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),
  mp4:()=>import("./adapters/video.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),webm:()=>import("./adapters/video.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),mkv:()=>import("./adapters/video.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),
  stl:()=>import("./adapters/stl.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),"3mf":()=>import("./adapters/three-mf.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),
  md:()=>import("./adapters/text.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),txt:()=>import("./adapters/text.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),py:()=>import("./adapters/text.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),
  js:()=>import("./adapters/text.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),mjs:()=>import("./adapters/text.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),ts:()=>import("./adapters/text.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),
  tsx:()=>import("./adapters/text.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),jsx:()=>import("./adapters/text.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),json:()=>import("./adapters/text.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),
  yaml:()=>import("./adapters/text.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),yml:()=>import("./adapters/text.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),c:()=>import("./adapters/text.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),
  cpp:()=>import("./adapters/text.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),h:()=>import("./adapters/text.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),hpp:()=>import("./adapters/text.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),
  cs:()=>import("./adapters/text.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894"),java:()=>import("./adapters/text.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
