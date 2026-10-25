/**
 * A partial NTNU index read is not the same as an empty public semester.
 * Keep successful course data, name failed semester numbers (never URLs or
 * course filenames), and let users navigate to successful semesters.
 *
 * No stale file references are cached or resurrected here: NTNU may have
 * revoked public access since a previous visit.
 */
export function failedNTNUSemesters(source){
  if(source?.mode!=="ntnu"||source.status!=="partial"||
     !Array.isArray(source.failedSemesters))return [];
  return [...new Set(source.failedSemesters.filter(
    id=>Number.isInteger(id)&&id>=1&&id<=20))].sort((a,b)=>a-b);
}

/** Explicit semester links always win; the initial overview prefers a loaded semester. */
export function initialCourseSemester(semesters,source,{requested,preferred}={}){
  const list=Array.isArray(semesters)?semesters:[];
  const byId=id=>list.find(s=>Number(s.id)===id);
  const number=id=>Number.isInteger(Number(id))&&Number(id)>0?Number(id):null;
  const requestedId=number(requested);
  if(requested!=null&&requested!==""&&byId(requestedId))return requestedId;
  const preferredId=number(preferred);
  const unavailable=new Set(failedNTNUSemesters(source));
  const available=list.filter(s=>!unavailable.has(Number(s.id))&&
    Array.isArray(s.courses)&&s.courses.length>0);
  if(preferredId&&available.some(s=>Number(s.id)===preferredId))return preferredId;
  if(available.length)return Number(available[0].id);
  if(preferredId&&byId(preferredId))return preferredId;
  return Number(list[0]?.id)||1;
}

export function courseCatalogWarningHTML(source){
  if(source?.mode!=="ntnu")return "";
  if(source.status==="partial"){
    const failed=failedNTNUSemesters(source);
    const names=failed.map(id=>"S"+id).join(", ");
    return `<div class="course-source-warning" role="status" aria-live="polite">
      <strong>En del av NTNUs kursoversikt kunne ikke oppdateres.</strong>
      <p>${failed.length?`Utilgjengelige semestre: ${names}. `:""}
      Fag fra semestre som kunne leses, vises fortsatt. Ingen originale kursfiler er endret.</p>
    </div>`;
  }
  if(source.status==="unavailable"){
    return `<div class="course-source-warning" role="status" aria-live="polite">
      <strong>NTNUs kursoversikt kunne ikke lastes.</strong>
      <p>Prøv å åpne siden på nytt senere. Ingen originale kursfiler er endret.</p>
    </div>`;
  }
  return "";
}

export function emptySemesterHTML(semester,source){
  const id=Number(semester?.id);
  if(failedNTNUSemesters(source).includes(id)){
    return `<div class="course-header course-semester-unavailable" role="status">
      <h3>Semester ${id} kunne ikke oppdateres</h3>
      <p>NTNUs offentlige indeks for dette semesteret svarte ikke. Det betyr ikke at
      fagene eller filene er slettet. Velg et annet semester over, eller prøv igjen senere.</p>
    </div>`;
  }
  if(source?.mode==="ntnu"&&source.status==="unavailable"){
    return '<div class="course-header"><h3>Kursdata er midlertidig utilgjengelige.</h3><p>Prøv å åpne siden på nytt senere. Dette betyr ikke at originalfilene er slettet.</p></div>';
  }
  if(source?.mode==="github-ntnu"||source?.mode==="ntnu"){
    return '<div class="course-header"><h3>Ingen offentlige fag registrert i dette semesteret ennå.</h3><p>Når det opprettes og godkjennes offentlige fag på NTNU, kan de vises her uten å kopiere kursfilene til GitHub.</p></div>';
  }
  return '<div class="course-header"><h3>Ingen eksempeldata i dette semesteret ennå.</h3><p>Forhåndsvisningen inneholder bare et begrenset utvalg av testressurser.</p></div>';
}
