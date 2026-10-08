import {extension} from "./utils.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),docx:()=>import("./adapters/office.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),xlsx:()=>import("./adapters/office.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),pptx:()=>import("./adapters/office.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),csv:()=>import("./adapters/csv.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),
  html:()=>import("./adapters/html.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),htm:()=>import("./adapters/html.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),
  ipynb:()=>import("./adapters/notebook.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),tex:()=>import("./adapters/latex.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),
  mp4:()=>import("./adapters/video.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),webm:()=>import("./adapters/video.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),mkv:()=>import("./adapters/video.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),
  stl:()=>import("./adapters/stl.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),"3mf":()=>import("./adapters/three-mf.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),
  md:()=>import("./adapters/text.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),txt:()=>import("./adapters/text.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),py:()=>import("./adapters/text.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),
  js:()=>import("./adapters/text.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),mjs:()=>import("./adapters/text.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),ts:()=>import("./adapters/text.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),
  tsx:()=>import("./adapters/text.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),jsx:()=>import("./adapters/text.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),json:()=>import("./adapters/text.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),
  yaml:()=>import("./adapters/text.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),yml:()=>import("./adapters/text.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),c:()=>import("./adapters/text.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),
  cpp:()=>import("./adapters/text.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),h:()=>import("./adapters/text.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),hpp:()=>import("./adapters/text.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),
  cs:()=>import("./adapters/text.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d"),java:()=>import("./adapters/text.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
