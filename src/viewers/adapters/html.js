import {fetchText} from "../utils.js?v=d97324820154988db8a9dbe762b2f04ca65b6ad9";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=d97324820154988db8a9dbe762b2f04ca65b6ad9";

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
