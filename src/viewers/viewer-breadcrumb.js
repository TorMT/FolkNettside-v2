import {escapeHTML} from "./utils.js?v=af205f8fa5f9c95418543446d58c9f0db93f34d9";

/** Links are derived exclusively from an already loaded/validated course. */
export function viewerBreadcrumbHTML(resource={}){
  const semester=Number(resource.semester);
  const code=String(resource.courseCode||"");
  const valid=Number.isInteger(semester)&&semester>=1&&semester<=20&&
    Boolean(code)&&code.length<=210&&!/[\\/%?#\u0000-\u001f]/.test(code);
  const section=String(resource.section||"");
  const index=Number(resource.sectionIndex);
  const base=valid?`#/courses/${semester}/${encodeURIComponent(code)}`:null;
  const link=(href,label)=>`<a href="${escapeHTML(href)}">${escapeHTML(label)}</a>`;
  const items=[link("#/courses","Courses")];
  if(valid){
    items.push(link(`#/courses/${semester}`,`Semester ${semester}`));
    items.push(link(base,resource.courseTitle||code));
    if(section){
      if(Number.isInteger(index)&&index>=0&&index<=999)
        items.push(link(base+`/section/${index}`,section));
      else items.push(`<span>${escapeHTML(section)}</span>`);
    }
  }
  return `<nav class="viewer-breadcrumb" aria-label="Brødsmulesti">${items.join('<span aria-hidden="true"> / </span>')}</nav>`;
}
