import {fetchText} from "../utils.js?v=b12f77bd9f5bfbfaefe3e9fabba6a393250ab995";
import {groupedLectures,normalizeLectureList,parseLectureText} from "../../video/lecture-list.js?v=b12f77bd9f5bfbfaefe3e9fabba6a393250ab995";
import {localVideoProgress} from "../../video/progress-store.js?v=b12f77bd9f5bfbfaefe3e9fabba6a393250ab995";

/** Interactive, metadata-only V1 lecture playlist. Never executes file content. */
export async function render(container,resource){
  const raw=await fetchText(resource.path);
  const file=(resource.path||resource.name||"").toLowerCase();
  const data=file.endsWith(".json")?JSON.parse(raw):parseLectureText(raw);
  const videos=normalizeLectureList(data);
  if(!videos.length)throw new Error("No valid HTTPS lecture links in this catalog");

  const el=(tag,cls,text)=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined)node.textContent=String(text);
    return node;
  };
  const root=el("div","lecture-library");
  const intro=el("div","lecture-intro");
  intro.append(el("h2","", "Forelesninger"),
    el("p","muted",videos.length+" videoer · grupper, temaer og sett-status"));
  const controls=el("div","lecture-controls");
  const search=el("input");search.type="search";search.placeholder="Søk etter tema, forelesning eller del";
  search.setAttribute("aria-label","Søk i forelesninger");
  const order=el("select");order.setAttribute("aria-label","Sorter forelesningsgrupper");
  for(const [value,label] of [["natural","Nummerrekkefølge"],["alphabetical","Alfabetisk"]]){
    const option=el("option","",label);option.value=value;order.append(option);
  }
  const onlyLabel=el("label","lecture-only-unwatched");
  const only=el("input");only.type="checkbox";
  onlyLabel.append(only,document.createTextNode(" Kun usette"));
  controls.append(search,order,onlyLabel);
  const count=el("div","lecture-count muted");
  const groupsHost=el("div","lecture-groups");
  const playerHost=el("section","lecture-player");playerHost.setAttribute("aria-label","Valgt video");
  root.append(intro,controls,count,playerHost,groupsHost);
  container.replaceChildren(root);

  const watched=video=>Boolean(localVideoProgress.read({url:video.id}).watched);
  const setWatched=(video,flag)=>{
    const item={url:video.id};
    const before=localVideoProgress.read(item);
    localVideoProgress.write(item,{...before,watched:flag,updatedAt:Date.now()});
  };
  const videoById=new Map(videos.map(v=>[v.id,v]));
  let activeVideo=null;

  function activate(video){
    activeVideo=video;
    playerHost.replaceChildren();
    const heading=el("h3","",video.title);
    const description=el("p","muted",video.description||video.groupDescription||"");
    playerHost.append(heading,description);
    if(video.embed){
      const iframe=el("iframe","lecture-embed");
      iframe.title=video.title;
      iframe.src=video.embed;
      iframe.loading="lazy";
      iframe.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      iframe.referrerPolicy="strict-origin-when-cross-origin";
      iframe.allowFullscreen=true;
      playerHost.append(iframe);
    }else{
      playerHost.append(el("p","muted","Denne leverandøren åpnes hos kilden."));
    }
    const link=el("a","btn","Åpne hos "+video.kind);
    link.href=video.url;link.target="_blank";link.rel="noopener noreferrer";
    playerHost.append(link);
  }
  function redraw(){
    const groups=groupedLectures(videos,{
      query:search.value,sort:order.value,unwatchedOnly:only.checked,isWatched:watched
    });
    count.textContent=groups.reduce((sum,g)=>sum+g.videos.length,0)+" av "+videos.length+
      " videoer · "+groups.length+" grupper";
    groupsHost.replaceChildren();
    if(!groups.length){
      groupsHost.append(el("p","muted","Ingen treff. Prøv et annet søkeord eller vis alle."));
      return;
    }
    for(const group of groups){
      const details=el("details","lecture-group");
      details.open=true;
      const summary=el("summary");
      const done=group.videos.filter(watched).length;
      summary.append(el("strong","",group.id),el("span","muted",done+"/"+group.videos.length+" sett"));
      details.append(summary);
      if(group.description)details.append(el("p","lecture-group-description",group.description));
      const bulk=el("button","btn lecture-group-complete","Merk gruppe sett");
      bulk.type="button";
      bulk.addEventListener("click",()=>{
        const all=group.videos.every(watched);
        group.videos.forEach(item=>setWatched(item,!all));
        redraw();
      });
      details.append(bulk);
      const list=el("div","lecture-list");
      for(const video of group.videos){
        const line=el("article","lecture-entry");
        if(video===activeVideo)line.classList.add("is-active");
        const main=el("button","lecture-open");main.type="button";
        main.append(el("strong","",video.title),
          el("small","muted",[
            video.part?"Del "+video.part:"",video.themes.slice(0,4).join(", ")
          ].filter(Boolean).join(" · ")));
        main.addEventListener("click",()=>{activate(video);redraw()});
        const mark=el("button","btn lecture-watch",watched(video)?"Sett ✓":"Marker sett");
        mark.type="button";mark.setAttribute("aria-pressed",String(watched(video)));
        mark.setAttribute("aria-label",(watched(video)?"Fjern sett-markering: ":"Marker som sett: ")+video.title);
        mark.addEventListener("click",()=>{setWatched(video,!watched(video));redraw()});
        line.append(main,mark);
        list.append(line);
      }
      details.append(list);groupsHost.append(details);
    }
  }
  search.addEventListener("input",redraw);
  only.addEventListener("change",redraw);
  order.addEventListener("change",redraw);
  redraw();
  return {
    info:videos.length+" videoer · "+new Set(videos.map(v=>v.group)).size+" grupper · lokal sett-status",
    actions:{resetProgress(){
      for(const video of videos)localVideoProgress.clear({url:video.id});
      redraw();
    }},
    cleanup(){playerHost.replaceChildren()}
  };
}
