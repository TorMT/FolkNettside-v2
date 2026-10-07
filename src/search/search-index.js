function normalize(value){
  return String(value??"")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .replace(/[^a-z0-9æøå]+/g," ")
    .trim();
}

function entry({type,title,subtitle="",keywords=[],route,meta={}}){
  return {
    type,title,subtitle,route,meta,
    haystack:normalize([title,subtitle,...keywords].join(" "))
  };
}

export function buildSearchIndex({semesters=[],projects=[],tools=[],diverse=[]}={}){
  const entries=[];

  for(const module of diverse){
    entries.push(entry({
      type:"diverse",
      title:module.title,
      subtitle:module.category||"Diverse",
      keywords:[module.summary,module.status,module.short],
      route:module.route||"/diverse",
      meta:{moduleId:module.id,status:module.status,legacyUrl:module.legacyUrl||null}
    }));
  }

  for(const tool of tools){
    if(!tool.route)continue;
    entries.push(entry({
      type:"tool",
      title:tool.title,
      subtitle:tool.category||"Tool",
      keywords:[tool.summary,...(tool.keywords||[])],
      route:tool.route,
      meta:{toolId:tool.id}
    }));
  }

  for(const project of projects){
    entries.push(entry({
      type:"project",
      title:project.title,
      subtitle:project.type==="physical"?"Physical engineering project":"Project",
      keywords:[project.summary,...(project.skills||[]),...(project.tools||[])],
      route:`/projects/${encodeURIComponent(project.slug)}`,
      meta:{slug:project.slug,projectType:project.type}
    }));
  }

  for(const semester of semesters){
    for(const course of semester.courses||[]){
      entries.push(entry({
        type:"course",
        title:`${course.code} · ${course.title}`,
        subtitle:semester.label,
        keywords:[course.code,course.title,course.description,...(course.tags||[])],
        route:`/courses/${semester.id}/${encodeURIComponent(course.code)}`,
        meta:{semester:semester.id,courseCode:course.code}
      }));

      (course.resources||[]).forEach((resource,index)=>{
        entries.push(entry({
          type:"resource",
          title:resource.label||resource.name,
          subtitle:[course.code,resource.section,(resource.folders||[]).join(" / ")].filter(Boolean).join(" · "),
          keywords:[
            resource.name,resource.kind,resource.relativePath,resource.section,
            ...(resource.folders||[]),course.code,course.title
          ],
          route:`/viewer/${semester.id}/${encodeURIComponent(course.code)}/${index}`,
          meta:{semester:semester.id,courseCode:course.code,resourceIndex:index,kind:resource.kind}
        }));
      });
    }
  }
  return entries;
}

function scoreEntry(item,tokens,query){
  if(!tokens.length)return -1;
  let score=0;
  const title=normalize(item.title);
  const subtitle=normalize(item.subtitle);

  if(title===query)score+=100;
  if(title.startsWith(query))score+=45;
  if(title.includes(query))score+=25;
  if(subtitle.includes(query))score+=10;

  for(const token of tokens){
    if(!item.haystack.includes(token))return -1;
    if(title===token)score+=20;
    else if(title.startsWith(token))score+=12;
    else if(title.includes(token))score+=8;
    else if(subtitle.includes(token))score+=4;
    else score+=2;
  }
  score+=item.type==="course"?3:item.type==="project"?2:item.type==="tool"?2:item.type==="diverse"?2:0;
  return score;
}

export function searchIndex(index,query,{limit=12}={}){
  const normalized=normalize(query);
  if(!normalized)return [];
  const tokens=normalized.split(/\s+/).filter(Boolean);
  return index
    .map((item,order)=>({item,order,score:scoreEntry(item,tokens,normalized)}))
    .filter(result=>result.score>=0)
    .sort((a,b)=>b.score-a.score||a.order-b.order)
    .slice(0,limit)
    .map(result=>result.item);
}
