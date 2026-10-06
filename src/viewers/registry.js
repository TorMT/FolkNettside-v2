import {extension} from "./utils.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),docx:()=>import("./adapters/office.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),xlsx:()=>import("./adapters/office.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),pptx:()=>import("./adapters/office.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),csv:()=>import("./adapters/csv.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),
  html:()=>import("./adapters/html.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),htm:()=>import("./adapters/html.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),
  ipynb:()=>import("./adapters/notebook.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),tex:()=>import("./adapters/latex.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),
  mp4:()=>import("./adapters/video.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),webm:()=>import("./adapters/video.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),mkv:()=>import("./adapters/video.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),
  stl:()=>import("./adapters/stl.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),"3mf":()=>import("./adapters/three-mf.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),
  md:()=>import("./adapters/text.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),txt:()=>import("./adapters/text.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),py:()=>import("./adapters/text.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),
  js:()=>import("./adapters/text.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),mjs:()=>import("./adapters/text.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),ts:()=>import("./adapters/text.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),
  tsx:()=>import("./adapters/text.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),jsx:()=>import("./adapters/text.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),json:()=>import("./adapters/text.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),
  yaml:()=>import("./adapters/text.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),yml:()=>import("./adapters/text.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),c:()=>import("./adapters/text.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),
  cpp:()=>import("./adapters/text.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),h:()=>import("./adapters/text.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),hpp:()=>import("./adapters/text.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),
  cs:()=>import("./adapters/text.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f"),java:()=>import("./adapters/text.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f")
};
export async function loadAdapter(resource){
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
