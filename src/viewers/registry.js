import {extension} from "./utils.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),docx:()=>import("./adapters/office.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),xlsx:()=>import("./adapters/office.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),pptx:()=>import("./adapters/office.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),csv:()=>import("./adapters/csv.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),
  html:()=>import("./adapters/html.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),htm:()=>import("./adapters/html.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),
  ipynb:()=>import("./adapters/notebook.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),tex:()=>import("./adapters/latex.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),
  mp4:()=>import("./adapters/video.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),webm:()=>import("./adapters/video.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),mkv:()=>import("./adapters/video.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),
  stl:()=>import("./adapters/stl.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),"3mf":()=>import("./adapters/three-mf.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),
  md:()=>import("./adapters/text.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),txt:()=>import("./adapters/text.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),py:()=>import("./adapters/text.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),
  js:()=>import("./adapters/text.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),mjs:()=>import("./adapters/text.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),ts:()=>import("./adapters/text.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),
  tsx:()=>import("./adapters/text.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),jsx:()=>import("./adapters/text.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),json:()=>import("./adapters/text.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),
  yaml:()=>import("./adapters/text.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),yml:()=>import("./adapters/text.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),c:()=>import("./adapters/text.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),
  cpp:()=>import("./adapters/text.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),h:()=>import("./adapters/text.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),hpp:()=>import("./adapters/text.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),
  cs:()=>import("./adapters/text.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140"),java:()=>import("./adapters/text.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
