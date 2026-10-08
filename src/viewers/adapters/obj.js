import {getThreeRuntime} from "../../model/three-runtime.js";
import {modelDocumentFromThree} from "../three-model-import.js";
import {renderModelWorkbench} from "../model-workbench.js";
export async function render(container,resource){
  const url=resource.path||resource.url;
  const response=await fetch(url);
  if(!response.ok)throw new Error("OBJ HTTP "+response.status);
  const text=await response.text();
  if(text.length>30_000_000)throw new Error("OBJ preview exceeds 30 MB");
  const {THREE}=await getThreeRuntime();
  const {OBJLoader}=await import("https://esm.sh/three@0.180.0/examples/jsm/loaders/OBJLoader.js");
  const obj=new OBJLoader().parse(text);
  const documentModel=modelDocumentFromThree({
    scene:obj,name:resource.label||resource.name||"OBJ model",format:"OBJ",unit:"meter"
  });
  const viewer=await renderModelWorkbench(container,documentModel);
  return {...viewer,info:"OBJ · preview in assumed metre coordinates (OBJ lacks units) · "+
    documentModel.components.length+" mesh parts · not Hydro certified"};
}
