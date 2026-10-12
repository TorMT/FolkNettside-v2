import {getGLTFRuntime} from "../../model/three-runtime.js?v=c069d06605336ec6b20a55d0b13a48d9b985e62a";
import {modelDocumentFromThree} from "../three-model-import.js?v=c069d06605336ec6b20a55d0b13a48d9b985e62a";
import {renderModelWorkbench} from "../model-workbench.js?v=c069d06605336ec6b20a55d0b13a48d9b985e62a";
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
