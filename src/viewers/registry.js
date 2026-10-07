import {extension} from "./utils.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),docx:()=>import("./adapters/office.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),xlsx:()=>import("./adapters/office.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),pptx:()=>import("./adapters/office.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),csv:()=>import("./adapters/csv.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),
  html:()=>import("./adapters/html.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),htm:()=>import("./adapters/html.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),
  ipynb:()=>import("./adapters/notebook.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),tex:()=>import("./adapters/latex.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),
  mp4:()=>import("./adapters/video.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),webm:()=>import("./adapters/video.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),mkv:()=>import("./adapters/video.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),
  stl:()=>import("./adapters/stl.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),"3mf":()=>import("./adapters/three-mf.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),
  md:()=>import("./adapters/text.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),txt:()=>import("./adapters/text.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),py:()=>import("./adapters/text.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),
  js:()=>import("./adapters/text.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),mjs:()=>import("./adapters/text.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),ts:()=>import("./adapters/text.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),
  tsx:()=>import("./adapters/text.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),jsx:()=>import("./adapters/text.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),json:()=>import("./adapters/text.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),
  yaml:()=>import("./adapters/text.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),yml:()=>import("./adapters/text.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),c:()=>import("./adapters/text.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),
  cpp:()=>import("./adapters/text.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),h:()=>import("./adapters/text.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),hpp:()=>import("./adapters/text.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),
  cs:()=>import("./adapters/text.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128"),java:()=>import("./adapters/text.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
