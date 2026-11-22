import {fetchText} from "../utils.js?v=2b353cf6da72a1d7cc61c3bad70605b408844964";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=2b353cf6da72a1d7cc61c3bad70605b408844964";

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
