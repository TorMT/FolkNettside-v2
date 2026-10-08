// RFC 4180-style delimited text reader: multiline quoted cells, escaped
// quotes, BOM, CRLF, tabs and pipes. Values remain plain text (never HTML).
export function parseDelimitedText(text,delimiter=","){
  if(typeof text!=="string")throw new TypeError("CSV source must be text");
  if(typeof delimiter!=="string"||delimiter.length!==1)
    throw new Error("CSV delimiter must be exactly one character");
  const data=text.replace(/^\uFEFF/,"");
  const rows=[];let row=[],cell="",quoted=false;
  for(let i=0;i<data.length;i++){
    const ch=data[i];
    if(ch==='"'){
      if(quoted&&data[i+1]==='"'){cell+='"';i++}
      else if(!quoted&&cell==="")quoted=true;
      else if(quoted)quoted=false;
      else cell+='"';
    }else if(ch===delimiter&&!quoted){row.push(cell);cell=""}
    else if((ch==="\n"||ch==="\r")&&!quoted){
      if(ch==="\r"&&data[i+1]==="\n")i++;
      row.push(cell);rows.push(row);row=[];cell="";
    }else cell+=ch;
  }
  if(quoted)throw new Error("CSV contains an unterminated quoted field");
  if(cell.length||row.length){row.push(cell);rows.push(row)}
  return rows;
}
export function detectCSVDelimiter(text,path=""){
  if(/\.tsv(?:$|[?#])/i.test(String(path)))return "\t";
  if(/\.psv(?:$|[?#])/i.test(String(path)))return "|";
  const candidates=[",",";","\t","|"];
  const sample=String(text).slice(0,20000);
  const ranked=candidates.map(delimiter=>{
    try{
      const rows=parseDelimitedText(sample,delimiter).slice(0,8);
      const counts=rows.map(r=>r.length).filter(n=>n>0);
      const count=counts.length;
      if(!count)return {delimiter,score:-Infinity};
      const max=Math.max(...counts),min=Math.min(...counts);
      return {delimiter,score:min>1?min*10-(max-min)*3+count:0};
    }catch{return {delimiter,score:-Infinity}}
  }).sort((a,b)=>b.score-a.score);
  return ranked[0]?.score>0?ranked[0].delimiter:",";
}
export function filterDelimitedRows(rows,query){
  if(!rows.length)return [];
  const needle=String(query||"").trim().toLocaleLowerCase();
  if(!needle)return rows;
  return [rows[0],...rows.slice(1).filter(row=>row.some(
    cell=>String(cell).toLocaleLowerCase().includes(needle)))];
}
