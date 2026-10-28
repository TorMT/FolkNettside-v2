import {escapeHTML as esc} from "../viewers/utils.js?v=ff51b5daa35664ca28a23c24f1a3361797476be3";
import {checkCourseAdmin,saveCourseLabel,deleteCourseLabel} from "../platform/folk-course-admin.js?v=ff51b5daa35664ca28a23c24f1a3361797476be3";
import {getFolkAccountSnapshot} from "../platform/folkside-auth.js?v=ff51b5daa35664ca28a23c24f1a3361797476be3";

export function courseAdminTargets(course){
  if(!course||!Number.isInteger(Number(course.semester))||!course.code)return [];
  const prefix=course.semester+"/"+course.code;
  const result=[
    {kind:"course-title",key:prefix,title:"Fagnavn",value:course.title||""},
    {kind:"course-description",key:prefix,title:"Fagbeskrivelse",value:course.description||""}
  ];
  const sections=new Set();
  for(const item of course.resources||[]){
    const original=item.originalSection||item.section;
    if(original&&!sections.has(original)){
      sections.add(original);
      result.push({kind:"section",key:prefix+"/"+original,
        title:"Seksjon: "+original,value:item.section||original});
    }
  }
  for(const item of course.resources||[]){
    if(!item.relativePath)continue;
    result.push({kind:"file",key:prefix+"/"+item.relativePath,
      title:"Fil: "+item.name,value:item.label||item.name});
  }
  return result;
}

export async function mountCourseAdmin(host,{semesters=[]}={}){
  if(!host)return;
  const account=getFolkAccountSnapshot();
  if(account.status!=="signed-in"){
    host.innerHTML='<p>Logg inn med FolkNet-kontoen under <a href="#/settings/connections">Innstillinger → Konto og tilkoblinger</a> for å redigere kurs.</p>';
    return;
  }
  host.textContent="Kontrollerer administratorrettigheter …";
  let admin;
  try{admin=await checkCourseAdmin()}catch(error){
    if(host.isConnected)host.textContent="Kan ikke kontrollere adminrettigheter: "+String(error.message||error);
    return;
  }
  if(!host.isConnected)return;
  if(!admin){
    host.innerHTML='<p>Denne kontoen har ikke administratorrettigheter. Bare en konto som er gitt tilgang i Supabase kan endre fagdata.</p>';
    return;
  }
  const courses=semesters.flatMap(semester=>(semester.courses||[])
    .map(course=>({...course,semester:Number(semester.id)})));
  if(!courses.length){host.textContent="Ingen fag er tilgjengelige.";return}
  host.innerHTML='<div class="course-admin">'+
    '<p>Her endres bare navn og beskrivelser som vises på FolkNettside. Originalfiler og stier på NTNU forblir urørt.</p>'+
    '<label for="admin-course-select">Fag</label>'+
    '<select id="admin-course-select">'+courses.map((course,index)=>
      '<option value="'+index+'">'+esc(course.semester+" · "+course.title)+'</option>').join("")+'</select>'+
    '<label for="admin-target-select">Hva skal endres?</label>'+
    '<select id="admin-target-select"></select>'+
    '<label for="admin-label-value">Nytt visningsnavn / beskrivelse</label>'+
    '<textarea rows="3" id="admin-label-value" maxlength="300" spellcheck="true"></textarea>'+
    '<div class="course-admin-actions">'+
      '<button class="btn primary" id="admin-save-label" type="button">Lagre i Supabase</button>'+
      '<button class="btn" id="admin-delete-label" type="button">Tilbakestill til standardnavn</button>'+
    '</div><p id="admin-status" role="status"></p></div>';
  const courseSelect=host.querySelector("#admin-course-select");
  const targetSelect=host.querySelector("#admin-target-select");
  const input=host.querySelector("#admin-label-value");
  const status=host.querySelector("#admin-status");
  const save=host.querySelector("#admin-save-label");
  const reset=host.querySelector("#admin-delete-label");
  let targets=[];
  const selected=()=>targets[Number(targetSelect.value)]||null;
  const showValue=()=>{
    const item=selected();
    input.value=item?.value||"";
    input.maxLength=item?.kind==="course-description"?300:item?.kind==="course-title"?130:160;
    status.textContent="";
  };
  const showCourse=()=>{
    targets=courseAdminTargets(courses[Number(courseSelect.value)]).filter(item=>item.key);
    targetSelect.innerHTML=targets.map((item,index)=>
      '<option value="'+index+'">'+esc(item.title)+'</option>').join("");
    showValue();
  };
  const busy=on=>{save.disabled=on;reset.disabled=on;courseSelect.disabled=on;targetSelect.disabled=on;};
  const perform=async(remove=false)=>{
    const item=selected();
    if(!item)return;
    const value=input.value.trim();
    if(!remove&&(!value||value.length>input.maxLength)){status.textContent="Ugyldig eller tom verdi.";return}
    if(remove&&!window.confirm("Fjerne denne overstyringen? Standardnavnet blir brukt igjen."))return;
    busy(true);
    status.textContent=remove?"Tilbakestiller …":"Lagrer …";
    try{
      if(remove)await deleteCourseLabel(item);
      else await saveCourseLabel({kind:item.kind,key:item.key,label:value});
      if(!host.isConnected)return;
      status.textContent="Endringen er lagret. Oppdaterer kursoversikten …";
      window.location.reload();
    }catch(error){
      if(host.isConnected)status.textContent=String(error.message||error);
      busy(false);
    }
  };
  courseSelect.addEventListener("change",showCourse);
  targetSelect.addEventListener("change",showValue);
  save.addEventListener("click",()=>perform());
  reset.addEventListener("click",()=>perform(true));
  showCourse();
}
