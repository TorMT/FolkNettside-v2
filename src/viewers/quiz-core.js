export function normalizeQuiz(data={}){
  const title=String(data.title||"Quiz").trim()||"Quiz";
  const questions=(Array.isArray(data.questions)?data.questions:[]).map((question,index)=>{
    const prompt=String(question?.prompt||"").trim();
    const choices=Array.isArray(question?.choices)?question.choices.map(choice=>String(choice)):[];
    const answer=Number(question?.answer);
    if(!prompt)throw new Error(`Quiz question ${index+1} is missing a prompt`);
    if(choices.length<2)throw new Error(`Quiz question ${index+1} must have at least two choices`);
    if(!Number.isInteger(answer)||answer<0||answer>=choices.length){
      throw new Error(`Quiz question ${index+1} has an invalid answer index`);
    }
    return {
      id:String(question.id||`q${index+1}`),
      chapter:String(question.chapter??question.chapterId??"").trim(),
      prompt,
      choices,
      answer,
      explanation:String(question.explanation||"").trim()
    };
  });
  if(!questions.length)throw new Error("Quiz has no questions");
  const declared=Array.isArray(data.chapters)?data.chapters:[];
  const chapters=new Map();
  for(const entry of declared){
    const id=String(typeof entry==="string"?entry:entry?.id??"").trim();
    const label=String(typeof entry==="string"?entry:entry?.title??entry?.label??id).trim();
    if(id)chapters.set(id,label||id);
  }
  for(const question of questions){
    if(question.chapter&&!chapters.has(question.chapter))chapters.set(question.chapter,question.chapter);
  }
  if(chapters.size&&questions.some(q=>!q.chapter))chapters.set("general",chapters.get("general")||"General");
  return {title,questions,version:Number(data.version)||1,
    chapters:[...chapters].map(([id,label])=>({
      id,label,count:questions.filter(q=>(q.chapter||"general")===id).length
    })).filter(chapter=>chapter.count>0)};
}

export function quizChapterView(quiz,chapterId="all"){
  if(chapterId==="all")return quiz;
  if(!quiz.chapters?.some(chapter=>chapter.id===chapterId))throw new Error("Unknown quiz chapter");
  return {...quiz,questions:quiz.questions.filter(q=>(q.chapter||"general")===chapterId)};
}

export function quizChapterStorageKey(resource,chapterId="all"){
  const key=quizStorageKey(resource);
  return chapterId==="all"?key+"::chapter:"+encodeURIComponent(chapterId);

}

export function createQuizAttempt(quiz){
  return {
    version:1,
    quizVersion:quiz.version,
    current:0,
    answers:Array(quiz.questions.length).fill(null),
    completed:false,
    updatedAt:Date.now()
  };
}

export function sanitizeQuizAttempt(quiz,attempt){
  const fresh=createQuizAttempt(quiz);
  if(!attempt||attempt.quizVersion!==quiz.version)return fresh;
  const answers=Array(quiz.questions.length).fill(null);
  for(let i=0;i<answers.length;i++){
    const value=attempt.answers?.[i];
    if(Number.isInteger(value)&&value>=0&&value<quiz.questions[i].choices.length)answers[i]=value;
  }
  const answered=answers.filter(value=>value!==null).length;
  return {
    ...fresh,
    current:Math.max(0,Math.min(quiz.questions.length-1,Number(attempt.current)||0)),
    answers,
    completed:Boolean(attempt.completed)&&answered===quiz.questions.length,
    updatedAt:Number(attempt.updatedAt)||fresh.updatedAt
  };
}

export function quizScore(quiz,attempt){
  let correct=0,answered=0;
  quiz.questions.forEach((question,index)=>{
    const answer=attempt.answers?.[index];
    if(answer===null||answer===undefined)return;
    answered++;
    if(answer===question.answer)correct++;
  });
  return {
    correct,
    answered,
    total:quiz.questions.length,
    percent:quiz.questions.length?Math.round(correct/quiz.questions.length*100):0
  };
}

export function quizStorageKey(resource={}){
  const identity=resource.relativePath||resource.path||resource.url||resource.name||resource.label||"quiz";
  return `folknet:quiz:${String(identity)}`;
}

export function answerQuestion(quiz,attempt,index,choice){
  const next=sanitizeQuizAttempt(quiz,attempt);
  if(next.answers[index]!==null)return next;
  const numeric=Number(choice);
  if(!Number.isInteger(numeric)||numeric<0||numeric>=quiz.questions[index].choices.length)return next;
  next.answers=[...next.answers];
  next.answers[index]=numeric;
  next.current=index;
  // Completion is explicit so the final question can show its feedback before results.
  next.completed=false;
  next.updatedAt=Date.now();
  return next;
}
