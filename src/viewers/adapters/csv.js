import {escapeHTML,fetchText} from "../utils.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef";
import {createDomFinder} from "../dom-search.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef";

function parseRow(line,delimiter){
  const values=[];let current="",quoted=false;
  for(let i=0;i<line.length;i++){
    const char=line[i];
    if(char==='"'){
      if(quoted&&line[i+1]==='"'){current+='"';i++}
      else quoted=!quoted;
    }else if(char===delimiter&&!quoted){values.push(current);current=""}
    else current+=char;
  }
  values.push(current);
  return values;
}

function detectDelimiter(text){
  const sample=text.split(/\r?\n/,5).filter(Boolean);
  const candidates=[",",";","\t"];
  return candidates
    .map(delimiter=>({delimiter,score:sample.reduce((sum,line)=>sum+parseRow(line,delimiter).length,0)}))
    .sort((a,b)=>b.score-a.score)[0]?.delimiter || ",";
}

export async function render(container,resource){
  const text=await fetchText(resource.path);
  const delimiter=detectDelimiter(text);
  const rows=text.trim().split(/\r?\n/).map(line=>parseRow(line,delimiter));
  const header=rows.shift()||[];

  container.innerHTML=`<div class="table-wrap"><table class="data-table">
    <thead><tr>${header.map(value=>`<th>${escapeHTML(value)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(row=>`<tr>${header.map((_,index)=>`<td>${escapeHTML(row[index]??"")}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;

  return {info:`${rows.length} rows · ${header.length} columns · delimiter ${delimiter==="\t"?"tab":delimiter}`,actions:{find:createDomFinder(container)}};
}
