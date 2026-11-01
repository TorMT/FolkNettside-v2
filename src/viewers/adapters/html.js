import {fetchText} from "../utils.js?v=b69e3e03655a6accba2c4903d6e460c0a037e484";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=b69e3e03655a6accba2c4903d6e460c0a037e484";

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
