import {fetchText} from "../utils.js?v=bce4c24ff48c46da2eb08d66dbf794d8ff46c161";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=bce4c24ff48c46da2eb08d66dbf794d8ff46c161";

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
