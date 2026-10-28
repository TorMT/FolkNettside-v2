import {fetchText} from "../utils.js?v=2e69355dfff68f7b24a4f8ed038f05081cb69e43";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=2e69355dfff68f7b24a4f8ed038f05081cb69e43";

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
