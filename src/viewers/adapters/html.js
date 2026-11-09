import {fetchText} from "../utils.js?v=59759b72209ea5f70352282e4d1ca742cf6d2efe";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=59759b72209ea5f70352282e4d1ca742cf6d2efe";

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
