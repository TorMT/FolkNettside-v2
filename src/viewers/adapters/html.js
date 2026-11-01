import {fetchText} from "../utils.js?v=71b3ca353c744cd3b6167899f0c6c190d53e8df1";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=71b3ca353c744cd3b6167899f0c6c190d53e8df1";

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
