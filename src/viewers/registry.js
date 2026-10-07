import {extension} from "./utils.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),docx:()=>import("./adapters/office.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),xlsx:()=>import("./adapters/office.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),pptx:()=>import("./adapters/office.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),csv:()=>import("./adapters/csv.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),
  html:()=>import("./adapters/html.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),htm:()=>import("./adapters/html.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),
  ipynb:()=>import("./adapters/notebook.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),tex:()=>import("./adapters/latex.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),
  mp4:()=>import("./adapters/video.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),webm:()=>import("./adapters/video.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),mkv:()=>import("./adapters/video.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),
  stl:()=>import("./adapters/stl.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),"3mf":()=>import("./adapters/three-mf.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),
  md:()=>import("./adapters/text.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),txt:()=>import("./adapters/text.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),py:()=>import("./adapters/text.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),
  js:()=>import("./adapters/text.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),mjs:()=>import("./adapters/text.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),ts:()=>import("./adapters/text.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),
  tsx:()=>import("./adapters/text.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),jsx:()=>import("./adapters/text.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),json:()=>import("./adapters/text.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),
  yaml:()=>import("./adapters/text.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),yml:()=>import("./adapters/text.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),c:()=>import("./adapters/text.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),
  cpp:()=>import("./adapters/text.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),h:()=>import("./adapters/text.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),hpp:()=>import("./adapters/text.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),
  cs:()=>import("./adapters/text.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22"),java:()=>import("./adapters/text.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
