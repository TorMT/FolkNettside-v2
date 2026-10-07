import {extension} from "./utils.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),docx:()=>import("./adapters/office.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),xlsx:()=>import("./adapters/office.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),pptx:()=>import("./adapters/office.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),csv:()=>import("./adapters/csv.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),
  html:()=>import("./adapters/html.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),htm:()=>import("./adapters/html.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),
  ipynb:()=>import("./adapters/notebook.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),tex:()=>import("./adapters/latex.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),
  mp4:()=>import("./adapters/video.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),webm:()=>import("./adapters/video.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),mkv:()=>import("./adapters/video.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),
  stl:()=>import("./adapters/stl.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),"3mf":()=>import("./adapters/three-mf.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),
  md:()=>import("./adapters/text.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),txt:()=>import("./adapters/text.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),py:()=>import("./adapters/text.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),
  js:()=>import("./adapters/text.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),mjs:()=>import("./adapters/text.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),ts:()=>import("./adapters/text.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),
  tsx:()=>import("./adapters/text.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),jsx:()=>import("./adapters/text.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),json:()=>import("./adapters/text.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),
  yaml:()=>import("./adapters/text.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),yml:()=>import("./adapters/text.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),c:()=>import("./adapters/text.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),
  cpp:()=>import("./adapters/text.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),h:()=>import("./adapters/text.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),hpp:()=>import("./adapters/text.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),
  cs:()=>import("./adapters/text.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e"),java:()=>import("./adapters/text.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
