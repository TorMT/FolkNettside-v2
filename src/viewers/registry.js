import {extension} from "./utils.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),docx:()=>import("./adapters/office.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),xlsx:()=>import("./adapters/office.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),pptx:()=>import("./adapters/office.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),csv:()=>import("./adapters/csv.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),
  html:()=>import("./adapters/html.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),htm:()=>import("./adapters/html.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),
  ipynb:()=>import("./adapters/notebook.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),tex:()=>import("./adapters/latex.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),
  mp4:()=>import("./adapters/video.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),webm:()=>import("./adapters/video.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),mkv:()=>import("./adapters/video.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),
  stl:()=>import("./adapters/stl.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),"3mf":()=>import("./adapters/three-mf.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),
  md:()=>import("./adapters/text.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),txt:()=>import("./adapters/text.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),py:()=>import("./adapters/text.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),
  js:()=>import("./adapters/text.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),mjs:()=>import("./adapters/text.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),ts:()=>import("./adapters/text.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),
  tsx:()=>import("./adapters/text.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),jsx:()=>import("./adapters/text.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),json:()=>import("./adapters/text.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),
  yaml:()=>import("./adapters/text.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),yml:()=>import("./adapters/text.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),c:()=>import("./adapters/text.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),
  cpp:()=>import("./adapters/text.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),h:()=>import("./adapters/text.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),hpp:()=>import("./adapters/text.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),
  cs:()=>import("./adapters/text.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad"),java:()=>import("./adapters/text.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
