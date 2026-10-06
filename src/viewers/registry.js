import {extension} from "./utils.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),docx:()=>import("./adapters/office.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),xlsx:()=>import("./adapters/office.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),pptx:()=>import("./adapters/office.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),csv:()=>import("./adapters/csv.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),
  html:()=>import("./adapters/html.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),htm:()=>import("./adapters/html.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),
  ipynb:()=>import("./adapters/notebook.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),tex:()=>import("./adapters/latex.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),
  mp4:()=>import("./adapters/video.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),webm:()=>import("./adapters/video.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),mkv:()=>import("./adapters/video.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),
  stl:()=>import("./adapters/stl.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),"3mf":()=>import("./adapters/three-mf.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),
  md:()=>import("./adapters/text.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),txt:()=>import("./adapters/text.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),py:()=>import("./adapters/text.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),
  js:()=>import("./adapters/text.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),mjs:()=>import("./adapters/text.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),ts:()=>import("./adapters/text.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),
  tsx:()=>import("./adapters/text.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),jsx:()=>import("./adapters/text.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),json:()=>import("./adapters/text.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),
  yaml:()=>import("./adapters/text.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),yml:()=>import("./adapters/text.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),c:()=>import("./adapters/text.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),
  cpp:()=>import("./adapters/text.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),h:()=>import("./adapters/text.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),hpp:()=>import("./adapters/text.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),
  cs:()=>import("./adapters/text.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6"),java:()=>import("./adapters/text.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
