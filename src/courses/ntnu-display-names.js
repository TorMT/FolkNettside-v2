/**
 * NTNU display names are a cosmetic overlay. Course slugs, original filenames,
 * relative paths and URLs must never change: old links/progress remain valid.
 *
 * Canonical alias keys use original, case-sensitive names:
 *   courses["5/Marin-Dynamikk"].title
 *   sections["5/Marin-Dynamikk/Øving3"]
 *   folders["5/Marin-Dynamikk/filer/Øving3/oppgave2"]
 *   files["5/Marin-Dynamikk/filer/Øving3/const_avg_acc.py"]
 */
const object=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
const FIELDS=["courses","sections","folders","files"];
const aliasText=(text,max=160)=>{
 if(typeof text!=="string"||!text.trim()||text.length>max||
   /[<>\u0000-\u001f\u007f]/.test(text))
   throw Error("Invalid NTNU display name");
 return text.trim();
};

function validKey(key,minimumParts){
 if(typeof key!=="string"||key.length>1600)return false;
 const parts=key.split("/");
 if(parts.length<minimumParts)return false;
 const sid=Number(parts[0]);
 if(!/^\d{1,2}$/.test(parts[0])||!Number.isInteger(sid)||sid<1||sid>20)
   return false;
 return parts.slice(1).every(p=>p&&p!=="."&&p!==".."&&
   !p.startsWith(".")&&!p.startsWith("~$")&&p.length<=210&&
   !/[\\%?#\u0000-\u001f\u007f]/.test(p));
}

export function validateNTNUDisplayNames(raw){
 if(!object(raw)||raw.schemaVersion!==1)throw Error("Unsupported NTNU name-config schema");
 const normalized={schemaVersion:1,courses:{},sections:{},folders:{},files:{}};
 for(const field of FIELDS){
   const source=raw[field]??{};
   if(!object(source)||Object.keys(source).length>10000)
     throw Error("Invalid NTNU display-name map: "+field);
   for(const [key,value] of Object.entries(source)){
     if(!validKey(key,field==="courses"?2:3))
       throw Error("Unsafe NTNU display-name key: "+key);
     if(field==="courses"){
       if(key.split("/").length!==2||!object(value)||
          !Object.keys(value).length||
          Object.keys(value).some(name=>!["title","description"].includes(name)))
         throw Error("Invalid course display-name override");
       normalized.courses[key]={
         ...(value.title!==undefined?{title:aliasText(value.title,130)}:{}),
         ...(value.description!==undefined?{description:aliasText(value.description,300)}:{})
       };
     }else{
       normalized[field][key]=aliasText(value);
     }
   }
 }
 return normalized;
}

export function applyNTNUDisplayNames(manifest,config){
 const overrides=validateNTNUDisplayNames(config);
 if(!object(manifest)||!Array.isArray(manifest.semesters))
   throw Error("Invalid NTNU course manifest");
 return {...manifest,semesters:manifest.semesters.map(semester=>({
   ...semester,
   courses:semester.courses.map(course=>{
     const key=semester.id+"/"+course.code;
     const custom=overrides.courses[key]||{};
     const originalSections=course.sections||[];
     const sections=originalSections.map(section=>
       overrides.sections[key+"/"+section]||section);
     if(new Set(sections).size!==sections.length)
       throw Error("Duplicate renamed section in "+key);
     const resources=(course.resources||[]).map(resource=>{
       const relative=resource.relativePath||"";
       const rawParts=relative.split("/");
       const originalFolders=Array.isArray(resource.folders)?
         resource.folders:[];
       const rootDepth=rawParts[0]==="filer"&&rawParts.length>=3?2:1;
       const folders=originalFolders.map((original,index)=>{
         const path=rawParts.slice(0,rootDepth+index+1).join("/");
         return overrides.folders[key+"/"+path]||original;
       });
       const alias=overrides.files[key+"/"+relative];
       const renamedSection=overrides.sections[key+"/"+resource.section]||resource.section;
       return {
         ...resource,
         originalLabel:resource.originalLabel||resource.label,
         originalSection:resource.originalSection||resource.section,
         originalFolders:resource.originalFolders||[...originalFolders],
         label:alias||resource.label,
         section:renamedSection,
         folders
       };
     });
     return {...course,
       originalTitle:course.originalTitle||course.title,
       title:custom.title||course.title,
       description:custom.description||course.description,
       sections,resources};
   }).sort((a,b)=>a.title.localeCompare(b.title,"no",{numeric:true}))
 }))};
}
