const KNOWN_EXTENSIONS=/\.(?:pdf|docx?|xlsx?|pptx?|tex|ipynb|py|html?|md|txt|zip)(?:[?#]|$)/i;
const EXERCISE_WORDS=/(?:^|[^a-z0-9])(laos|oblig|obligatorisk|øving|oving|exercise|assignment|innlevering|oppgave)(?:[^a-z0-9]|$)/i;
const norm=v=>String(v??"").trim();
const searchValue=v=>norm(v).toLocaleLowerCase("nb-NO");
export function safeCatalogUrl(value,{allowRelative=false}={}){
  const raw=norm(value);
  if(!raw||/^[\s\u0000-\u001f]*\/\//.test(raw))return "";
  if(allowRelative&&/^(?:\.\.?\/|\/)(?!\/)/.test(raw)&&!raw.includes("\\"))return raw;
  try{
    const url=new URL(raw);
    return ["https:","http:"].includes(url.protocol)&&!url.username&&!url.password?url.href:"";
  }catch{return ""}
}
export function validateDiverseCatalog(value,kind){
  if(!value||typeof value!=="object"||value.schemaVersion!==1||!Array.isArray(value.items))
    throw new Error("Ukjent katalogformat.");
  if(value.items.length>3000)throw new Error("Katalogen er for stor.");
  const expected=kind==="kok"?"kok":"laos";
  const items=value.items.map((entry,index)=>{
    if(!entry||typeof entry!=="object")throw new Error("Ugyldig oppføring "+index);
    const name=norm(entry.name||entry.title);
    const url=safeCatalogUrl(entry.url,{allowRelative:expected==="laos"});
    if(!name||name.length>200||!url)throw new Error("Katalogoppføring mangler gyldig tittel/HTTPS-lenke "+index);
    const item={name,url,source:norm(entry.source||value.source).slice(0,220)};
    if(expected==="kok"){
      item.study=norm(entry.study).slice(0,100);
      item.specialization=norm(entry.specialization).slice(0,100);
      item.cohort=norm(entry.cohort).slice(0,24);
      item.ratingScale=entry.ratingScale===10?10:5;
      item.rating=entry.rating===undefined||entry.rating===null||entry.rating===""?null:Number(entry.rating);
      if(item.rating!==null&&(!Number.isFinite(item.rating)||item.rating<0||item.rating>item.ratingScale))
        throw new Error("Ugyldig rating "+index);
      item.description=norm(entry.description).slice(0,1500);
      item.sourceId=entry.sourceId===undefined?null:Number(entry.sourceId);
    }else{
      item.courseCode=norm(entry.courseCode).slice(0,40);
      item.semester=norm(entry.semester).slice(0,30);
      item.category=norm(entry.category).slice(0,60);
    }
    return item;
  });
  return {items,verified:value.verified===true,sourceUrl:safeCatalogUrl(value.sourceUrl),
    source:norm(value.source),kind:expected};
}
export function filterKokSites(items,{query="",study="all",specialization="all",cohort="all",sort="name"}={}){
  const q=searchValue(query);
  const filtered=items.filter(x=>(!q||[x.name,x.study,x.specialization,x.cohort].some(s=>searchValue(s).includes(q)))&&
    (study==="all"||x.study===study)&&(specialization==="all"||x.specialization===specialization)&&
    (cohort==="all"||x.cohort===cohort));
  const alphabetical=(a,b)=>a.name.localeCompare(b.name,"nb",{numeric:true});
  if(sort==="cohort")return filtered.sort((a,b)=>b.cohort.localeCompare(a.cohort,"nb",{numeric:true})||alphabetical(a,b));
  if(sort==="rating")return filtered.sort((a,b)=>(b.rating??-1)-(a.rating??-1)||alphabetical(a,b));
  return filtered.sort(alphabetical);
}
export function filterLAOSAssignments(items,{query="",course="all"}={}){
  const q=searchValue(query);
  return items.filter(x=>(course==="all"||x.courseCode===course)&&(!q||
    [x.name,x.courseCode,x.category].some(s=>searchValue(s).includes(q))))
    .sort((a,b)=>a.courseCode.localeCompare(b.courseCode,"nb")||a.name.localeCompare(b.name,"nb"));
}
export function courseExerciseResources(semesters=[]){
  const result=[];
  for(const semester of semesters){
    for(const course of (semester.courses||[])){
      (course.resources||[]).forEach((resource,index)=>{
        const name=norm(resource.title||resource.name||resource.label||resource.fileName||resource.path);
        const key=[name,resource.path,resource.url,resource.section,resource.category].map(norm).join(" ");
        if(!EXERCISE_WORDS.test(key))return;
        result.push({name:name||"Øvingsressurs",courseCode:norm(course.code),semester:String(semester.id),
          category:norm(resource.category)||"Fra Courses",
          route:`/viewer/${encodeURIComponent(semester.id)}/${encodeURIComponent(course.code)}/${index}`,
          origin:"courses-manifest"});
      });
    }
  }
  return result;
}
export function distinctValues(items,field){
  return [...new Set(items.map(item=>norm(item[field])).filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b,"nb",{numeric:true}));
}
