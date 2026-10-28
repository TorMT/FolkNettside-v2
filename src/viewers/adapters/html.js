import {fetchText} from "../utils.js?v=ccc1ecac0233715636ff562a37129782179e56e9";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=ccc1ecac0233715636ff562a37129782179e56e9";

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
