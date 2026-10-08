import {extension} from "./utils.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),docx:()=>import("./adapters/office.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),xlsx:()=>import("./adapters/office.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),pptx:()=>import("./adapters/office.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),csv:()=>import("./adapters/csv.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),
  html:()=>import("./adapters/html.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),htm:()=>import("./adapters/html.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),
  ipynb:()=>import("./adapters/notebook.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),tex:()=>import("./adapters/latex.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),
  mp4:()=>import("./adapters/video.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),webm:()=>import("./adapters/video.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),mkv:()=>import("./adapters/video.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),
  stl:()=>import("./adapters/stl.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),"3mf":()=>import("./adapters/three-mf.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),
  md:()=>import("./adapters/text.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),txt:()=>import("./adapters/text.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),py:()=>import("./adapters/text.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),
  js:()=>import("./adapters/text.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),mjs:()=>import("./adapters/text.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),ts:()=>import("./adapters/text.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),
  tsx:()=>import("./adapters/text.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),jsx:()=>import("./adapters/text.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),json:()=>import("./adapters/text.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),
  yaml:()=>import("./adapters/text.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),yml:()=>import("./adapters/text.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),c:()=>import("./adapters/text.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),
  cpp:()=>import("./adapters/text.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),h:()=>import("./adapters/text.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),hpp:()=>import("./adapters/text.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),
  cs:()=>import("./adapters/text.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f"),java:()=>import("./adapters/text.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
