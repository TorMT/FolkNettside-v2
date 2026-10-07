import {extension} from "./utils.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),docx:()=>import("./adapters/office.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),xlsx:()=>import("./adapters/office.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),pptx:()=>import("./adapters/office.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),csv:()=>import("./adapters/csv.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),
  html:()=>import("./adapters/html.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),htm:()=>import("./adapters/html.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),
  ipynb:()=>import("./adapters/notebook.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),tex:()=>import("./adapters/latex.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),
  mp4:()=>import("./adapters/video.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),webm:()=>import("./adapters/video.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),mkv:()=>import("./adapters/video.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),
  stl:()=>import("./adapters/stl.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),"3mf":()=>import("./adapters/three-mf.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),
  md:()=>import("./adapters/text.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),txt:()=>import("./adapters/text.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),py:()=>import("./adapters/text.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),
  js:()=>import("./adapters/text.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),mjs:()=>import("./adapters/text.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),ts:()=>import("./adapters/text.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),
  tsx:()=>import("./adapters/text.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),jsx:()=>import("./adapters/text.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),json:()=>import("./adapters/text.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),
  yaml:()=>import("./adapters/text.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),yml:()=>import("./adapters/text.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),c:()=>import("./adapters/text.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),
  cpp:()=>import("./adapters/text.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),h:()=>import("./adapters/text.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),hpp:()=>import("./adapters/text.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),
  cs:()=>import("./adapters/text.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b"),java:()=>import("./adapters/text.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
