import {fetchText} from "../utils.js?v=96a91e1cce3fad30597988715d86bdab2e452e9e";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=96a91e1cce3fad30597988715d86bdab2e452e9e";

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
