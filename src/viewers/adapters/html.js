import {fetchText} from "../utils.js?v=ea9e4b4a294a186aa2045fac4e863491e23720f5";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=ea9e4b4a294a186aa2045fac4e863491e23720f5";

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
