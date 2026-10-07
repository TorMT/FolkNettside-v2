import {extension} from "./utils.js?v=9b10a5208cab21508aaf459572f641924ac7e89a";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),docx:()=>import("./adapters/office.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),xlsx:()=>import("./adapters/office.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),pptx:()=>import("./adapters/office.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),csv:()=>import("./adapters/csv.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),
  html:()=>import("./adapters/html.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),htm:()=>import("./adapters/html.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),
  ipynb:()=>import("./adapters/notebook.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),tex:()=>import("./adapters/latex.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),
  mp4:()=>import("./adapters/video.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),webm:()=>import("./adapters/video.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),mkv:()=>import("./adapters/video.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),
  stl:()=>import("./adapters/stl.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),"3mf":()=>import("./adapters/three-mf.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),
  md:()=>import("./adapters/text.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),txt:()=>import("./adapters/text.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),py:()=>import("./adapters/text.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),
  js:()=>import("./adapters/text.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),mjs:()=>import("./adapters/text.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),ts:()=>import("./adapters/text.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),
  tsx:()=>import("./adapters/text.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),jsx:()=>import("./adapters/text.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),json:()=>import("./adapters/text.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),
  yaml:()=>import("./adapters/text.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),yml:()=>import("./adapters/text.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),c:()=>import("./adapters/text.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),
  cpp:()=>import("./adapters/text.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),h:()=>import("./adapters/text.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),hpp:()=>import("./adapters/text.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),
  cs:()=>import("./adapters/text.js?v=9b10a5208cab21508aaf459572f641924ac7e89a"),java:()=>import("./adapters/text.js?v=9b10a5208cab21508aaf459572f641924ac7e89a")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=9b10a5208cab21508aaf459572f641924ac7e89a");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=9b10a5208cab21508aaf459572f641924ac7e89a");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
