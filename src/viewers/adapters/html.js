import {fetchText} from "../utils.js?v=f6a6bcca8acf93bfdac3ac0f44c76dc5b3795187";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=f6a6bcca8acf93bfdac3ac0f44c76dc5b3795187";

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
