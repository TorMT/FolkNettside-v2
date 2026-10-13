import {onNTNUHost} from "./courses/ntnu-catalog.js?v=6d607086d97957cd2aad874d59cc9c70ebaac62b";
import {loadPreferredNTNUCatalog} from "./courses/ntnu-autocatalog.js?v=6d607086d97957cd2aad874d59cc9c70ebaac62b";

let cache;

async function readJSON(path) {
  const response = await fetch(path, {cache: "no-cache"});
  if (!response.ok) throw new Error(`Failed to load ${path}: HTTP ${response.status}`);
  return response.json();
}

function flattenCourses(manifest) {
  return manifest.semesters.flatMap(semester =>
    semester.courses.map(course => ({
      ...course,
      semester: semester.id
    }))
  );
}

export async function loadContent() {
  if (cache) return cache;

  const [site, baseManifest, model, gunnerusModel, projects] = await Promise.all([
    readJSON("./config/site.json"),
    readJSON("./data/content-manifest.json"),
    readJSON("./data/demo-model.json"),
    readJSON("./data/gunnerus-model.json"),
    readJSON("./data/projects.json")
  ]);
  let manifest=baseManifest;
  let courseSource={mode:"preview",status:"demo",failedSemesters:[]};
  if(onNTNUHost(globalThis.location?.hostname)){
    try{
      let navbarHtml="";
      try{
        const response=await fetch("/includes/navbar.html",{
          credentials:"same-origin",mode:"same-origin",cache:"no-store",redirect:"error"
        });
        if(response.ok)navbarHtml=(await response.text()).slice(0,250_000);
      }catch{ /* Course labels fall back to NTNU directory names. */ }
      const catalog=await loadPreferredNTNUCatalog({navbarHtml});
      manifest=catalog.manifest;
      courseSource={mode:"ntnu",status:manifest.status,
        catalogSource:catalog.source,fallback:catalog.fallback,
        failedSemesters:manifest.failedSemesters};
    }catch{
      // A tiny synthetic GitHub demo must never masquerade as the NTNU archive.
      manifest={schemaVersion:2,source:"ntnu-same-origin",semesters:[]};
      courseSource={mode:"ntnu",status:"unavailable",failedSemesters:[]};
    }
  }
  const models=[
    {id:model.id||"fixture",label:model.label||model.name,...model},
    {id:gunnerusModel.id||"gunnerus",label:gunnerusModel.label||gunnerusModel.name,...gunnerusModel}
  ];

  const manifestBySemester = new Map(manifest.semesters.map(s => [Number(s.id), s]));
  const semesters = site.semesterOrder.map(id => {
    const found = manifestBySemester.get(Number(id));
    return found || {id: Number(id), label: `Semester ${id}`, courses: []};
  });

  const courses = flattenCourses({semesters});
  const resources = courses.flatMap(course =>
    course.resources.map(item => ({...item, courseCode: course.code, semester: course.semester}))
  );

  cache = {
    site,
    manifest,
    courseSource,
    semesters,
    courses,
    resources,
    model,
    models,
    projects,
    components: model.components,
    navLabels: {courses: site.coursesLabel || "Courses"}
  };
  return cache;
}

export function clearContentCache() {
  cache = undefined;
}
