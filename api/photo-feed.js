// Vercel serverless endpoint. Set GOOGLE_SERVICE_ACCOUNT_JSON in Vercel and
// share the Bilder root with that service account (Viewer). Never expose credentials.
import {createSign} from "node:crypto";
const ROOT="1lBkBhTHl7CkVoAaUgWn2RAtKZXqRre3k";
const TYPES=new Set(["image/jpeg","image/png","image/webp","image/gif","image/avif"]);
const DRIVE="https://www.googleapis.com/drive/v3";
const enc=x=>Buffer.from(JSON.stringify(x)).toString("base64url");
let cached=null;
function tokenFromServiceAccount(account){
  const now=Math.floor(Date.now()/1000);
  const header=enc({alg:"RS256",typ:"JWT"});
  const body=enc({iss:account.client_email,scope:"https://www.googleapis.com/auth/drive.readonly",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3300});
  const input=header+"."+body;
  const sign=createSign("RSA-SHA256");sign.update(input);sign.end();
  return input+"."+sign.sign(account.private_key,"base64url");
}
async function driveToken(){
  const account=JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON||"null");
  if(!account?.client_email||!account?.private_key)throw Error("Drive credentials not configured");
  const res=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:tokenFromServiceAccount(account)})});
  if(!res.ok)throw Error("Drive authentication failed");
  return (await res.json()).access_token;
}
async function drive(path,token,params={}){
  const url=new URL(DRIVE+path);
  for(const [key,value] of Object.entries(params))url.searchParams.set(key,value);
  const res=await fetch(url,{headers:{authorization:"Bearer "+token}});
  if(!res.ok)throw Error("Drive API returned "+res.status);
  return res.json();
}
async function allChildren(parent,token){
  const out=[];let pageToken;
  do{
    const page=await drive("/files",token,{q:"'"+parent+"' in parents and trashed = false",fields:"nextPageToken,files(id,name,mimeType,createdTime,size)",pageSize:"1000",...(pageToken?{pageToken}:{})});
    if(!Array.isArray(page.files))throw Error("Incomplete Drive listing");
    out.push(...page.files);
    pageToken=page.nextPageToken;
  }while(pageToken);
  return out;
}
async function build(){
  const token=await driveToken();
  const folders=(await allChildren(ROOT,token)).filter(x=>x.mimeType==="application/vnd.google-apps.folder");
  const albums=[];
  for(const folder of folders){
    const files=(await allChildren(folder.id,token)).filter(x=>TYPES.has(x.mimeType)&&Number(x.size||0)<=25000000);
    const publicPhotos=[];
    for(const file of files){
      // Permission verification is fail-closed. Any ambiguous result aborts the entire response.
      const perms=await drive("/files/"+encodeURIComponent(file.id)+"/permissions",token,{fields:"nextPageToken,permissions(type,role)",pageSize:"100"});
      if(perms.nextPageToken)throw Error("Incomplete permission listing");
      if(!Array.isArray(perms.permissions))throw Error("Ambiguous permissions");
      if(perms.permissions.some(p=>p.type==="anyone"&&["reader","commenter","writer","owner"].includes(p.role)))publicPhotos.push(file);
    }
    publicPhotos.sort((a,b)=>a.name.localeCompare(b.name,"nb",{numeric:true}));
    if(publicPhotos.length)albums.push({id:folder.id,title:folder.name,date:folder.createdTime||publicPhotos.map(x=>x.createdTime||"").sort().at(-1),images:publicPhotos.slice(0,100).map(({id,name})=>({id,name}))});
  }
  albums.sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title,"nb"));
  return {schema:1,rootFolderId:ROOT,generatedAt:new Date().toISOString(),albums};
}
export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET, OPTIONS");
  res.setHeader("Cache-Control","public, s-maxage=300, stale-while-revalidate=60");
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
  try{
    if(!cached||Date.now()-cached.time>300000)cached={time:Date.now(),payload:await build()};
    return res.status(200).json(cached.payload);
  }catch(error){
    console.error("Photo feed failed:",error.message);
    return res.status(503).json({error:"Live photo feed unavailable"});
  }
}
