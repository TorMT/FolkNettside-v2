import {extension} from "./utils.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),docx:()=>import("./adapters/office.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),xlsx:()=>import("./adapters/office.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),pptx:()=>import("./adapters/office.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),csv:()=>import("./adapters/csv.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),
  html:()=>import("./adapters/html.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),htm:()=>import("./adapters/html.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),
  ipynb:()=>import("./adapters/notebook.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),tex:()=>import("./adapters/latex.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),
  mp4:()=>import("./adapters/video.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),webm:()=>import("./adapters/video.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),mkv:()=>import("./adapters/video.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),
  stl:()=>import("./adapters/stl.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),"3mf":()=>import("./adapters/three-mf.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),
  md:()=>import("./adapters/text.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),txt:()=>import("./adapters/text.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),py:()=>import("./adapters/text.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),
  js:()=>import("./adapters/text.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),mjs:()=>import("./adapters/text.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),ts:()=>import("./adapters/text.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),
  tsx:()=>import("./adapters/text.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),jsx:()=>import("./adapters/text.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),json:()=>import("./adapters/text.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),
  yaml:()=>import("./adapters/text.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),yml:()=>import("./adapters/text.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),c:()=>import("./adapters/text.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),
  cpp:()=>import("./adapters/text.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),h:()=>import("./adapters/text.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),hpp:()=>import("./adapters/text.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),
  cs:()=>import("./adapters/text.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e"),java:()=>import("./adapters/text.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
