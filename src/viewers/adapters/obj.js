import {modelDocumentFromThree} from "../three-model-import.js?v=132013825d145c941b3130fd96ad64721ba11663";
import {renderModelWorkbench} from "../model-workbench.js?v=132013825d145c941b3130fd96ad64721ba11663";
import {escapeHTML} from "../utils.js?v=132013825d145c941b3130fd96ad64721ba11663";
export async function render(container,resource){
  const url=resource.path||resource.url;
  const response=await fetch(url);
  if(!response.ok)throw new Error("OBJ HTTP "+response.status);
  if(Number(response.headers.get("content-length"))>30_000_000)
    throw new Error("OBJ preview exceeds 30 MB");
  const text=await response.text();
  if(text.length>30_000_000)throw new Error("OBJ preview exceeds 30 MB");
  const {OBJLoader}=await import("https://esm.sh/three@0.180.0/examples/jsm/loaders/OBJLoader.js");
  const obj=new OBJLoader().parse(text);
  container.innerHTML=`<section class="obj-viewer">
    <div class="obj-viewer-units">
      <strong>OBJ has no physical unit declaration</strong>
      <label>Interpret source coordinates as
        <select data-obj-unit>
          <option value="millimeter">millimetres</option>
          <option value="centimeter">centimetres</option>
          <option value="meter" selected>metres (assumed for preview)</option>
          <option value="inch">inches</option>
          <option value="foot">feet</option>
        </select>
      </label>
      <span role="status">Visual inspection only. Confirm units before any engineering analysis.</span>
    </div>
    <div class="obj-viewer-scene" data-obj-scene></div>
  </section>`;
  const host=container.querySelector("[data-obj-scene]");
  const picker=container.querySelector("[data-obj-unit]");
  let current=null,generation=0;
  async function reload(){
    const token=++generation;
    current?.cleanup?.();current=null;
    const model=modelDocumentFromThree({
      scene:obj,name:resource.label||resource.name||"OBJ model",
      format:"OBJ",unit:picker.value
    });
    const view=await renderModelWorkbench(host,model);
    if(token!==generation){view.cleanup?.();return}
    current=view;
    container.querySelector(".obj-viewer-units [role=status]").textContent=
      "Preview: "+model.components.length+" mesh parts · "+picker.value+
      " source units. Not structural/Hydro-certified.";
  }
  await reload();
  picker.addEventListener("change",()=>reload().catch(error=>{
    host.innerHTML="OBJ rendering error: "+escapeHTML(error?.message||error);
  }));
  return {
    info:"OBJ · interpreted units selectable · 3D, waterline and waves",
    actions:{
      fit(){current?.actions?.fit?.()},
      resetZoom(){current?.actions?.resetZoom?.()}
    },
    cleanup(){generation++;current?.cleanup?.()}
  };
}
