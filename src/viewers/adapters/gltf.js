import {getGLTFRuntime} from "../../model/three-runtime.js?v=ba4504c94e2d0fb6d93f6f08242d632c0b1259f8";
import {modelDocumentFromThree} from "../three-model-import.js?v=ba4504c94e2d0fb6d93f6f08242d632c0b1259f8";
import {renderModelWorkbench} from "../model-workbench.js?v=ba4504c94e2d0fb6d93f6f08242d632c0b1259f8";
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
