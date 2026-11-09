import {fetchText} from "../utils.js?v=f3e9d7477bd1be20579a3bfdbde776e975209335";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=f3e9d7477bd1be20579a3bfdbde776e975209335";

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
