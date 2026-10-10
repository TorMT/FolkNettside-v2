import {renderFusionPackage} from "../fusion-package-view.js?v=dce8cb8ada3681d0e836ba70920c59bdec67b54b";
import {extension} from "../utils.js?v=dce8cb8ada3681d0e836ba70920c59bdec67b54b";

export async function render(container,resource){
 const source=resource.url||resource.path;
 const kind=extension(source||resource.name);
 if(kind!=="f3d"&&kind!=="f3z")throw Error("Not a Fusion archive");
 container.textContent="Reading Fusion archive locally…";
 const response=await fetch(source);
 if(!response.ok)throw Error("Fusion archive HTTP "+response.status);
 const reported=Number(response.headers.get("content-length"));
 if(reported>55*1024*1024)throw Error("Fusion archive exceeds 55 MiB safe preview limit");
 const buffer=await response.arrayBuffer();
 return renderFusionPackage(container,buffer,resource.label||resource.name||"model."+kind);
}
