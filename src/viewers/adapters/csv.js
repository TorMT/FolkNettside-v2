import {escapeHTML,fetchText} from "../utils.js?v=17fdff0a6e45b58d67d4c9854bc5db012bbe4664";
import {createDomFinder} from "../dom-search.js?v=17fdff0a6e45b58d67d4c9854bc5db012bbe4664";
import {detectCSVDelimiter,filterDelimitedRows,parseDelimitedText} from "../csv-core.js?v=17fdff0a6e45b58d67d4c9854bc5db012bbe4664";

export async function render(container,resource){
  const source=await fetchText(resource.path||resource.url);
  const delimiter=detectCSVDelimiter(source,resource.path);
  const rows=parseDelimitedText(source,delimiter);
  const headers=rows[0]||[];
  const count=Math.max(0,rows.length-1);
  const maxColumns=rows.reduce((largest,row)=>Math.max(largest,row.length),headers.length);
  const header=Array.from({length:maxColumns},(_,i)=>headers[i]||"Column "+(i+1));
  const rowNumbers=new Map(rows.map((row,index)=>[row,index]));
  container.innerHTML=`<div class="csv-workbench">
    <div class="csv-workbench-toolbar">
      <strong>Delimited data</strong>
      <span class="csv-workbench-count">${count} rows · ${maxColumns} columns · separator ${delimiter==="\t"?"tab":escapeHTML(delimiter)}</span>
      <label>Filter rows <input type="search" class="csv-filter" placeholder="Search visible cells"></label>
      <button type="button" class="csv-toggle-raw" aria-pressed="false">Raw text</button>
    </div>
    <div class="table-wrap csv-workbench-scroll">
      <table class="data-table"><thead><tr><th>#</th>${header.map(col=>`<th>${escapeHTML(col)}</th>`).join("")}</tr></thead>
      <tbody></tbody></table>
      <pre class="csv-source-raw" hidden></pre>
      <p class="csv-no-results" hidden>No matching rows</p>
    </div>
  </div>`;
  const table=container.querySelector("table");
  const tbody=container.querySelector("tbody");
  const input=container.querySelector(".csv-filter");
  const countLabel=container.querySelector(".csv-workbench-count");
  const empty=container.querySelector(".csv-no-results");
  const raw=container.querySelector(".csv-source-raw");
  const toggle=container.querySelector(".csv-toggle-raw");
  raw.textContent=source;
  function update(){
    const match=filterDelimitedRows(rows,input.value).slice(1);
    // Bound DOM work; search always covers the full source and shows count.
    tbody.innerHTML=match.slice(0,1500).map((row,i)=>{
      const number=rowNumbers.get(row);
      return `<tr><td>${number}</td>${header.map((_,j)=>`<td>${escapeHTML(row[j]??"")}</td>`).join("")}</tr>`;
    }).join("");
    empty.hidden=match.length!==0;
    countLabel.textContent=`${match.length} / ${count} rows · ${maxColumns} columns · separator ${delimiter==="\t"?"tab":delimiter}`+
      (match.length>1500?" · first 1500 shown":"");
  }
  input.addEventListener("input",update);
  toggle.addEventListener("click",()=>{
    const showing=raw.hidden;
    raw.hidden=!showing;table.hidden=showing;empty.hidden=showing||tbody.children.length!==0;
    toggle.textContent=showing?"Table":"Raw text";
    toggle.setAttribute("aria-pressed",String(showing));
  });
  update();
  return {info:`${count} rows · ${maxColumns} columns · filter/raw view`,
    actions:{find:createDomFinder(container)}};
}
