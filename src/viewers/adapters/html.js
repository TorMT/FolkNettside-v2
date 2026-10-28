import {fetchText} from "../utils.js?v=ff65360f8997e54d67031643faf6320badda39f8";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=ff65360f8997e54d67031643faf6320badda39f8";

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
