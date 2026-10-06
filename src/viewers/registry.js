import {extension} from "./utils.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),docx:()=>import("./adapters/office.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),xlsx:()=>import("./adapters/office.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),pptx:()=>import("./adapters/office.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),csv:()=>import("./adapters/csv.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),
  html:()=>import("./adapters/html.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),htm:()=>import("./adapters/html.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),
  ipynb:()=>import("./adapters/notebook.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),tex:()=>import("./adapters/latex.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),
  mp4:()=>import("./adapters/video.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),webm:()=>import("./adapters/video.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),mkv:()=>import("./adapters/video.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),
  stl:()=>import("./adapters/stl.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),"3mf":()=>import("./adapters/three-mf.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),
  md:()=>import("./adapters/text.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),txt:()=>import("./adapters/text.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),py:()=>import("./adapters/text.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),
  js:()=>import("./adapters/text.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),mjs:()=>import("./adapters/text.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),ts:()=>import("./adapters/text.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),
  tsx:()=>import("./adapters/text.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),jsx:()=>import("./adapters/text.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),json:()=>import("./adapters/text.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),
  yaml:()=>import("./adapters/text.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),yml:()=>import("./adapters/text.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),c:()=>import("./adapters/text.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),
  cpp:()=>import("./adapters/text.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),h:()=>import("./adapters/text.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),hpp:()=>import("./adapters/text.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),
  cs:()=>import("./adapters/text.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1"),java:()=>import("./adapters/text.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1")
};
export async function loadAdapter(resource){
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
