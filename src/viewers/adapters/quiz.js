import {escapeHTML,fetchJSON} from "../utils.js?v=f43c64dc23d4f9c4ea33c44599f732ad61d1ed78";
import {
  answerQuestion,createQuizAttempt,normalizeQuiz,quizScore,quizChapterView,quizChapterStorageKey,sanitizeQuizAttempt
} from "../quiz-core.js?v=f43c64dc23d4f9c4ea33c44599f732ad61d1ed78";
import {mistakeQuestions,recordQuizChoice,clearMistakeBank} from "../quiz-mistake-bank.js?v=f43c64dc23d4f9c4ea33c44599f732ad61d1ed78";

function loadAttempt(key,quiz){
  try{
    return sanitizeQuizAttempt(quiz,JSON.parse(localStorage.getItem(key)||"null"));
  }catch{
    return createQuizAttempt(quiz);
  }
}

function saveAttempt(key,attempt){
  try{localStorage.setItem(key,JSON.stringify(attempt))}catch{}
}

export async function render(container,resource){
  const wholeQuiz=normalizeQuiz(await fetchJSON(resource.path));
  let selectedChapter="all";
  let quiz=wholeQuiz;
  let storageKey=quizChapterStorageKey(resource);
  let attempt=loadAttempt(storageKey,quiz);
  let review=false;
  let mistakeMode=false;

  const persist=()=>saveAttempt(storageKey,attempt);
  const score=()=>quizScore(quiz,attempt);

  function chaptersHTML(){
    if(mistakeMode)return '<div class="quiz-chapter-picker"><button class="btn" id="quiz-mistake-exit" type="button">Back to full quiz</button></div>';
    if(!wholeQuiz.chapters?.length)return "";
    return `<div class="quiz-chapter-picker">
      <label for="quiz-chapter-select">Chapter</label>
      <select id="quiz-chapter-select" aria-label="Select quiz chapter">
        <option value="all" ${selectedChapter==="all"?"selected":""}>All chapters (${wholeQuiz.questions.length})</option>
        ${wholeQuiz.chapters.map(chapter=>`<option value="${escapeHTML(chapter.id)}" ${selectedChapter===chapter.id?"selected":""}>${escapeHTML(chapter.label)} (${chapter.count})</option>`).join("")}
      </select>
    </div>`;
  }
  function exitMistakes(){
    mistakeMode=false;
    selectedChapter="all";
    quiz=wholeQuiz;
    storageKey=quizChapterStorageKey(resource);
    attempt=loadAttempt(storageKey,quiz);
    review=false;
    draw();
  }
  function startMistakes(){
    const wrong=mistakeQuestions(wholeQuiz,resource);
    if(!wrong.length)return;
    persist();
    mistakeMode=true;
    quiz={...wholeQuiz,title:"Øv på feil-svar",questions:wrong,chapters:[]};
    storageKey=quizChapterStorageKey(resource,"wrong-bank");
    attempt=createQuizAttempt(quiz);
    review=false;
    draw();
  }
  function bindChapters(){
    container.querySelector("#quiz-mistake-exit")?.addEventListener("click",exitMistakes);
    container.querySelector("#quiz-chapter-select")?.addEventListener("change",event=>{
      const chapter=event.target.value;
      if(chapter===selectedChapter)return;
      persist();
      selectedChapter=chapter;
      quiz=quizChapterView(wholeQuiz,chapter);
      storageKey=quizChapterStorageKey(resource,chapter);
      attempt=loadAttempt(storageKey,quiz);
      review=false;
      draw();
    });
  }

  function progressHTML(){
    const s=score();
    return `<div class="quiz-progress">
      <div class="quiz-progress-meta"><span>${s.answered}/${s.total} answered</span><span>${s.percent}% correct</span></div>
      <div class="quiz-progress-track"><span style="width:${s.total?s.answered/s.total*100:0}%"></span></div>
    </div>`;
  }

  function resultHTML(){
    const s=score();
    return `<div class="quiz-view">
      <div class="quiz-topline"><div><span class="project-kicker">Quiz complete</span><h2>${escapeHTML(quiz.title)}</h2></div><span class="quiz-score-pill">${s.correct}/${s.total}</span></div>
      ${chaptersHTML()}
      ${progressHTML()}
      <div class="quiz-result"><strong>${s.percent}%</strong><span>${s.correct} correct of ${s.total}</span></div>
      <div class="quiz-result-actions">
        <button class="btn primary" id="quiz-review">Review answers</button>
        <button class="btn" id="quiz-restart">Start new attempt</button>
        ${!mistakeMode&&mistakeQuestions(wholeQuiz,resource).length?'<button class="btn" id="quiz-mistake-start" type="button">Øv på feil-svar ('+mistakeQuestions(wholeQuiz,resource).length+')</button>':""}
        ${mistakeMode?'<button class="btn" id="quiz-mistake-clear" type="button">Tøm feil-svar-bank</button>':""}
      </div>
    </div>`;
  }

  function questionHTML(){
    const index=Math.max(0,Math.min(quiz.questions.length-1,attempt.current));
    const q=quiz.questions[index];
    const selected=attempt.answers[index];
    const answered=selected!==null;
    const correct=Number(q.answer);
    return `<div class="quiz-view">
      <div class="quiz-topline">
        <div><span class="project-kicker">${review?"Review":"Course quiz"}</span><h2>${escapeHTML(quiz.title)}</h2></div>
        <span class="quiz-question-counter">${index+1}/${quiz.questions.length}</span>
      </div>
      ${chaptersHTML()}
      ${progressHTML()}
      <div class="quiz-question-nav" aria-label="Quiz questions">
        ${quiz.questions.map((_,i)=>{
          const a=attempt.answers[i];
          const state=a===null?"pending":a===quiz.questions[i].answer?"correct":"wrong";
          return `<button data-quiz-jump="${i}" data-state="${state}" class="${i===index?"active":""}" aria-label="Question ${i+1}">${i+1}</button>`;
        }).join("")}
      </div>
      <div class="muted">Question ${index+1} of ${quiz.questions.length}</div>
      <h3 class="quiz-prompt">${escapeHTML(q.prompt)}</h3>
      <div class="quiz-options">
        ${q.choices.map((choice,i)=>{
          const classes=[];
          if(answered&&i===correct)classes.push('data-correct="true"');
          if(answered&&i===selected&&i!==correct)classes.push('data-wrong="true"');
          return `<button class="quiz-option" data-choice="${i}" ${answered?"disabled":""} ${classes.join(" ")}><span class="quiz-choice-key">${i+1}</span><span>${escapeHTML(choice)}</span></button>`;
        }).join("")}
      </div>
      <div id="quiz-feedback">
        ${answered?`<div class="quiz-feedback ${selected===correct?"correct":"wrong"}"><strong>${selected===correct?"Correct":"Not quite"}</strong><p>${escapeHTML(q.explanation||"")}</p></div>`:""}
      </div>
      <div class="quiz-nav-actions">
        <button class="btn" id="quiz-prev" ${index===0?"disabled":""}>Previous</button>
        <div class="top-spacer"></div>
        ${answered&&index+1<quiz.questions.length?`<button class="btn primary" id="quiz-next">Next</button>`:""}
        ${answered&&index+1===quiz.questions.length?`<button class="btn primary" id="quiz-finish">Results</button>`:""}
      </div>
      <p class="quiz-shortcuts muted">Keys 1–9 answer · ←/→ navigate · Enter continues after answering</p>
    </div>`;
  }

  function draw(){
    const s=score();
    container.dispatchEvent(new CustomEvent("viewer-info-update",{detail:`${s.total} questions · ${s.answered} answered · ${s.correct} correct`}));
    if(attempt.completed&&!review){
     container.innerHTML=resultHTML();
      bindChapters();
      container.querySelector("#quiz-review")?.addEventListener("click",()=>{
        review=true;
        attempt.current=0;
        draw();
      });
      container.querySelector("#quiz-restart")?.addEventListener("click",()=>{
        attempt=createQuizAttempt(quiz);
        review=false;
        persist();
        draw();
      });
      container.querySelector("#quiz-mistake-start")?.addEventListener("click",startMistakes);
      container.querySelector("#quiz-mistake-clear")?.addEventListener("click",()=>{
        clearMistakeBank(resource);
        exitMistakes();
      });
      return;
    }

    container.innerHTML=questionHTML();
    bindChapters();
    const index=attempt.current;
    const answered=attempt.answers[index]!==null;

    container.querySelectorAll("[data-choice]").forEach(button=>button.addEventListener("click",()=>{
      if(review||attempt.answers[index]!==null)return;
      const choice=Number(button.dataset.choice);
      attempt=answerQuestion(quiz,attempt,index,choice);
      recordQuizChoice(resource,quiz.questions[index],choice);
      persist();
      draw();
    }));

    container.querySelectorAll("[data-quiz-jump]").forEach(button=>button.addEventListener("click",()=>{
      attempt.current=Number(button.dataset.quizJump);
      persist();
      draw();
    }));

    container.querySelector("#quiz-prev")?.addEventListener("click",()=>{
      attempt.current=Math.max(0,index-1);
      persist();
      draw();
    });
    container.querySelector("#quiz-next")?.addEventListener("click",()=>{
      attempt.current=Math.min(quiz.questions.length-1,index+1);
      persist();
      draw();
    });
    container.querySelector("#quiz-finish")?.addEventListener("click",()=>{
      attempt.completed=score().answered===quiz.questions.length;
      review=false;
      persist();
      draw();
    });

    if(review&&answered&&index+1===quiz.questions.length){
      const finish=container.querySelector("#quiz-finish");
      if(finish)finish.textContent="Back to results";
    }
  }

  const onKey=event=>{
    if(!container.isConnected)return;
    const tag=document.activeElement?.tagName?.toLowerCase();
    if(tag==="input"||tag==="textarea"||tag==="select")return;
    const index=attempt.current;
    if(/^[1-9]$/.test(event.key)&&!review&&attempt.answers[index]===null){
      const choice=Number(event.key)-1;
      if(choice<quiz.questions[index].choices.length){
        event.preventDefault();
        attempt=answerQuestion(quiz,attempt,index,choice);
        recordQuizChoice(resource,quiz.questions[index],choice);
        persist();
        draw();
      }
      return;
    }
    if(event.key==="ArrowLeft"&&index>0){
      event.preventDefault();attempt.current=index-1;persist();draw();
    }else if(event.key==="ArrowRight"&&index+1<quiz.questions.length){
      event.preventDefault();attempt.current=index+1;persist();draw();
    }else if(event.key==="Enter"&&attempt.answers[index]!==null){
      event.preventDefault();
      if(index+1<quiz.questions.length){attempt.current=index+1;persist();draw()}
      else{attempt.completed=score().answered===quiz.questions.length;review=false;persist();draw()}
    }
  };
  window.addEventListener("keydown",onKey);
  draw();

  const s=score();
  return {
    info:`${quiz.questions.length} questions · ${s.answered} answered`,
    cleanup:()=>window.removeEventListener("keydown",onKey)
  };
}
