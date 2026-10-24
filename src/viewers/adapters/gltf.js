import {getGLTFRuntime} from "../../model/three-runtime.js?v=adaf31ee0f1c2b0c71c1bde514746b5fbd3ee61d";
import {modelDocumentFromThree} from "../three-model-import.js?v=adaf31ee0f1c2b0c71c1bde514746b5fbd3ee61d";
import {renderModelWorkbench} from "../model-workbench.js?v=adaf31ee0f1c2b0c71c1bde514746b5fbd3ee61d";
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
