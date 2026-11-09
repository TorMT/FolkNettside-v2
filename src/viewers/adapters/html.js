import {fetchText} from "../utils.js?v=f184f9a61104f9a9f1796528e12d901dd70fec6b";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=f184f9a61104f9a9f1796528e12d901dd70fec6b";

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
