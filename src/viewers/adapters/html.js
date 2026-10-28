import {fetchText} from "../utils.js?v=32de25f0c97c7dd494338dbc4a4ac2bb35c11c7a";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=32de25f0c97c7dd494338dbc4a4ac2bb35c11c7a";

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
