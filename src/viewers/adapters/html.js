import {fetchText} from "../utils.js?v=a0d404486e2d896610962ef4b7b1358be575feed";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=a0d404486e2d896610962ef4b7b1358be575feed";

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
