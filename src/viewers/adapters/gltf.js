import {getGLTFRuntime} from "../../model/three-runtime.js?v=b7eb79d0ed4c054d239cf37dbe91fb119947a507";
import {modelDocumentFromThree} from "../three-model-import.js?v=b7eb79d0ed4c054d239cf37dbe91fb119947a507";
import {renderModelWorkbench} from "../model-workbench.js?v=b7eb79d0ed4c054d239cf37dbe91fb119947a507";
export async function render(container,resource){
  const url=resource.path||resource.url;
  const {GLTFLoader,MeshoptDecoder}=await getGLTFRuntime();
  const loader=new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const model=await loader.loadAsync(url);
  const documentModel=modelDocumentFromThree({
    scene:model.scene,name:resource.label||resource.name||"glTF model",format:"glTF",unit:"meter"
  });
  const viewer=await renderModelWorkbench(container,documentModel);
  return {...viewer,info:"glTF/GLB · "+documentModel.components.length+
    " mesh objects · visual preview, not validated for Hydro"};
}
