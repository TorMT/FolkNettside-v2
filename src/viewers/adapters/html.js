import {fetchText} from "../utils.js?v=9803e61e702b8eb17b52157c4df7d7fc1bf6bcb4";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=9803e61e702b8eb17b52157c4df7d7fc1bf6bcb4";

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
