import {escapeHTML,extension} from "../utils.js?v=a9b99ee88974141a595afc683db34eea2547479f";
import {getJSZip} from "../../vendor/jszip.js?v=a9b99ee88974141a595afc683db34eea2547479f";
import {createDomFinder} from "../dom-search.js?v=a9b99ee88974141a595afc683db34eea2547479f";

function parseXML(text){
  const doc=new DOMParser().parseFromString(text,"application/xml");
  if(doc.querySelector("parsererror")) throw new Error("Could not parse Office XML");
  return doc;
}

async function loadArchive(path){
  const JSZip=await getJSZip();
  const response=await fetch(path);
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  return JSZip.loadAsync(await response.arrayBuffer());
}

function textContent(node){
  return [...node.getElementsByTagNameNS("*","t")].map(n=>n.textContent||"").join("");
}

async function renderDocx(container,zip){
  const entry=zip.file("word/document.xml");
  if(!entry) throw new Error("DOCX document.xml missing");
  const doc=parseXML(await entry.async("text"));
  const paragraphs=[...doc.getElementsByTagNameNS("*","p")]
    .map(p=>textContent(p).trim())
    .filter(Boolean);

  const rows=[...doc.getElementsByTagNameNS("*","tr")].map(row=>
    [...row.getElementsByTagNameNS("*","tc")].map(cell=>textContent(cell).trim())
  ).filter(row=>row.length);

  container.innerHTML=`<article class="office-doc">
    <div class="office-page">
      ${paragraphs.map((p,i)=>i===0?`<h1>${escapeHTML(p)}</h1>`:`<p>${escapeHTML(p)}</p>`).join("")}
      ${rows.length?`<table class="data-table office-table"><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${escapeHTML(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`:""}
    </div>
  </article>`;
  return {info:`DOCX · ${paragraphs.length} paragraph(s)`};
}

function colIndex(reference){
  const letters=(reference.match(/[A-Z]+/i)?.[0]||"A").toUpperCase();
  let value=0;
  for(const char of letters)value=value*26+(char.charCodeAt(0)-64);
  return value-1;
}

async function sharedStrings(zip){
  const entry=zip.file("xl/sharedStrings.xml");
  if(!entry)return[];
  const doc=parseXML(await entry.async("text"));
  return [...doc.getElementsByTagNameNS("*","si")].map(si=>textContent(si));
}

function cellValue(cell,strings){
  const type=cell.getAttribute("t");
  if(type==="inlineStr")return textContent(cell);
  const value=cell.getElementsByTagNameNS("*","v")[0]?.textContent??"";
  if(type==="s")return strings[Number(value)]??value;
  return value;
}

async function renderXlsx(container,zip){
  const strings=await sharedStrings(zip);
  const worksheetPaths=Object.keys(zip.files)
    .filter(name=>/^xl\/worksheets\/sheet\d+\.xml$/i.test(name))
    .sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  if(!worksheetPaths.length)throw new Error("XLSX contains no worksheets");

  const sheets=[];
  for(const path of worksheetPaths){
    const doc=parseXML(await zip.file(path).async("text"));
    const rows=[...doc.getElementsByTagNameNS("*","row")].map(row=>{
      const values=[];
      for(const cell of row.getElementsByTagNameNS("*","c")){
        values[colIndex(cell.getAttribute("r")||"A1")]=cellValue(cell,strings);
      }
      return values;
    });
    sheets.push({path,rows});
  }

  container.innerHTML=`<div class="office-workbook">
    ${sheets.map((sheet,index)=>{
      const width=Math.max(0,...sheet.rows.map(r=>r.length));
      return `<section class="office-sheet"><h2>Sheet ${index+1}</h2><div class="table-wrap"><table class="data-table"><tbody>
        ${sheet.rows.map((row,rowIndex)=>`<tr>${Array.from({length:width},(_,i)=>rowIndex===0?`<th>${escapeHTML(row[i]??"")}</th>`:`<td>${escapeHTML(row[i]??"")}</td>`).join("")}</tr>`).join("")}
      </tbody></table></div></section>`;
    }).join("")}
  </div>`;
  return {info:`XLSX · ${sheets.length} sheet(s)`};
}

async function renderPptx(container,zip){
  const slidePaths=Object.keys(zip.files)
    .filter(name=>/^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  if(!slidePaths.length)throw new Error("PPTX contains no slides");

  const slides=[];
  for(const path of slidePaths){
    const doc=parseXML(await zip.file(path).async("text"));
    const text=[...doc.getElementsByTagNameNS("*","p")]
      .map(p=>textContent(p).trim())
      .filter(Boolean);
    slides.push(text);
  }

  container.innerHTML=`<div class="office-slides">
    ${slides.map((lines,index)=>`<section class="office-slide"><div class="office-slide-number">${index+1}</div>
      ${lines.map((line,i)=>i===0?`<h2>${escapeHTML(line)}</h2>`:`<p>${escapeHTML(line)}</p>`).join("")}
    </section>`).join("")}
  </div>`;
  return {info:`PPTX · ${slides.length} slide(s)`};
}

export async function render(container,resource){
  const zip=await loadArchive(resource.path);
  const ext=extension(resource.path);
  let result;
  if(ext==="docx")result=await renderDocx(container,zip);
  else if(ext==="xlsx")result=await renderXlsx(container,zip);
  else if(ext==="pptx")result=await renderPptx(container,zip);
  else throw new Error(`Unsupported Office format: .${ext}`);
  return {...result,actions:{find:createDomFinder(container)}};
}
