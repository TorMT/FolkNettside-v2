export function escapeHTML(value){
  return String(value ?? "").replace(/[&<>"]/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"
  })[char]);
}

export function extension(path){
  const clean=String(path||"").split(/[?#]/,1)[0].replace(/\\/g,"/");
  const file=clean.slice(clean.lastIndexOf("/")+1);
  const dot=file.lastIndexOf(".");
  return dot<0||dot===file.length-1?"":file.slice(dot+1).toLowerCase();
}

/** Preserve the original public URL except when the user explicitly chose a local copy. */
export function previewContentURL(resource){
  return resource?.localPreview===true&&String(resource.path||"").startsWith("blob:")
    ?resource.path:(resource?.url||resource?.path);
}

const DEFAULT_MAX_TEXT_BYTES=8*1024*1024;
const DEFAULT_MAX_JSON_BYTES=32*1024*1024;
function sizeLimit(maxBytes){
  if(!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>128*1024*1024)
    throw new RangeError("Invalid preview size limit.");
  return (maxBytes/(1024*1024)).toLocaleString("en-US",{maximumFractionDigits:2})+" MiB";
}
export async function fetchText(path,{maxBytes=DEFAULT_MAX_TEXT_BYTES}={}){
  const label=sizeLimit(maxBytes);
  const response=await fetch(path);
  if(!response.ok)throw new Error(`HTTP ${response.status} while loading ${path}`);
  const size=Number(response.headers.get("content-length")||0);
  if(size>maxBytes){await response.body?.cancel?.();throw new Error(`Preview exceeds the ${label} limit; download the original instead.`);}
  if(!response.body?.getReader){
    const text=await response.text();
    if(new TextEncoder().encode(text).byteLength>maxBytes)throw new Error(`Preview exceeds the ${label} limit.`);
    return text;
  }
  const reader=response.body.getReader(),chunks=[];
  let used=0;
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      used+=value.byteLength;
      if(used>maxBytes)throw new Error(`Preview exceeds the ${label} limit; download the original instead.`);
      chunks.push(value);
    }
  }catch(error){await reader.cancel().catch(()=>{});throw error}
  const decoder=new TextDecoder();
  return chunks.map((chunk,index)=>decoder.decode(chunk,{stream:index<chunks.length-1})).join("")+decoder.decode();
}

/** Bounded parsing for untrusted course JSON and notebook archives. */
export async function fetchJSON(path,{maxBytes=DEFAULT_MAX_JSON_BYTES}={}){
  return JSON.parse(await fetchText(path,{maxBytes}));
}

/** Stream binary course files under a strict byte budget, including unknown-length responses. */
export async function fetchBoundedBuffer(path,{maxBytes=80_000_000}={}){
  const label=sizeLimit(maxBytes);
  const response=await fetch(path);
  if(!response.ok)throw new Error(`HTTP ${response.status} while loading ${path}`);
  const declared=Number(response.headers.get("content-length")||0);
  if(declared>maxBytes){
    await response.body?.cancel?.();
    throw new Error(`Archive exceeds ${label} preview limit; download the original.`);
  }
  if(!response.body?.getReader){
    const buffer=await response.arrayBuffer();
    if(buffer.byteLength>maxBytes)throw new Error(`Archive exceeds ${label} preview limit; download the original.`);
    return buffer;
  }
  const reader=response.body.getReader();
  const chunks=[];let used=0;
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      used+=value.byteLength;
      if(used>maxBytes)throw new Error(`Archive exceeds ${label} preview limit; download the original.`);
      chunks.push(value);
    }
  }catch(error){await reader.cancel().catch(()=>{});throw error}
  const output=new Uint8Array(used);
  let offset=0;
  for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.length}
  return output.buffer;
}
