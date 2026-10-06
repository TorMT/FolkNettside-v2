import {extension} from "./utils.js?v=8aa0c11932670c127bfa632341edc0b2d5192849";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),docx:()=>import("./adapters/office.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),xlsx:()=>import("./adapters/office.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),pptx:()=>import("./adapters/office.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),csv:()=>import("./adapters/csv.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),
  html:()=>import("./adapters/html.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),htm:()=>import("./adapters/html.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),
  ipynb:()=>import("./adapters/notebook.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),tex:()=>import("./adapters/latex.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),
  mp4:()=>import("./adapters/video.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),webm:()=>import("./adapters/video.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),mkv:()=>import("./adapters/video.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),
  stl:()=>import("./adapters/stl.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),"3mf":()=>import("./adapters/three-mf.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),
  md:()=>import("./adapters/text.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),txt:()=>import("./adapters/text.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),py:()=>import("./adapters/text.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),
  js:()=>import("./adapters/text.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),mjs:()=>import("./adapters/text.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),ts:()=>import("./adapters/text.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),
  tsx:()=>import("./adapters/text.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),jsx:()=>import("./adapters/text.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),json:()=>import("./adapters/text.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),
  yaml:()=>import("./adapters/text.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),yml:()=>import("./adapters/text.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),c:()=>import("./adapters/text.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),
  cpp:()=>import("./adapters/text.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),h:()=>import("./adapters/text.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),hpp:()=>import("./adapters/text.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),
  cs:()=>import("./adapters/text.js?v=8aa0c11932670c127bfa632341edc0b2d5192849"),java:()=>import("./adapters/text.js?v=8aa0c11932670c127bfa632341edc0b2d5192849")
};
export async function loadAdapter(resource){
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=8aa0c11932670c127bfa632341edc0b2d5192849");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
