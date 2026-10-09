/** KISSsoft text parameter reader. Not a KISSsoft calculation engine. */
const supported=new Set(["z12","z14","w10","ksys"]);
export function decodeKisssoft(buffer){
 const bytes=new Uint8Array(buffer);
 if(bytes.byteLength>12_000_000)throw Error("KISSsoft file exceeds the 12 MB preview limit");
 if(bytes[0]===0xff&&bytes[1]===0xfe)return new TextDecoder("utf-16le",{fatal:true}).decode(bytes.subarray(2));
 if(bytes[0]===0xfe&&bytes[1]===0xff)return new TextDecoder("utf-16be",{fatal:true}).decode(bytes.subarray(2));
 const sample=bytes.subarray(0,Math.min(100,bytes.length));
 if(sample.length>4&&sample.filter((v,i)=>i%2===1&&v===0).length>sample.length/5)
   return new TextDecoder("utf-16le",{fatal:true}).decode(bytes);
 return new TextDecoder("utf-8",{fatal:true}).decode(bytes);
}
export function parseKisssoft(text,name="model.z14"){
 const ext=String(name).split(".").pop().toLowerCase();
 if(!supported.has(ext))throw Error("Unsupported KISSsoft extension");
 const fields=Object.create(null);
 const lines=text.replace(/\r/g,"\n").replace(/¶/g,"\n").split("\n");
 for(const line of lines){
   const i=line.indexOf("=");
   if(i<1)continue;
   const key=line.slice(0,i).trim();
   if(!/^[A-Za-z][A-Za-z0-9_.\[\]-]{0,140}$/.test(key))continue;
   if(!(key in fields))fields[key]=line.slice(i+1).replace(/;$/,"").trim().slice(0,300);
 }
 if(!fields.MODULE&&!fields.KSOFTVERSION&&!fields.VERSION)throw Error("Not a recognized KISSsoft parameter file");
 const number=key=>{const value=fields[key];if(value===undefined||value==="")return null;const n=Number(value);return Number.isFinite(n)?n:null};
 const gears=[0,1,2].map(i=>({
   teeth:number(`ZR[${i}].z`),width:number(`ZR[${i}].b`),
   material:fields[`ZR[${i}].mat.bez`]||"",
   shift:number(`ZR[${i}].x`)
 }));
 const module=number("ZS.Geo.mn");
 // KISSsoft stores angles in radians internally. UI and pitch helpers use degrees.
 const betaRad=number("ZS.Geo.beta");
 const beta=betaRad===null?null:betaRad*180/Math.PI;
 const pressureAngleNormalRad=number("ZS.Geo.alfn");
 const pressureAngleNormalDeg=pressureAngleNormalRad===null?null:pressureAngleNormalRad*180/Math.PI;
 const planetary=fields.MODULE==="Z014"&&gears[0].teeth>0&&gears[1].teeth>0&&gears[2].teeth<0&&module>0;
 const sun=gears[0].teeth,planet=gears[1].teeth,ring=Math.abs(gears[2].teeth||0);
 const consistent=planetary&&sun+2*planet===ring;
 return {
   name:String(name).split(/[\\/]/).pop(),
   format:ext.toUpperCase(),moduleCode:fields.MODULE||"unknown",
   version:fields.KSOFTVERSION||fields.VERSION||"unknown",
   module,beta,betaRad,pressureAngleNormalRad,pressureAngleNormalDeg,gears,planetary,consistent,
   centerDistance:planetary?module*(sun+planet)/(2*Math.cos((beta||0)*Math.PI/180)):null,
   fields
 };
}
export function parseKisssoftBuffer(buffer,name){return parseKisssoft(decodeKisssoft(buffer),name)}
