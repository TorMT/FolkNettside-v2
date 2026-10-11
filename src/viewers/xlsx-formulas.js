import {escapeHTML} from "./utils.js?v=fff57a90002fdfc1dbd9487a4c3adf2d886a238e";

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
