import {escapeHTML,extension} from "../utils.js?v=6107a75ee9edc7a765b5fbcb07069998f2366f5d";
export async function render(container,resource){
  const ext=extension(resource.path||resource.url||resource.name||"");
  const path=resource.url||resource.path;
  container.innerHTML=`<section class="viewer-conversion-required">
    <h2>${escapeHTML(ext?ext.toUpperCase():"Unknown file type")}</h2>
    <p>No safe native browser preview is registered for this format.
    The original bytes have not been interpreted as text or geometry.</p>
    ${path?`<a class="btn" href="${escapeHTML(path)}" download>Download original file</a>`:""}
    <p class="muted">You can open the original in an appropriate desktop application.</p>
  </section>`;
  return {info:`Unsupported preview · ${ext||"unknown type"} · download available`};
}
