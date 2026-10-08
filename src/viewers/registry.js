import {extension} from "./utils.js?v=6c4cc3557b13b5654450274a995d12c977c89852";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),docx:()=>import("./adapters/office.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),xlsx:()=>import("./adapters/office.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),pptx:()=>import("./adapters/office.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),csv:()=>import("./adapters/csv.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),tsv:()=>import("./adapters/csv.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),psv:()=>import("./adapters/csv.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),
  html:()=>import("./adapters/html.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),htm:()=>import("./adapters/html.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),
  ipynb:()=>import("./adapters/notebook.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),tex:()=>import("./adapters/latex.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),
  mp4:()=>import("./adapters/video.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),webm:()=>import("./adapters/video.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),mkv:()=>import("./adapters/video.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),
  stl:()=>import("./adapters/stl.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),"3mf":()=>import("./adapters/three-mf.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),
  f3z:()=>import("./adapters/fusion.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),f3d:()=>import("./adapters/fusion.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),
  md:()=>import("./adapters/text.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),txt:()=>import("./adapters/text.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),py:()=>import("./adapters/python.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),
  js:()=>import("./adapters/text.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),mjs:()=>import("./adapters/text.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),ts:()=>import("./adapters/text.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),
  tsx:()=>import("./adapters/text.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),jsx:()=>import("./adapters/text.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),json:()=>import("./adapters/text.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),
  yaml:()=>import("./adapters/text.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),yml:()=>import("./adapters/text.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),c:()=>import("./adapters/text.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),
  cpp:()=>import("./adapters/text.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),h:()=>import("./adapters/text.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),hpp:()=>import("./adapters/text.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),
  cs:()=>import("./adapters/text.js?v=6c4cc3557b13b5654450274a995d12c977c89852"),java:()=>import("./adapters/text.js?v=6c4cc3557b13b5654450274a995d12c977c89852")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=6c4cc3557b13b5654450274a995d12c977c89852");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=6c4cc3557b13b5654450274a995d12c977c89852");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
