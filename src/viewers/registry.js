import {extension} from "./utils.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),docx:()=>import("./adapters/office.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),xlsx:()=>import("./adapters/office.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),pptx:()=>import("./adapters/office.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),csv:()=>import("./adapters/csv.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),
  html:()=>import("./adapters/html.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),htm:()=>import("./adapters/html.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),
  ipynb:()=>import("./adapters/notebook.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),tex:()=>import("./adapters/latex.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),
  mp4:()=>import("./adapters/video.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),webm:()=>import("./adapters/video.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),mkv:()=>import("./adapters/video.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),
  stl:()=>import("./adapters/stl.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),"3mf":()=>import("./adapters/three-mf.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),
  md:()=>import("./adapters/text.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),txt:()=>import("./adapters/text.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),py:()=>import("./adapters/text.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),
  js:()=>import("./adapters/text.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),mjs:()=>import("./adapters/text.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),ts:()=>import("./adapters/text.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),
  tsx:()=>import("./adapters/text.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),jsx:()=>import("./adapters/text.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),json:()=>import("./adapters/text.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),
  yaml:()=>import("./adapters/text.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),yml:()=>import("./adapters/text.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),c:()=>import("./adapters/text.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),
  cpp:()=>import("./adapters/text.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),h:()=>import("./adapters/text.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),hpp:()=>import("./adapters/text.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),
  cs:()=>import("./adapters/text.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a"),java:()=>import("./adapters/text.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
