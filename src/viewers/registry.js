import {extension} from "./utils.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),docx:()=>import("./adapters/office.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),xlsx:()=>import("./adapters/office.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),pptx:()=>import("./adapters/office.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),csv:()=>import("./adapters/csv.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),
  html:()=>import("./adapters/html.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),htm:()=>import("./adapters/html.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),
  ipynb:()=>import("./adapters/notebook.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),tex:()=>import("./adapters/latex.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),
  mp4:()=>import("./adapters/video.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),webm:()=>import("./adapters/video.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),mkv:()=>import("./adapters/video.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),
  stl:()=>import("./adapters/stl.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),"3mf":()=>import("./adapters/three-mf.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),
  md:()=>import("./adapters/text.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),txt:()=>import("./adapters/text.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),py:()=>import("./adapters/text.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),
  js:()=>import("./adapters/text.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),mjs:()=>import("./adapters/text.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),ts:()=>import("./adapters/text.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),
  tsx:()=>import("./adapters/text.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),jsx:()=>import("./adapters/text.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),json:()=>import("./adapters/text.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),
  yaml:()=>import("./adapters/text.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),yml:()=>import("./adapters/text.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),c:()=>import("./adapters/text.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),
  cpp:()=>import("./adapters/text.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),h:()=>import("./adapters/text.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),hpp:()=>import("./adapters/text.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),
  cs:()=>import("./adapters/text.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18"),java:()=>import("./adapters/text.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
