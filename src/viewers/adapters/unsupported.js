import {escapeHTML,extension} from "../utils.js?v=c31a0d930ade8837c9d0a52442369d82a6295e73";
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
