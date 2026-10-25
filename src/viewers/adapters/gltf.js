import {getGLTFRuntime} from "../../model/three-runtime.js?v=0afd31dcd08a2722e0d4df5a45729a42aef30087";
import {modelDocumentFromThree} from "../three-model-import.js?v=0afd31dcd08a2722e0d4df5a45729a42aef30087";
import {renderModelWorkbench} from "../model-workbench.js?v=0afd31dcd08a2722e0d4df5a45729a42aef30087";
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
