import {extension} from "./utils.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),docx:()=>import("./adapters/office.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),xlsx:()=>import("./adapters/office.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),pptx:()=>import("./adapters/office.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),csv:()=>import("./adapters/csv.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),
  html:()=>import("./adapters/html.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),htm:()=>import("./adapters/html.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),
  ipynb:()=>import("./adapters/notebook.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),tex:()=>import("./adapters/latex.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),
  mp4:()=>import("./adapters/video.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),webm:()=>import("./adapters/video.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),mkv:()=>import("./adapters/video.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),
  stl:()=>import("./adapters/stl.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),"3mf":()=>import("./adapters/three-mf.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),
  md:()=>import("./adapters/text.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),txt:()=>import("./adapters/text.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),py:()=>import("./adapters/text.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),
  js:()=>import("./adapters/text.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),mjs:()=>import("./adapters/text.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),ts:()=>import("./adapters/text.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),
  tsx:()=>import("./adapters/text.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),jsx:()=>import("./adapters/text.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),json:()=>import("./adapters/text.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),
  yaml:()=>import("./adapters/text.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),yml:()=>import("./adapters/text.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),c:()=>import("./adapters/text.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),
  cpp:()=>import("./adapters/text.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),h:()=>import("./adapters/text.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),hpp:()=>import("./adapters/text.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),
  cs:()=>import("./adapters/text.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8"),java:()=>import("./adapters/text.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
