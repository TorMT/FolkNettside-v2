import {extension} from "./utils.js?v=0c572609238258b358cd83accef2e828f95d7316";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=0c572609238258b358cd83accef2e828f95d7316"),docx:()=>import("./adapters/office.js?v=0c572609238258b358cd83accef2e828f95d7316"),xlsx:()=>import("./adapters/office.js?v=0c572609238258b358cd83accef2e828f95d7316"),pptx:()=>import("./adapters/office.js?v=0c572609238258b358cd83accef2e828f95d7316"),csv:()=>import("./adapters/csv.js?v=0c572609238258b358cd83accef2e828f95d7316"),
  html:()=>import("./adapters/html.js?v=0c572609238258b358cd83accef2e828f95d7316"),htm:()=>import("./adapters/html.js?v=0c572609238258b358cd83accef2e828f95d7316"),
  ipynb:()=>import("./adapters/notebook.js?v=0c572609238258b358cd83accef2e828f95d7316"),tex:()=>import("./adapters/latex.js?v=0c572609238258b358cd83accef2e828f95d7316"),
  mp4:()=>import("./adapters/video.js?v=0c572609238258b358cd83accef2e828f95d7316"),webm:()=>import("./adapters/video.js?v=0c572609238258b358cd83accef2e828f95d7316"),mkv:()=>import("./adapters/video.js?v=0c572609238258b358cd83accef2e828f95d7316"),
  stl:()=>import("./adapters/stl.js?v=0c572609238258b358cd83accef2e828f95d7316"),"3mf":()=>import("./adapters/three-mf.js?v=0c572609238258b358cd83accef2e828f95d7316"),
  md:()=>import("./adapters/text.js?v=0c572609238258b358cd83accef2e828f95d7316"),txt:()=>import("./adapters/text.js?v=0c572609238258b358cd83accef2e828f95d7316"),py:()=>import("./adapters/text.js?v=0c572609238258b358cd83accef2e828f95d7316"),
  js:()=>import("./adapters/text.js?v=0c572609238258b358cd83accef2e828f95d7316"),mjs:()=>import("./adapters/text.js?v=0c572609238258b358cd83accef2e828f95d7316"),ts:()=>import("./adapters/text.js?v=0c572609238258b358cd83accef2e828f95d7316"),
  tsx:()=>import("./adapters/text.js?v=0c572609238258b358cd83accef2e828f95d7316"),jsx:()=>import("./adapters/text.js?v=0c572609238258b358cd83accef2e828f95d7316"),json:()=>import("./adapters/text.js?v=0c572609238258b358cd83accef2e828f95d7316"),
  yaml:()=>import("./adapters/text.js?v=0c572609238258b358cd83accef2e828f95d7316"),yml:()=>import("./adapters/text.js?v=0c572609238258b358cd83accef2e828f95d7316"),c:()=>import("./adapters/text.js?v=0c572609238258b358cd83accef2e828f95d7316"),
  cpp:()=>import("./adapters/text.js?v=0c572609238258b358cd83accef2e828f95d7316"),h:()=>import("./adapters/text.js?v=0c572609238258b358cd83accef2e828f95d7316"),hpp:()=>import("./adapters/text.js?v=0c572609238258b358cd83accef2e828f95d7316"),
  cs:()=>import("./adapters/text.js?v=0c572609238258b358cd83accef2e828f95d7316"),java:()=>import("./adapters/text.js?v=0c572609238258b358cd83accef2e828f95d7316")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=0c572609238258b358cd83accef2e828f95d7316");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=0c572609238258b358cd83accef2e828f95d7316");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
