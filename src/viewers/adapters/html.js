import {fetchText} from "../utils.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34";

export async function render(container,resource){
  const source=await fetchText(resource.path);
  const frame=document.createElement("iframe");
  frame.className="html-preview";
  frame.sandbox="allow-scripts";
  frame.referrerPolicy="no-referrer";
  frame.srcdoc=source;
  frame.title=resource.label || resource.name;
  container.replaceChildren(frame);
  return {info:"Sandboxed HTML preview"};
}
