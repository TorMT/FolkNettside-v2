import {getGLTFRuntime} from "../../model/three-runtime.js?v=53b596ca51970a6e00d540ea88086fb2c15a8587";
import {modelDocumentFromThree} from "../three-model-import.js?v=53b596ca51970a6e00d540ea88086fb2c15a8587";
import {renderModelWorkbench} from "../model-workbench.js?v=53b596ca51970a6e00d540ea88086fb2c15a8587";
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
