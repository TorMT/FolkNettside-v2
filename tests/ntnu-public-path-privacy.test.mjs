import test from "node:test";
import assert from "node:assert/strict";
import {
  NTNU_ORIGIN,isSafeNTNUSegment,parseNTNUSemesterIndex
} from "../src/courses/ntnu-catalog.js";
import {
  validateNTNUAutoCatalog,loadPreferredNTNUCatalog
} from "../src/courses/ntnu-autocatalog.js";

const credentialNames=[
 "filer/API_token.json",
 "filer/Exam/PasswordList.txt",
 "filer/notes/client_secret.json",
 "filer/notes/api-key.json",
 "filer/notes/service-account.json",
 "filer/notes/id_rsa",
 "filer/notes/id_ed25519.pub",
 "filer/notes/private-key.pem",
 "filer/notes/cert.p12",
 "filer/notes/ca.pfx",
 "filer/notes/auth.p8",
 "filer/notes/trust.keystore",
 "filer/notes/credentials.xlsx",
 "filer/notes/.env.production",
 "filer/notes/.htaccess",
 "filer/Passord/forelesning.pdf",
 "filer/secret lecture/intro.pdf",
 "filer/Token-oppgaver/oppgave.py"
];
const normalNames=[
 "filer/Øving 1/oppgave.py",
 "filer/Prosjekt/Nested/solver.ipynb",
 "filer/Forelesninger/generell-kjemi.pdf",
 "quiz/quiz.json"
];

const index=files=>({
 "marin-dynamikk":{dir:"marin-dynamikk",beskyttet:false,files}
});
const makeResource=relativePath=>{
 const path="/semestre/5/marin-dynamikk/"+relativePath.split("/")
   .map(encodeURIComponent).join("/");
 return {source:"ntnu",relativePath,path,url:NTNU_ORIGIN+path,
  size:0,modified:0};
};
const auto=relativePath=>({
 schemaVersion:2,source:"ntnu-auto-preview",
 semesters:[{id:5,courses:[{
  semester:5,code:"marin-dynamikk",title:"Marin dynamikk",
  resources:[makeResource(relativePath)]
 }]}]
});

test("legacy index ignores credential-like files and folder names but keeps approved coursework",()=>{
 const parsed=parseNTNUSemesterIndex(5,index([...normalNames,...credentialNames]));
 assert.equal(parsed.courses.length,1);
 assert.deepEqual(parsed.courses[0].resources.map(x=>x.relativePath).sort(),
   [...normalNames].sort());
 for(const relative of credentialNames){
   assert.equal(parsed.courses[0].resources.some(x=>x.relativePath===relative),
     false,"Credential-like metadata must never become a public file link");
 }
 assert.ok(parsed.courses[0].resources.some(x=>x.name==="solver.ipynb"));
});

test("both legacy and generated index paths use the same fail-closed segment policy",()=>{
 for(const relative of credentialNames){
   const tail=relative.split("/").find(piece=>!isSafeNTNUSegment(piece));
   assert.ok(tail,"A credential-like filename or folder must be rejected");
   assert.throws(()=>validateNTNUAutoCatalog(auto(relative)),
     /Unsafe or duplicate auto-index path/);
 }
 for(const relative of normalNames){
   assert.ok(relative.split("/").every(isSafeNTNUSegment));
   const checked=validateNTNUAutoCatalog(auto(relative));
   assert.equal(checked.semesters[0].courses[0].resources[0].relativePath,
     relative);
 }
 for(const code of ["student_token","passwords","service_account","api_key"]){
   assert.equal(isSafeNTNUSegment(code),false);
   const candidate=auto(normalNames[0]);
   candidate.semesters[0].courses[0].code=code;
   assert.throws(()=>validateNTNUAutoCatalog(candidate),/course/);
 }
});

test("a rejected generated entry falls back only to filtered public legacy metadata",async()=>{
 const requests=[];
 const fetchImpl=async(url)=>{
   requests.push(url);
   const body=url==="./data/ntnu-autocatalog.json"?
     auto("filer/Access_token.json"):
     new URL(url).pathname==="/semestre/index.json"?
     {"5":{dir:"5",beskyttet:false}}:
     index([...credentialNames,...normalNames]);
   return {ok:true,status:200,headers:{get:()=>null},
     text:async()=>JSON.stringify(body)};
 };
 const result=await loadPreferredNTNUCatalog({fetchImpl});
 assert.equal(result.fallback,true);
 assert.equal(result.manifest.source,"ntnu-same-origin");
 assert.equal(result.manifest.semesters[0].courses[0].resources.length,
   normalNames.length);
 assert.equal(requests.length,3);
 assert.ok(!JSON.stringify(result.manifest).includes("secret lecture"));
 assert.ok(!JSON.stringify(result.manifest).includes("API_token"));
});
