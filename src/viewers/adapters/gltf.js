import {getGLTFRuntime} from "../../model/three-runtime.js?v=e3cf3c80b1b5f77bd6808d1a3d97aef7016481dc";
import {modelDocumentFromThree} from "../three-model-import.js?v=e3cf3c80b1b5f77bd6808d1a3d97aef7016481dc";
import {renderModelWorkbench} from "../model-workbench.js?v=e3cf3c80b1b5f77bd6808d1a3d97aef7016481dc";
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
