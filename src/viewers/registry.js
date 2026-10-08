import {extension} from "./utils.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),docx:()=>import("./adapters/office.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),xlsx:()=>import("./adapters/office.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),pptx:()=>import("./adapters/office.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),csv:()=>import("./adapters/csv.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),
  html:()=>import("./adapters/html.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),htm:()=>import("./adapters/html.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),
  ipynb:()=>import("./adapters/notebook.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),tex:()=>import("./adapters/latex.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),
  mp4:()=>import("./adapters/video.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),webm:()=>import("./adapters/video.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),mkv:()=>import("./adapters/video.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),
  stl:()=>import("./adapters/stl.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),"3mf":()=>import("./adapters/three-mf.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),
  md:()=>import("./adapters/text.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),txt:()=>import("./adapters/text.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),py:()=>import("./adapters/text.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),
  js:()=>import("./adapters/text.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),mjs:()=>import("./adapters/text.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),ts:()=>import("./adapters/text.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),
  tsx:()=>import("./adapters/text.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),jsx:()=>import("./adapters/text.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),json:()=>import("./adapters/text.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),
  yaml:()=>import("./adapters/text.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),yml:()=>import("./adapters/text.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),c:()=>import("./adapters/text.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),
  cpp:()=>import("./adapters/text.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),h:()=>import("./adapters/text.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),hpp:()=>import("./adapters/text.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),
  cs:()=>import("./adapters/text.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257"),java:()=>import("./adapters/text.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
