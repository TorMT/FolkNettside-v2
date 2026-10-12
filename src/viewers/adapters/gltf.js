import {getGLTFRuntime} from "../../model/three-runtime.js?v=c5051d0b74b45fbfd26ed6b01d81bf5520ece5f3";
import {modelDocumentFromThree} from "../three-model-import.js?v=c5051d0b74b45fbfd26ed6b01d81bf5520ece5f3";
import {renderModelWorkbench} from "../model-workbench.js?v=c5051d0b74b45fbfd26ed6b01d81bf5520ece5f3";
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
