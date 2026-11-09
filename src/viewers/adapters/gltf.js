import {getGLTFRuntime} from "../../model/three-runtime.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
import {modelDocumentFromThree} from "../three-model-import.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
import {renderModelWorkbench} from "../model-workbench.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
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
