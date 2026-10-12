import {getGLTFRuntime} from "../../model/three-runtime.js?v=d6a52c819161b70263a3229136a2315c3bf243ce";
import {modelDocumentFromThree} from "../three-model-import.js?v=d6a52c819161b70263a3229136a2315c3bf243ce";
import {renderModelWorkbench} from "../model-workbench.js?v=d6a52c819161b70263a3229136a2315c3bf243ce";
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
