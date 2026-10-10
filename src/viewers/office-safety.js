/** Strict, predictable browser preview budgets; original Office file is never changed. */
export const OFFICE_LIMITS=Object.freeze({
  archiveBytes:32_000_000,
  entries:5000,
  totalUncompressedBytes:220_000_000,
  xmlBytes:7_000_000,
  worksheets:40,
  worksheetRows:5000,
  worksheetColumns:256,
  worksheetCells:50000,
  slides:200,
  paragraphs:12000
});
export function validateOfficeArchive(zip){
  const list=Object.values(zip?.files||{});
  if(!list.length||list.length>OFFICE_LIMITS.entries)
    throw Error("Office archive has too many or no entries. Download the original.");
  let bytes=0;
  for(const entry of list){
    if(entry.dir)continue;
    const size=entry._data?.uncompressedSize;
    if(!Number.isSafeInteger(size)||size<0)
      throw Error("Office archive contains a file with unknown expanded size.");
    bytes+=size;
    if(bytes>OFFICE_LIMITS.totalUncompressedBytes)
      throw Error("Office archive expands beyond the safe preview budget.");
    if(/\.xml$/i.test(entry.name)&&size>OFFICE_LIMITS.xmlBytes)
      throw Error("Office XML part exceeds the safe preview limit.");
  }
  return zip;
}
export async function limitedOfficeXML(entry,name="Office XML"){
  if(!entry)throw Error(name+" is missing");
  const known=entry._data?.uncompressedSize;
  if(!Number.isSafeInteger(known)||known<0||known>OFFICE_LIMITS.xmlBytes)
    throw Error(name+" exceeds the safe XML preview limit.");
  const bytes=await entry.async("uint8array");
  if(bytes.length>OFFICE_LIMITS.xmlBytes)
    throw Error(name+" exceeds the safe XML preview limit.");
  return new TextDecoder("utf-8",{fatal:true}).decode(bytes);
}
export function assertOfficeWorksheetBounds({rows,columns,cells}){
  if(![rows,columns,cells].every(Number.isSafeInteger)||rows>OFFICE_LIMITS.worksheetRows||
    columns>OFFICE_LIMITS.worksheetColumns||cells>OFFICE_LIMITS.worksheetCells||
    rows<0||columns<0||cells<0)
    throw Error("Excel worksheet exceeds the browser preview grid limits; download the original.");
}
