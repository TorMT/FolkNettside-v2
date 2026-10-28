import {fetchText} from "../utils.js?v=af205f8fa5f9c95418543446d58c9f0db93f34d9";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=af205f8fa5f9c95418543446d58c9f0db93f34d9";

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
