import {extension} from "./utils.js?v=e26a8be364148308481765cdcfc55597812e79d3";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=e26a8be364148308481765cdcfc55597812e79d3"),docx:()=>import("./adapters/office.js?v=e26a8be364148308481765cdcfc55597812e79d3"),xlsx:()=>import("./adapters/office.js?v=e26a8be364148308481765cdcfc55597812e79d3"),pptx:()=>import("./adapters/office.js?v=e26a8be364148308481765cdcfc55597812e79d3"),csv:()=>import("./adapters/csv.js?v=e26a8be364148308481765cdcfc55597812e79d3"),
  html:()=>import("./adapters/html.js?v=e26a8be364148308481765cdcfc55597812e79d3"),htm:()=>import("./adapters/html.js?v=e26a8be364148308481765cdcfc55597812e79d3"),
  ipynb:()=>import("./adapters/notebook.js?v=e26a8be364148308481765cdcfc55597812e79d3"),tex:()=>import("./adapters/latex.js?v=e26a8be364148308481765cdcfc55597812e79d3"),
  mp4:()=>import("./adapters/video.js?v=e26a8be364148308481765cdcfc55597812e79d3"),webm:()=>import("./adapters/video.js?v=e26a8be364148308481765cdcfc55597812e79d3"),mkv:()=>import("./adapters/video.js?v=e26a8be364148308481765cdcfc55597812e79d3"),
  stl:()=>import("./adapters/stl.js?v=e26a8be364148308481765cdcfc55597812e79d3"),"3mf":()=>import("./adapters/three-mf.js?v=e26a8be364148308481765cdcfc55597812e79d3"),
  md:()=>import("./adapters/text.js?v=e26a8be364148308481765cdcfc55597812e79d3"),txt:()=>import("./adapters/text.js?v=e26a8be364148308481765cdcfc55597812e79d3"),py:()=>import("./adapters/text.js?v=e26a8be364148308481765cdcfc55597812e79d3"),
  js:()=>import("./adapters/text.js?v=e26a8be364148308481765cdcfc55597812e79d3"),mjs:()=>import("./adapters/text.js?v=e26a8be364148308481765cdcfc55597812e79d3"),ts:()=>import("./adapters/text.js?v=e26a8be364148308481765cdcfc55597812e79d3"),
  tsx:()=>import("./adapters/text.js?v=e26a8be364148308481765cdcfc55597812e79d3"),jsx:()=>import("./adapters/text.js?v=e26a8be364148308481765cdcfc55597812e79d3"),json:()=>import("./adapters/text.js?v=e26a8be364148308481765cdcfc55597812e79d3"),
  yaml:()=>import("./adapters/text.js?v=e26a8be364148308481765cdcfc55597812e79d3"),yml:()=>import("./adapters/text.js?v=e26a8be364148308481765cdcfc55597812e79d3"),c:()=>import("./adapters/text.js?v=e26a8be364148308481765cdcfc55597812e79d3"),
  cpp:()=>import("./adapters/text.js?v=e26a8be364148308481765cdcfc55597812e79d3"),h:()=>import("./adapters/text.js?v=e26a8be364148308481765cdcfc55597812e79d3"),hpp:()=>import("./adapters/text.js?v=e26a8be364148308481765cdcfc55597812e79d3"),
  cs:()=>import("./adapters/text.js?v=e26a8be364148308481765cdcfc55597812e79d3"),java:()=>import("./adapters/text.js?v=e26a8be364148308481765cdcfc55597812e79d3")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=e26a8be364148308481765cdcfc55597812e79d3");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=e26a8be364148308481765cdcfc55597812e79d3");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
