import {extension} from "./utils.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),docx:()=>import("./adapters/office.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),xlsx:()=>import("./adapters/office.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),pptx:()=>import("./adapters/office.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),csv:()=>import("./adapters/csv.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),
  html:()=>import("./adapters/html.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),htm:()=>import("./adapters/html.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),
  ipynb:()=>import("./adapters/notebook.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),tex:()=>import("./adapters/latex.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),
  mp4:()=>import("./adapters/video.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),webm:()=>import("./adapters/video.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),mkv:()=>import("./adapters/video.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),
  stl:()=>import("./adapters/stl.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),"3mf":()=>import("./adapters/three-mf.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),
  md:()=>import("./adapters/text.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),txt:()=>import("./adapters/text.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),py:()=>import("./adapters/text.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),
  js:()=>import("./adapters/text.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),mjs:()=>import("./adapters/text.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),ts:()=>import("./adapters/text.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),
  tsx:()=>import("./adapters/text.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),jsx:()=>import("./adapters/text.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),json:()=>import("./adapters/text.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),
  yaml:()=>import("./adapters/text.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),yml:()=>import("./adapters/text.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),c:()=>import("./adapters/text.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),
  cpp:()=>import("./adapters/text.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),h:()=>import("./adapters/text.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),hpp:()=>import("./adapters/text.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),
  cs:()=>import("./adapters/text.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4"),java:()=>import("./adapters/text.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4")
};
export async function loadAdapter(resource){
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
