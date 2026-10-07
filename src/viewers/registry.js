import {extension} from "./utils.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),docx:()=>import("./adapters/office.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),xlsx:()=>import("./adapters/office.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),pptx:()=>import("./adapters/office.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),csv:()=>import("./adapters/csv.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),
  html:()=>import("./adapters/html.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),htm:()=>import("./adapters/html.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),
  ipynb:()=>import("./adapters/notebook.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),tex:()=>import("./adapters/latex.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),
  mp4:()=>import("./adapters/video.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),webm:()=>import("./adapters/video.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),mkv:()=>import("./adapters/video.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),
  stl:()=>import("./adapters/stl.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),"3mf":()=>import("./adapters/three-mf.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),
  md:()=>import("./adapters/text.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),txt:()=>import("./adapters/text.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),py:()=>import("./adapters/text.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),
  js:()=>import("./adapters/text.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),mjs:()=>import("./adapters/text.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),ts:()=>import("./adapters/text.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),
  tsx:()=>import("./adapters/text.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),jsx:()=>import("./adapters/text.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),json:()=>import("./adapters/text.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),
  yaml:()=>import("./adapters/text.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),yml:()=>import("./adapters/text.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),c:()=>import("./adapters/text.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),
  cpp:()=>import("./adapters/text.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),h:()=>import("./adapters/text.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),hpp:()=>import("./adapters/text.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),
  cs:()=>import("./adapters/text.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b"),java:()=>import("./adapters/text.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
