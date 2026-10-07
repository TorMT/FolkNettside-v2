import {extension} from "./utils.js?v=7ad2c067446e996584637c569ccd95576101aea7";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=7ad2c067446e996584637c569ccd95576101aea7"),docx:()=>import("./adapters/office.js?v=7ad2c067446e996584637c569ccd95576101aea7"),xlsx:()=>import("./adapters/office.js?v=7ad2c067446e996584637c569ccd95576101aea7"),pptx:()=>import("./adapters/office.js?v=7ad2c067446e996584637c569ccd95576101aea7"),csv:()=>import("./adapters/csv.js?v=7ad2c067446e996584637c569ccd95576101aea7"),
  html:()=>import("./adapters/html.js?v=7ad2c067446e996584637c569ccd95576101aea7"),htm:()=>import("./adapters/html.js?v=7ad2c067446e996584637c569ccd95576101aea7"),
  ipynb:()=>import("./adapters/notebook.js?v=7ad2c067446e996584637c569ccd95576101aea7"),tex:()=>import("./adapters/latex.js?v=7ad2c067446e996584637c569ccd95576101aea7"),
  mp4:()=>import("./adapters/video.js?v=7ad2c067446e996584637c569ccd95576101aea7"),webm:()=>import("./adapters/video.js?v=7ad2c067446e996584637c569ccd95576101aea7"),mkv:()=>import("./adapters/video.js?v=7ad2c067446e996584637c569ccd95576101aea7"),
  stl:()=>import("./adapters/stl.js?v=7ad2c067446e996584637c569ccd95576101aea7"),"3mf":()=>import("./adapters/three-mf.js?v=7ad2c067446e996584637c569ccd95576101aea7"),
  md:()=>import("./adapters/text.js?v=7ad2c067446e996584637c569ccd95576101aea7"),txt:()=>import("./adapters/text.js?v=7ad2c067446e996584637c569ccd95576101aea7"),py:()=>import("./adapters/text.js?v=7ad2c067446e996584637c569ccd95576101aea7"),
  js:()=>import("./adapters/text.js?v=7ad2c067446e996584637c569ccd95576101aea7"),mjs:()=>import("./adapters/text.js?v=7ad2c067446e996584637c569ccd95576101aea7"),ts:()=>import("./adapters/text.js?v=7ad2c067446e996584637c569ccd95576101aea7"),
  tsx:()=>import("./adapters/text.js?v=7ad2c067446e996584637c569ccd95576101aea7"),jsx:()=>import("./adapters/text.js?v=7ad2c067446e996584637c569ccd95576101aea7"),json:()=>import("./adapters/text.js?v=7ad2c067446e996584637c569ccd95576101aea7"),
  yaml:()=>import("./adapters/text.js?v=7ad2c067446e996584637c569ccd95576101aea7"),yml:()=>import("./adapters/text.js?v=7ad2c067446e996584637c569ccd95576101aea7"),c:()=>import("./adapters/text.js?v=7ad2c067446e996584637c569ccd95576101aea7"),
  cpp:()=>import("./adapters/text.js?v=7ad2c067446e996584637c569ccd95576101aea7"),h:()=>import("./adapters/text.js?v=7ad2c067446e996584637c569ccd95576101aea7"),hpp:()=>import("./adapters/text.js?v=7ad2c067446e996584637c569ccd95576101aea7"),
  cs:()=>import("./adapters/text.js?v=7ad2c067446e996584637c569ccd95576101aea7"),java:()=>import("./adapters/text.js?v=7ad2c067446e996584637c569ccd95576101aea7")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=7ad2c067446e996584637c569ccd95576101aea7");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=7ad2c067446e996584637c569ccd95576101aea7");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
