import {mountGerberViewer} from "../../engineering/gerber-viewer.js?v=e6965e51fc31049b66b431e203a66c2d95ac1cab";
import {fetchBoundedBuffer,previewContentURL} from "../utils.js?v=e6965e51fc31049b66b431e203a66c2d95ac1cab";
// Single Gerber or Excellon file from the library: shown in the Gerber viewer (layer view of that one file).
export async function render(container,resource){
  const buffer=await fetchBoundedBuffer(previewContentURL(resource),{maxBytes:30_000_000});
  const name=String(resource.name||resource.path||"layer.gbr").split(/[?#]/,1)[0].split(/[\\/]/).pop();
  const file=new File([buffer],name);
  const cleanup=mountGerberViewer(container,{files:[file],title:resource.label||name});
  return cleanup;
}
