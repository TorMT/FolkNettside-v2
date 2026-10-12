import {renderFusionPackage} from "../fusion-package-view.js?v=c5051d0b74b45fbfd26ed6b01d81bf5520ece5f3";
import {extension} from "../utils.js?v=c5051d0b74b45fbfd26ed6b01d81bf5520ece5f3";

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
