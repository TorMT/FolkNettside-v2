import {extension} from "./utils.js?v=b1312dbafff1965033da411a6ca48957dd011d26";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),docx:()=>import("./adapters/office.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),xlsx:()=>import("./adapters/office.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),pptx:()=>import("./adapters/office.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),csv:()=>import("./adapters/csv.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),
  html:()=>import("./adapters/html.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),htm:()=>import("./adapters/html.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),
  ipynb:()=>import("./adapters/notebook.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),tex:()=>import("./adapters/latex.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),
  mp4:()=>import("./adapters/video.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),webm:()=>import("./adapters/video.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),mkv:()=>import("./adapters/video.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),
  stl:()=>import("./adapters/stl.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),"3mf":()=>import("./adapters/three-mf.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),
  md:()=>import("./adapters/text.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),txt:()=>import("./adapters/text.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),py:()=>import("./adapters/text.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),
  js:()=>import("./adapters/text.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),mjs:()=>import("./adapters/text.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),ts:()=>import("./adapters/text.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),
  tsx:()=>import("./adapters/text.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),jsx:()=>import("./adapters/text.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),json:()=>import("./adapters/text.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),
  yaml:()=>import("./adapters/text.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),yml:()=>import("./adapters/text.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),c:()=>import("./adapters/text.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),
  cpp:()=>import("./adapters/text.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),h:()=>import("./adapters/text.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),hpp:()=>import("./adapters/text.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),
  cs:()=>import("./adapters/text.js?v=b1312dbafff1965033da411a6ca48957dd011d26"),java:()=>import("./adapters/text.js?v=b1312dbafff1965033da411a6ca48957dd011d26")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=b1312dbafff1965033da411a6ca48957dd011d26");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=b1312dbafff1965033da411a6ca48957dd011d26");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
