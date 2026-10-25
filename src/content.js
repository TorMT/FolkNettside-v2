import {onNTNUHost} from "./courses/ntnu-catalog.js?v=1c0dceae9bc922bebf73eab9f6487dd3ab3fe668";
import {loadNTNUAutoCatalog,loadPreferredNTNUCatalog} from "./courses/ntnu-autocatalog.js?v=1c0dceae9bc922bebf73eab9f6487dd3ab3fe668";
import {loadPublicCourseLabels,mergeCloudCourseLabels} from "./platform/folk-course-admin.js?v=1c0dceae9bc922bebf73eab9f6487dd3ab3fe668";
import {applyNTNUDisplayNames} from "./courses/ntnu-display-names.js?v=1c0dceae9bc922bebf73eab9f6487dd3ab3fe668";
import {applyNTNUCourseVisibility} from "./courses/course-visibility.js?v=1c0dceae9bc922bebf73eab9f6487dd3ab3fe668";

export function onGithubPagesArchive(hostname,pathname){
 return String(hostname||"").toLowerCase()==="tormt.github.io"&&
   (String(pathname||"")==="/FolkNettside-v2"||
    String(pathname||"").startsWith("/FolkNettside-v2/"));
}

/** Remap file-byte URLs to original NTNU on Pages, not Pages /semestre. */
export function asRemoteNTNUManifest(manifest){
 return {...manifest,source:"ntnu-github-pages-references",
   semesters:manifest.semesters.map(semester=>({...semester,
     courses:semester.courses.map(course=>({...course,
       resources:course.resources.map(resource=>({
         ...resource,originalPath:resource.path,
         path:resource.url,remoteArchive:true
       }))
     }))
   }))};
}

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
  if(onGithubPagesArchive(globalThis.location?.hostname,
    globalThis.location?.pathname)){
    try{
      const live=await loadNTNUAutoCatalog();
      manifest=asRemoteNTNUManifest(live);
      courseSource={mode:"github-ntnu",status:"remote",
        failedSemesters:[],catalogSource:"github-scheduled"};
    }catch{
      // Preview remains clearly labelled fixture data until first successful
      // hourly scan; never invent a live NTNU course.
      courseSource={mode:"preview",status:"demo",
        failedSemesters:[],catalogSource:"example"};
    }
  }

  // Friendly labels are independent of original NTNU filenames and URLs.
  // A malformed optional alias file never hides approved public subjects.
  if(courseSource.mode==="ntnu"||courseSource.mode==="github-ntnu"){
    try{
      const aliases=await readJSON("./config/ntnu-display-names.json");
      let selectedNames=aliases;
      try{
        const cloud=await loadPublicCourseLabels({
          fetchImpl:(url,options)=>fetch(url,{...options,
            signal:AbortSignal.timeout(3500)})
        });
        if(cloud.length)selectedNames=mergeCloudCourseLabels(aliases,cloud);
      }catch{
        // The optional Supabase table may be uninstalled or offline. The
        // checked-in aliases remain authoritative until cloud is available.
      }
      manifest=applyNTNUDisplayNames(manifest,selectedNames);
    }catch(error){
      console.warn("NTNU display names unavailable; original labels are retained.",error);
    }
  }

  if(courseSource.mode==="ntnu"||courseSource.mode==="github-ntnu"){
    try{
      const visibility=await readJSON("./config/ntnu-course-visibility.json");
      manifest=applyNTNUCourseVisibility(manifest,visibility);
    }catch(error){
      console.warn("Optional V2 course visibility settings unavailable.",error);
    }
  }

  const models=[
    {id:model.id||"fixture",label:model.label||model.name,...model},
    {id:gunnerusModel.id||"gunnerus",label:gunnerusModel.label||gunnerusModel.name,...gunnerusModel}
  ];

  // Presentation-only exclusion requested for V2. Never remove any
  // original NTNU folders, aliases, or auto-index data.
  if(courseSource.mode==="github-ntnu"||courseSource.mode==="ntnu"){
    manifest={...manifest,semesters:manifest.semesters.map(s=>({
      ...s,courses:s.courses.filter(c=>!(Number(s.id)===5&&c.code==="marin-maskineri"))
    }))};
  }

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
