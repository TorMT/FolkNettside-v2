import {fetchText} from "../utils.js?v=1a342824a06722100c319b29d295e0300e9128ff";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=1a342824a06722100c319b29d295e0300e9128ff";

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
