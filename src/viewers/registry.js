import {extension} from "./utils.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),docx:()=>import("./adapters/office.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),xlsx:()=>import("./adapters/office.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),pptx:()=>import("./adapters/office.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),csv:()=>import("./adapters/csv.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),
  html:()=>import("./adapters/html.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),htm:()=>import("./adapters/html.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),
  ipynb:()=>import("./adapters/notebook.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),tex:()=>import("./adapters/latex.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),
  mp4:()=>import("./adapters/video.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),webm:()=>import("./adapters/video.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),mkv:()=>import("./adapters/video.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),
  stl:()=>import("./adapters/stl.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),"3mf":()=>import("./adapters/three-mf.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),
  md:()=>import("./adapters/text.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),txt:()=>import("./adapters/text.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),py:()=>import("./adapters/text.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),
  js:()=>import("./adapters/text.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),mjs:()=>import("./adapters/text.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),ts:()=>import("./adapters/text.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),
  tsx:()=>import("./adapters/text.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),jsx:()=>import("./adapters/text.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),json:()=>import("./adapters/text.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),
  yaml:()=>import("./adapters/text.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),yml:()=>import("./adapters/text.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),c:()=>import("./adapters/text.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),
  cpp:()=>import("./adapters/text.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),h:()=>import("./adapters/text.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),hpp:()=>import("./adapters/text.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),
  cs:()=>import("./adapters/text.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0"),java:()=>import("./adapters/text.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
