import {extension} from "./utils.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),docx:()=>import("./adapters/office.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),xlsx:()=>import("./adapters/office.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),pptx:()=>import("./adapters/office.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),csv:()=>import("./adapters/csv.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),
  html:()=>import("./adapters/html.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),htm:()=>import("./adapters/html.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),
  ipynb:()=>import("./adapters/notebook.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),tex:()=>import("./adapters/latex.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),
  mp4:()=>import("./adapters/video.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),webm:()=>import("./adapters/video.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),mkv:()=>import("./adapters/video.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),
  stl:()=>import("./adapters/stl.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),"3mf":()=>import("./adapters/three-mf.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),
  md:()=>import("./adapters/text.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),txt:()=>import("./adapters/text.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),py:()=>import("./adapters/text.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),
  js:()=>import("./adapters/text.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),mjs:()=>import("./adapters/text.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),ts:()=>import("./adapters/text.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),
  tsx:()=>import("./adapters/text.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),jsx:()=>import("./adapters/text.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),json:()=>import("./adapters/text.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),
  yaml:()=>import("./adapters/text.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),yml:()=>import("./adapters/text.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),c:()=>import("./adapters/text.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),
  cpp:()=>import("./adapters/text.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),h:()=>import("./adapters/text.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),hpp:()=>import("./adapters/text.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),
  cs:()=>import("./adapters/text.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76"),java:()=>import("./adapters/text.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
