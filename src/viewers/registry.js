import {extension} from "./utils.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),docx:()=>import("./adapters/office.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),xlsx:()=>import("./adapters/office.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),pptx:()=>import("./adapters/office.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),csv:()=>import("./adapters/csv.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),
  html:()=>import("./adapters/html.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),htm:()=>import("./adapters/html.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),
  ipynb:()=>import("./adapters/notebook.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),tex:()=>import("./adapters/latex.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),
  mp4:()=>import("./adapters/video.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),webm:()=>import("./adapters/video.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),mkv:()=>import("./adapters/video.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),
  stl:()=>import("./adapters/stl.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),"3mf":()=>import("./adapters/three-mf.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),
  md:()=>import("./adapters/text.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),txt:()=>import("./adapters/text.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),py:()=>import("./adapters/text.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),
  js:()=>import("./adapters/text.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),mjs:()=>import("./adapters/text.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),ts:()=>import("./adapters/text.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),
  tsx:()=>import("./adapters/text.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),jsx:()=>import("./adapters/text.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),json:()=>import("./adapters/text.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),
  yaml:()=>import("./adapters/text.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),yml:()=>import("./adapters/text.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),c:()=>import("./adapters/text.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),
  cpp:()=>import("./adapters/text.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),h:()=>import("./adapters/text.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),hpp:()=>import("./adapters/text.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),
  cs:()=>import("./adapters/text.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648"),java:()=>import("./adapters/text.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
