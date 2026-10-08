import {fetchText} from "../utils.js?v=a435f153ef7e9408be42556149dd61c3928ec506";

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
