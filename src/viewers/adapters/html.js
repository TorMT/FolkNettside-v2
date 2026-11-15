import {fetchText} from "../utils.js?v=7ed855647cd6e9cf86c889a9855aae891c4a2029";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=7ed855647cd6e9cf86c889a9855aae891c4a2029";

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
