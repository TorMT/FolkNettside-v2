/**
 * Read-only, dated HTTP observation data for the original AndreKokSider
 * directory. It does not change owner-supplied URLs or imply permanent
 * deletion. This is intentionally not a client-side link scanner: cross-
 * origin CORS restrictions would turn reachable NTNU sites into false errors.
 */
const OBSERVATIONS=new Set(["responded","http_410","inconclusive"]);
export function validateStudyLinkAudit(value,publishedItems){
  if(!value||value.schemaVersion!==1||!Array.isArray(value.entries)||
     !/^\d{4}-\d{2}-\d{2}$/.test(String(value.checkedOn||""))||
     !Number.isFinite(Date.parse(value.checkedOn+"T00:00:00Z")))
    throw new Error("Ukjent format eller dato i studielenke-kontroll.");
  const expected=new Set((publishedItems||[]).map(item=>item.url));
  if(value.entries.length!==expected.size||expected.size===0)
    throw new Error("Lenkekontrollen er ikke for den publiserte katalogen.");
  const byUrl=new Map();
  for(const row of value.entries){
    if(!row||typeof row.url!=="string"||!expected.has(row.url)||
       !OBSERVATIONS.has(row.observation)||byUrl.has(row.url))
      throw new Error("Lenkekontrollen har ukjent eller duplisert adresse/status.");
    byUrl.set(row.url,row.observation);
  }
  const summary={
    responded:[...byUrl.values()].filter(status=>status==="responded").length,
    http_410:[...byUrl.values()].filter(status=>status==="http_410").length,
    inconclusive:[...byUrl.values()].filter(status=>status==="inconclusive").length
  };
  if(Object.entries(summary).some(([name,total])=>value.summary?.[name]!==total))
    throw new Error("Lenkekontrollens opptelling stemmer ikke.");
  return {checkedOn:value.checkedOn,byUrl,summary};
}
export function studyLinkObservation(audit,url){
  if(!audit||!audit.byUrl.has(url))return null;
  const status=audit.byUrl.get(url);
  if(status==="responded")return null;
  const date=audit.checkedOn;
  return status==="http_410"
    ?`Svarte HTTP 410 ved kontroll ${date}. Lenken er beholdt; siden kan ha flyttet eller endret seg.`
    :`Tilgjengelighet uavklart ved kontroll ${date} (tidsavbrudd/tomt svar). Prøv lenken manuelt.`;
}
export function studyLinkAuditSummary(audit){
  if(!audit)return "";
  const s=audit.summary;
  return `Sist undersøkt ${audit.checkedOn}: ${s.responded} svarte, ${s.http_410} ga HTTP 410, ${s.inconclusive} uavklart. Statusen kan ha endret seg; alle originaladresser beholdes.`;
}
