import {extension} from "./utils.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),docx:()=>import("./adapters/office.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),xlsx:()=>import("./adapters/office.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),pptx:()=>import("./adapters/office.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),csv:()=>import("./adapters/csv.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),
  html:()=>import("./adapters/html.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),htm:()=>import("./adapters/html.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),
  ipynb:()=>import("./adapters/notebook.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),tex:()=>import("./adapters/latex.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),
  mp4:()=>import("./adapters/video.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),webm:()=>import("./adapters/video.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),mkv:()=>import("./adapters/video.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),
  stl:()=>import("./adapters/stl.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),"3mf":()=>import("./adapters/three-mf.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),
  md:()=>import("./adapters/text.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),txt:()=>import("./adapters/text.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),py:()=>import("./adapters/text.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),
  js:()=>import("./adapters/text.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),mjs:()=>import("./adapters/text.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),ts:()=>import("./adapters/text.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),
  tsx:()=>import("./adapters/text.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),jsx:()=>import("./adapters/text.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),json:()=>import("./adapters/text.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),
  yaml:()=>import("./adapters/text.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),yml:()=>import("./adapters/text.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),c:()=>import("./adapters/text.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),
  cpp:()=>import("./adapters/text.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),h:()=>import("./adapters/text.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),hpp:()=>import("./adapters/text.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),
  cs:()=>import("./adapters/text.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca"),java:()=>import("./adapters/text.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
