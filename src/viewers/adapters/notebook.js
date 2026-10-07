import {escapeHTML,fetchJSON} from "../utils.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8";
import {createDomFinder} from "../dom-search.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8";

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
