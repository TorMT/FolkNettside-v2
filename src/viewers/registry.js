import {extension} from "./utils.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),docx:()=>import("./adapters/office.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),xlsx:()=>import("./adapters/office.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),pptx:()=>import("./adapters/office.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),csv:()=>import("./adapters/csv.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),
  html:()=>import("./adapters/html.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),htm:()=>import("./adapters/html.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),
  ipynb:()=>import("./adapters/notebook.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),tex:()=>import("./adapters/latex.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),
  mp4:()=>import("./adapters/video.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),webm:()=>import("./adapters/video.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),mkv:()=>import("./adapters/video.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),
  stl:()=>import("./adapters/stl.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),"3mf":()=>import("./adapters/three-mf.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),
  md:()=>import("./adapters/text.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),txt:()=>import("./adapters/text.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),py:()=>import("./adapters/text.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),
  js:()=>import("./adapters/text.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),mjs:()=>import("./adapters/text.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),ts:()=>import("./adapters/text.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),
  tsx:()=>import("./adapters/text.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),jsx:()=>import("./adapters/text.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),json:()=>import("./adapters/text.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),
  yaml:()=>import("./adapters/text.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),yml:()=>import("./adapters/text.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),c:()=>import("./adapters/text.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),
  cpp:()=>import("./adapters/text.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),h:()=>import("./adapters/text.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),hpp:()=>import("./adapters/text.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),
  cs:()=>import("./adapters/text.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe"),java:()=>import("./adapters/text.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
