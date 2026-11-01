import {fetchText} from "../utils.js?v=629edfb958bddabdc52f1005397529a1901ff610";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=629edfb958bddabdc52f1005397529a1901ff610";

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
