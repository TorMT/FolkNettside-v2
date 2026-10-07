import {extension} from "./utils.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),docx:()=>import("./adapters/office.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),xlsx:()=>import("./adapters/office.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),pptx:()=>import("./adapters/office.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),csv:()=>import("./adapters/csv.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),
  html:()=>import("./adapters/html.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),htm:()=>import("./adapters/html.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),
  ipynb:()=>import("./adapters/notebook.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),tex:()=>import("./adapters/latex.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),
  mp4:()=>import("./adapters/video.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),webm:()=>import("./adapters/video.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),mkv:()=>import("./adapters/video.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),
  stl:()=>import("./adapters/stl.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),"3mf":()=>import("./adapters/three-mf.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),
  md:()=>import("./adapters/text.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),txt:()=>import("./adapters/text.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),py:()=>import("./adapters/text.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),
  js:()=>import("./adapters/text.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),mjs:()=>import("./adapters/text.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),ts:()=>import("./adapters/text.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),
  tsx:()=>import("./adapters/text.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),jsx:()=>import("./adapters/text.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),json:()=>import("./adapters/text.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),
  yaml:()=>import("./adapters/text.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),yml:()=>import("./adapters/text.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),c:()=>import("./adapters/text.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),
  cpp:()=>import("./adapters/text.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),h:()=>import("./adapters/text.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),hpp:()=>import("./adapters/text.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),
  cs:()=>import("./adapters/text.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39"),java:()=>import("./adapters/text.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
