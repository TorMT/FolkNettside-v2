import {extension} from "./utils.js?v=f3d774892c06685186973c87dab921f08453adf7";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=f3d774892c06685186973c87dab921f08453adf7"),docx:()=>import("./adapters/office.js?v=f3d774892c06685186973c87dab921f08453adf7"),xlsx:()=>import("./adapters/office.js?v=f3d774892c06685186973c87dab921f08453adf7"),pptx:()=>import("./adapters/office.js?v=f3d774892c06685186973c87dab921f08453adf7"),csv:()=>import("./adapters/csv.js?v=f3d774892c06685186973c87dab921f08453adf7"),
  html:()=>import("./adapters/html.js?v=f3d774892c06685186973c87dab921f08453adf7"),htm:()=>import("./adapters/html.js?v=f3d774892c06685186973c87dab921f08453adf7"),
  ipynb:()=>import("./adapters/notebook.js?v=f3d774892c06685186973c87dab921f08453adf7"),tex:()=>import("./adapters/latex.js?v=f3d774892c06685186973c87dab921f08453adf7"),
  mp4:()=>import("./adapters/video.js?v=f3d774892c06685186973c87dab921f08453adf7"),webm:()=>import("./adapters/video.js?v=f3d774892c06685186973c87dab921f08453adf7"),mkv:()=>import("./adapters/video.js?v=f3d774892c06685186973c87dab921f08453adf7"),
  stl:()=>import("./adapters/stl.js?v=f3d774892c06685186973c87dab921f08453adf7"),"3mf":()=>import("./adapters/three-mf.js?v=f3d774892c06685186973c87dab921f08453adf7"),
  md:()=>import("./adapters/text.js?v=f3d774892c06685186973c87dab921f08453adf7"),txt:()=>import("./adapters/text.js?v=f3d774892c06685186973c87dab921f08453adf7"),py:()=>import("./adapters/text.js?v=f3d774892c06685186973c87dab921f08453adf7"),
  js:()=>import("./adapters/text.js?v=f3d774892c06685186973c87dab921f08453adf7"),mjs:()=>import("./adapters/text.js?v=f3d774892c06685186973c87dab921f08453adf7"),ts:()=>import("./adapters/text.js?v=f3d774892c06685186973c87dab921f08453adf7"),
  tsx:()=>import("./adapters/text.js?v=f3d774892c06685186973c87dab921f08453adf7"),jsx:()=>import("./adapters/text.js?v=f3d774892c06685186973c87dab921f08453adf7"),json:()=>import("./adapters/text.js?v=f3d774892c06685186973c87dab921f08453adf7"),
  yaml:()=>import("./adapters/text.js?v=f3d774892c06685186973c87dab921f08453adf7"),yml:()=>import("./adapters/text.js?v=f3d774892c06685186973c87dab921f08453adf7"),c:()=>import("./adapters/text.js?v=f3d774892c06685186973c87dab921f08453adf7"),
  cpp:()=>import("./adapters/text.js?v=f3d774892c06685186973c87dab921f08453adf7"),h:()=>import("./adapters/text.js?v=f3d774892c06685186973c87dab921f08453adf7"),hpp:()=>import("./adapters/text.js?v=f3d774892c06685186973c87dab921f08453adf7"),
  cs:()=>import("./adapters/text.js?v=f3d774892c06685186973c87dab921f08453adf7"),java:()=>import("./adapters/text.js?v=f3d774892c06685186973c87dab921f08453adf7")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=f3d774892c06685186973c87dab921f08453adf7");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=f3d774892c06685186973c87dab921f08453adf7");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
