import {extension} from "./utils.js?v=a56ceec4b1cce9377be321761db205db6c2e4721";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),docx:()=>import("./adapters/office.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),xlsx:()=>import("./adapters/office.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),pptx:()=>import("./adapters/office.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),csv:()=>import("./adapters/csv.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),
  html:()=>import("./adapters/html.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),htm:()=>import("./adapters/html.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),
  ipynb:()=>import("./adapters/notebook.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),tex:()=>import("./adapters/latex.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),
  mp4:()=>import("./adapters/video.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),webm:()=>import("./adapters/video.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),mkv:()=>import("./adapters/video.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),
  stl:()=>import("./adapters/stl.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),"3mf":()=>import("./adapters/three-mf.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),
  md:()=>import("./adapters/text.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),txt:()=>import("./adapters/text.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),py:()=>import("./adapters/text.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),
  js:()=>import("./adapters/text.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),mjs:()=>import("./adapters/text.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),ts:()=>import("./adapters/text.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),
  tsx:()=>import("./adapters/text.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),jsx:()=>import("./adapters/text.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),json:()=>import("./adapters/text.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),
  yaml:()=>import("./adapters/text.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),yml:()=>import("./adapters/text.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),c:()=>import("./adapters/text.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),
  cpp:()=>import("./adapters/text.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),h:()=>import("./adapters/text.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),hpp:()=>import("./adapters/text.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),
  cs:()=>import("./adapters/text.js?v=a56ceec4b1cce9377be321761db205db6c2e4721"),java:()=>import("./adapters/text.js?v=a56ceec4b1cce9377be321761db205db6c2e4721")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=a56ceec4b1cce9377be321761db205db6c2e4721");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=a56ceec4b1cce9377be321761db205db6c2e4721");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
