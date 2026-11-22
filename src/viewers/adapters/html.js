import {fetchText} from "../utils.js?v=906d934ae3aa2b43c5d1f5bdc0422e6b2240cd78";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=906d934ae3aa2b43c5d1f5bdc0422e6b2240cd78";

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
