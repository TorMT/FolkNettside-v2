/**
 * Stable previous/next viewer links within the current course section.
 * Uses existing manifest indexes; no file downloads or backend requests.
 */
const collator=new Intl.Collator("no",{numeric:true,sensitivity:"base"});

function folderParts(item){
  return Array.isArray(item?.folders)?item.folders.map(x=>String(x)):[];
}

function compareVisibleOrder(a,b){
  const af=folderParts(a.resource),bf=folderParts(b.resource);
  // Resource tree shows folders before loose files at each level.
  if(Boolean(af.length)!==Boolean(bf.length))return af.length?-1:1;
  for(let i=0;i<Math.min(af.length,bf.length);i++){
    const c=collator.compare(af[i],bf[i]);
    if(c)return c;
  }
  if(af.length!==bf.length)return bf.length-af.length;
  const name=collator.compare(a.resource.name||a.resource.label||"",
    b.resource.name||b.resource.label||"");
  return name||a.index-b.index;
}

/** Return navigable sibling files and labels; do not reorder the catalog. */
export function courseViewerNeighbors(course,currentIndex){
  const resources=course?.resources;
  const sid=Number(course?.semester);
  const code=course?.code;
  if(!Array.isArray(resources)||!Number.isInteger(currentIndex)||
     currentIndex<0||currentIndex>=resources.length||
     !Number.isInteger(sid)||sid<1||sid>20||
     typeof code!=="string"||!code||/[\\/\u0000-\u001f?#%]/.test(code))
    return {previous:null,next:null,position:0,total:0};
  const current=resources[currentIndex];
  const sameSection=resources.map((resource,index)=>({resource,index}))
    .filter(x=>x.resource.section===current.section)
    .sort(compareVisibleOrder);
  const pos=sameSection.findIndex(x=>x.index===currentIndex);
  const link=x=>x?{
    index:x.index,label:String(x.resource.label||x.resource.name||"Fil"),
    href:`#/viewer/${sid}/${encodeURIComponent(code)}/${x.index}`
  }:null;
  return {previous:link(sameSection[pos-1]),
    next:link(sameSection[pos+1]),
    position:pos+1,total:sameSection.length};
}
