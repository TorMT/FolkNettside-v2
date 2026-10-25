import {parseCADBuffer} from "../../model/parsers/cad-runtime.js?v=3f2b7644d1b7d4bdefd3c49a1dbc9d1aaed4801d";
import {renderModelWorkbench} from "../model-workbench.js?v=3f2b7644d1b7d4bdefd3c49a1dbc9d1aaed4801d";
import {extension} from "../utils.js?v=3f2b7644d1b7d4bdefd3c49a1dbc9d1aaed4801d";
export async function render(container,resource){
 const source=resource.path||resource.url;
 const kind=extension(source||resource.name);
 const label=resource.label||resource.name||"CAD model";
 container.textContent="Loading OpenCascade for STEP/IGES/BREP tessellation (locally in browser)…";
 const resp=await fetch(source);
 if(!resp.ok)throw Error("CAD file HTTP "+resp.status);
 const declared=Number(resp.headers.get("content-length"));
 if(Number.isFinite(declared)&&declared>25*1024*1024)
   throw Error("CAD file exceeds 25 MB browser limit");
 const bytes=await resp.arrayBuffer();
 const model=await parseCADBuffer(bytes,label,{format:kind});
 const viewer=await renderModelWorkbench(container,model);
 return {...viewer,info:kind.toUpperCase()+" · OpenCascade tessellation · "+model.source.triangles+
   " triangles · "+model.components.filter(c=>c.geometry).length+" mesh parts (not native B-Rep)"};
}
