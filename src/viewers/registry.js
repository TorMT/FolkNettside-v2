import {extension} from "./utils.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),docx:()=>import("./adapters/office.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),xlsx:()=>import("./adapters/office.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),pptx:()=>import("./adapters/office.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),csv:()=>import("./adapters/csv.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),
  html:()=>import("./adapters/html.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),htm:()=>import("./adapters/html.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),
  ipynb:()=>import("./adapters/notebook.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),tex:()=>import("./adapters/latex.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),
  mp4:()=>import("./adapters/video.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),webm:()=>import("./adapters/video.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),mkv:()=>import("./adapters/video.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),
  stl:()=>import("./adapters/stl.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),"3mf":()=>import("./adapters/three-mf.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),
  md:()=>import("./adapters/text.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),txt:()=>import("./adapters/text.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),py:()=>import("./adapters/text.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),
  js:()=>import("./adapters/text.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),mjs:()=>import("./adapters/text.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),ts:()=>import("./adapters/text.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),
  tsx:()=>import("./adapters/text.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),jsx:()=>import("./adapters/text.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),json:()=>import("./adapters/text.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),
  yaml:()=>import("./adapters/text.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),yml:()=>import("./adapters/text.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),c:()=>import("./adapters/text.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),
  cpp:()=>import("./adapters/text.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),h:()=>import("./adapters/text.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),hpp:()=>import("./adapters/text.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),
  cs:()=>import("./adapters/text.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a"),java:()=>import("./adapters/text.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=25ea58eb7b3959c7e12a95b55ea60dc1c08b591a");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
