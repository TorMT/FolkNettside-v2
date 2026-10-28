import {fetchText} from "../utils.js?v=0fb0917ee01b583ac866336e4511d0378e051b76";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=0fb0917ee01b583ac866336e4511d0378e051b76";

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
