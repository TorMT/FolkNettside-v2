import {fetchText} from "../utils.js?v=20c62fd1f2072e677ffaeec8435ff766e7624aed";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=20c62fd1f2072e677ffaeec8435ff766e7624aed";

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
