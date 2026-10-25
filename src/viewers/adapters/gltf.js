import {getGLTFRuntime} from "../../model/three-runtime.js?v=9f227c0035f93c85f02e5f4d20c40d9e9f0b2afb";
import {modelDocumentFromThree} from "../three-model-import.js?v=9f227c0035f93c85f02e5f4d20c40d9e9f0b2afb";
import {renderModelWorkbench} from "../model-workbench.js?v=9f227c0035f93c85f02e5f4d20c40d9e9f0b2afb";
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
