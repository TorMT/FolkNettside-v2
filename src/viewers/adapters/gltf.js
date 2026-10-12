import {getGLTFRuntime} from "../../model/three-runtime.js?v=301cd1ad39956f18bcf1f2a01b695f2c42a9d89f";
import {modelDocumentFromThree} from "../three-model-import.js?v=301cd1ad39956f18bcf1f2a01b695f2c42a9d89f";
import {renderModelWorkbench} from "../model-workbench.js?v=301cd1ad39956f18bcf1f2a01b695f2c42a9d89f";
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
