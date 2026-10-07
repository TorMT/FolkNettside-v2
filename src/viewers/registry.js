import {extension} from "./utils.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),docx:()=>import("./adapters/office.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),xlsx:()=>import("./adapters/office.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),pptx:()=>import("./adapters/office.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),csv:()=>import("./adapters/csv.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),
  html:()=>import("./adapters/html.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),htm:()=>import("./adapters/html.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),
  ipynb:()=>import("./adapters/notebook.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),tex:()=>import("./adapters/latex.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),
  mp4:()=>import("./adapters/video.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),webm:()=>import("./adapters/video.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),mkv:()=>import("./adapters/video.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),
  stl:()=>import("./adapters/stl.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),"3mf":()=>import("./adapters/three-mf.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),
  md:()=>import("./adapters/text.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),txt:()=>import("./adapters/text.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),py:()=>import("./adapters/text.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),
  js:()=>import("./adapters/text.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),mjs:()=>import("./adapters/text.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),ts:()=>import("./adapters/text.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),
  tsx:()=>import("./adapters/text.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),jsx:()=>import("./adapters/text.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),json:()=>import("./adapters/text.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),
  yaml:()=>import("./adapters/text.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),yml:()=>import("./adapters/text.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),c:()=>import("./adapters/text.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),
  cpp:()=>import("./adapters/text.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),h:()=>import("./adapters/text.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),hpp:()=>import("./adapters/text.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),
  cs:()=>import("./adapters/text.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978"),java:()=>import("./adapters/text.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
