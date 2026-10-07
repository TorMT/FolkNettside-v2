import {extension} from "./utils.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),docx:()=>import("./adapters/office.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),xlsx:()=>import("./adapters/office.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),pptx:()=>import("./adapters/office.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),csv:()=>import("./adapters/csv.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),
  html:()=>import("./adapters/html.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),htm:()=>import("./adapters/html.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),
  ipynb:()=>import("./adapters/notebook.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),tex:()=>import("./adapters/latex.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),
  mp4:()=>import("./adapters/video.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),webm:()=>import("./adapters/video.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),mkv:()=>import("./adapters/video.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),
  stl:()=>import("./adapters/stl.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),"3mf":()=>import("./adapters/three-mf.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),
  md:()=>import("./adapters/text.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),txt:()=>import("./adapters/text.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),py:()=>import("./adapters/text.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),
  js:()=>import("./adapters/text.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),mjs:()=>import("./adapters/text.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),ts:()=>import("./adapters/text.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),
  tsx:()=>import("./adapters/text.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),jsx:()=>import("./adapters/text.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),json:()=>import("./adapters/text.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),
  yaml:()=>import("./adapters/text.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),yml:()=>import("./adapters/text.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),c:()=>import("./adapters/text.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),
  cpp:()=>import("./adapters/text.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),h:()=>import("./adapters/text.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),hpp:()=>import("./adapters/text.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),
  cs:()=>import("./adapters/text.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65"),java:()=>import("./adapters/text.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
