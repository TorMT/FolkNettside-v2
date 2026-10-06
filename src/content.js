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

  const [site, manifest, model, projects] = await Promise.all([
    readJSON("./config/site.json"),
    readJSON("./data/content-manifest.json"),
    readJSON("./data/demo-model.json"),
    readJSON("./data/projects.json")
  ]);

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
    semesters,
    courses,
    resources,
    model,
    projects,
    components: model.components,
    navLabels: {courses: site.coursesLabel || "Courses"}
  };
  return cache;
}

export function clearContentCache() {
  cache = undefined;
}
