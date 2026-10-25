import {getGLTFRuntime} from "../../model/three-runtime.js?v=79b5d8681aa2894aaa520e68ce480d4aca258feb";
import {modelDocumentFromThree} from "../three-model-import.js?v=79b5d8681aa2894aaa520e68ce480d4aca258feb";
import {renderModelWorkbench} from "../model-workbench.js?v=79b5d8681aa2894aaa520e68ce480d4aca258feb";
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
