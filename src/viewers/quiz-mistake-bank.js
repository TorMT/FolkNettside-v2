import {quizStorageKey,answerMatches} from "./quiz-core.js?v=926c03b74b4f91155d335575219cf17720aedde5";

function storageKey(resource){return quizStorageKey(resource)+":mistake-bank.v1"}
function hash(text){
  let value=2166136261;
  for(const character of String(text||"")){
    value=Math.imul(value^character.charCodeAt(0),16777619)>>>0;
  }
  return value.toString(16).padStart(8,"0");
}
export function quizQuestionKey(question){
  return [String(question.id||"").slice(0,80),String(question.chapter||"").slice(0,80),
    hash(question.prompt)].join(":");
}
export function readMistakeBank(resource,storage=globalThis.localStorage){
  try{
    const parsed=JSON.parse(storage?.getItem(storageKey(resource))||"{}");
    if(!parsed||!Array.isArray(parsed.entries))return [];
    return parsed.entries.filter(x=>typeof x.key==="string"&&x.key.length<=190&&
      Number.isInteger(x.wrongCount)&&x.wrongCount>0)
      .slice(0,512);
  }catch{return []}
}
export function recordQuizChoice(resource,question,choice,storage=globalThis.localStorage){
  const chosen=question.multiple?choice:Number(choice);
  if(question.multiple){
    if(!Array.isArray(chosen)||!chosen.length||
       !chosen.every(v=>Number.isInteger(v)&&v>=0&&v<question.choices.length))return false;
  }else if(!Number.isInteger(chosen)||chosen<0||chosen>=question.choices.length)return false;
  const entries=readMistakeBank(resource,storage);
  const key=quizQuestionKey(question);
  const index=entries.findIndex(item=>item.key===key);
  const correct=answerMatches(question,chosen);
  if(correct){
    if(index>=0)entries.splice(index,1);
  }else{
    const previous=index>=0?entries.splice(index,1)[0]:null;
    entries.unshift({
      key,wrongCount:Math.min(100000,(previous?.wrongCount||0)+1),lastWrongAt:Date.now()
    });
  }
  try{storage?.setItem(storageKey(resource),JSON.stringify({version:1,entries:entries.slice(0,512)}))}catch{}
  return !correct;
}
export function mistakeQuestions(quiz,resource,storage=globalThis.localStorage){
  const keys=new Set(readMistakeBank(resource,storage).map(item=>item.key));
  return quiz.questions.filter(q=>keys.has(quizQuestionKey(q)));
}
export function clearMistakeBank(resource,storage=globalThis.localStorage){
  try{storage?.removeItem(storageKey(resource))}catch{}
}
