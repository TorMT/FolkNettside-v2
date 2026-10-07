import {extension} from "./utils.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),docx:()=>import("./adapters/office.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),xlsx:()=>import("./adapters/office.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),pptx:()=>import("./adapters/office.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),csv:()=>import("./adapters/csv.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),
  html:()=>import("./adapters/html.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),htm:()=>import("./adapters/html.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),
  ipynb:()=>import("./adapters/notebook.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),tex:()=>import("./adapters/latex.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),
  mp4:()=>import("./adapters/video.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),webm:()=>import("./adapters/video.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),mkv:()=>import("./adapters/video.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),
  stl:()=>import("./adapters/stl.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),"3mf":()=>import("./adapters/three-mf.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),
  md:()=>import("./adapters/text.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),txt:()=>import("./adapters/text.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),py:()=>import("./adapters/text.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),
  js:()=>import("./adapters/text.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),mjs:()=>import("./adapters/text.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),ts:()=>import("./adapters/text.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),
  tsx:()=>import("./adapters/text.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),jsx:()=>import("./adapters/text.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),json:()=>import("./adapters/text.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),
  yaml:()=>import("./adapters/text.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),yml:()=>import("./adapters/text.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),c:()=>import("./adapters/text.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),
  cpp:()=>import("./adapters/text.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),h:()=>import("./adapters/text.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),hpp:()=>import("./adapters/text.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),
  cs:()=>import("./adapters/text.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06"),java:()=>import("./adapters/text.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
