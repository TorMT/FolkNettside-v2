import {fetchText} from "../utils.js?v=f8575958a8ef908f0b771b6c240fe7bfc8496f34";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=f8575958a8ef908f0b771b6c240fe7bfc8496f34";

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
