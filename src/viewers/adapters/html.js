import {fetchText} from "../utils.js?v=b5862f49d322160eb24a824b8eca0a7461a30e26";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=b5862f49d322160eb24a824b8eca0a7461a30e26";

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
