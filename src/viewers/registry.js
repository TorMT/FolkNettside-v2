import {extension} from "./utils.js?v=0229689279d590d75553a254f7674b17d66813e0";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=0229689279d590d75553a254f7674b17d66813e0"),docx:()=>import("./adapters/office.js?v=0229689279d590d75553a254f7674b17d66813e0"),xlsx:()=>import("./adapters/office.js?v=0229689279d590d75553a254f7674b17d66813e0"),pptx:()=>import("./adapters/office.js?v=0229689279d590d75553a254f7674b17d66813e0"),csv:()=>import("./adapters/csv.js?v=0229689279d590d75553a254f7674b17d66813e0"),
  html:()=>import("./adapters/html.js?v=0229689279d590d75553a254f7674b17d66813e0"),htm:()=>import("./adapters/html.js?v=0229689279d590d75553a254f7674b17d66813e0"),
  ipynb:()=>import("./adapters/notebook.js?v=0229689279d590d75553a254f7674b17d66813e0"),tex:()=>import("./adapters/latex.js?v=0229689279d590d75553a254f7674b17d66813e0"),
  mp4:()=>import("./adapters/video.js?v=0229689279d590d75553a254f7674b17d66813e0"),webm:()=>import("./adapters/video.js?v=0229689279d590d75553a254f7674b17d66813e0"),mkv:()=>import("./adapters/video.js?v=0229689279d590d75553a254f7674b17d66813e0"),
  stl:()=>import("./adapters/stl.js?v=0229689279d590d75553a254f7674b17d66813e0"),"3mf":()=>import("./adapters/three-mf.js?v=0229689279d590d75553a254f7674b17d66813e0"),
  md:()=>import("./adapters/text.js?v=0229689279d590d75553a254f7674b17d66813e0"),txt:()=>import("./adapters/text.js?v=0229689279d590d75553a254f7674b17d66813e0"),py:()=>import("./adapters/text.js?v=0229689279d590d75553a254f7674b17d66813e0"),
  js:()=>import("./adapters/text.js?v=0229689279d590d75553a254f7674b17d66813e0"),mjs:()=>import("./adapters/text.js?v=0229689279d590d75553a254f7674b17d66813e0"),ts:()=>import("./adapters/text.js?v=0229689279d590d75553a254f7674b17d66813e0"),
  tsx:()=>import("./adapters/text.js?v=0229689279d590d75553a254f7674b17d66813e0"),jsx:()=>import("./adapters/text.js?v=0229689279d590d75553a254f7674b17d66813e0"),json:()=>import("./adapters/text.js?v=0229689279d590d75553a254f7674b17d66813e0"),
  yaml:()=>import("./adapters/text.js?v=0229689279d590d75553a254f7674b17d66813e0"),yml:()=>import("./adapters/text.js?v=0229689279d590d75553a254f7674b17d66813e0"),c:()=>import("./adapters/text.js?v=0229689279d590d75553a254f7674b17d66813e0"),
  cpp:()=>import("./adapters/text.js?v=0229689279d590d75553a254f7674b17d66813e0"),h:()=>import("./adapters/text.js?v=0229689279d590d75553a254f7674b17d66813e0"),hpp:()=>import("./adapters/text.js?v=0229689279d590d75553a254f7674b17d66813e0"),
  cs:()=>import("./adapters/text.js?v=0229689279d590d75553a254f7674b17d66813e0"),java:()=>import("./adapters/text.js?v=0229689279d590d75553a254f7674b17d66813e0")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=0229689279d590d75553a254f7674b17d66813e0");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=0229689279d590d75553a254f7674b17d66813e0");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
