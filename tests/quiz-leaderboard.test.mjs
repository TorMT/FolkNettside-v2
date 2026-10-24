import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  leaderboardQuizId,leaderboardPayload,leaderboardEndpoint,
  normalizeLeaderboardEntries
} from "../src/viewers/quiz-leaderboard.js";

const quizResource={
  source:"ntnu",url:"https://tormt.folk.ntnu.no/semestre/1/exphil/quiz/quiz.json"
};
const quiz={
  title:"Example",questions:[{id:"q1"},{id:"q2"}]
};
const completed={completed:true,answers:[1,[0,2]]};

test("only approved same-origin legacy quiz paths become leaderboard IDs",()=>{
  assert.equal(leaderboardQuizId(quizResource),"1/exphil");
  assert.equal(leaderboardQuizId({...quizResource,url:"https://evil.example/semestre/1/exphil/quiz/quiz.json"}),null);
  assert.equal(leaderboardQuizId({...quizResource,url:"https://tormt.folk.ntnu.no/semestre/1/exphil/quiz/../private.json"}),null);
  assert.equal(leaderboardQuizId({...quizResource,url:"https://tormt.folk.ntnu.no/semestre/1/exphil/quiz/quiz.json?x=1"}),null);
  assert.equal(leaderboardQuizId({...quizResource,source:"fixture"}),null);
});

test("only completed full rounds can submit choices; never trust a client score",()=>{
  assert.deepEqual(leaderboardPayload(quizResource,quiz,completed,2),{
    quiz:"1/exphil",answers:[{id:"q1",selected:1},{id:"q2",selected:[0,2]}]
  });
  assert.equal(leaderboardPayload(quizResource,quiz,completed,3),null);
  assert.equal(leaderboardPayload(quizResource,quiz,{completed:false,answers:[1,[0,2]]},2),null);
  assert.equal(leaderboardPayload(quizResource,quiz,{completed:true,answers:[1,null]},2),null);
});

test("disabled, cross-origin and non-PHP endpoints cannot be selected",()=>{
  const ctx={base:"https://tormt.folk.ntnu.no/v2-staging/index.html",origin:"https://tormt.folk.ntnu.no"};
  assert.equal(leaderboardEndpoint({quizLeaderboard:{enabled:false,endpoint:"./api/quiz-leaderboard.php"}},ctx),null);
  assert.equal(leaderboardEndpoint({quizLeaderboard:{enabled:true,endpoint:"https://evil.example/api/quiz-leaderboard.php"}},ctx),null);
  assert.equal(leaderboardEndpoint({quizLeaderboard:{enabled:true,endpoint:"./api/quiz-leaderboard.js"}},ctx),null);
  assert.equal(leaderboardEndpoint({quizLeaderboard:{enabled:true,endpoint:"./api/quiz-leaderboard.php"}},ctx),
    "https://tormt.folk.ntnu.no/v2-staging/api/quiz-leaderboard.php");
});

test("ranking responses are bounded and structurally validated",()=>{
  assert.deepEqual(normalizeLeaderboardEntries({entries:[{nickname:"Ola",correct:2,total:3}]}),
    [{nickname:"Ola",correct:2,total:3}]);
  assert.throws(()=>normalizeLeaderboardEntries({entries:[{nickname:"x",correct:7,total:3}]}),/Invalid/);
  assert.throws(()=>normalizeLeaderboardEntries({entries:"unsafe"}),/Invalid/);
});

test("quiz renderer mounts ranking only in full completed result; PHP remains opt-in",()=>{
  const adapter=readFileSync(new URL("../src/viewers/adapters/quiz.js",import.meta.url),"utf8");
  const config=JSON.parse(readFileSync(new URL("../data/service-endpoints.json",import.meta.url),"utf8"));
  const php=readFileSync(new URL("../server/quiz-leaderboard.php",import.meta.url),"utf8");
  assert.equal(config.quizLeaderboard.enabled,false);
  assert.equal(config.quizLeaderboard.endpoint,null);
  assert.match(adapter,/mountQuizLeaderboard/);
  assert.match(adapter,/!mistakeMode&&selectedChapter==="all"&&quiz.questions.length===catalogQuiz.questions.length/);
  assert.match(php,/FOLK_LEADERBOARD_QUIZZES/);
  assert.match(php,/hash_hmac\('sha256'/);
  assert.match(php,/\$correct\+\+/);
});
