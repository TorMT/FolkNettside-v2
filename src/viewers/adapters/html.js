import {fetchText} from "../utils.js?v=65d0c8e0f081dce644939afd1aabe4959c83ab95";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=65d0c8e0f081dce644939afd1aabe4959c83ab95";

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
