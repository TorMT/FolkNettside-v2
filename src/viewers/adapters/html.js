import {fetchText} from "../utils.js?v=6ec3e4445933c12c117ae3d707ac899695076c42";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=6ec3e4445933c12c117ae3d707ac899695076c42";

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
