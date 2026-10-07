import {extension} from "./utils.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),docx:()=>import("./adapters/office.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),xlsx:()=>import("./adapters/office.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),pptx:()=>import("./adapters/office.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),csv:()=>import("./adapters/csv.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),
  html:()=>import("./adapters/html.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),htm:()=>import("./adapters/html.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),
  ipynb:()=>import("./adapters/notebook.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),tex:()=>import("./adapters/latex.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),
  mp4:()=>import("./adapters/video.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),webm:()=>import("./adapters/video.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),mkv:()=>import("./adapters/video.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),
  stl:()=>import("./adapters/stl.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),"3mf":()=>import("./adapters/three-mf.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),
  md:()=>import("./adapters/text.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),txt:()=>import("./adapters/text.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),py:()=>import("./adapters/text.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),
  js:()=>import("./adapters/text.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),mjs:()=>import("./adapters/text.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),ts:()=>import("./adapters/text.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),
  tsx:()=>import("./adapters/text.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),jsx:()=>import("./adapters/text.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),json:()=>import("./adapters/text.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),
  yaml:()=>import("./adapters/text.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),yml:()=>import("./adapters/text.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),c:()=>import("./adapters/text.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),
  cpp:()=>import("./adapters/text.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),h:()=>import("./adapters/text.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),hpp:()=>import("./adapters/text.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),
  cs:()=>import("./adapters/text.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50"),java:()=>import("./adapters/text.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
