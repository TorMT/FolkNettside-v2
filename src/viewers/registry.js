import {extension} from "./utils.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),docx:()=>import("./adapters/office.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),xlsx:()=>import("./adapters/office.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),pptx:()=>import("./adapters/office.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),csv:()=>import("./adapters/csv.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),
  html:()=>import("./adapters/html.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),htm:()=>import("./adapters/html.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),
  ipynb:()=>import("./adapters/notebook.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),tex:()=>import("./adapters/latex.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),
  mp4:()=>import("./adapters/video.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),webm:()=>import("./adapters/video.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),mkv:()=>import("./adapters/video.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),
  stl:()=>import("./adapters/stl.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),"3mf":()=>import("./adapters/three-mf.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),
  md:()=>import("./adapters/text.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),txt:()=>import("./adapters/text.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),py:()=>import("./adapters/text.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),
  js:()=>import("./adapters/text.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),mjs:()=>import("./adapters/text.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),ts:()=>import("./adapters/text.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),
  tsx:()=>import("./adapters/text.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),jsx:()=>import("./adapters/text.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),json:()=>import("./adapters/text.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),
  yaml:()=>import("./adapters/text.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),yml:()=>import("./adapters/text.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),c:()=>import("./adapters/text.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),
  cpp:()=>import("./adapters/text.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),h:()=>import("./adapters/text.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),hpp:()=>import("./adapters/text.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),
  cs:()=>import("./adapters/text.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653"),java:()=>import("./adapters/text.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
