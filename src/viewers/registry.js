import {extension} from "./utils.js?v=5847de308f81a28abf005e6bee53d1782423cc42";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),docx:()=>import("./adapters/office.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),xlsx:()=>import("./adapters/office.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),pptx:()=>import("./adapters/office.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),csv:()=>import("./adapters/csv.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),
  html:()=>import("./adapters/html.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),htm:()=>import("./adapters/html.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),
  ipynb:()=>import("./adapters/notebook.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),tex:()=>import("./adapters/latex.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),
  mp4:()=>import("./adapters/video.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),webm:()=>import("./adapters/video.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),mkv:()=>import("./adapters/video.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),
  stl:()=>import("./adapters/stl.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),"3mf":()=>import("./adapters/three-mf.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),
  md:()=>import("./adapters/text.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),txt:()=>import("./adapters/text.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),py:()=>import("./adapters/text.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),
  js:()=>import("./adapters/text.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),mjs:()=>import("./adapters/text.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),ts:()=>import("./adapters/text.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),
  tsx:()=>import("./adapters/text.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),jsx:()=>import("./adapters/text.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),json:()=>import("./adapters/text.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),
  yaml:()=>import("./adapters/text.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),yml:()=>import("./adapters/text.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),c:()=>import("./adapters/text.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),
  cpp:()=>import("./adapters/text.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),h:()=>import("./adapters/text.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),hpp:()=>import("./adapters/text.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),
  cs:()=>import("./adapters/text.js?v=5847de308f81a28abf005e6bee53d1782423cc42"),java:()=>import("./adapters/text.js?v=5847de308f81a28abf005e6bee53d1782423cc42")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=5847de308f81a28abf005e6bee53d1782423cc42");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=5847de308f81a28abf005e6bee53d1782423cc42");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
