import {fetchText} from "../utils.js?v=36f07c61157411137f4a79e6379500223e5fc1ce";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=36f07c61157411137f4a79e6379500223e5fc1ce";

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
