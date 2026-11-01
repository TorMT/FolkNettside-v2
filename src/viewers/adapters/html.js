import {fetchText} from "../utils.js?v=ebe616383fa17ea6407d55139d89705508f6d741";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=ebe616383fa17ea6407d55139d89705508f6d741";

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
