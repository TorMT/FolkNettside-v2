import {fetchText} from "../utils.js?v=ff51b5daa35664ca28a23c24f1a3361797476be3";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=ff51b5daa35664ca28a23c24f1a3361797476be3";

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
