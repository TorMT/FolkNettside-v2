export function escapeHTML(value){
  return String(value ?? "").replace(/[&<>"]/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"
  })[char]);
}

export function extension(path){
  const clean=String(path||"").split(/[?#]/,1)[0].replace(/\\/g,"/");
  const file=clean.slice(clean.lastIndexOf("/")+1);
  const dot=file.lastIndexOf(".");
  return dot<=0||dot===file.length-1?"":file.slice(dot+1).toLowerCase();
}

const DEFAULT_MAX_TEXT_BYTES=8*1024*1024;
export async function fetchText(path,{maxBytes=DEFAULT_MAX_TEXT_BYTES}={}){
  const response=await fetch(path);
  if(!response.ok)throw new Error(`HTTP ${response.status} while loading ${path}`);
  const size=Number(response.headers.get("content-length")||0);
  if(size>maxBytes){await response.body?.cancel?.();throw new Error("Text preview exceeds the 8 MiB limit; download the original instead.");}
  if(!response.body?.getReader){
    const text=await response.text();
    if(new TextEncoder().encode(text).byteLength>maxBytes)throw new Error("Text preview exceeds the 8 MiB limit.");
    return text;
  }
  const reader=response.body.getReader(),chunks=[];
  let used=0;
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      used+=value.byteLength;
      if(used>maxBytes)throw new Error("Text preview exceeds the 8 MiB limit; download the original instead.");
      chunks.push(value);
    }
  }catch(error){await reader.cancel().catch(()=>{});throw error}
  const decoder=new TextDecoder();
  return chunks.map((chunk,index)=>decoder.decode(chunk,{stream:index<chunks.length-1})).join("")+decoder.decode();
}

export async function fetchJSON(path){
  const response=await fetch(path);
  if(!response.ok)throw new Error(`HTTP ${response.status} while loading ${path}`);
  return response.json();
}
