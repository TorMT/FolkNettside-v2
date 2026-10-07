import {fetchText} from "../utils.js?v=7ad2c067446e996584637c569ccd95576101aea7";

export async function render(container,resource){
  const source=await fetchText(resource.path);
  const frame=document.createElement("iframe");
  frame.className="html-preview";
  frame.sandbox="allow-scripts";
  frame.referrerPolicy="no-referrer";
  frame.srcdoc=source;
  frame.title=resource.label || resource.name;
  container.replaceChildren(frame);
  return {info:"Sandboxed HTML preview"};
}
