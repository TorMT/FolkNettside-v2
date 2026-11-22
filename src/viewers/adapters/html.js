import {fetchText} from "../utils.js?v=006c7e6f7dcf9ff7d3ec52dcb41c83a07f2c2766";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=006c7e6f7dcf9ff7d3ec52dcb41c83a07f2c2766";

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
