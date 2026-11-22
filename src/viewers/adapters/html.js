import {fetchText} from "../utils.js?v=d740b77b80b6a8023d9528c3e6395f02f722d911";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=d740b77b80b6a8023d9528c3e6395f02f722d911";

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
