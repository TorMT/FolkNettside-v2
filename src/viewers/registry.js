import {extension} from "./utils.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),docx:()=>import("./adapters/office.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),xlsx:()=>import("./adapters/office.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),pptx:()=>import("./adapters/office.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),csv:()=>import("./adapters/csv.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),
  html:()=>import("./adapters/html.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),htm:()=>import("./adapters/html.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),
  ipynb:()=>import("./adapters/notebook.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),tex:()=>import("./adapters/latex.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),
  mp4:()=>import("./adapters/video.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),webm:()=>import("./adapters/video.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),mkv:()=>import("./adapters/video.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),
  stl:()=>import("./adapters/stl.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),"3mf":()=>import("./adapters/three-mf.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),
  md:()=>import("./adapters/text.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),txt:()=>import("./adapters/text.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),py:()=>import("./adapters/text.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),
  js:()=>import("./adapters/text.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),mjs:()=>import("./adapters/text.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),ts:()=>import("./adapters/text.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),
  tsx:()=>import("./adapters/text.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),jsx:()=>import("./adapters/text.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),json:()=>import("./adapters/text.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),
  yaml:()=>import("./adapters/text.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),yml:()=>import("./adapters/text.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),c:()=>import("./adapters/text.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),
  cpp:()=>import("./adapters/text.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),h:()=>import("./adapters/text.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),hpp:()=>import("./adapters/text.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),
  cs:()=>import("./adapters/text.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a"),java:()=>import("./adapters/text.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
