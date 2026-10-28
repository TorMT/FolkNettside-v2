import {fetchText} from "../utils.js?v=378e192972d27ddaafe3f143f6db13b0a140e4c5";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=378e192972d27ddaafe3f143f6db13b0a140e4c5";

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
