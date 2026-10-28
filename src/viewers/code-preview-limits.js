/** Browser-friendly bounds for read-only highlighted code previews.
 * Copy retains the complete downloaded text; ViewerShell retains Open original.
 */
export const MAX_CODE_PREVIEW_CHARS=300_000;
export const MAX_CODE_PREVIEW_LINES=5_000;

export function codePreview(text){
  const raw=String(text??"");
  let end=Math.min(raw.length,MAX_CODE_PREVIEW_CHARS);
  let lines=raw.length?1:0;
  for(let i=0;i<end;i++){
    if(raw[i]==="\n"){
      if(lines>=MAX_CODE_PREVIEW_LINES){end=i;break}
      lines++;
    }
  }
  // Do not split an astral Unicode character at the character cap.
  if(end<raw.length&&end>0){
    const code=raw.charCodeAt(end-1);
    if(code>=0xd800&&code<=0xdbff)end--;
  }
  // We may have trimmed the final UTF-16 code unit above.
  const visible=raw.slice(0,end);
  if(end<raw.length){
    lines=visible.length?1:0;
    for(let i=0;i<visible.length;i++)if(visible[i]==="\n")lines++;
  }
  return {text:visible,truncated:end<raw.length,
    displayedChars:end,totalChars:raw.length,displayedLines:lines};
}
