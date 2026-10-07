import {extension} from "./utils.js?v=4f96120049cd91bc89369b363db6c9d63719a367";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),docx:()=>import("./adapters/office.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),xlsx:()=>import("./adapters/office.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),pptx:()=>import("./adapters/office.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),csv:()=>import("./adapters/csv.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),
  html:()=>import("./adapters/html.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),htm:()=>import("./adapters/html.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),
  ipynb:()=>import("./adapters/notebook.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),tex:()=>import("./adapters/latex.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),
  mp4:()=>import("./adapters/video.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),webm:()=>import("./adapters/video.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),mkv:()=>import("./adapters/video.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),
  stl:()=>import("./adapters/stl.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),"3mf":()=>import("./adapters/three-mf.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),
  md:()=>import("./adapters/text.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),txt:()=>import("./adapters/text.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),py:()=>import("./adapters/text.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),
  js:()=>import("./adapters/text.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),mjs:()=>import("./adapters/text.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),ts:()=>import("./adapters/text.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),
  tsx:()=>import("./adapters/text.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),jsx:()=>import("./adapters/text.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),json:()=>import("./adapters/text.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),
  yaml:()=>import("./adapters/text.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),yml:()=>import("./adapters/text.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),c:()=>import("./adapters/text.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),
  cpp:()=>import("./adapters/text.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),h:()=>import("./adapters/text.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),hpp:()=>import("./adapters/text.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),
  cs:()=>import("./adapters/text.js?v=4f96120049cd91bc89369b363db6c9d63719a367"),java:()=>import("./adapters/text.js?v=4f96120049cd91bc89369b363db6c9d63719a367")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=4f96120049cd91bc89369b363db6c9d63719a367");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=4f96120049cd91bc89369b363db6c9d63719a367");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
