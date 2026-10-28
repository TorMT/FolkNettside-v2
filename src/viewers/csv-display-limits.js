/** Bound the number of DOM cells created for large public CSV previews.
 * Parsing, filtering and raw-text access remain complete and unchanged.
 */
export function csvTableDisplayLimits(rowCount,columnCount){
 if(!Number.isSafeInteger(rowCount)||rowCount<0||
    !Number.isSafeInteger(columnCount)||columnCount<0)
   throw new RangeError("Invalid CSV table dimensions");
 const columns=Math.min(columnCount,64);
 const rows=Math.min(rowCount,1500,Math.max(1,Math.floor(8000/Math.max(1,columns))));
 return {rows,columns};
}
