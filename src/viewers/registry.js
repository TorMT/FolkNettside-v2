import {extension} from "./utils.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),docx:()=>import("./adapters/office.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),xlsx:()=>import("./adapters/office.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),pptx:()=>import("./adapters/office.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),csv:()=>import("./adapters/csv.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),
  html:()=>import("./adapters/html.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),htm:()=>import("./adapters/html.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),
  ipynb:()=>import("./adapters/notebook.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),tex:()=>import("./adapters/latex.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),
  mp4:()=>import("./adapters/video.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),webm:()=>import("./adapters/video.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),mkv:()=>import("./adapters/video.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),
  stl:()=>import("./adapters/stl.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),"3mf":()=>import("./adapters/three-mf.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),
  md:()=>import("./adapters/text.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),txt:()=>import("./adapters/text.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),py:()=>import("./adapters/text.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),
  js:()=>import("./adapters/text.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),mjs:()=>import("./adapters/text.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),ts:()=>import("./adapters/text.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),
  tsx:()=>import("./adapters/text.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),jsx:()=>import("./adapters/text.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),json:()=>import("./adapters/text.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),
  yaml:()=>import("./adapters/text.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),yml:()=>import("./adapters/text.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),c:()=>import("./adapters/text.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),
  cpp:()=>import("./adapters/text.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),h:()=>import("./adapters/text.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),hpp:()=>import("./adapters/text.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),
  cs:()=>import("./adapters/text.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c"),java:()=>import("./adapters/text.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
