import {escapeHTML,extension,fetchBoundedBuffer} from "../utils.js?v=86f8fa322926f91794fed377d73ff22673a8eabf";
import {OFFICE_LIMITS,validateOfficeArchive,limitedOfficeXML,assertOfficeWorksheetBounds} from "../office-safety.js?v=86f8fa322926f91794fed377d73ff22673a8eabf";
import {getJSZip} from "../../vendor/jszip.js?v=86f8fa322926f91794fed377d73ff22673a8eabf";
import {spreadsheetCellHTML} from "../xlsx-formulas.js?v=86f8fa322926f91794fed377d73ff22673a8eabf";
import {createDomFinder} from "../dom-search.js?v=86f8fa322926f91794fed377d73ff22673a8eabf";

function parseXML(text){
  const doc=new DOMParser().parseFromString(text,"application/xml");
  if(doc.querySelector("parsererror")) throw new Error("Could not parse Office XML");
  return doc;
}

async function loadArchive(path){
  const JSZip=await getJSZip();
  return validateOfficeArchive(await JSZip.loadAsync(await fetchBoundedBuffer(path,{maxBytes:OFFICE_LIMITS.archiveBytes})));
}

function textContent(node){
  return [...node.getElementsByTagNameNS("*","t")].map(n=>n.textContent||"").join("");
}

async function renderDocx(container,zip){
  const entry=zip.file("word/document.xml");
  if(!entry) throw new Error("DOCX document.xml missing");
  const doc=parseXML(await limitedOfficeXML(entry,"DOCX document.xml"));
  const allParagraphs=[...doc.getElementsByTagNameNS("*","p")];
  if(allParagraphs.length>OFFICE_LIMITS.paragraphs)throw Error("DOCX contains too many paragraphs for browser preview.");
  const paragraphs=allParagraphs
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
  const doc=parseXML(await limitedOfficeXML(entry,"XLSX shared strings"));
  return [...doc.getElementsByTagNameNS("*","si")].map(si=>textContent(si));
}

function cellValue(cell,strings){
  const type=cell.getAttribute("t");
  if(type==="inlineStr")return textContent(cell);
  const value=cell.getElementsByTagNameNS("*","v")[0]?.textContent??"";
  if(type==="s")return strings[Number(value)]??value;
  return value;
}

function sheetCell(cell,strings){
  const formula=cell.getElementsByTagNameNS("*","f")[0];
  return {
    value:cellValue(cell,strings),
    hasFormula:Boolean(formula),
    formula:formula?.textContent||null
  };
}

async function renderXlsx(container,zip){
  const strings=await sharedStrings(zip);
  const worksheetPaths=Object.keys(zip.files)
    .filter(name=>/^xl\/worksheets\/sheet\d+\.xml$/i.test(name))
    .sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  if(!worksheetPaths.length)throw new Error("XLSX contains no worksheets");
  if(worksheetPaths.length>OFFICE_LIMITS.worksheets)throw Error("XLSX contains too many sheets for browser preview.");

  const sheets=[];
  let formulaCount=0;
  for(const path of worksheetPaths){
    const doc=parseXML(await limitedOfficeXML(zip.file(path),path));
    const sourceRows=[...doc.getElementsByTagNameNS("*","row")];
    if(sourceRows.length>OFFICE_LIMITS.worksheetRows)
      throw Error("XLSX worksheet has too many rows for browser preview.");
    let cells=0,maxColumns=0;
    const rows=sourceRows.map(row=>{
      const values=[];
      for(const cell of row.getElementsByTagNameNS("*","c")){
        cells++;
        if(cells>OFFICE_LIMITS.worksheetCells)
          throw Error("XLSX worksheet has too many cells for browser preview.");
        const column=colIndex(cell.getAttribute("r")||"A1");
        if(column>=OFFICE_LIMITS.worksheetColumns)
          throw Error("XLSX worksheet has too many columns for browser preview.");
        maxColumns=Math.max(maxColumns,column+1);
        const entry=sheetCell(cell,strings);
        if(entry.hasFormula)formulaCount++;
        values[column]=entry;
      }
      return values;
    });
    assertOfficeWorksheetBounds({rows:rows.length,columns:maxColumns,cells});
    sheets.push({path,rows});
  }

  container.innerHTML=`<div class="office-workbook">
    <div class="office-workbook-toolbar"><strong>Excel workbook</strong><span>${sheets.length} sheet(s)</span>
      ${formulaCount?`<button type="button" class="btn office-formula-toggle" aria-pressed="false">Show formulas (${formulaCount})</button>`
        :'<span class="muted">No formulas found</span>'}
    </div>
    ${sheets.map((sheet,index)=>{
      const width=Math.max(0,...sheet.rows.map(r=>r.length));
      return `<section class="office-sheet"><h2>Sheet ${index+1}</h2><div class="table-wrap"><table class="data-table"><tbody>
        ${sheet.rows.map((row,rowIndex)=>`<tr>${Array.from({length:width},(_,i)=>rowIndex===0?`<th>${spreadsheetCellHTML(row[i])}</th>`:`<td>${spreadsheetCellHTML(row[i])}</td>`).join("")}</tr>`).join("")}
      </tbody></table></div></section>`;
    }).join("")}
  </div>`;
  const toggle=container.querySelector(".office-formula-toggle");
  toggle?.addEventListener("click",()=>{
    const show=toggle.getAttribute("aria-pressed")!=="true";
    toggle.setAttribute("aria-pressed",String(show));
    toggle.textContent=show?"Show values":"Show formulas ("+formulaCount+")";
    for(const span of container.querySelectorAll(".office-cell-value")){
      const hasFormula=span.nextElementSibling?.classList.contains("office-cell-formula");
      span.hidden=show&&hasFormula;
    }
    for(const span of container.querySelectorAll(".office-cell-formula"))span.hidden=!show;
  });
  return {info:`XLSX · ${sheets.length} sheet(s) · ${formulaCount} formula cells (not recalculated)`};
}

async function renderPptx(container,zip){
  const slidePaths=Object.keys(zip.files)
    .filter(name=>/^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  if(!slidePaths.length)throw new Error("PPTX contains no slides");
  if(slidePaths.length>OFFICE_LIMITS.slides)throw Error("PPTX contains too many slides for browser preview.");

  const slides=[];
  for(const path of slidePaths){
    const doc=parseXML(await limitedOfficeXML(zip.file(path),path));
    const paragraphs=[...doc.getElementsByTagNameNS("*","p")];
    if(paragraphs.length>OFFICE_LIMITS.paragraphs)throw Error("PPTX slide contains too much text.");
    const text=paragraphs
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
  const path=resource.url||resource.path;
  const zip=await loadArchive(path);
  const ext=extension(resource.name||path);
  let result;
  if(ext==="docx")result=await renderDocx(container,zip);
  else if(ext==="xlsx")result=await renderXlsx(container,zip);
  else if(ext==="pptx")result=await renderPptx(container,zip);
  else throw new Error(`Unsupported Office format: .${ext}`);
  return {...result,actions:{find:createDomFinder(container)}};
}
