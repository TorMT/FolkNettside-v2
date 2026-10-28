/** V2's optional read-only relay for explicitly approved, public KISSsoft files. */
export const APPROVED_PUBLIC_KISSSOFT_PATHS=Object.freeze([
  "/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/RingOgPinionMaskineriProsjekt.Z12",
  "/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/Stage1PlanetaryGear.Z14",
  "/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/Stage2PlanetaryGear.Z14",
  "/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/Stage3PlanetaryGear.Z14"
]);
const approved=new Set(APPROVED_PUBLIC_KISSSOFT_PATHS);
export const PUBLIC_KISSSOFT_RELAY="https://aeuouzkiyddfjtjfdosp.supabase.co/functions/v1/ntnu-kisssoft";
const NTNU_ORIGIN="https://tormt.folk.ntnu.no";
export function publicKisssoftRelayURL(resource,{siteOrigin=globalThis.location?.origin}={}){
 if(resource?.localPreview===true||resource?.source!=="ntnu"||
    resource?.remoteArchive!==true||siteOrigin!=="https://tormt.github.io"||
    typeof resource.url!=="string")return null;
 try{
  const url=new URL(resource.url);
  if(url.origin!==NTNU_ORIGIN||url.search||url.hash||url.username||url.password||
     !approved.has(url.pathname))return null;
  return PUBLIC_KISSSOFT_RELAY+"?path="+encodeURIComponent(url.pathname);
 }catch{return null}
}
