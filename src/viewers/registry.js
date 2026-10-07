import {extension} from "./utils.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),docx:()=>import("./adapters/office.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),xlsx:()=>import("./adapters/office.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),pptx:()=>import("./adapters/office.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),csv:()=>import("./adapters/csv.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),
  html:()=>import("./adapters/html.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),htm:()=>import("./adapters/html.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),
  ipynb:()=>import("./adapters/notebook.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),tex:()=>import("./adapters/latex.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),
  mp4:()=>import("./adapters/video.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),webm:()=>import("./adapters/video.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),mkv:()=>import("./adapters/video.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),
  stl:()=>import("./adapters/stl.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),"3mf":()=>import("./adapters/three-mf.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),
  md:()=>import("./adapters/text.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),txt:()=>import("./adapters/text.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),py:()=>import("./adapters/text.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),
  js:()=>import("./adapters/text.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),mjs:()=>import("./adapters/text.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),ts:()=>import("./adapters/text.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),
  tsx:()=>import("./adapters/text.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),jsx:()=>import("./adapters/text.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),json:()=>import("./adapters/text.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),
  yaml:()=>import("./adapters/text.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),yml:()=>import("./adapters/text.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),c:()=>import("./adapters/text.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),
  cpp:()=>import("./adapters/text.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),h:()=>import("./adapters/text.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),hpp:()=>import("./adapters/text.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),
  cs:()=>import("./adapters/text.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735"),java:()=>import("./adapters/text.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
