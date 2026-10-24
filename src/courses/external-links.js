export function normalizeCourseCode(value){
  const code=String(value||"").trim().toUpperCase();
  if(!/^[A-ZÆØÅ]{2,6}\d{3,5}[A-Z]?$/.test(code)){
    throw new Error("Invalid course code");
  }
  return code;
}

export function karakterwebUrl(courseCode){
  const code=normalizeCourseCode(courseCode);
  return `https://karakterweb.no/ntnu/${encodeURIComponent(code)}`;
}

/** A legacy NTNU folder slug is not necessarily a registered course code. */
export function optionalKarakterwebUrl(courseCode){
  try{return karakterwebUrl(courseCode)}catch{return null}
}

export function courseExternalLinks(courseCode){
  const code=normalizeCourseCode(courseCode);
  return [{
    id:"karakterweb",
    label:"Karakterweb",
    description:`Grade statistics for ${code}`,
    url:karakterwebUrl(code),
    external:true
  }];
}
