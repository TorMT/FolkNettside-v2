import {renderFusionPackage} from "../fusion-package-view.js?v=2a148f9fe14717df5c3d1cbeea15dca9ce4d1348";
import {extension,previewContentURL} from "../utils.js?v=2a148f9fe14717df5c3d1cbeea15dca9ce4d1348";

export async function render(container,resource){
 const source=previewContentURL(resource);
 const kind=extension(resource.localPreview===true?resource.name:(source||resource.name));
 if(kind!=="f3d"&&kind!=="f3z")throw Error("Not a Fusion archive");
 container.textContent="Reading Fusion archive locally…";
 const response=await fetch(source);
 if(!response.ok)throw Error("Fusion archive HTTP "+response.status);
 const reported=Number(response.headers.get("content-length"));
 if(reported>55*1024*1024)throw Error("Fusion archive exceeds 55 MiB safe preview limit");
 const buffer=await response.arrayBuffer();
 return renderFusionPackage(container,buffer,resource.label||resource.name||"model."+kind);
}
