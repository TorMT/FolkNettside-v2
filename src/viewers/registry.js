import {extension} from "./utils.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),docx:()=>import("./adapters/office.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),xlsx:()=>import("./adapters/office.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),pptx:()=>import("./adapters/office.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),csv:()=>import("./adapters/csv.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),
  html:()=>import("./adapters/html.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),htm:()=>import("./adapters/html.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),
  ipynb:()=>import("./adapters/notebook.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),tex:()=>import("./adapters/latex.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),
  mp4:()=>import("./adapters/video.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),webm:()=>import("./adapters/video.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),mkv:()=>import("./adapters/video.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),
  stl:()=>import("./adapters/stl.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),"3mf":()=>import("./adapters/three-mf.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),
  md:()=>import("./adapters/text.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),txt:()=>import("./adapters/text.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),py:()=>import("./adapters/text.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),
  js:()=>import("./adapters/text.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),mjs:()=>import("./adapters/text.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),ts:()=>import("./adapters/text.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),
  tsx:()=>import("./adapters/text.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),jsx:()=>import("./adapters/text.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),json:()=>import("./adapters/text.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),
  yaml:()=>import("./adapters/text.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),yml:()=>import("./adapters/text.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),c:()=>import("./adapters/text.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),
  cpp:()=>import("./adapters/text.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),h:()=>import("./adapters/text.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),hpp:()=>import("./adapters/text.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),
  cs:()=>import("./adapters/text.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419"),java:()=>import("./adapters/text.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
