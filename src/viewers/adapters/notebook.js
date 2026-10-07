import {escapeHTML,fetchJSON} from "../utils.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e";
import {createDomFinder} from "../dom-search.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e";

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
