import {legacyReadEndpoint} from "./legacy-read-client.js?v=bce4c24ff48c46da2eb08d66dbf794d8ff46c161";
/** Explicit V2-only Brewing endpoint mapping, never fall back to V1 /includes/. */
const ROOTS={
  brewing:"./includes/brewing/api/",
  rapt:"./includes/rapt/api/"
};
export function brewingEndpoint(config,service,file,{baseURI=globalThis.document?.baseURI||globalThis.location?.href}={}){
  const legacy=legacyReadEndpoint(config,service,file);
  if(legacy)return legacy;
  const settings=config?.brewing;
  if(settings?.enabled!==true||!(service in ROOTS))return null;
  const base=service==="rapt"?settings.raptBase:settings.brewingBase;
  if(base!==ROOTS[service])return null;
  if(typeof file!=="string"||! /^[a-z][a-z0-9_-]*\.php$/i.test(file))return null;
  if(!baseURI)return null;
  try{
    const uri=new URL(base+file,new URL(baseURI));
    const reference=new URL(baseURI);
    if(uri.origin!==reference.origin)return null;
    // Return an absolute URL resolved from V2's own base directory.
    return uri.href;
  }catch{return null}
}
export async function loadBrewingServiceConfig(fetcher=globalThis.fetch){
  try{
    const response=await fetcher("./data/service-endpoints.json",{cache:"no-store",headers:{"Accept":"application/json"}});
    if(!response.ok)return null;
    const payload=await response.json();
    return payload&&typeof payload==="object"&&!Array.isArray(payload)?payload:null;
  }catch{return null}
}
