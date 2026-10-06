import {extension} from "./utils.js?v=e39b98077eed11779471c81b49cce38b5350d256";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=e39b98077eed11779471c81b49cce38b5350d256"),docx:()=>import("./adapters/office.js?v=e39b98077eed11779471c81b49cce38b5350d256"),xlsx:()=>import("./adapters/office.js?v=e39b98077eed11779471c81b49cce38b5350d256"),pptx:()=>import("./adapters/office.js?v=e39b98077eed11779471c81b49cce38b5350d256"),csv:()=>import("./adapters/csv.js?v=e39b98077eed11779471c81b49cce38b5350d256"),
  html:()=>import("./adapters/html.js?v=e39b98077eed11779471c81b49cce38b5350d256"),htm:()=>import("./adapters/html.js?v=e39b98077eed11779471c81b49cce38b5350d256"),
  ipynb:()=>import("./adapters/notebook.js?v=e39b98077eed11779471c81b49cce38b5350d256"),tex:()=>import("./adapters/latex.js?v=e39b98077eed11779471c81b49cce38b5350d256"),
  mp4:()=>import("./adapters/video.js?v=e39b98077eed11779471c81b49cce38b5350d256"),webm:()=>import("./adapters/video.js?v=e39b98077eed11779471c81b49cce38b5350d256"),mkv:()=>import("./adapters/video.js?v=e39b98077eed11779471c81b49cce38b5350d256"),
  stl:()=>import("./adapters/stl.js?v=e39b98077eed11779471c81b49cce38b5350d256"),"3mf":()=>import("./adapters/three-mf.js?v=e39b98077eed11779471c81b49cce38b5350d256"),
  md:()=>import("./adapters/text.js?v=e39b98077eed11779471c81b49cce38b5350d256"),txt:()=>import("./adapters/text.js?v=e39b98077eed11779471c81b49cce38b5350d256"),py:()=>import("./adapters/text.js?v=e39b98077eed11779471c81b49cce38b5350d256"),
  js:()=>import("./adapters/text.js?v=e39b98077eed11779471c81b49cce38b5350d256"),mjs:()=>import("./adapters/text.js?v=e39b98077eed11779471c81b49cce38b5350d256"),ts:()=>import("./adapters/text.js?v=e39b98077eed11779471c81b49cce38b5350d256"),
  tsx:()=>import("./adapters/text.js?v=e39b98077eed11779471c81b49cce38b5350d256"),jsx:()=>import("./adapters/text.js?v=e39b98077eed11779471c81b49cce38b5350d256"),json:()=>import("./adapters/text.js?v=e39b98077eed11779471c81b49cce38b5350d256"),
  yaml:()=>import("./adapters/text.js?v=e39b98077eed11779471c81b49cce38b5350d256"),yml:()=>import("./adapters/text.js?v=e39b98077eed11779471c81b49cce38b5350d256"),c:()=>import("./adapters/text.js?v=e39b98077eed11779471c81b49cce38b5350d256"),
  cpp:()=>import("./adapters/text.js?v=e39b98077eed11779471c81b49cce38b5350d256"),h:()=>import("./adapters/text.js?v=e39b98077eed11779471c81b49cce38b5350d256"),hpp:()=>import("./adapters/text.js?v=e39b98077eed11779471c81b49cce38b5350d256"),
  cs:()=>import("./adapters/text.js?v=e39b98077eed11779471c81b49cce38b5350d256"),java:()=>import("./adapters/text.js?v=e39b98077eed11779471c81b49cce38b5350d256")
};
export async function loadAdapter(resource){
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=e39b98077eed11779471c81b49cce38b5350d256");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
