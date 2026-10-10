/**
 * Public lecture catalogs from the V1 Forelesning.json / Forelesning.txt
 * format. This is metadata: videos stay at their original providers and
 * private URLs are never proxied through the static V2 site.
 */
function text(value,max=450){return String(value??"").trim().slice(0,max)}

export function lectureProvider(value){
  const raw=text(value,2000);
  if(!raw)return null;
  let url;
  try{url=new URL(raw)}catch{return null}
  if(url.protocol!=="https:")return null;
  const host=url.hostname.toLowerCase();
  if(host==="youtube.com"||host==="www.youtube.com"||host==="m.youtube.com"||
    host==="www.youtube-nocookie.com"||host==="youtu.be"){
    let id;
    if(host==="youtu.be")id=url.pathname.slice(1).split("/")[0];
    else if(url.pathname==="/watch")id=url.searchParams.get("v");
    else id=url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/)?.[1];
    if(!/^[A-Za-z0-9_-]{11}$/.test(id||""))return null;
    return {kind:"youtube",url:"https://www.youtube.com/watch?v="+id,
      embed:"https://www.youtube-nocookie.com/embed/"+id};
  }
  if(host==="drive.google.com"){
    const id=url.pathname.match(/^\/file\/d\/([A-Za-z0-9_-]{10,})\//)?.[1];
    return {kind:"drive",url:url.href,embed:id?"https://drive.google.com/file/d/"+id+"/preview":null};
  }
  if(host==="panopto.com"||host.endsWith(".panopto.com")){
    const id=url.searchParams.get("id");
    const safeId=/^[0-9a-fA-F-]{32,40}$/.test(id||"")?id:null;
    return {kind:"panopto",url:url.href,
      embed:safeId?url.origin+"/Panopto/Pages/Embed.aspx?id="+encodeURIComponent(safeId):null};
  }
  return {kind:"external",url:url.href,embed:null};
}
export function parseLectureText(raw){
  const rows=[];
  for(const line of String(raw||"").split(/\r?\n/)){
    const trimmed=line.trim();
    if(!trimmed||trimmed.startsWith("#"))continue;
    const link=trimmed.match(/^\[(.*?)\]\((https:\/\/[^\s)]+)\)$/);
    if(link){rows.push({title:link[1],url:link[2]});continue}
    const url=trimmed.match(/https:\/\/\S+/)?.[0];
    if(!url)continue;
    const label=trimmed.slice(0,trimmed.indexOf(url)).replace(/[|:—-]+$/,"").trim();
    rows.push({title:label||"Forelesning "+(rows.length+1),url});
  }
  return {videos:rows};
}
export function normalizeLectureList(input){
  const source=Array.isArray(input)?input:Array.isArray(input?.videos)?input.videos:[];
  const result=[],ids=new Set();
  for(const value of source.slice(0,5000)){
    if(!value||typeof value!=="object")continue;
    const provider=lectureProvider(value.url||value.href||value.link);
    if(!provider)continue;
    const title=text(value.title||value.name||"Forelesning",240);
    const group=text(value.group||value.groupName||"Andre videoer",160)||"Andre videoer";
    const themes=Array.isArray(value.themes)?
      value.themes.slice(0,25).map(x=>text(x,80)).filter(Boolean):[];
    const key=provider.url;
    if(ids.has(key))continue;
    ids.add(key);
    result.push({id:key,title,group,part:text(value.part,60),
      groupDescription:text(value.group_description||value.groupDescription,600),
      description:text(value.description,1200),themes,...provider});
  }
  return result;
}
export function groupedLectures(videos,{query="",unwatchedOnly=false,isWatched=()=>false,sort="natural"}={}){
  const term=String(query).trim().toLocaleLowerCase("nb-NO");
  const groups=new Map();
  for(const video of videos){
    if(unwatchedOnly&&isWatched(video))continue;
    const searchable=[video.title,video.group,video.groupDescription,video.description,
      video.part,...video.themes].join(" ").toLocaleLowerCase("nb-NO");
    if(term&&!searchable.includes(term))continue;
    if(!groups.has(video.group))groups.set(video.group,{
      id:video.group,description:video.groupDescription,videos:[]
    });
    groups.get(video.group).videos.push(video);
  }
  const sorter=new Intl.Collator("nb-NO",{numeric:sort!=="alphabetical",sensitivity:"base"});
  return [...groups.values()].sort((a,b)=>sorter.compare(a.id,b.id));
}
