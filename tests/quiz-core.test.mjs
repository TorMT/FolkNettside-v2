import test from "node:test";
import assert from "node:assert/strict";
import {
  answerQuestion,createQuizAttempt,normalizeQuiz,quizScore,quizStorageKey,sanitizeQuizAttempt
} from "../src/viewers/quiz-core.js";

const quiz=normalizeQuiz({
  title:"Fixture",
  version:2,
  questions:[
    {id:"a",prompt:"2+2?",choices:["3","4","5"],answer:1,explanation:"4"},
    {id:"b",prompt:"Unit of area?",choices:["m","m²"],answer:1}
  ]
});

test("quiz normalization validates prompts choices and answer indices",()=>{
  assert.equal(quiz.title,"Fixture");
  assert.equal(quiz.questions.length,2);
  assert.throws(()=>normalizeQuiz({questions:[]}),/no questions/i);
  assert.throws(()=>normalizeQuiz({questions:[{prompt:"x",choices:["a"],answer:0}]}),/at least two/i);
  assert.throws(()=>normalizeQuiz({questions:[{prompt:"x",choices:["a","b"],answer:3}]}),/invalid answer/i);
});

test("quiz attempts score once and retain unanswered states",()=>{
  let attempt=createQuizAttempt(quiz);
  assert.deepEqual(quizScore(quiz,attempt),{correct:0,answered:0,total:2,percent:0});

  attempt=answerQuestion(quiz,attempt,0,1);
  assert.equal(attempt.answers[0],1);
  assert.equal(quizScore(quiz,attempt).correct,1);

  const duplicate=answerQuestion(quiz,attempt,0,0);
  assert.equal(duplicate.answers[0],1);

  attempt=answerQuestion(quiz,attempt,1,0);
  const score=quizScore(quiz,attempt);
  assert.equal(score.correct,1);
  assert.equal(score.answered,2);
  assert.equal(score.percent,50);
  assert.equal(attempt.completed,false);
});

test("stored attempts are sanitized against quiz version and choice bounds",()=>{
  const restored=sanitizeQuizAttempt(quiz,{
    quizVersion:2,current:99,answers:[1,8],completed:true,updatedAt:123
  });
  assert.equal(restored.current,1);
  assert.deepEqual(restored.answers,[1,null]);
  assert.equal(restored.completed,false);

  const stale=sanitizeQuizAttempt(quiz,{quizVersion:1,answers:[1,1]});
  assert.deepEqual(stale.answers,[null,null]);
});

test("quiz storage identity follows resource path",()=>{
  assert.equal(
    quizStorageKey({relativePath:"Quiz/hydro.quiz.json"}),
    "folknet:quiz:Quiz/hydro.quiz.json"
  );
});
