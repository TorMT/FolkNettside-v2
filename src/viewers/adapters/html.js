import {fetchText} from "../utils.js?v=7074fbd28c67a3039d4b7261a367e0ea552508b2";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=7074fbd28c67a3039d4b7261a367e0ea552508b2";

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
