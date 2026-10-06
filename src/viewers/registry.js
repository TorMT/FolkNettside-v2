import {extension} from "./utils.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),docx:()=>import("./adapters/office.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),xlsx:()=>import("./adapters/office.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),pptx:()=>import("./adapters/office.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),csv:()=>import("./adapters/csv.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),
  html:()=>import("./adapters/html.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),htm:()=>import("./adapters/html.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),
  ipynb:()=>import("./adapters/notebook.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),tex:()=>import("./adapters/latex.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),
  mp4:()=>import("./adapters/video.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),webm:()=>import("./adapters/video.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),mkv:()=>import("./adapters/video.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),
  stl:()=>import("./adapters/stl.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),"3mf":()=>import("./adapters/three-mf.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),
  md:()=>import("./adapters/text.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),txt:()=>import("./adapters/text.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),py:()=>import("./adapters/text.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),
  js:()=>import("./adapters/text.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),mjs:()=>import("./adapters/text.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),ts:()=>import("./adapters/text.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),
  tsx:()=>import("./adapters/text.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),jsx:()=>import("./adapters/text.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),json:()=>import("./adapters/text.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),
  yaml:()=>import("./adapters/text.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),yml:()=>import("./adapters/text.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),c:()=>import("./adapters/text.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),
  cpp:()=>import("./adapters/text.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),h:()=>import("./adapters/text.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),hpp:()=>import("./adapters/text.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),
  cs:()=>import("./adapters/text.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca"),java:()=>import("./adapters/text.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
