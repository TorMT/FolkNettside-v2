/** Append the owner's standalone pitch-drive model to the verified course, without touching NTNU files. */
export const PITCH_DRIVE_MODEL_PATH="./assets/pitch-drive/planetgirdrift-3d.html";
export const PITCH_DRIVE_COURSE="marin-machinery-design-and-condition-monitoring";

export function addPitchDriveCourseModel(manifest){
  if(!manifest||!Array.isArray(manifest.semesters))return manifest;
  return {...manifest,semesters:manifest.semesters.map(semester=>{
    if(Number(semester.id)!==5)return semester;
    return {...semester,courses:(semester.courses||[]).map(course=>{
      if(course.code!==PITCH_DRIVE_COURSE)return course;
      const resource={
        id:"v2-pitch-drive-full-model",
        name:"planetgirdrift-3d.html",
        label:"Full modell",
        description:"Interaktiv 3D-modell av pitch drive med motor, brems, tre planetgirtrinn, lagre, pinjong og innvendig ringgir.",
        section:"Modeller",
        folders:["Pitch drive-prosjekt"],
        originalFolders:["Pitch drive-prosjekt"],
        relativePath:"Modeller/planetgirdrift-3d.html",
        path:PITCH_DRIVE_MODEL_PATH,
        url:PITCH_DRIVE_MODEL_PATH,
        kind:"HTML",
        source:"site",
        size:13868,
        modified:"2026-10-26T00:00:00+01:00"
      };
      return {...course,
        sections:[...new Set([...(course.sections||[]),"Modeller"])],
        resources:[...(course.resources||[]).filter(item=>item.id!==resource.id),resource]
      };
    })};
  })};
}
