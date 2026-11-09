import {fetchText} from "../utils.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
import {publicCodePreviewURL} from "../ntnu-public-code.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";

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
