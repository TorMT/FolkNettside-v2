import {getGLTFRuntime} from "../../model/three-runtime.js?v=625ab66ed8a7b04f32af5781dabc49ae5abfedc6";
import {modelDocumentFromThree} from "../three-model-import.js?v=625ab66ed8a7b04f32af5781dabc49ae5abfedc6";
import {renderModelWorkbench} from "../model-workbench.js?v=625ab66ed8a7b04f32af5781dabc49ae5abfedc6";
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
