import {extension} from "./utils.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),docx:()=>import("./adapters/office.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),xlsx:()=>import("./adapters/office.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),pptx:()=>import("./adapters/office.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),csv:()=>import("./adapters/csv.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),
  html:()=>import("./adapters/html.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),htm:()=>import("./adapters/html.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),
  ipynb:()=>import("./adapters/notebook.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),tex:()=>import("./adapters/latex.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),
  mp4:()=>import("./adapters/video.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),webm:()=>import("./adapters/video.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),mkv:()=>import("./adapters/video.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),
  stl:()=>import("./adapters/stl.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),"3mf":()=>import("./adapters/three-mf.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),
  md:()=>import("./adapters/text.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),txt:()=>import("./adapters/text.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),py:()=>import("./adapters/text.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),
  js:()=>import("./adapters/text.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),mjs:()=>import("./adapters/text.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),ts:()=>import("./adapters/text.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),
  tsx:()=>import("./adapters/text.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),jsx:()=>import("./adapters/text.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),json:()=>import("./adapters/text.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),
  yaml:()=>import("./adapters/text.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),yml:()=>import("./adapters/text.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),c:()=>import("./adapters/text.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),
  cpp:()=>import("./adapters/text.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),h:()=>import("./adapters/text.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),hpp:()=>import("./adapters/text.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),
  cs:()=>import("./adapters/text.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac"),java:()=>import("./adapters/text.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
