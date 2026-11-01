import {fetchText} from "../utils.js?v=b7eb79d0ed4c054d239cf37dbe91fb119947a507";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=b7eb79d0ed4c054d239cf37dbe91fb119947a507";

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
