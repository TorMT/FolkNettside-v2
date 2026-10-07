import {extension} from "./utils.js?v=380e9d0432f71953908a58630b8159100e439b22";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=380e9d0432f71953908a58630b8159100e439b22"),docx:()=>import("./adapters/office.js?v=380e9d0432f71953908a58630b8159100e439b22"),xlsx:()=>import("./adapters/office.js?v=380e9d0432f71953908a58630b8159100e439b22"),pptx:()=>import("./adapters/office.js?v=380e9d0432f71953908a58630b8159100e439b22"),csv:()=>import("./adapters/csv.js?v=380e9d0432f71953908a58630b8159100e439b22"),
  html:()=>import("./adapters/html.js?v=380e9d0432f71953908a58630b8159100e439b22"),htm:()=>import("./adapters/html.js?v=380e9d0432f71953908a58630b8159100e439b22"),
  ipynb:()=>import("./adapters/notebook.js?v=380e9d0432f71953908a58630b8159100e439b22"),tex:()=>import("./adapters/latex.js?v=380e9d0432f71953908a58630b8159100e439b22"),
  mp4:()=>import("./adapters/video.js?v=380e9d0432f71953908a58630b8159100e439b22"),webm:()=>import("./adapters/video.js?v=380e9d0432f71953908a58630b8159100e439b22"),mkv:()=>import("./adapters/video.js?v=380e9d0432f71953908a58630b8159100e439b22"),
  stl:()=>import("./adapters/stl.js?v=380e9d0432f71953908a58630b8159100e439b22"),"3mf":()=>import("./adapters/three-mf.js?v=380e9d0432f71953908a58630b8159100e439b22"),
  md:()=>import("./adapters/text.js?v=380e9d0432f71953908a58630b8159100e439b22"),txt:()=>import("./adapters/text.js?v=380e9d0432f71953908a58630b8159100e439b22"),py:()=>import("./adapters/text.js?v=380e9d0432f71953908a58630b8159100e439b22"),
  js:()=>import("./adapters/text.js?v=380e9d0432f71953908a58630b8159100e439b22"),mjs:()=>import("./adapters/text.js?v=380e9d0432f71953908a58630b8159100e439b22"),ts:()=>import("./adapters/text.js?v=380e9d0432f71953908a58630b8159100e439b22"),
  tsx:()=>import("./adapters/text.js?v=380e9d0432f71953908a58630b8159100e439b22"),jsx:()=>import("./adapters/text.js?v=380e9d0432f71953908a58630b8159100e439b22"),json:()=>import("./adapters/text.js?v=380e9d0432f71953908a58630b8159100e439b22"),
  yaml:()=>import("./adapters/text.js?v=380e9d0432f71953908a58630b8159100e439b22"),yml:()=>import("./adapters/text.js?v=380e9d0432f71953908a58630b8159100e439b22"),c:()=>import("./adapters/text.js?v=380e9d0432f71953908a58630b8159100e439b22"),
  cpp:()=>import("./adapters/text.js?v=380e9d0432f71953908a58630b8159100e439b22"),h:()=>import("./adapters/text.js?v=380e9d0432f71953908a58630b8159100e439b22"),hpp:()=>import("./adapters/text.js?v=380e9d0432f71953908a58630b8159100e439b22"),
  cs:()=>import("./adapters/text.js?v=380e9d0432f71953908a58630b8159100e439b22"),java:()=>import("./adapters/text.js?v=380e9d0432f71953908a58630b8159100e439b22")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=380e9d0432f71953908a58630b8159100e439b22");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=380e9d0432f71953908a58630b8159100e439b22");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
