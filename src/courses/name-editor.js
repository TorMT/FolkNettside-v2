import {validateNTNUAutoCatalog} from "./ntnu-autocatalog.js?v=b67b252dd6fbc40137d93e0430b40fd3e1089c77";
import {applyNTNUDisplayNames,validateNTNUDisplayNames}
 from "./ntnu-display-names.js?v=b67b252dd6fbc40137d93e0430b40fd3e1089c77";

/** Original V1 paths are the identifiers; any display labels are optional. */
export function editorCandidates(course){
 const prefix=course.semester+"/"+course.code+"/";
 const folders=new Map();
 const files=[];
 for(const resource of course.resources||[]){
   const parts=resource.relativePath.split("/");
   const rootDepth=parts[0]==="filer"&&parts.length>=3?2:1;
   for(const [i,original] of (resource.folders||[]).entries()){
     const rel=parts.slice(0,rootDepth+i+1).join("/");
     folders.set(prefix+rel,original);
   }
   files.push({key:prefix+resource.relativePath,
     original:resource.name,path:resource.relativePath});
 }
 return {
   sections:(course.sections||[]).map(section=>({
     key:prefix+section,original:section
   })),
   folders:[...folders].map(([key,original])=>({
     key,original,path:key.slice(prefix.length)
   })).sort((a,b)=>a.path.localeCompare(b.path,"no",{numeric:true})),
   files:files.sort((a,b)=>a.path.localeCompare(b.path,"no",{numeric:true}))
 };
}

export function changeAlias(draft,type,key,value,property="title"){
 if(!["courses","sections","folders","files"].includes(type))
   throw Error("Unknown display-name field");
 if(typeof value!=="string")throw Error("Display name must be text");
 const trimmed=value.trim();
 if(type==="courses"){
   if(!draft.courses[key])draft.courses[key]={};
   if(trimmed)draft.courses[key][property]=trimmed;
   else delete draft.courses[key][property];
   if(!Object.keys(draft.courses[key]).length)delete draft.courses[key];
 }else if(trimmed)draft[type][key]=trimmed;
 else delete draft[type][key];
}

export function exportAliases(draft,manifest){
 const validated=validateNTNUDisplayNames(draft);
 applyNTNUDisplayNames(manifest,validated); // detect colliding section labels
 const cleaned={
  schemaVersion:1,
  _comment:typeof draft._comment==="string"?draft._comment:
   "Visningsnavn i V2. Originalfiler og lenker på NTNU beholdes.",
  ...validated
 };
 return JSON.stringify(cleaned,null,2)+"\n";
}

