import {extension} from "./utils.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),docx:()=>import("./adapters/office.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),xlsx:()=>import("./adapters/office.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),pptx:()=>import("./adapters/office.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),csv:()=>import("./adapters/csv.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),
  html:()=>import("./adapters/html.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),htm:()=>import("./adapters/html.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),
  ipynb:()=>import("./adapters/notebook.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),tex:()=>import("./adapters/latex.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),
  mp4:()=>import("./adapters/video.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),webm:()=>import("./adapters/video.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),mkv:()=>import("./adapters/video.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),
  stl:()=>import("./adapters/stl.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),"3mf":()=>import("./adapters/three-mf.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),
  md:()=>import("./adapters/text.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),txt:()=>import("./adapters/text.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),py:()=>import("./adapters/text.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),
  js:()=>import("./adapters/text.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),mjs:()=>import("./adapters/text.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),ts:()=>import("./adapters/text.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),
  tsx:()=>import("./adapters/text.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),jsx:()=>import("./adapters/text.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),json:()=>import("./adapters/text.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),
  yaml:()=>import("./adapters/text.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),yml:()=>import("./adapters/text.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),c:()=>import("./adapters/text.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),
  cpp:()=>import("./adapters/text.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),h:()=>import("./adapters/text.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),hpp:()=>import("./adapters/text.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),
  cs:()=>import("./adapters/text.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f"),java:()=>import("./adapters/text.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
