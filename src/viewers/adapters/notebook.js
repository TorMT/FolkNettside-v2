import {escapeHTML,fetchJSON} from "../utils.js?v=634ad8a5914465c1e005c6866964328b8a95df46";
import {createDomFinder} from "../dom-search.js?v=634ad8a5914465c1e005c6866964328b8a95df46";

function renderOutput(output){
  if(Array.isArray(output?.text)) return `<pre>${escapeHTML(output.text.join(""))}</pre>`;
  if(typeof output?.text==="string") return `<pre>${escapeHTML(output.text)}</pre>`;
  const plain=output?.data?.["text/plain"];
  if(Array.isArray(plain)) return `<pre>${escapeHTML(plain.join(""))}</pre>`;
  if(typeof plain==="string") return `<pre>${escapeHTML(plain)}</pre>`;
  return "";
}

export async function render(container,resource){
  const notebook=await fetchJSON(resource.path);
  const cells=Array.isArray(notebook.cells)?notebook.cells:[];

  container.innerHTML=`<div class="notebook">${cells.map((cell,index)=>`
    <section class="nb-cell">
      <div class="nb-kind">${escapeHTML(cell.cell_type||"cell")} · cell ${index+1}</div>
      <div class="nb-body">
        <pre>${escapeHTML((cell.source||[]).join(""))}</pre>
        ${(cell.outputs||[]).map(renderOutput).join("")}
      </div>
    </section>`).join("")}</div>`;

  return {info:`${cells.length} cells`,actions:{find:createDomFinder(container)}};
}
