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

/**
 * Original course-file links are metadata, not trusted HTML attributes.
 * Accept ordinary HTTP(S) destinations and relative site paths, never active
 * schemes such as javascript:/data:, credentials or protocol-relative URLs.
 * Do not rewrite the accepted URL: legacy relative course paths must survive.
 */
export function safeViewerOriginalURL(resource){
  const candidate=resource?.url||resource?.path;
  if(typeof candidate!=="string"||!candidate||candidate!==candidate.trim()||
     candidate.startsWith("//")||/[\\\\\u0000-\u001f\u007f]/.test(candidate))return null;
  try{
    const parsed=new URL(candidate,"https://viewer.invalid/");
    if(!["https:","http:"].includes(parsed.protocol)||parsed.username||parsed.password)
      return null;
    return candidate;
  }catch{return null}
}

const DEFAULT_MAX_TEXT_BYTES=8*1024*1024;
const DEFAULT_MAX_JSON_BYTES=32*1024*1024;
const TEXT_IDLE_TIMEOUT_MS=30_000;
const BINARY_IDLE_TIMEOUT_MS=60_000;
function sizeLimit(maxBytes){
  if(!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>128*1024*1024)
    throw new RangeError("Invalid preview size limit.");
  return (maxBytes/(1024*1024)).toLocaleString("en-US",{maximumFractionDigits:2})+" MiB";
}

function checkIdleTimeout(idleTimeoutMs){
  if(!Number.isSafeInteger(idleTimeoutMs)||idleTimeoutMs<1||idleTimeoutMs>300_000)
    throw new RangeError("Invalid preview idle timeout.");
}
/** Bound each network operation, not just fetch headers: a stalled body can hang too. */
async function timedPreviewIO(operation,controller,idleTimeoutMs){
  let timer;
  try{
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise((_,reject)=>{
        timer=setTimeout(()=>{
          controller.abort();
          reject(new Error("Preview timed out waiting for file data; open the original or retry."));
        },idleTimeoutMs);
      })
    ]);
  }finally{clearTimeout(timer)}
}
function cancelPreviewReader(reader){
  try{void reader?.cancel?.().catch(()=>{});}catch{}
}
/** Read untrusted text under both byte and per-operation idle-time limits. */
export async function fetchText(path,{maxBytes=DEFAULT_MAX_TEXT_BYTES,idleTimeoutMs=TEXT_IDLE_TIMEOUT_MS}={}){
  const label=sizeLimit(maxBytes);
  checkIdleTimeout(idleTimeoutMs);
  const controller=new AbortController();
  const io=operation=>timedPreviewIO(operation,controller,idleTimeoutMs);
  const response=await io(()=>fetch(path,{signal:controller.signal}));
  if(!response.ok)throw new Error(`HTTP ${response.status} while loading ${path}`);
  const size=Number(response.headers.get("content-length")||0);
  if(size>maxBytes){controller.abort();
    try{void response.body?.cancel?.().catch(()=>{});}catch{}throw new Error(`Preview exceeds the ${label} limit; download the original instead.`);}
  if(!response.body?.getReader){
    const text=await io(()=>response.text());
    if(new TextEncoder().encode(text).byteLength>maxBytes)throw new Error(`Preview exceeds the ${label} limit.`);
    return text;
  }
  const reader=response.body.getReader(),chunks=[];
  let used=0;
  try{
    while(true){
      const {done,value}=await io(()=>reader.read());
      if(done)break;
      used+=value.byteLength;
      if(used>maxBytes)throw new Error(`Preview exceeds the ${label} limit; download the original instead.`);
      chunks.push(value);
    }
  }catch(error){controller.abort();cancelPreviewReader(reader);throw error}
  const decoder=new TextDecoder();
  return chunks.map((chunk,index)=>decoder.decode(chunk,{stream:index<chunks.length-1})).join("")+decoder.decode();
}

/** Bounded parsing for untrusted course JSON and notebook archives. */
export async function fetchJSON(path,options={}){
  return JSON.parse(await fetchText(path,{maxBytes:DEFAULT_MAX_JSON_BYTES,...options}));
}

/** Stream binary course files under a strict byte budget, including unknown-length responses. */
export async function fetchBoundedBuffer(path,{maxBytes=80_000_000,idleTimeoutMs=BINARY_IDLE_TIMEOUT_MS}={}){
  const label=sizeLimit(maxBytes);
  checkIdleTimeout(idleTimeoutMs);
  const controller=new AbortController();
  const io=operation=>timedPreviewIO(operation,controller,idleTimeoutMs);
  const response=await io(()=>fetch(path,{signal:controller.signal}));
  if(!response.ok)throw new Error(`HTTP ${response.status} while loading ${path}`);
  const declared=Number(response.headers.get("content-length")||0);
  if(declared>maxBytes){
    controller.abort();
    try{void response.body?.cancel?.().catch(()=>{});}catch{}
    throw new Error(`Archive exceeds ${label} preview limit; download the original.`);
  }
  if(!response.body?.getReader){
    const buffer=await io(()=>response.arrayBuffer());
    if(buffer.byteLength>maxBytes)throw new Error(`Archive exceeds ${label} preview limit; download the original.`);
    return buffer;
  }
  const reader=response.body.getReader();
  const chunks=[];let used=0;
  try{
    while(true){
      const {done,value}=await io(()=>reader.read());
      if(done)break;
      used+=value.byteLength;
      if(used>maxBytes)throw new Error(`Archive exceeds ${label} preview limit; download the original.`);
      chunks.push(value);
    }
  }catch(error){controller.abort();cancelPreviewReader(reader);throw error}
  const output=new Uint8Array(used);
  let offset=0;
  for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.length}
  return output.buffer;
}
