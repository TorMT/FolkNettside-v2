/**
 * NTNU same-origin course catalog. The existing webedit server owns the
 * originals; V2 never mirrors their bytes into GitHub or downloads them to
 * assemble a manifest. This only runs on the exact, trusted NTNU host.
 */
export const NTNU_ORIGIN="https://tormt.folk.ntnu.no";
const PRIVATE=/(?:beskyttet|protected|private|privat|restricted|hemmelig|secrets?|credentials|passord)/i;
const SAFE_FILE_TYPES=Object.freeze({
 pdf:"PDF",md:"MD",txt:"TXT",py:"PY",ipynb:"IPYNB",js:"JS",mjs:"JS",
 html:"HTML",htm:"HTML",json:"JSON",csv:"CSV",xlsx:"XLSX",xls:"XLS",
 docx:"DOCX",doc:"DOC",pptx:"PPTX",ppt:"PPT",tex:"TEX",
 png:"IMAGE",jpg:"IMAGE",jpeg:"IMAGE",svg:"IMAGE",webp:"IMAGE",
 mp4:"VIDEO",webm:"VIDEO",mov:"VIDEO",mp3:"AUDIO",wav:"AUDIO",
 zip:"ZIP",stl:"STL","3mf":"3MF",obj:"OBJ",glb:"GLB",gltf:"GLTF",
 f3z:"F3Z",f3d:"F3D",step:"STEP",stp:"STEP",iges:"IGES",igs:"IGES",
 w10:"W10",z012rs:"Z012RS",z014rs:"Z014RS"
});
const object=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
const safePiece=v=>typeof v==="string"&&v.length>0&&v.length<=210&&
 ![".",".."].includes(v)&&!v.startsWith(".")&&!v.startsWith("~$")&&
 !/[\\/%?#\u0000-\u001f\u007f]/.test(v)&&!PRIVATE.test(v);
const segments=path=>{
 if(typeof path!=="string"||path.length>1400||!path||
   path.startsWith("/")||path.includes("\\")||path.includes("%")||
   path.includes("?")||path.includes("#"))return null;
 const parts=path.split("/");
 return parts.every(safePiece)?parts:null;
};
const pretty=s=>String(s).replace(/[-_]+/g," ").replace(/([a-z])([A-Z])/g,"$1 $2").trim();
const readKind=name=>{
 const match=/\.([a-z0-9]+)$/i.exec(name);
 return SAFE_FILE_TYPES[match?.[1]?.toLowerCase()]||"FILE";
};
const label=s=>pretty(s.replace(/\.[^.]+$/,""));
const encodePath=parts=>parts.map(encodeURIComponent).join("/");
const uniqueList=entries=>[...new Set(entries)];

export function onNTNUHost(hostname){
 return String(hostname||"").toLowerCase()==="tormt.folk.ntnu.no";
}
export function parseNTNUNavbarTitles(html,origin=NTNU_ORIGIN){
 // DOMParser is only used for parsing, never to insert V1 HTML into V2.
 if(typeof DOMParser==="undefined"||typeof html!=="string")return new Map();
 const doc=new DOMParser().parseFromString(html.slice(0,250_000),"text/html");
 const titles=new Map();
 for(const a of doc.querySelectorAll("a[href]")){
   try{
     const u=new URL(a.getAttribute("href"),origin);
     const match=/^\/semestre\/(\d{1,2})\/([^/]+)\/index\.html$/.exec(u.pathname);
     if(u.origin!==origin||!match||u.search||u.hash)continue;
     const slug=decodeURIComponent(match[2]);
     if(!safePiece(slug))continue;
     const title=a.textContent.trim().replace(/\s+/g," ").slice(0,130);
     if(title)titles.set(match[1]+":"+slug,title);
   }catch{}
 }
 return titles;
}
/** Parse an existing /semestre/N/index.json into V2's stable course schema. */
export function parseNTNUSemesterIndex(semesterId,raw,{titles=new Map(),origin=NTNU_ORIGIN}={}){
 const sid=Number(semesterId);
 if(!Number.isInteger(sid)||sid<1||sid>20||!object(raw))
   throw Error("Invalid NTNU semester index");
 const courses=[];
 for(const [slug,record] of Object.entries(raw)){
   if(slug==="welcome"||!safePiece(slug)||!object(record)||
      record.beskyttet===true)continue;
   if(record.dir!==undefined&&record.dir!==slug)continue;
   const indexed=Array.isArray(record.files)?record.files:[];
   const quizRef=typeof record.quiz==="string"?record.quiz:null;
   if(!Array.isArray(record.files)&&!quizRef)continue;
   if(indexed.length>20_000)throw Error("NTNU course index has excessive entries");
   // Legacy NTNU indexes register the interactive quiz separately as
   // record.quiz = "quiz/quiz.json", not inside record.files.
   // Keep one combined resource list, without touching quiz content here.
   const referenced=quizRef?[...indexed,quizRef]:indexed;
   const resources=[];
   const seen=new Set();
   for(const file of referenced){
     const parts=segments(file);
     if(!parts||seen.has(file))continue;
     seen.add(file);
     const filename=parts.at(-1);
     // Bare filenames such as "Øving7.pdf" belong to the Øving 7
     // section even when the NTNU server has not put them in a folder.
     // Preserve an existing Øving folder grouping if one is present.
     const exercise=/^(?:øving|oving|øvelse|ovelse)[\s._-]*(\d{1,3})(?=$|[\s._(-])/iu
       .exec(filename.replace(/\.[^.]+$/,""));
     const baseSection=parts[0]==="filer"?
       (parts[1]&&parts.length>2?parts[1]:"Filer og ressurser"):
       parts[0]==="quiz"?"Quiz":pretty(parts[0]);
     const section=parts[0]==="filer"&&exercise&&
       !(parts.length>2&&/^(?:øving|oving|øvelse|ovelse)[\s._-]*\d/iu.test(parts[1]||""))
       ?"Øving "+Number(exercise[1]):baseSection;
     const folders=parts[0]==="filer"?
       (parts.length>3?parts.slice(2,-1):[]):
       (parts.length>2?parts.slice(1,-1):[]);
     const path="/semestre/"+sid+"/"+encodeURIComponent(slug)+"/"+encodePath(parts);
     const url=new URL(path,origin);
     if(url.origin!==origin||!url.pathname.startsWith("/semestre/"+sid+"/"))
       continue;
     // Existing NTNU quiz files use V1's text/options/answer[] format.
     // Route their JSON through the interactive quiz viewer, not raw text.
     // Auxiliary attribution JSON remains a normal file.
     const isQuiz=parts[0]?.toLowerCase()==="quiz"&&parts.length===2&&
       /^quiz(?:_[a-z0-9-]+)?\.json$/i.test(filename);
     resources.push({
       source:"ntnu",section,folders,
       name:filename,label:label(filename),relativePath:file,
       path:url.pathname,url:url.toString(),kind:isQuiz?"QUIZ":readKind(filename)
     });
   }
   resources.sort((a,b)=>a.section.localeCompare(b.section,"no")||
      a.relativePath.localeCompare(b.relativePath,"no",{numeric:true}));
   const title=titles.get(sid+":"+slug)||pretty(slug);
   courses.push({
     semester:sid,code:slug,title,
     description:"Originalfiler på NTNU-serveren · ingen GitHub-kopier",
     tags:["NTNU"],
     sections:uniqueList(resources.map(x=>x.section)),
     resources
   });
 }
 courses.sort((a,b)=>a.title.localeCompare(b.title,"no",{numeric:true}));
 return {id:sid,label:"Semester "+sid,courses};
}

async function readIndex(url,{fetchImpl,origin}){
 const parsed=new URL(url,origin);
 if(parsed.origin!==origin||!/^\/semestre\/(?:index\.json|\d{1,2}\/index\.json)$/.test(parsed.pathname))
   throw Error("Unapproved NTNU index endpoint");
 const response=await fetchImpl(parsed.href,{
   cache:"no-store",credentials:"same-origin",mode:"same-origin",
   redirect:"error",headers:{Accept:"application/json"}
 });
 if(!response.ok)throw Error("NTNU index HTTP "+response.status);
 const raw=await response.text();
 if(raw.length>4_000_000)throw Error("NTNU index exceeds safety limit");
 try{return JSON.parse(raw)}catch{throw Error("Malformed NTNU JSON index")}
}
export async function loadNTNUCatalog({fetchImpl=fetch,origin=NTNU_ORIGIN,
  navbarHtml=""}={}){
 if(origin!==NTNU_ORIGIN)throw Error("Unexpected NTNU catalog origin");
 const root=await readIndex("/semestre/index.json",{fetchImpl,origin});
 if(!object(root))throw Error("Invalid NTNU catalog root");
 const ids=Object.keys(root).filter(x=>/^\d{1,2}$/.test(x)&&
   Number(x)>=1&&Number(x)<=20&&root[x]?.beskyttet!==true)
   .map(Number).sort((a,b)=>a-b);
 if(!ids.length)throw Error("NTNU index declares no public semesters");
 let titles=new Map();
 if(navbarHtml)titles=parseNTNUNavbarTitles(navbarHtml,origin);
 // Each semester-specific index includes course filenames and nested folders.
 // Root-level /semestre/index.json may contain only a tiny subset for S5.
 const settled=await Promise.allSettled(ids.map(async id=>{
   const data=await readIndex("/semestre/"+id+"/index.json",{fetchImpl,origin});
   return parseNTNUSemesterIndex(id,data,{titles,origin});
 }));
 const semesters=[],failed=[];
 settled.forEach((item,i)=>item.status==="fulfilled"?
   semesters.push(item.value):failed.push(ids[i]));
 if(!semesters.length)throw Error("Every NTNU semester index failed to load");
 return {schemaVersion:2,source:"ntnu-same-origin",semesters,
   status:failed.length?"partial":"live",failedSemesters:failed};
}
