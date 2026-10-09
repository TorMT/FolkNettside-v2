import test from "node:test";
import assert from "node:assert/strict";
import {spreadsheetCellHTML,spreadsheetCellView} from "../src/viewers/xlsx-formulas.js";
import {fixedRingPlanetaryRates} from "../src/engineering/kisssoft-motion.js";
import {normalizeQuiz,quizChapterView,quizChapterStorageKey,quizScore,createQuizAttempt} from "../src/viewers/quiz-core.js";

test("Excel formula switch represents cached values and formula source without evaluation",()=>{
  assert.deepEqual(spreadsheetCellView({value:"120",formula:"SUM(A1:A10)",hasFormula:true}),{
    value:"120",formula:"=SUM(A1:A10)"
  });
  const html=spreadsheetCellHTML({value:"120",formula:"<script>",hasFormula:true});
  assert.match(html,/office-cell-formula/);
  assert.match(html,/&lt;script&gt;/);
  assert.doesNotMatch(html,/<script>/);
  assert.equal(spreadsheetCellView({value:"14",hasFormula:true,formula:""}).formula,null,
    "Do not fabricate a relative formula for shared-formula continuation cells");
  assert.doesNotMatch(spreadsheetCellHTML({value:"Plain",hasFormula:false}),/office-cell-formula/);
});

test("Quiz chapter filtering preserves separately scoped question pools and progress identities",()=>{
 const quiz=normalizeQuiz({
   title:"Engineering",version:3,
   chapters:[{id:"chapter1",title:"Hydrostatics"},{id:"chapter2",title:"Stability"}],
   questions:[
     {prompt:"Barge volume?",choices:["30","36"],answer:1,chapter:"chapter1"},
     {prompt:"GM?",choices:["1","2"],answer:0,chapter:"chapter2"}
   ]
 });
 assert.deepEqual(quiz.chapters.map(c=>c.count),[1,1]);
 const subset=quizChapterView(quiz,"chapter1");
 assert.equal(subset.questions.length,1);
 assert.equal(subset.questions[0].prompt,"Barge volume?");
 assert.equal(quizScore(subset,createQuizAttempt(subset)).total,1);
 const resource={relativePath:"Sem5/Quiz/hydro.quiz.json"};
 assert.notEqual(quizChapterStorageKey(resource,"chapter1"),quizChapterStorageKey(resource,"chapter2"));
 assert.equal(quizChapterStorageKey(resource), "folknet:quiz:Sem5/Quiz/hydro.quiz.json");
 assert.throws(()=>quizChapterView(quiz,"unknown"),/Unknown/);
});

test("Fixed-ring planetary concept uses physically consistent angular-speed ratios",()=>{
 const rates=fixedRingPlanetaryRates(25,35,95);
 assert.equal(rates.sun,1);
 assert.equal(rates.ring,0);
 assert.ok(Math.abs(rates.carrier-25/120)<1e-12);
 assert.ok(Math.abs(rates.planet+5/14)<1e-12);
 assert.ok(Math.abs(rates.carrier+rates.planetRelativeCarrier-rates.planet)<1e-12);
 assert.throws(()=>fixedRingPlanetaryRates(25,35,96),/inconsistent/);
 assert.throws(()=>fixedRingPlanetaryRates(0,35,95),/Positive/);
});
