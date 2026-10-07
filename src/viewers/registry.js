import {extension} from "./utils.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),docx:()=>import("./adapters/office.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),xlsx:()=>import("./adapters/office.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),pptx:()=>import("./adapters/office.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),csv:()=>import("./adapters/csv.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),
  html:()=>import("./adapters/html.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),htm:()=>import("./adapters/html.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),
  ipynb:()=>import("./adapters/notebook.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),tex:()=>import("./adapters/latex.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),
  mp4:()=>import("./adapters/video.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),webm:()=>import("./adapters/video.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),mkv:()=>import("./adapters/video.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),
  stl:()=>import("./adapters/stl.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),"3mf":()=>import("./adapters/three-mf.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),
  md:()=>import("./adapters/text.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),txt:()=>import("./adapters/text.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),py:()=>import("./adapters/text.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),
  js:()=>import("./adapters/text.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),mjs:()=>import("./adapters/text.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),ts:()=>import("./adapters/text.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),
  tsx:()=>import("./adapters/text.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),jsx:()=>import("./adapters/text.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),json:()=>import("./adapters/text.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),
  yaml:()=>import("./adapters/text.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),yml:()=>import("./adapters/text.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),c:()=>import("./adapters/text.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),
  cpp:()=>import("./adapters/text.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),h:()=>import("./adapters/text.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),hpp:()=>import("./adapters/text.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),
  cs:()=>import("./adapters/text.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334"),java:()=>import("./adapters/text.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
