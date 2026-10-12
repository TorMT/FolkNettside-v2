import {escapeHTML} from "./utils.js?v=468cf42af4c1c5caa1a94dfe6479885dd70b7773";

/** Render cached spreadsheet output and the original formula without evaluating it. */
export function spreadsheetCellView({value="",formula=null,hasFormula=false}={}){
  const raw=String(value??"");
  if(!hasFormula)return {value:raw,formula:null};
  if(typeof formula!=="string"||!formula.trim()){
    // In a shared-formula follower cell, the formula text is stored in the
    // master cell. Showing a guessed relative formula would be misleading.
    return {value:raw,formula:null};
  }
  return {value:raw,formula:"="+formula.trim().replace(/^=/,"")};
}
export function spreadsheetCellHTML(cell){
  const view=spreadsheetCellView(cell);
  return `<span class="office-cell-value">${escapeHTML(view.value)}</span>`+
    (view.formula!==null
      ?`<span class="office-cell-formula" hidden>${escapeHTML(view.formula)}</span>`
      :"");
}
