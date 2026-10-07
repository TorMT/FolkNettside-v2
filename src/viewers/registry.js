import {extension} from "./utils.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),docx:()=>import("./adapters/office.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),xlsx:()=>import("./adapters/office.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),pptx:()=>import("./adapters/office.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),csv:()=>import("./adapters/csv.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),
  html:()=>import("./adapters/html.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),htm:()=>import("./adapters/html.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),
  ipynb:()=>import("./adapters/notebook.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),tex:()=>import("./adapters/latex.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),
  mp4:()=>import("./adapters/video.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),webm:()=>import("./adapters/video.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),mkv:()=>import("./adapters/video.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),
  stl:()=>import("./adapters/stl.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),"3mf":()=>import("./adapters/three-mf.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),
  md:()=>import("./adapters/text.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),txt:()=>import("./adapters/text.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),py:()=>import("./adapters/text.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),
  js:()=>import("./adapters/text.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),mjs:()=>import("./adapters/text.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),ts:()=>import("./adapters/text.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),
  tsx:()=>import("./adapters/text.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),jsx:()=>import("./adapters/text.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),json:()=>import("./adapters/text.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),
  yaml:()=>import("./adapters/text.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),yml:()=>import("./adapters/text.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),c:()=>import("./adapters/text.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),
  cpp:()=>import("./adapters/text.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),h:()=>import("./adapters/text.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),hpp:()=>import("./adapters/text.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),
  cs:()=>import("./adapters/text.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17"),java:()=>import("./adapters/text.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
