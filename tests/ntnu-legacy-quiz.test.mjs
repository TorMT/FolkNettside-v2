import test from "node:test";
import assert from "node:assert/strict";
import {
 normalizeQuiz,answerMatches,answerQuestion,quizScore,createQuizAttempt,
 sanitizeQuizAttempt,quizStorageKey,quizImageURL,selectQuizQuestions
} from "../src/viewers/quiz-core.js";
import {recordQuizChoice,mistakeQuestions} from "../src/viewers/quiz-mistake-bank.js";

const legacy=normalizeQuiz({
 title:"ITGK – Quiz",select:2,questions:[
  {id:"q001",type:"multiple",text:"Hvilke tall skrives ut?",
   options:["0","1","2","3"],answer:[0,1],image:"quiz/bilder/q001_range.png",
   chapter:"Kapittel 1",explanation:"To tall"},
  {id:"q002",type:"single",text:"Hvilket tall?",options:["1","2","3"],
   answer:[2],chapter:"Kapittel 1",image:"bilder/q002.png"},
  {id:"q003",type:"single",text:"Enhet?",options:["m","s"],
   answer:[0],chapter:"Kapittel 2"}
 ]});
const memory=()=>{const m=new Map();return {
  getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)
}};
test("normalize V1 options/text/answer arrays without breaking V2 single-choice",()=>{
 assert.equal(legacy.title,"ITGK – Quiz");
 assert.equal(legacy.select,2);
 assert.equal(legacy.questions[0].prompt,"Hvilke tall skrives ut?");
 assert.deepEqual(legacy.questions[0].answer,[0,1]);
 assert.deepEqual(legacy.questions[0].correctAnswers,[0,1]);
 assert.equal(legacy.questions[0].multiple,true);
 assert.equal(legacy.questions[1].answer,2);
 assert.equal(legacy.questions[1].multiple,false);
 assert.throws(()=>normalizeQuiz({questions:[{text:"x",options:["a","b"],answer:[]}] }),
   /invalid answer/);
});
test("multi-choice submits only exact sets, stores and restores arrays safely",()=>{
 const q={...legacy,questions:legacy.questions.slice(0,2)};
 let a=createQuizAttempt(q);
 assert.equal(answerMatches(q.questions[0],[1,0]),true);
 assert.equal(answerMatches(q.questions[0],[0]),false);
 assert.equal(answerMatches(q.questions[0],[0,1,2]),false);
 a=answerQuestion(q,a,0,[1,0,0]);
 assert.deepEqual(a.answers[0],[0,1]);
 assert.equal(quizScore(q,a).correct,1);
 a=answerQuestion(q,a,1,2);
 assert.deepEqual(quizScore(q,a),{correct:2,answered:2,total:2,percent:100});
 const restored=sanitizeQuizAttempt(q,{quizVersion:q.version,
   answers:[[1,0],2],current:0,completed:true});
 assert.deepEqual(restored.answers,[[0,1],2]);
 assert.equal(restored.completed,true);
 const invalid=sanitizeQuizAttempt(q,{quizVersion:q.version,
   answers:[[0,99],99]});
 assert.deepEqual(invalid.answers,[null,null]);
});
test("course-specific progress and wrong-bank records never mix NTNU quizzes",()=>{
 const a={source:"ntnu",relativePath:"quiz/quiz.json",
   path:"/semestre/1/itgk/quiz/quiz.json"};
 const b={...a,path:"/semestre/2/fysikk/quiz/quiz.json"};
 assert.notEqual(quizStorageKey(a),quizStorageKey(b));
 const st=memory();
 assert.equal(recordQuizChoice(a,legacy.questions[0],[0],st),true);
 assert.deepEqual(mistakeQuestions(legacy,a,st),[legacy.questions[0]]);
 assert.deepEqual(mistakeQuestions(legacy,b,st),[]);
 assert.equal(recordQuizChoice(a,legacy.questions[0],[0,1],st),false);
 assert.deepEqual(mistakeQuestions(legacy,a,st),[]);
});
test("V1 quiz illustrations resolve only within containing quiz folder",()=>{
 const resource={path:"https://tormt.folk.ntnu.no/semestre/1/itgk/quiz/quiz.json"};
 assert.equal(quizImageURL(resource,legacy.questions[0].image),
  "https://tormt.folk.ntnu.no/semestre/1/itgk/quiz/bilder/q001_range.png");
 assert.equal(quizImageURL(resource,legacy.questions[1].image),
  "https://tormt.folk.ntnu.no/semestre/1/itgk/quiz/bilder/q002.png");
 for(const img of ["../secret.png","https://evil.example/foo.png",
   "quiz/%2e%2e/data.png","/evil.png","quiz/../../../foo.png",
   "foo.svg","foo.png?secret=1",String.raw`quiz\..\secret.png`]){
   assert.equal(quizImageURL(resource,img),null,img);
 }
});
test("legacy select-N persists a randomized round until explicitly restarted",()=>{
 const storage=memory();
 const resource={source:"ntnu",path:"/semestre/1/itgk/quiz/quiz.json"};
 const first=selectQuizQuestions(legacy,resource,{storage,random:()=>0});
 assert.equal(first.questions.length,2);
 assert.deepEqual(first.questions.map(x=>x.id),["q001","q002"]);
 const stable=selectQuizQuestions(legacy,resource,{storage,random:()=>0.99});
 assert.deepEqual(stable.questions.map(x=>x.id),["q001","q002"]);
 assert.equal(first.version,stable.version);
 const reset=selectQuizQuestions(legacy,resource,{storage,random:()=>0.99,reset:true});
 assert.equal(reset.questions.length,2);
 assert.notDeepEqual(reset.questions.map(x=>x.id),["q001","q002"]);
 assert.notEqual(first.version,reset.version);
});
