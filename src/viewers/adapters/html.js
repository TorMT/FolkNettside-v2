import {fetchText} from "../utils.js?v=ba1fa47143fb4e2535ce35d37c43fe037e897fcf";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=ba1fa47143fb4e2535ce35d37c43fe037e897fcf";

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
