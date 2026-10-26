import {renderFusionPackage} from "../fusion-package-view.js?v=1a6f56f341ef01a7070056db44a1feadd33d0c85";
import {extension,previewContentURL} from "../utils.js?v=1a6f56f341ef01a7070056db44a1feadd33d0c85";

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
