import {fetchText} from "../utils.js?v=62932505e0a98b797eaaa5840646cc0fc7ae8a1a";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=62932505e0a98b797eaaa5840646cc0fc7ae8a1a";

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
