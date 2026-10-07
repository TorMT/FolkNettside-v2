import {extension} from "./utils.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),docx:()=>import("./adapters/office.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),xlsx:()=>import("./adapters/office.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),pptx:()=>import("./adapters/office.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),csv:()=>import("./adapters/csv.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),
  html:()=>import("./adapters/html.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),htm:()=>import("./adapters/html.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),
  ipynb:()=>import("./adapters/notebook.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),tex:()=>import("./adapters/latex.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),
  mp4:()=>import("./adapters/video.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),webm:()=>import("./adapters/video.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),mkv:()=>import("./adapters/video.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),
  stl:()=>import("./adapters/stl.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),"3mf":()=>import("./adapters/three-mf.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),
  md:()=>import("./adapters/text.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),txt:()=>import("./adapters/text.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),py:()=>import("./adapters/text.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),
  js:()=>import("./adapters/text.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),mjs:()=>import("./adapters/text.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),ts:()=>import("./adapters/text.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),
  tsx:()=>import("./adapters/text.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),jsx:()=>import("./adapters/text.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),json:()=>import("./adapters/text.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),
  yaml:()=>import("./adapters/text.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),yml:()=>import("./adapters/text.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),c:()=>import("./adapters/text.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),
  cpp:()=>import("./adapters/text.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),h:()=>import("./adapters/text.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),hpp:()=>import("./adapters/text.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),
  cs:()=>import("./adapters/text.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba"),java:()=>import("./adapters/text.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
