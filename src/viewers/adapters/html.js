import {fetchText} from "../utils.js?v=00b50d48be5befc84b237bb477aea9f35b9fe3ba";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=00b50d48be5befc84b237bb477aea9f35b9fe3ba";

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
