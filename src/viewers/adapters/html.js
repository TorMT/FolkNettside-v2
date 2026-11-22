import {fetchText} from "../utils.js?v=0d23b69ef67722f06c8123b1f7c857375f4358b4";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=0d23b69ef67722f06c8123b1f7c857375f4358b4";

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
