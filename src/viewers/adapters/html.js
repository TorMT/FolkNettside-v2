import {fetchText} from "../utils.js?v=ac814c72d15c6b6265a1c02b43bc1ac19d96fe4c";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=ac814c72d15c6b6265a1c02b43bc1ac19d96fe4c";

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
