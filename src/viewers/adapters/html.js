import {fetchText} from "../utils.js?v=7aed4fe16527d7b166739c37de3aa7c273d4d5b7";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=7aed4fe16527d7b166739c37de3aa7c273d4d5b7";

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
