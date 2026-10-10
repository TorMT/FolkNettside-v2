/** Resolve a script's actual same-origin folder for automatic Python imports. */
export function pythonSourceURL(resource,baseURI){
  if(resource?.sourceText!==undefined)return "";
  const path=resource?.url||resource?.path;
  if(typeof path!=="string"||!path.trim()||typeof baseURI!=="string")return "";
  try{
    const base=new URL(baseURI);
    const target=new URL(path,base);
    if(!["https:","http:"].includes(target.protocol)||target.origin!==base.origin)return "";
    return target.href;
  }catch{return ""}
}
