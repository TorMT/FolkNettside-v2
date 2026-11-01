import {fetchText} from "../utils.js?v=469b5cda80fe77c01ec0885ac97a54188e276d5f";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=469b5cda80fe77c01ec0885ac97a54188e276d5f";

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
