import {extension} from "./utils.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),docx:()=>import("./adapters/office.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),xlsx:()=>import("./adapters/office.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),pptx:()=>import("./adapters/office.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),csv:()=>import("./adapters/csv.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),
  html:()=>import("./adapters/html.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),htm:()=>import("./adapters/html.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),
  ipynb:()=>import("./adapters/notebook.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),tex:()=>import("./adapters/latex.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),
  mp4:()=>import("./adapters/video.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),webm:()=>import("./adapters/video.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),mkv:()=>import("./adapters/video.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),
  stl:()=>import("./adapters/stl.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),"3mf":()=>import("./adapters/three-mf.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),
  md:()=>import("./adapters/text.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),txt:()=>import("./adapters/text.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),py:()=>import("./adapters/text.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),
  js:()=>import("./adapters/text.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),mjs:()=>import("./adapters/text.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),ts:()=>import("./adapters/text.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),
  tsx:()=>import("./adapters/text.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),jsx:()=>import("./adapters/text.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),json:()=>import("./adapters/text.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),
  yaml:()=>import("./adapters/text.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),yml:()=>import("./adapters/text.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),c:()=>import("./adapters/text.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),
  cpp:()=>import("./adapters/text.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),h:()=>import("./adapters/text.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),hpp:()=>import("./adapters/text.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),
  cs:()=>import("./adapters/text.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407"),java:()=>import("./adapters/text.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
