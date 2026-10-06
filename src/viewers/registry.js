import {extension} from "./utils.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),docx:()=>import("./adapters/office.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),xlsx:()=>import("./adapters/office.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),pptx:()=>import("./adapters/office.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),csv:()=>import("./adapters/csv.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),
  html:()=>import("./adapters/html.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),htm:()=>import("./adapters/html.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),
  ipynb:()=>import("./adapters/notebook.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),tex:()=>import("./adapters/latex.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),
  mp4:()=>import("./adapters/video.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),webm:()=>import("./adapters/video.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),mkv:()=>import("./adapters/video.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),
  stl:()=>import("./adapters/stl.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),"3mf":()=>import("./adapters/three-mf.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),
  md:()=>import("./adapters/text.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),txt:()=>import("./adapters/text.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),py:()=>import("./adapters/text.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),
  js:()=>import("./adapters/text.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),mjs:()=>import("./adapters/text.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),ts:()=>import("./adapters/text.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),
  tsx:()=>import("./adapters/text.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),jsx:()=>import("./adapters/text.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),json:()=>import("./adapters/text.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),
  yaml:()=>import("./adapters/text.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),yml:()=>import("./adapters/text.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),c:()=>import("./adapters/text.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),
  cpp:()=>import("./adapters/text.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),h:()=>import("./adapters/text.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),hpp:()=>import("./adapters/text.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),
  cs:()=>import("./adapters/text.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb"),java:()=>import("./adapters/text.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
