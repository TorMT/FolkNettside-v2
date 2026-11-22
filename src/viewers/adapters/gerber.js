import {mountGerberViewer} from "../../engineering/gerber-viewer.js";
import {fetchBoundedBuffer,previewContentURL} from "../utils.js";
// Single Gerber or Excellon file from the library: shown in the Gerber viewer (layer view of that one file).
export async function render(container,resource){
  const buffer=await fetchBoundedBuffer(previewContentURL(resource),{maxBytes:30_000_000});
  const name=String(resource.name||resource.path||"layer.gbr").split(/[?#]/,1)[0].split(/[\\/]/).pop();
  const file=new File([buffer],name);
  const cleanup=mountGerberViewer(container,{files:[file],title:resource.label||name});
  return cleanup;
}
