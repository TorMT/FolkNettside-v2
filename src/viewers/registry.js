import {extension} from "./utils.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),docx:()=>import("./adapters/office.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),xlsx:()=>import("./adapters/office.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),pptx:()=>import("./adapters/office.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),csv:()=>import("./adapters/csv.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),
  html:()=>import("./adapters/html.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),htm:()=>import("./adapters/html.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),
  ipynb:()=>import("./adapters/notebook.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),tex:()=>import("./adapters/latex.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),
  mp4:()=>import("./adapters/video.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),webm:()=>import("./adapters/video.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),mkv:()=>import("./adapters/video.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),
  stl:()=>import("./adapters/stl.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),"3mf":()=>import("./adapters/three-mf.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),
  md:()=>import("./adapters/text.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),txt:()=>import("./adapters/text.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),py:()=>import("./adapters/text.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),
  js:()=>import("./adapters/text.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),mjs:()=>import("./adapters/text.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),ts:()=>import("./adapters/text.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),
  tsx:()=>import("./adapters/text.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),jsx:()=>import("./adapters/text.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),json:()=>import("./adapters/text.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),
  yaml:()=>import("./adapters/text.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),yml:()=>import("./adapters/text.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),c:()=>import("./adapters/text.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),
  cpp:()=>import("./adapters/text.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),h:()=>import("./adapters/text.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),hpp:()=>import("./adapters/text.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),
  cs:()=>import("./adapters/text.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68"),java:()=>import("./adapters/text.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
