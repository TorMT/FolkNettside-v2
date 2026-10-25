import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {
 learningResourceKey,validateLearningProgress,createFolkLearningProgress
} from "../src/platform/folk-learning-progress.js";

const config={url:"https://aeuouzkiyddfjtjfdosp.supabase.co",
 publishableKey:"sb_publishable_"+"Q".repeat(30)};
const user="11111111-2222-3333-4444-555555555555";
const resource={source:"ntnu",path:"/semestre/5/Marin-Dynamikk/quiz/quiz.json"};
const inputs={
 config,tokenProvider:async()=> "folk-supabase-auth-jwt",
 snapshotProvider:()=>({status:"signed-in",user:{id:user}}),
 cryptoImpl:webcrypto
};
const response=(data,status=200)=>({
 ok:status>=200&&status<300,status,json:async()=>data
});
const data={answered:3,total:5,correct:2,completed:false,
 updatedAt:"2026-10-13T10:30:00.000Z"};

test("stable per-kind SHA-256 keys cannot collide across courses or kinds",async()=>{
 const quiz=await learningResourceKey("quiz",resource,{cryptoImpl:webcrypto});
 const repeat=await learningResourceKey("quiz",{...resource},{cryptoImpl:webcrypto});
 const other=await learningResourceKey("quiz",{
   ...resource,path:"/semestre/4/Marin-Dynamikk/quiz/quiz.json"
 },{cryptoImpl:webcrypto});
 const video=await learningResourceKey("video",resource,{cryptoImpl:webcrypto});
 assert.match(quiz,/^[a-f0-9]{64}$/);
 assert.equal(quiz,repeat);
 assert.notEqual(quiz,other);
 assert.notEqual(quiz,video);
 await assert.rejects(learningResourceKey("medicine",resource,{cryptoImpl:webcrypto}),/kind/);
 await assert.rejects(learningResourceKey("quiz",{source:"ntnu",relativePath:"quiz/quiz.json"},
   {cryptoImpl:webcrypto}),/stable NTNU/);
});

test("progress summaries exclude raw quiz answers, notes and arbitrary secrets",()=>{
 assert.deepEqual(validateLearningProgress("quiz",{...data,answers:["A","B"],
  medicine:"private"}),data);
 assert.deepEqual(validateLearningProgress("course",{
  completed:true,updatedAt:data.updatedAt,private_notes:"must not upload"
 }),{completed:true,updatedAt:data.updatedAt});
 assert.deepEqual(validateLearningProgress("video",{
  position:23,duration:70,watched:false,token:"no",updatedAt:data.updatedAt
 }),{position:23,duration:70,watched:false,updatedAt:data.updatedAt});
 assert.throws(()=>validateLearningProgress("quiz",{...data,correct:7}),/quiz/);
 assert.throws(()=>validateLearningProgress("video",{
  position:100,duration:20,watched:true,updatedAt:data.updatedAt
 }),/video/);
 assert.throws(()=>validateLearningProgress("course",{completed:true}),/timestamp/);
});

test("private read scopes both user identity, kind and exact hashed resource",async()=>{
 let request;
 const api=createFolkLearningProgress({...inputs,fetchImpl:async(url,options)=>{
  request={url,options};
  return response([{revision:3,progress:data,updated_at:data.updatedAt}]);
 }});
 const result=await api.read("quiz",resource);
 assert.equal(result.revision,3);
 assert.deepEqual(result.progress,data);
 const parsed=new URL(request.url);
 assert.equal(parsed.pathname,"/rest/v1/folk_learning_progress");
 assert.equal(parsed.searchParams.get("user_id"),"eq."+user);
 assert.equal(parsed.searchParams.get("kind"),"eq.quiz");
 assert.match(parsed.searchParams.get("resource_key"),/^eq\.[a-f0-9]{64}$/);
 assert.equal(request.options.headers.Authorization,"Bearer folk-supabase-auth-jwt");
 assert.equal(request.options.headers.apikey,config.publishableKey);
 assert.ok(!request.options.body);
});

test("first-write POST and conditional PATCH never replace other-device data silently",async()=>{
 let request,mode="first";
 const expectedKey=await learningResourceKey("quiz",resource,{cryptoImpl:webcrypto});
 const api=createFolkLearningProgress({...inputs,fetchImpl:async(url,options)=>{
  request={url,options};
  return response(mode==="conflict"?[]:[{
   revision:mode==="first"?1:6,user_id:user,
   kind:"quiz",resource_key:expectedKey
  }]);
 }});
 let result=await api.save("quiz",resource,{...data,answers:["private"]});
 assert.equal(result.revision,1);
 assert.equal(request.options.method,"POST");
 const post=JSON.parse(request.options.body);
 assert.deepEqual(post.progress,data);
 assert.equal(post.resource_key,expectedKey);
 assert.equal(post.user_id,user);
 assert.ok(!JSON.stringify(post).includes("private"));
 mode="update";
 result=await api.save("quiz",resource,data,{expectedRevision:5});
 assert.equal(result.revision,6);
 const url=new URL(request.url);
 assert.equal(url.searchParams.get("revision"),"eq.5");
 assert.equal(request.options.method,"PATCH");
 assert.equal(JSON.parse(request.options.body).revision,6);
 mode="conflict";
 await assert.rejects(api.save("quiz",resource,data,{expectedRevision:5}),/conflict/);
});

test("identity spoofing, wrong config, revision and permission failure fail closed",async()=>{
 assert.throws(()=>createFolkLearningProgress({config:{
  ...config,url:"https://evil.example"
 }}),/configuration/);
 const anonymous=createFolkLearningProgress({...inputs,
  snapshotProvider:()=>({status:"signed-out",user:null}),
  fetchImpl:async()=>{throw Error("Network should not happen")}});
 await assert.rejects(anonymous.read("quiz",resource),/Sign in/);
 await assert.rejects(anonymous.save("quiz",resource,data),/Sign in/);
 const denied=createFolkLearningProgress({...inputs,
  fetchImpl:async()=>response({error:"protected details"},403)});
 await assert.rejects(denied.read("quiz",resource),/cannot access/);
 const api=createFolkLearningProgress({...inputs,
  fetchImpl:async()=>response([])});
 await assert.rejects(api.save("quiz",resource,data,{expectedRevision:-5}),/revision/);
 await assert.rejects(api.save("quiz",resource,data,{expectedRevision:1}),/conflict/);
});

test("versioned schema is self-owned, limited, and advances exactly one revision",()=>{
 const sql=readFileSync(new URL("../server/supabase/20261013_learning_progress_candidate.sql",
  import.meta.url),"utf8");
 assert.match(sql,/enable row level security/i);
 assert.match(sql,/user_id = \(select auth\.uid\(\)\)/i);
 assert.match(sql,/NEW\.revision <> OLD\.revision \+ 1/);
 assert.match(sql,/pg_column_size\(progress\) <= 4096/);
 assert.match(sql,/\^\[a-f0-9\]\{64\}\$/);
});
