import {extension} from "./utils.js?v=3addd6f7ca32031daa045b013932d00187968508";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=3addd6f7ca32031daa045b013932d00187968508"),docx:()=>import("./adapters/office.js?v=3addd6f7ca32031daa045b013932d00187968508"),xlsx:()=>import("./adapters/office.js?v=3addd6f7ca32031daa045b013932d00187968508"),pptx:()=>import("./adapters/office.js?v=3addd6f7ca32031daa045b013932d00187968508"),csv:()=>import("./adapters/csv.js?v=3addd6f7ca32031daa045b013932d00187968508"),
  html:()=>import("./adapters/html.js?v=3addd6f7ca32031daa045b013932d00187968508"),htm:()=>import("./adapters/html.js?v=3addd6f7ca32031daa045b013932d00187968508"),
  ipynb:()=>import("./adapters/notebook.js?v=3addd6f7ca32031daa045b013932d00187968508"),tex:()=>import("./adapters/latex.js?v=3addd6f7ca32031daa045b013932d00187968508"),
  mp4:()=>import("./adapters/video.js?v=3addd6f7ca32031daa045b013932d00187968508"),webm:()=>import("./adapters/video.js?v=3addd6f7ca32031daa045b013932d00187968508"),mkv:()=>import("./adapters/video.js?v=3addd6f7ca32031daa045b013932d00187968508"),
  stl:()=>import("./adapters/stl.js?v=3addd6f7ca32031daa045b013932d00187968508"),"3mf":()=>import("./adapters/three-mf.js?v=3addd6f7ca32031daa045b013932d00187968508"),
  md:()=>import("./adapters/text.js?v=3addd6f7ca32031daa045b013932d00187968508"),txt:()=>import("./adapters/text.js?v=3addd6f7ca32031daa045b013932d00187968508"),py:()=>import("./adapters/text.js?v=3addd6f7ca32031daa045b013932d00187968508"),
  js:()=>import("./adapters/text.js?v=3addd6f7ca32031daa045b013932d00187968508"),mjs:()=>import("./adapters/text.js?v=3addd6f7ca32031daa045b013932d00187968508"),ts:()=>import("./adapters/text.js?v=3addd6f7ca32031daa045b013932d00187968508"),
  tsx:()=>import("./adapters/text.js?v=3addd6f7ca32031daa045b013932d00187968508"),jsx:()=>import("./adapters/text.js?v=3addd6f7ca32031daa045b013932d00187968508"),json:()=>import("./adapters/text.js?v=3addd6f7ca32031daa045b013932d00187968508"),
  yaml:()=>import("./adapters/text.js?v=3addd6f7ca32031daa045b013932d00187968508"),yml:()=>import("./adapters/text.js?v=3addd6f7ca32031daa045b013932d00187968508"),c:()=>import("./adapters/text.js?v=3addd6f7ca32031daa045b013932d00187968508"),
  cpp:()=>import("./adapters/text.js?v=3addd6f7ca32031daa045b013932d00187968508"),h:()=>import("./adapters/text.js?v=3addd6f7ca32031daa045b013932d00187968508"),hpp:()=>import("./adapters/text.js?v=3addd6f7ca32031daa045b013932d00187968508"),
  cs:()=>import("./adapters/text.js?v=3addd6f7ca32031daa045b013932d00187968508"),java:()=>import("./adapters/text.js?v=3addd6f7ca32031daa045b013932d00187968508")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=3addd6f7ca32031daa045b013932d00187968508");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=3addd6f7ca32031daa045b013932d00187968508");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
