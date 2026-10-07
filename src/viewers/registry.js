import {extension} from "./utils.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),docx:()=>import("./adapters/office.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),xlsx:()=>import("./adapters/office.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),pptx:()=>import("./adapters/office.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),csv:()=>import("./adapters/csv.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),
  html:()=>import("./adapters/html.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),htm:()=>import("./adapters/html.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),
  ipynb:()=>import("./adapters/notebook.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),tex:()=>import("./adapters/latex.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),
  mp4:()=>import("./adapters/video.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),webm:()=>import("./adapters/video.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),mkv:()=>import("./adapters/video.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),
  stl:()=>import("./adapters/stl.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),"3mf":()=>import("./adapters/three-mf.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),
  md:()=>import("./adapters/text.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),txt:()=>import("./adapters/text.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),py:()=>import("./adapters/text.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),
  js:()=>import("./adapters/text.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),mjs:()=>import("./adapters/text.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),ts:()=>import("./adapters/text.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),
  tsx:()=>import("./adapters/text.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),jsx:()=>import("./adapters/text.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),json:()=>import("./adapters/text.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),
  yaml:()=>import("./adapters/text.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),yml:()=>import("./adapters/text.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),c:()=>import("./adapters/text.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),
  cpp:()=>import("./adapters/text.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),h:()=>import("./adapters/text.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),hpp:()=>import("./adapters/text.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),
  cs:()=>import("./adapters/text.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146"),java:()=>import("./adapters/text.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
