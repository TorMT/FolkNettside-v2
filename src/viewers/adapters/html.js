import {fetchText} from "../utils.js?v=bed53df858f7f2543ac5f9591a597aa63742a8c5";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=bed53df858f7f2543ac5f9591a597aa63742a8c5";

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
