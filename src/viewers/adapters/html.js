import {fetchText} from "../utils.js?v=17424844b3d92523b8b57661368abfd83bf5b431";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=17424844b3d92523b8b57661368abfd83bf5b431";

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
