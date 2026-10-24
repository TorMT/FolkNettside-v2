import {renderFusionPackage} from "../fusion-package-view.js?v=b80d2d574b602cba398fff5f3b9fd89d5861e712";
import {extension} from "../utils.js?v=b80d2d574b602cba398fff5f3b9fd89d5861e712";

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
