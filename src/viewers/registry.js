import {extension} from "./utils.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),docx:()=>import("./adapters/office.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),xlsx:()=>import("./adapters/office.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),pptx:()=>import("./adapters/office.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),csv:()=>import("./adapters/csv.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),
  html:()=>import("./adapters/html.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),htm:()=>import("./adapters/html.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),
  ipynb:()=>import("./adapters/notebook.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),tex:()=>import("./adapters/latex.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),
  mp4:()=>import("./adapters/video.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),webm:()=>import("./adapters/video.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),mkv:()=>import("./adapters/video.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),
  stl:()=>import("./adapters/stl.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),"3mf":()=>import("./adapters/three-mf.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),
  md:()=>import("./adapters/text.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),txt:()=>import("./adapters/text.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),py:()=>import("./adapters/text.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),
  js:()=>import("./adapters/text.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),mjs:()=>import("./adapters/text.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),ts:()=>import("./adapters/text.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),
  tsx:()=>import("./adapters/text.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),jsx:()=>import("./adapters/text.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),json:()=>import("./adapters/text.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),
  yaml:()=>import("./adapters/text.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),yml:()=>import("./adapters/text.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),c:()=>import("./adapters/text.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),
  cpp:()=>import("./adapters/text.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),h:()=>import("./adapters/text.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),hpp:()=>import("./adapters/text.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),
  cs:()=>import("./adapters/text.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e"),java:()=>import("./adapters/text.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
