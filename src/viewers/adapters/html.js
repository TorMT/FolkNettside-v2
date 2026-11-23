import {fetchText} from "../utils.js?v=e6965e51fc31049b66b431e203a66c2d95ac1cab";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=e6965e51fc31049b66b431e203a66c2d95ac1cab";

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
