import {fetchText} from "../utils.js?v=8e0c15571814ec770413057e733c1fddcf4e4d02";

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
