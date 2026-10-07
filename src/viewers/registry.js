import {extension} from "./utils.js?v=a74d6e80c206c18560d176157cc5752b2144f976";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),docx:()=>import("./adapters/office.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),xlsx:()=>import("./adapters/office.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),pptx:()=>import("./adapters/office.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),csv:()=>import("./adapters/csv.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),
  html:()=>import("./adapters/html.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),htm:()=>import("./adapters/html.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),
  ipynb:()=>import("./adapters/notebook.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),tex:()=>import("./adapters/latex.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),
  mp4:()=>import("./adapters/video.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),webm:()=>import("./adapters/video.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),mkv:()=>import("./adapters/video.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),
  stl:()=>import("./adapters/stl.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),"3mf":()=>import("./adapters/three-mf.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),
  md:()=>import("./adapters/text.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),txt:()=>import("./adapters/text.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),py:()=>import("./adapters/text.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),
  js:()=>import("./adapters/text.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),mjs:()=>import("./adapters/text.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),ts:()=>import("./adapters/text.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),
  tsx:()=>import("./adapters/text.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),jsx:()=>import("./adapters/text.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),json:()=>import("./adapters/text.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),
  yaml:()=>import("./adapters/text.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),yml:()=>import("./adapters/text.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),c:()=>import("./adapters/text.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),
  cpp:()=>import("./adapters/text.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),h:()=>import("./adapters/text.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),hpp:()=>import("./adapters/text.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),
  cs:()=>import("./adapters/text.js?v=a74d6e80c206c18560d176157cc5752b2144f976"),java:()=>import("./adapters/text.js?v=a74d6e80c206c18560d176157cc5752b2144f976")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=a74d6e80c206c18560d176157cc5752b2144f976");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=a74d6e80c206c18560d176157cc5752b2144f976");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
