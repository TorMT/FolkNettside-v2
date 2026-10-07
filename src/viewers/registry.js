import {extension} from "./utils.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),docx:()=>import("./adapters/office.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),xlsx:()=>import("./adapters/office.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),pptx:()=>import("./adapters/office.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),csv:()=>import("./adapters/csv.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),
  html:()=>import("./adapters/html.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),htm:()=>import("./adapters/html.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),
  ipynb:()=>import("./adapters/notebook.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),tex:()=>import("./adapters/latex.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),
  mp4:()=>import("./adapters/video.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),webm:()=>import("./adapters/video.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),mkv:()=>import("./adapters/video.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),
  stl:()=>import("./adapters/stl.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),"3mf":()=>import("./adapters/three-mf.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),
  md:()=>import("./adapters/text.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),txt:()=>import("./adapters/text.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),py:()=>import("./adapters/text.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),
  js:()=>import("./adapters/text.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),mjs:()=>import("./adapters/text.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),ts:()=>import("./adapters/text.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),
  tsx:()=>import("./adapters/text.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),jsx:()=>import("./adapters/text.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),json:()=>import("./adapters/text.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),
  yaml:()=>import("./adapters/text.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),yml:()=>import("./adapters/text.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),c:()=>import("./adapters/text.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),
  cpp:()=>import("./adapters/text.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),h:()=>import("./adapters/text.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),hpp:()=>import("./adapters/text.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),
  cs:()=>import("./adapters/text.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2"),java:()=>import("./adapters/text.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
