import {extension} from "./utils.js?v=a435f153ef7e9408be42556149dd61c3928ec506";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),docx:()=>import("./adapters/office.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),xlsx:()=>import("./adapters/office.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),pptx:()=>import("./adapters/office.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),csv:()=>import("./adapters/csv.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),
  html:()=>import("./adapters/html.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),htm:()=>import("./adapters/html.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),
  ipynb:()=>import("./adapters/notebook.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),tex:()=>import("./adapters/latex.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),
  mp4:()=>import("./adapters/video.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),webm:()=>import("./adapters/video.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),mkv:()=>import("./adapters/video.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),
  stl:()=>import("./adapters/stl.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),"3mf":()=>import("./adapters/three-mf.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),
  md:()=>import("./adapters/text.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),txt:()=>import("./adapters/text.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),py:()=>import("./adapters/text.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),
  js:()=>import("./adapters/text.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),mjs:()=>import("./adapters/text.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),ts:()=>import("./adapters/text.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),
  tsx:()=>import("./adapters/text.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),jsx:()=>import("./adapters/text.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),json:()=>import("./adapters/text.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),
  yaml:()=>import("./adapters/text.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),yml:()=>import("./adapters/text.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),c:()=>import("./adapters/text.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),
  cpp:()=>import("./adapters/text.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),h:()=>import("./adapters/text.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),hpp:()=>import("./adapters/text.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),
  cs:()=>import("./adapters/text.js?v=a435f153ef7e9408be42556149dd61c3928ec506"),java:()=>import("./adapters/text.js?v=a435f153ef7e9408be42556149dd61c3928ec506")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=a435f153ef7e9408be42556149dd61c3928ec506");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=a435f153ef7e9408be42556149dd61c3928ec506");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
