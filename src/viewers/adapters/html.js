import {fetchText} from "../utils.js?v=06a87a720a94d806809ac49f022413be5bc79968";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=06a87a720a94d806809ac49f022413be5bc79968";

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
