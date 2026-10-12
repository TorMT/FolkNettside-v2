/** Accept V2 questions and the actual NTNU V1 text/options/answer[] schema. */
export function normalizeQuiz(data={}){
  const title=String(data.title||"Quiz").trim()||"Quiz";
  const questions=(Array.isArray(data.questions)?data.questions:[]).map((question,index)=>{
    const prompt=String(question?.prompt??question?.text??"").trim();
    const sourceChoices=question?.choices??question?.options;
    const choices=Array.isArray(sourceChoices)?sourceChoices.map(choice=>String(choice)):[];
    const rawAnswers=Array.isArray(question?.answer)?question.answer:[question?.answer];
    const answers=[...new Set(rawAnswers.map(Number))].sort((a,b)=>a-b);
    const multiple=question?.type==="multiple"||answers.length>1;
    if(!prompt)throw new Error(`Quiz question ${index+1} is missing a prompt`);
    if(choices.length<2)throw new Error(`Quiz question ${index+1} must have at least two choices`);
    if(!answers.length||answers.some(a=>!Number.isInteger(a)||a<0||a>=choices.length))
      throw new Error(`Quiz question ${index+1} has an invalid answer index`);
    const images=typeof question?.image==="string"?question.image:"";
    return {
      id:String(question.id||`q${index+1}`),
      chapter:String(question.chapter??question.chapterId??"").trim(),
      prompt,choices,multiple,
      answer:multiple?answers:answers[0],correctAnswers:answers,
      explanation:String(question.explanation||"").trim(),
      optionExplanations:Array.isArray(question.optionExplanations)?
        question.optionExplanations.slice(0,choices.length).map(String):[],
      image:images.slice(0,800)
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
  const select=Number(data.select);
  return {title,questions,version:Number(data.version)||1,
    select:Number.isInteger(select)&&select>0?Math.min(select,questions.length):questions.length,
    chapters:[...chapters].map(([id,label])=>({
      id,label,count:questions.filter(q=>(q.chapter||"general")===id).length
    })).filter(chapter=>chapter.count>0)};
}

/** Compare exact sets for a V1 multi-answer question, or a single index. */
export function answerMatches(question,selection){
 if(question.multiple){
   if(!Array.isArray(selection))return false;
   const given=[...new Set(selection)].sort((a,b)=>a-b);
   return given.length===question.correctAnswers.length&&
     given.every((value,i)=>value===question.correctAnswers[i]);
 }
 return Number.isInteger(selection)&&selection===question.answer;
}

export function quizImageURL(resource,image){
 if(typeof image!=="string"||image.length>800||!image||
    image.startsWith("/")||image.includes("\\")||image.includes("%")||
    image.includes("?")||image.includes("#"))return null;
 const segments=image.split("/");
 if(segments.some(part=>!part||part==="."||part===".."||
   /[\u0000-\u001f]/.test(part)))return null;
 const file=segments.at(-1);
 if(!/\.(png|jpe?g|webp|gif)$/i.test(file))return null;
 const root=resource.path||resource.url;
 if(typeof root!=="string"||!root)return null;
 const base=new URL(root,typeof document!=="undefined"?document.baseURI:
   "https://tormt.folk.ntnu.no/");
 if(!["http:","https:"].includes(base.protocol))return null;
 // Legacy V1 stores "quiz/bilder/foo.png" relative to course root.
 if(segments[0].toLowerCase()==="quiz"&&/\/quiz\/$/i.test(
    base.pathname.slice(0,base.pathname.lastIndexOf("/")+1)))
   segments.shift();
 const fileURL=new URL(segments.map(encodeURIComponent).join("/"),base);
 const prefix=base.pathname.slice(0,base.pathname.lastIndexOf("/")+1);
 if(fileURL.origin!==base.origin||!fileURL.pathname.startsWith(prefix))return null;
 return fileURL.toString();
}

export function quizChapterView(quiz,chapterId="all"){
  if(chapterId==="all")return quiz;
  if(!quiz.chapters?.some(chapter=>chapter.id===chapterId))throw new Error("Unknown quiz chapter");
  return {...quiz,questions:quiz.questions.filter(q=>(q.chapter||"general")===chapterId)};
}

export function quizChapterStorageKey(resource,chapterId="all"){
  const key=quizStorageKey(resource);
  return chapterId==="all"?key:key+"::chapter:"+encodeURIComponent(chapterId);

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
    const question=quiz.questions[i];
    if(question.multiple&&Array.isArray(value)&&value.length&&value.length<=question.choices.length&&
        value.every(v=>Number.isInteger(v)&&v>=0&&v<question.choices.length)){
      answers[i]=[...new Set(value)].sort((a,b)=>a-b);
    }else if(!question.multiple&&Number.isInteger(value)&&
       value>=0&&value<question.choices.length)answers[i]=value;
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
    if(answerMatches(question,answer))correct++;
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
  const question=quiz.questions[index];
  let value;
  if(question.multiple){
    if(!Array.isArray(choice)||!choice.length||choice.length>question.choices.length||
       !choice.every(x=>Number.isInteger(x)&&x>=0&&x<question.choices.length))return next;
    value=[...new Set(choice)].sort((a,b)=>a-b);
  }else{
    value=Number(choice);
    if(!Number.isInteger(value)||value<0||value>=question.choices.length)return next;
  }
  next.answers=[...next.answers];
  next.answers[index]=value;
  next.current=index;
  // Completion is explicit so the final question can show its feedback before results.
  next.completed=false;
  next.updatedAt=Date.now();
  return next;
}
