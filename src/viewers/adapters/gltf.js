import {getGLTFRuntime} from "../../model/three-runtime.js?v=6c95d0f9ab17debd70a4c6b23b55e31688aa1937";
import {modelDocumentFromThree} from "../three-model-import.js?v=6c95d0f9ab17debd70a4c6b23b55e31688aa1937";
import {renderModelWorkbench} from "../model-workbench.js?v=6c95d0f9ab17debd70a4c6b23b55e31688aa1937";
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
