/**
 * Presentation-only limits for downloaded Jupyter notebooks. The original
 * document is never changed; ViewerShell retains its Open original action.
 * Bounds DOM/editor creation for large IPYNB files on 320 px phones.
 */
export const MAX_NOTEBOOK_PREVIEW_CELLS=300;
export const MAX_NOTEBOOK_SAVED_OUTPUTS=40;
export const MAX_NOTEBOOK_OUTPUT_CHARS=100_000;
export const MAX_NOTEBOOK_PNG_BASE64=2_000_000;

export function notebookPreviewCells(cells){
  if(!Array.isArray(cells))return {items:[],omitted:0,total:0};
  return {
    items:cells.slice(0,MAX_NOTEBOOK_PREVIEW_CELLS),
    omitted:Math.max(0,cells.length-MAX_NOTEBOOK_PREVIEW_CELLS),
    total:cells.length
  };
}
export function notebookSavedOutputs(outputs){
  if(!Array.isArray(outputs))return {items:[],omitted:0};
  return {
    items:outputs.slice(0,MAX_NOTEBOOK_SAVED_OUTPUTS),
    omitted:Math.max(0,outputs.length-MAX_NOTEBOOK_SAVED_OUTPUTS)
  };
}
export function limitedNotebookText(value,max=MAX_NOTEBOOK_OUTPUT_CHARS){
  const pieces=Array.isArray(value)?value:[value];
  let text="",truncated=false;
  for(const part of pieces){
    if(part===null||part===undefined)continue;
    const next=String(part);
    const available=max-text.length;
    if(next.length>available){
      text+=next.slice(0,Math.max(0,available));
      truncated=true;break;
    }
    text+=next;
  }
  return {text,truncated};
}
export function notebookPNGData(value){
  if(typeof value!=="string"&&!Array.isArray(value))return {data:"",omitted:false};
  const pieces=Array.isArray(value)?value:[value];
  let length=0;
  for(const part of pieces){
    if(typeof part!=="string")return {data:"",omitted:true};
    length+=part.length;
    if(length>MAX_NOTEBOOK_PNG_BASE64+100_000)return {data:"",omitted:true};
  }
  const clean=pieces.join("").replace(/[\r\n\s]/g,"");
  if(clean.length>MAX_NOTEBOOK_PNG_BASE64)return {data:"",omitted:true};
  if(!clean||!/^[A-Za-z0-9+/]+={0,2}$/.test(clean))return {data:"",omitted:false};
  return {data:clean,omitted:false};
}
