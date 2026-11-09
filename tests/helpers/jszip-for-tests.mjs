// JSZip for Node tests. The site loads JSZip from a CDN in the browser, which
// Node cannot import, so tests inject it. When the real library is installed
// (or JSZIP_MODULE points at it) it is used; otherwise a small in-memory
// stand-in that implements the exact API surface the parsers use.
const registry=new Map();
let nextId=1;

class FakeEntry{
  constructor(name,data,dir){
    this.name=name;this.dir=dir;
    this._bytes=dir?new Uint8Array(0):data;
    this._data={uncompressedSize:this._bytes.length};
  }
  async async(type){
    const copy=this._bytes.slice();
    if(type==="arraybuffer")return copy.buffer;
    if(type==="uint8array")return copy;
    if(type==="string")return new TextDecoder().decode(copy);
    throw new Error("Unsupported output type "+type);
  }
}
const toBytes=data=>typeof data==="string"?new TextEncoder().encode(data):
  data instanceof ArrayBuffer?new Uint8Array(data.slice(0)):Uint8Array.from(data);

class FakeJSZip{
  constructor(){this.files={}}
  file(path,data){
    if(data===undefined)return this.files[path]&&!this.files[path].dir?this.files[path]:null;
    const parts=path.split("/");
    for(let i=1;i<parts.length;i++){
      const dir=parts.slice(0,i).join("/")+"/";
      this.files[dir]??=new FakeEntry(dir,null,true);
    }
    this.files[path]=new FakeEntry(path,toBytes(data),false);
    return this;
  }
  async generateAsync(){
    const id=nextId++;registry.set(id,this.files);
    const bytes=new Uint8Array(12);bytes.set([80,75,3,4]);
    new DataView(bytes.buffer).setUint32(4,id,true);
    return bytes.buffer;
  }
  static async loadAsync(input){
    const bytes=input instanceof ArrayBuffer?new Uint8Array(input):
      new Uint8Array(input.buffer,input.byteOffset,input.byteLength);
    const files=bytes.length>=8&&bytes[0]===80&&bytes[1]===75?
      registry.get(new DataView(bytes.buffer,bytes.byteOffset).getUint32(4,true)):null;
    if(!files)throw new Error("Can't find end of central directory : is this a zip file ?");
    const zip=new FakeJSZip();zip.files={...files};return zip;
  }
}

export async function loadTestJSZip(){
  try{
    const module=await import(process.env.JSZIP_MODULE||"jszip");
    return {JSZip:module.default||module,real:true};
  }catch{
    return {JSZip:FakeJSZip,real:false};
  }
}

/** Build a ZIP ArrayBuffer from `{path: string|Uint8Array}`. */
export async function makeArchive(JSZip,files){
  const zip=new JSZip();
  for(const [path,data] of Object.entries(files))zip.file(path,data);
  return zip.generateAsync({type:"arraybuffer"});
}
