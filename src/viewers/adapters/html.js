import {fetchText} from "../utils.js?v=76e1eaf009bc8ca0dcb60309b8eabc8000ff62e8";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=76e1eaf009bc8ca0dcb60309b8eabc8000ff62e8";

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
