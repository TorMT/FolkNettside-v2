import {fetchText} from "../utils.js?v=dc1aefbf071039cc2cfd0dd72d5132f0a74dbc3f";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=dc1aefbf071039cc2cfd0dd72d5132f0a74dbc3f";

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
