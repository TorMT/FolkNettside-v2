import {extension} from "./utils.js?v=e20b7932369f663022714d061be3a7037a33b0d5";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),docx:()=>import("./adapters/office.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),xlsx:()=>import("./adapters/office.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),pptx:()=>import("./adapters/office.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),csv:()=>import("./adapters/csv.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),
  html:()=>import("./adapters/html.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),htm:()=>import("./adapters/html.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),
  ipynb:()=>import("./adapters/notebook.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),tex:()=>import("./adapters/latex.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),
  mp4:()=>import("./adapters/video.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),webm:()=>import("./adapters/video.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),mkv:()=>import("./adapters/video.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),
  stl:()=>import("./adapters/stl.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),"3mf":()=>import("./adapters/three-mf.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),
  md:()=>import("./adapters/text.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),txt:()=>import("./adapters/text.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),py:()=>import("./adapters/text.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),
  js:()=>import("./adapters/text.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),mjs:()=>import("./adapters/text.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),ts:()=>import("./adapters/text.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),
  tsx:()=>import("./adapters/text.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),jsx:()=>import("./adapters/text.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),json:()=>import("./adapters/text.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),
  yaml:()=>import("./adapters/text.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),yml:()=>import("./adapters/text.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),c:()=>import("./adapters/text.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),
  cpp:()=>import("./adapters/text.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),h:()=>import("./adapters/text.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),hpp:()=>import("./adapters/text.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),
  cs:()=>import("./adapters/text.js?v=e20b7932369f663022714d061be3a7037a33b0d5"),java:()=>import("./adapters/text.js?v=e20b7932369f663022714d061be3a7037a33b0d5")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=e20b7932369f663022714d061be3a7037a33b0d5");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=e20b7932369f663022714d061be3a7037a33b0d5");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
