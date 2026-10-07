import {extension} from "./utils.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),docx:()=>import("./adapters/office.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),xlsx:()=>import("./adapters/office.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),pptx:()=>import("./adapters/office.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),csv:()=>import("./adapters/csv.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),
  html:()=>import("./adapters/html.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),htm:()=>import("./adapters/html.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),
  ipynb:()=>import("./adapters/notebook.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),tex:()=>import("./adapters/latex.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),
  mp4:()=>import("./adapters/video.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),webm:()=>import("./adapters/video.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),mkv:()=>import("./adapters/video.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),
  stl:()=>import("./adapters/stl.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),"3mf":()=>import("./adapters/three-mf.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),
  md:()=>import("./adapters/text.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),txt:()=>import("./adapters/text.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),py:()=>import("./adapters/text.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),
  js:()=>import("./adapters/text.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),mjs:()=>import("./adapters/text.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),ts:()=>import("./adapters/text.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),
  tsx:()=>import("./adapters/text.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),jsx:()=>import("./adapters/text.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),json:()=>import("./adapters/text.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),
  yaml:()=>import("./adapters/text.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),yml:()=>import("./adapters/text.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),c:()=>import("./adapters/text.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),
  cpp:()=>import("./adapters/text.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),h:()=>import("./adapters/text.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),hpp:()=>import("./adapters/text.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),
  cs:()=>import("./adapters/text.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c"),java:()=>import("./adapters/text.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
