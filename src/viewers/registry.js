import {extension} from "./utils.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),docx:()=>import("./adapters/office.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),xlsx:()=>import("./adapters/office.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),pptx:()=>import("./adapters/office.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),csv:()=>import("./adapters/csv.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),
  html:()=>import("./adapters/html.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),htm:()=>import("./adapters/html.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),
  ipynb:()=>import("./adapters/notebook.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),tex:()=>import("./adapters/latex.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),
  mp4:()=>import("./adapters/video.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),webm:()=>import("./adapters/video.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),mkv:()=>import("./adapters/video.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),
  stl:()=>import("./adapters/stl.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),"3mf":()=>import("./adapters/three-mf.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),
  md:()=>import("./adapters/text.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),txt:()=>import("./adapters/text.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),py:()=>import("./adapters/text.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),
  js:()=>import("./adapters/text.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),mjs:()=>import("./adapters/text.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),ts:()=>import("./adapters/text.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),
  tsx:()=>import("./adapters/text.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),jsx:()=>import("./adapters/text.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),json:()=>import("./adapters/text.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),
  yaml:()=>import("./adapters/text.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),yml:()=>import("./adapters/text.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),c:()=>import("./adapters/text.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),
  cpp:()=>import("./adapters/text.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),h:()=>import("./adapters/text.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),hpp:()=>import("./adapters/text.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),
  cs:()=>import("./adapters/text.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d"),java:()=>import("./adapters/text.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
