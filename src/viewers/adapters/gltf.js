import {getGLTFRuntime} from "../../model/three-runtime.js?v=936b8d9a2a8de78d2df8067006848786331aae9f";
import {modelDocumentFromThree} from "../three-model-import.js?v=936b8d9a2a8de78d2df8067006848786331aae9f";
import {renderModelWorkbench} from "../model-workbench.js?v=936b8d9a2a8de78d2df8067006848786331aae9f";
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
