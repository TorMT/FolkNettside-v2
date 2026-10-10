/** Compare public course-resource IDs against the visitor's acknowledged baseline. */
const STORAGE_KEY="folk-v2:course-file-notices.v1";
export function resourceNoticeKey(semester,code,resource){
  return JSON.stringify([
    Number(semester),String(code||"").trim().toUpperCase(),
    String(resource?.id||resource?.path||resource?.url||resource?.relativePath||resource?.name||"").slice(0,1000)
  ]);
}
export function resourceSnapshot(semesters=[]){
  const all=new Set();
  for(const semester of semesters||[]){
    for(const course of semester.courses||[]){
      for(const resource of course.resources||[]){
        all.add(resourceNoticeKey(semester.id,course.code,resource));
      }
    }
  }
  return [...all].sort();
}
export function createResourceNotices(semesters=[],storage=globalThis.localStorage){
  const snapshot=resourceSnapshot(semesters);
  let baseline;
  try{
    const parsed=JSON.parse(storage?.getItem(STORAGE_KEY)||"null");
    if(parsed?.version===1&&Array.isArray(parsed.keys)&&parsed.keys.every(x=>typeof x==="string")){
      baseline=new Set(parsed.keys);
    }
  }catch{}
  const store=()=>{
    try{storage?.setItem(STORAGE_KEY,JSON.stringify({version:1,keys:snapshot}))}catch{}
  };
  if(!baseline){baseline=new Set(snapshot);store()}
  const keys=new Set(snapshot.filter(x=>!baseline.has(x)));
  const byCourse=new Map();
  for(const semester of semesters||[]){
    for(const course of semester.courses||[]){
      const id=Number(semester.id)+":"+String(course.code).toUpperCase();
      const added=(course.resources||[]).filter(resource=>
        keys.has(resourceNoticeKey(semester.id,course.code,resource)));
      if(added.length)byCourse.set(id,added);
    }
  }
  return {
    get total(){return keys.size},
    count(semester,code){return byCourse.get(Number(semester)+":"+String(code).toUpperCase())?.length||0},
    newResources(semester,code){return [...(byCourse.get(Number(semester)+":"+String(code).toUpperCase())||[])]},
    acknowledge(){
      store();
      keys.clear();
      byCourse.clear();
    }
  };
}