async function initializeEditor(){
 const status=document.getElementById("editor-status");
 const root=document.getElementById("editor");
 const semesterSelect=document.getElementById("semester");
 const courseSelect=document.getElementById("course");
 const search=document.getElementById("file-search");
 const fileCount=document.getElementById("file-count");
 const originalDocs=await Promise.all([
  fetch("../../data/ntnu-autocatalog.json",{cache:"no-store"}),
  fetch("../../config/ntnu-display-names.json",{cache:"no-store"})
 ]);
 if(originalDocs.some(r=>!r.ok))throw Error("Finner ikke offentlig kurskatalog eller navnefil.");
 const [manifestRaw,namesRaw]=await Promise.all(originalDocs.map(r=>r.json()));
 const manifest=validateNTNUAutoCatalog(manifestRaw);
 const initial=namesRaw;
 let draft=JSON.parse(exportAliases(initial,manifest));
 let dirty=false;

 function option(select,value,label){
   const item=document.createElement("option");
   item.value=String(value);
   item.textContent=label;
   select.append(item);
 }
 function selectedCourse(){
   const semester=manifest.semesters.find(s=>String(s.id)===semesterSelect.value);
   return semester?.courses.find(c=>c.code===courseSelect.value);
 }
 function markDirty(){
   dirty=true;
   status.textContent="Du har lokale navneendringer som ikke er publisert til GitHub.";
 }
 function inputRow(container,{key,original,path},type,field="title"){
   const row=document.createElement("div");row.className="field";
   const label=document.createElement("label");
   label.className="original";
   const name=document.createElement("strong");
   name.textContent=original;
   label.append(name);
   if(path){
     const code=document.createElement("code");
     code.textContent=path;label.append(code);
   }
   const input=document.createElement("input");
   input.type="text";input.maxLength=type==="courses"&&field==="description"?300:160;
   input.setAttribute("aria-label","Visningsnavn for "+original);
   input.placeholder=original;
   input.value=type==="courses"?draft.courses[key]?.[field]||"":
     draft[type][key]||"";
   input.addEventListener("input",()=>{
     changeAlias(draft,type,key,input.value,field);
     markDirty();
   });
   row.append(label,input);container.append(row);
 }
 function renderFileRows(){
   const course=selectedCourse();
   if(!course)return;
   const list=document.getElementById("file-fields");
   list.replaceChildren();
   const candidates=editorCandidates(course).files;
   const needle=search.value.trim().toLocaleLowerCase("no");
   const visible=candidates.filter(item=>
     !needle||item.path.toLocaleLowerCase("no").includes(needle)||
       (draft.files[item.key]||"").toLocaleLowerCase("no").includes(needle));
   fileCount.textContent=visible.length+" av "+candidates.length+" filreferanser";
   for(const item of visible)inputRow(list,item,"files");
 }
 function renderCourse(){
   const course=selectedCourse();if(!course)return;
   const prefix=course.semester+"/"+course.code;
   const current=editorCandidates(course);
   const titleContainer=document.getElementById("course-fields");
   titleContainer.replaceChildren();
   inputRow(titleContainer,{key:prefix,original:course.title,path:course.code},
     "courses","title");
   inputRow(titleContainer,{key:prefix,original:"Beskrivelse",path:""},
     "courses","description");
   for(const [type,items] of [["sections",current.sections],["folders",current.folders]]){
     const holder=document.getElementById(type==="sections"?
       "section-fields":"folder-fields");holder.replaceChildren();
     for(const item of items)inputRow(holder,item,type);
     if(!items.length){
       const p=document.createElement("p");p.className="help";
       p.textContent="Ingen "+(type==="sections"?"seksjoner":"undermapper")+
         " er registrert ennå.";
       holder.append(p);
     }
   }
   renderFileRows();
 }
 function renderCourses(){
   const semester=manifest.semesters.find(s=>String(s.id)===semesterSelect.value);
   const previous=courseSelect.value;
   courseSelect.replaceChildren();
   const friendly=applyNTNUDisplayNames(manifest,draft).semesters
     .find(s=>s.id===semester.id);
   for(const course of friendly.courses)option(courseSelect,course.code,course.title);
   if(friendly.courses.some(c=>c.code===previous))courseSelect.value=previous;
   renderCourse();
 }

 for(const semester of manifest.semesters)option(semesterSelect,semester.id,semester.label);
 semesterSelect.addEventListener("change",()=>{search.value="";renderCourses()});
 courseSelect.addEventListener("change",()=>{search.value="";renderCourse()});
 search.addEventListener("input",renderFileRows);
 async function getJSON(){
   const output=exportAliases(draft,manifest);
   status.textContent="Navnefil validert. "+(dirty?"Publiser den til GitHub for å dele endringene.":"Ingen lokale endringer.");
   return output;
 }
 document.getElementById("download").addEventListener("click",async()=>{
   try{
     const blob=new Blob([await getJSON()],{type:"application/json;charset=utf-8"});
     const url=URL.createObjectURL(blob);
     const a=document.createElement("a");a.href=url;a.download="ntnu-display-names.json";
     document.body.append(a);a.click();a.remove();
     window.setTimeout(()=>URL.revokeObjectURL(url),30000);
   }catch(error){status.textContent="Kan ikke eksportere: "+error.message}
 });
 document.getElementById("copy").addEventListener("click",async()=>{
   try{
     await navigator.clipboard.writeText(await getJSON());
     status.textContent="Navnefilen er kopiert. Lim den inn i GitHub-filen for publisering.";
   }catch(error){status.textContent="Kopiering mislyktes: "+error.message}
 });
 document.getElementById("reset").addEventListener("click",()=>{
   if(dirty&&!window.confirm("Forkaste alle lokale navneendringer?"))return;
   draft=JSON.parse(exportAliases(initial,manifest));
   dirty=false;status.textContent="Navnene er tilbakestilt til GitHub-versjonen.";
   renderCourses();
 });
 window.addEventListener("beforeunload",event=>{
   if(!dirty)return;
   event.preventDefault();
   event.returnValue="";
 });
 root.hidden=false;
 renderCourses();
 status.textContent=manifest.semesters.reduce((n,s)=>n+s.courses.length,0)+
   " offentlige fag lastet inn. Endringer lagres ikke før du publiserer JSON på GitHub.";
}

if(typeof document!=="undefined"&&document.getElementById("editor")){
 initializeEditor().catch(error=>{
   document.getElementById("editor-status").textContent=
     "Kunne ikke laste navneeditor: "+String(error?.message||error);
 });
}
