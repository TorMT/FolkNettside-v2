import {extension} from "./utils.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),docx:()=>import("./adapters/office.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),xlsx:()=>import("./adapters/office.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),pptx:()=>import("./adapters/office.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),csv:()=>import("./adapters/csv.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),
  html:()=>import("./adapters/html.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),htm:()=>import("./adapters/html.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),
  ipynb:()=>import("./adapters/notebook.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),tex:()=>import("./adapters/latex.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),
  mp4:()=>import("./adapters/video.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),webm:()=>import("./adapters/video.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),mkv:()=>import("./adapters/video.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),
  stl:()=>import("./adapters/stl.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),"3mf":()=>import("./adapters/three-mf.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),
  md:()=>import("./adapters/text.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),txt:()=>import("./adapters/text.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),py:()=>import("./adapters/text.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),
  js:()=>import("./adapters/text.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),mjs:()=>import("./adapters/text.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),ts:()=>import("./adapters/text.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),
  tsx:()=>import("./adapters/text.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),jsx:()=>import("./adapters/text.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),json:()=>import("./adapters/text.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),
  yaml:()=>import("./adapters/text.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),yml:()=>import("./adapters/text.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),c:()=>import("./adapters/text.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),
  cpp:()=>import("./adapters/text.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),h:()=>import("./adapters/text.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),hpp:()=>import("./adapters/text.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),
  cs:()=>import("./adapters/text.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83"),java:()=>import("./adapters/text.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
