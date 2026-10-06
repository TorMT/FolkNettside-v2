import {extension} from "./utils.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),docx:()=>import("./adapters/office.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),xlsx:()=>import("./adapters/office.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),pptx:()=>import("./adapters/office.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),csv:()=>import("./adapters/csv.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),
  html:()=>import("./adapters/html.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),htm:()=>import("./adapters/html.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),
  ipynb:()=>import("./adapters/notebook.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),tex:()=>import("./adapters/latex.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),
  mp4:()=>import("./adapters/video.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),webm:()=>import("./adapters/video.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),mkv:()=>import("./adapters/video.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),
  stl:()=>import("./adapters/stl.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),"3mf":()=>import("./adapters/three-mf.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),
  md:()=>import("./adapters/text.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),txt:()=>import("./adapters/text.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),py:()=>import("./adapters/text.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),
  js:()=>import("./adapters/text.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),mjs:()=>import("./adapters/text.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),ts:()=>import("./adapters/text.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),
  tsx:()=>import("./adapters/text.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),jsx:()=>import("./adapters/text.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),json:()=>import("./adapters/text.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),
  yaml:()=>import("./adapters/text.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),yml:()=>import("./adapters/text.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),c:()=>import("./adapters/text.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),
  cpp:()=>import("./adapters/text.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),h:()=>import("./adapters/text.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),hpp:()=>import("./adapters/text.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),
  cs:()=>import("./adapters/text.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6"),java:()=>import("./adapters/text.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
