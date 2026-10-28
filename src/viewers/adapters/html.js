import {fetchText} from "../utils.js?v=bc90dd63b57e70aa4a0538d08e077afedd120ff4";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=bc90dd63b57e70aa4a0538d08e077afedd120ff4";

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
