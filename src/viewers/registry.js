import {extension} from "./utils.js?v=fc6088e97be38f728db2b9e6a89d92c339303629";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),docx:()=>import("./adapters/office.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),xlsx:()=>import("./adapters/office.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),pptx:()=>import("./adapters/office.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),csv:()=>import("./adapters/csv.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),
  html:()=>import("./adapters/html.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),htm:()=>import("./adapters/html.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),
  ipynb:()=>import("./adapters/notebook.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),tex:()=>import("./adapters/latex.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),
  mp4:()=>import("./adapters/video.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),webm:()=>import("./adapters/video.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),mkv:()=>import("./adapters/video.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),
  stl:()=>import("./adapters/stl.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),"3mf":()=>import("./adapters/three-mf.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),
  md:()=>import("./adapters/text.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),txt:()=>import("./adapters/text.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),py:()=>import("./adapters/text.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),
  js:()=>import("./adapters/text.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),mjs:()=>import("./adapters/text.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),ts:()=>import("./adapters/text.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),
  tsx:()=>import("./adapters/text.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),jsx:()=>import("./adapters/text.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),json:()=>import("./adapters/text.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),
  yaml:()=>import("./adapters/text.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),yml:()=>import("./adapters/text.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),c:()=>import("./adapters/text.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),
  cpp:()=>import("./adapters/text.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),h:()=>import("./adapters/text.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),hpp:()=>import("./adapters/text.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),
  cs:()=>import("./adapters/text.js?v=fc6088e97be38f728db2b9e6a89d92c339303629"),java:()=>import("./adapters/text.js?v=fc6088e97be38f728db2b9e6a89d92c339303629")
};
export async function loadAdapter(resource){
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=fc6088e97be38f728db2b9e6a89d92c339303629");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
