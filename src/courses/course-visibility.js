/**
 * Hide an explicitly selected legacy course in the V2 UI. Never mutate the
 * authoritative NTNU catalog; old original links and files remain intact.
 */
export function applyNTNUCourseVisibility(manifest,raw){
 if(!manifest||!Array.isArray(manifest.semesters)||
    !raw||raw.schemaVersion!==1||!Array.isArray(raw.hiddenCourses)||
    raw.hiddenCourses.length>100)
   throw Error("Invalid course visibility configuration");
 const hidden=new Set();
 for(const key of raw.hiddenCourses){
   const slug=typeof key==="string"?key.split("/")[1]:"";
   if(typeof key!=="string"||!/^([1-9]|1[0-9]|20)\/[A-Za-z0-9_\p{L}\p{N} .()\-]{1,210}$/u.test(key)||
      !slug||slug.startsWith(".")||slug.startsWith("~$")||
      /(?:beskyttet|protected|private|privat|secret|passord)/i.test(key)||
      hidden.has(key))
     throw Error("Invalid hidden course identifier");
   hidden.add(key);
 }
 return {...manifest,semesters:manifest.semesters.map(semester=>({
   ...semester,
   courses:semester.courses.filter(course=>!hidden.has(semester.id+"/"+course.code))
 }))};
}
