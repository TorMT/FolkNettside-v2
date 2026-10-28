import {createAutodeskHubClient,validateHubConfig}
  from "../platform/autodesk-hub-client.js?v=17424844b3d92523b8b57661368abfd83bf5b431";

const escapeHTML=text=>String(text??"").replace(/[&<>"']/g,c=>({
 "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
const KIND_LABEL={hubs:"Hubs",projects:"Projects",topFolders:"Project folders",
 contents:"Folder contents",versions:"Item versions"};
const NEXT={hub:"projects",project:"topFolders",folder:"contents",item:"versions"};
const crumb=(text)=>String(text).slice(0,100);

export function autodeskHubBrowserHTML(){
 return '<section class="autodesk-hub-browser" aria-label="Fusion Hub read-only catalog">'+
   '<header><div><h2>Fusion Hub</h2>'+
   '<p class="muted">Read-only browsing of your Autodesk hubs, projects, folders and design versions.</p></div>'+
   '<button type="button" class="btn" data-aps-refresh>Connect / refresh</button></header>'+
   '<div data-aps-message role="status" aria-live="polite">'+
   'Checking for a configured Autodesk connection…</div>'+
   '<div data-aps-crumbs aria-label="Fusion Hub breadcrumb"></div>'+
   '<div data-aps-entries></div>'+
   '<div class="autodesk-hub-footer"><button class="btn" type="button" data-aps-more hidden>Load more</button>'+
   '<span class="muted">No modification or download is performed from this catalog. '+
   'Models are only accessible to the signed-in account.</span></div></section>';
}

/** client is injectable for integration tests and future authenticated backend. */
export function mountAutodeskHubBrowser(root,{config=null,client=null,configLoader=null}={}){
 if(!root)return()=>{};
 root.innerHTML=autodeskHubBrowserHTML();
 const message=root.querySelector("[data-aps-message]");
 const entries=root.querySelector("[data-aps-entries]");
 const crumbs=root.querySelector("[data-aps-crumbs]");
 const more=root.querySelector("[data-aps-more]");
 const refresh=root.querySelector("[data-aps-refresh]");
 let disposed=false,seq=0,activeClient=client,cursor=null,current=null;
 let trail=[];
 const controller=new AbortController();
 const renderTrail=()=>{
   crumbs.replaceChildren();
   trail.forEach((record,index)=>{
     const button=document.createElement("button");
     button.type="button";
     button.className="btn";
     button.dataset.apsBack=String(index);
     button.textContent=crumb(record.label);
     button.disabled=index===trail.length-1;
     crumbs.append(button);
   });
 };
 const announce=text=>{if(!disposed)message.textContent=text};
 function renderItems(list,{append=false}={}){
   if(!append)entries.replaceChildren();
   if(!list.length&&!append){const paragraph=document.createElement("p");
     paragraph.className="muted";paragraph.textContent="No accessible entries in this location.";
     entries.append(paragraph);return}
   for(const item of list){
     const article=document.createElement("article");
     article.className="autodesk-hub-item";
     const main=document.createElement("div");
     const strong=document.createElement("strong");
     strong.textContent=item.name;main.append(strong);
     const info=document.createElement("span");info.className="muted";
     info.textContent=item.type+(item.versionNumber===null?"":" · Version "+item.versionNumber)+
       (item.modifiedAt?" · "+item.modifiedAt:"");
     main.append(info);article.append(main);
     const controls=document.createElement("div");
     if(NEXT[item.type]){
       const button=document.createElement("button");
       button.type="button";button.className="btn";
       button.textContent=item.type==="item"?"Versions":"Open";
       button.dataset.apsOpen=item.type;button.dataset.apsId=item.id;
       button.dataset.apsName=item.name;controls.append(button);
     }
     if(item.webUrl){
       const link=document.createElement("a");
       link.href=item.webUrl;link.target="_blank";link.rel="noopener noreferrer";
       link.className="btn";link.textContent="Open at Autodesk";
       controls.append(link);
     }
     article.append(controls);entries.append(article);
   }
 }
 async function load(level,ids={},label=KIND_LABEL[level],{back=false,loadMore=false}={}){
   if(!activeClient)return;
   const ticket=++seq;const requestCursor=loadMore?cursor:null;
   if(!loadMore){
     current={level,ids,label};
     if(!back)trail.push(current);
     renderTrail();entries.replaceChildren();
   }
   more.hidden=true;
   announce("Loading "+label+" from Autodesk…");
   try{
     const result=await activeClient.catalog(level,ids,{
       cursor:requestCursor,signal:controller.signal
     });
     if(ticket!==seq||disposed)return;
     renderItems(result.entries,{append:loadMore});
     cursor=result.nextCursor;
     more.hidden=!cursor;
     announce(result.entries.length+" item(s) loaded"+
       (cursor?" · more results available":"")+". Read-only.");
   }catch(error){
     if(ticket!==seq||disposed)return;
     announce("Autodesk browsing failed: "+String(error?.message||error));
     if(!loadMore)entries.textContent="The hub could not be loaded. Check account and backend permissions.";
   }
 }
 async function start(){
   const ticket=++seq;
   entries.replaceChildren();crumbs.replaceChildren();trail=[];cursor=null;
   announce("Checking Autodesk backend session…");
   try{
     if(!activeClient){
       const provided=config||await (configLoader?configLoader():fetch("./data/autodesk-hub.json",{
         cache:"no-store",signal:controller.signal
       }).then(r=>r.ok?r.json():null));
       if(ticket!==seq||disposed)return;
       const setting=validateHubConfig(provided,{origin:location.origin});
       if(!setting.enabled){
         announce("Autodesk hub is not connected. Configure a secure APS backend to browse cloud files.");
         return;
       }
       activeClient=createAutodeskHubClient(setting);
     }
     const session=await activeClient.session({signal:controller.signal});
     if(ticket!==seq||disposed)return;
     if(!session.connected){
       if(session.configured===false){
         announce("Autodesk app credentials are not yet configured on the backend. Hub access is disabled.");
         return;
       }
       if(typeof activeClient.startAuthorization==="function"){
         const login=document.createElement("button");
         login.type="button";login.className="btn";
         login.textContent="Connect Autodesk account";
         login.addEventListener("click",async()=>{
           login.disabled=true;
           announce("Creating a protected Autodesk authorization request…");
           try{
             const url=await activeClient.startAuthorization({signal:controller.signal});
             if(!disposed)window.location.assign(url);
           }catch(error){
             if(!disposed){login.disabled=false;
               announce("Autodesk connection failed: "+String(error?.message||error));}
           }
         });
         entries.append(login);
       }else{
         const login=document.createElement("a");
         login.href=activeClient.loginURL();
         login.className="btn";login.textContent="Sign in with Autodesk";
         entries.append(login);
       }
       announce("Autodesk login required. This is separate from Google sign-in.");
       return;
     }
     announce("Connected as "+(session.displayName||"Autodesk user"));
     await load("hubs",{},"Hubs");
   }catch(error){
     if(ticket!==seq||disposed)return;
     announce("Autodesk backend unavailable: "+String(error?.message||error));
   }
 }
 const click=event=>{
   const back=event.target.closest("[data-aps-back]");
   if(back){
     const index=Number(back.dataset.apsBack);
     if(!Number.isSafeInteger(index)||!trail[index]||index===trail.length-1)return;
     const target=trail[index];trail=trail.slice(0,index+1);
     void load(target.level,target.ids,target.label,{back:true});return;
   }
   const open=event.target.closest("[data-aps-open]");
   if(!open||!current)return;
   const kind=open.dataset.apsOpen,next=NEXT[kind];
   if(!next)return;
   const ids={...current.ids};
   const itemId=open.dataset.apsId;
   if(kind==="hub")ids.hubId=itemId;
   if(kind==="project")ids.projectId=itemId;
   if(kind==="folder")ids.folderId=itemId;
   if(kind==="item")ids.itemId=itemId;
   void load(next,ids,open.dataset.apsName||KIND_LABEL[next]);
 };
 const onMore=()=>{if(current&&cursor)void load(
   current.level,current.ids,current.label,{back:true,loadMore:true})};
 const onRefresh=()=>{activeClient=client;void start()};
 crumbs.addEventListener("click",click);
 entries.addEventListener("click",click);
 more.addEventListener("click",onMore);
 refresh.addEventListener("click",onRefresh);
 void start();
 return()=>{
   disposed=true;seq++;controller.abort();
   crumbs.removeEventListener("click",click);
   entries.removeEventListener("click",click);
   more.removeEventListener("click",onMore);
   refresh.removeEventListener("click",onRefresh);
 };
}
