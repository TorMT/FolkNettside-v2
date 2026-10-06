import {fetchText} from "../utils.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe";

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
