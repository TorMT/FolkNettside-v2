import {fetchText} from "../utils.js?v=31699fd9504dcf90e03825d504eed380d00e1645";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=31699fd9504dcf90e03825d504eed380d00e1645";

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
