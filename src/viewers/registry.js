import {extension} from "./utils.js?v=45f0c87cf82a120173ca472434b0924971b680b7";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),docx:()=>import("./adapters/office.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),xlsx:()=>import("./adapters/office.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),pptx:()=>import("./adapters/office.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),csv:()=>import("./adapters/csv.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),
  html:()=>import("./adapters/html.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),htm:()=>import("./adapters/html.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),
  ipynb:()=>import("./adapters/notebook.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),tex:()=>import("./adapters/latex.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),
  mp4:()=>import("./adapters/video.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),webm:()=>import("./adapters/video.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),mkv:()=>import("./adapters/video.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),
  stl:()=>import("./adapters/stl.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),"3mf":()=>import("./adapters/three-mf.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),
  md:()=>import("./adapters/text.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),txt:()=>import("./adapters/text.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),py:()=>import("./adapters/text.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),
  js:()=>import("./adapters/text.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),mjs:()=>import("./adapters/text.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),ts:()=>import("./adapters/text.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),
  tsx:()=>import("./adapters/text.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),jsx:()=>import("./adapters/text.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),json:()=>import("./adapters/text.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),
  yaml:()=>import("./adapters/text.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),yml:()=>import("./adapters/text.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),c:()=>import("./adapters/text.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),
  cpp:()=>import("./adapters/text.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),h:()=>import("./adapters/text.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),hpp:()=>import("./adapters/text.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),
  cs:()=>import("./adapters/text.js?v=45f0c87cf82a120173ca472434b0924971b680b7"),java:()=>import("./adapters/text.js?v=45f0c87cf82a120173ca472434b0924971b680b7")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=45f0c87cf82a120173ca472434b0924971b680b7");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=45f0c87cf82a120173ca472434b0924971b680b7");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
