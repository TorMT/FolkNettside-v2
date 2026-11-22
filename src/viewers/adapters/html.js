import {fetchText} from "../utils.js?v=625ab66ed8a7b04f32af5781dabc49ae5abfedc6";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=625ab66ed8a7b04f32af5781dabc49ae5abfedc6";

export async function render(container,resource){
  const source=await fetchText(publicCodePreviewURL(resource));
  const frame=document.createElement("iframe");
  frame.className="html-preview";
  frame.sandbox="allow-scripts";
  frame.referrerPolicy="no-referrer";
  frame.srcdoc=source;
  frame.title=resource.label || resource.name;
  container.replaceChildren(frame);
  return {info:"Sandboxed HTML preview"};
}
