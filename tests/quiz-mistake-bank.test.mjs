import test from "node:test";
import assert from "node:assert/strict";
import {normalizeQuiz} from "../src/viewers/quiz-core.js";
import {
  readMistakeBank,recordQuizChoice,mistakeQuestions,clearMistakeBank,quizQuestionKey
} from "../src/viewers/quiz-mistake-bank.js";

function memoryStorage(){
  const values=new Map();
  return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),
    removeItem:k=>values.delete(k)};
}
const quiz=normalizeQuiz({
  title:"Mechanics",
  questions:[
    {id:"q1",chapter:"1",prompt:"What is GM?",choices:["Length","Force"],answer:0},
    {id:"q2",chapter:"2",prompt:"What is BM?",choices:["Area","Length"],answer:1}
  ]
});
const resource={path:"./semesters/4/MAR4110/Quiz/quiz.json"};
test("Wrong answers persist by quiz and question, and mastering removes them",()=>{
  const storage=memoryStorage();
  assert.deepEqual(mistakeQuestions(quiz,resource,storage),[]);
  assert.equal(recordQuizChoice(resource,quiz.questions[0],1,storage),true);
  assert.equal(recordQuizChoice(resource,quiz.questions[0],1,storage),true);
  assert.equal(readMistakeBank(resource,storage)[0].wrongCount,2);
  assert.deepEqual(mistakeQuestions(quiz,resource,storage),[quiz.questions[0]]);
  assert.equal(recordQuizChoice(resource,quiz.questions[0],0,storage),false);
  assert.deepEqual(mistakeQuestions(quiz,resource,storage),[]);
  assert.equal(recordQuizChoice(resource,quiz.questions[1],0,storage),true);
  clearMistakeBank(resource,storage);
  assert.equal(readMistakeBank(resource,storage).length,0);
});
test("Wrong-answer history never leaks into other quizzes or stale revisions",()=>{
  const storage=memoryStorage();
  const other={path:"./another/quiz.json"};
  recordQuizChoice(resource,quiz.questions[1],0,storage);
  assert.deepEqual(mistakeQuestions(quiz,other,storage),[]);
  const revised=normalizeQuiz({questions:[
    {id:"q2",chapter:"2",prompt:"Different question",choices:["Area","Length"],answer:1}
  ]});
  assert.deepEqual(mistakeQuestions(revised,resource,storage),[]);
});
test("Malformed local history and invalid selections fail closed",()=>{
  const storage=memoryStorage();
  assert.equal(recordQuizChoice(resource,quiz.questions[0],-1,storage),false);
  assert.equal(readMistakeBank(resource,storage).length,0);
  recordQuizChoice(resource,quiz.questions[0],1,storage);
  const original=quizQuestionKey(quiz.questions[0]);
  assert.match(original,/q1:1:/);
  const stored=readMistakeBank(resource,storage);
  assert.equal(stored[0].key,original);
  assert.equal(typeof stored[0].lastWrongAt,"number");
});
