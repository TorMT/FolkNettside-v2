import {escapeHTML,fetchJSON} from "../utils.js?v=2a148f9fe14717df5c3d1cbeea15dca9ce4d1348";
import {
  answerQuestion,answerMatches,quizImageURL,selectQuizQuestions,createQuizAttempt,normalizeQuiz,quizScore,quizChapterView,quizChapterStorageKey,sanitizeQuizAttempt
} from "../quiz-core.js?v=2a148f9fe14717df5c3d1cbeea15dca9ce4d1348";
import {mistakeQuestions,recordQuizChoice,clearMistakeBank} from "../quiz-mistake-bank.js?v=2a148f9fe14717df5c3d1cbeea15dca9ce4d1348";
import {mountQuizLeaderboard} from "../quiz-leaderboard.js?v=2a148f9fe14717df5c3d1cbeea15dca9ce4d1348";

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
  const catalogQuiz=normalizeQuiz(await fetchJSON(resource.path));
  let wholeQuiz=selectQuizQuestions(catalogQuiz,resource);
  let selectedChapter="all";
  let quiz=wholeQuiz;
  let storageKey=quizChapterStorageKey(resource);
  let attempt=loadAttempt(storageKey,quiz);
  let review=false;
  let mistakeMode=false;
  // Unsaved multi-select drafts live only in memory until "Check answers".
  const drafts=new Map();

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
      <div id="quiz-leaderboard"></div>
    </div>`;
  }

  function questionHTML(){
    const index=Math.max(0,Math.min(quiz.questions.length-1,attempt.current));
    const q=quiz.questions[index];
    const selected=attempt.answers[index];
    const answered=selected!==null;
    const draft=q.multiple?(answered?selected:(drafts.get(index)||[])):[];
    const correct=answerMatches(q,selected);
    const illustration=quizImageURL(resource,q.image);
    return `<div class="quiz-view">
      <div class="quiz-topline">
        <div><span class="project-kicker">${review?"Review":"Course quiz"}</span><h2>${escapeHTML(quiz.title)}</h2></div>
        <span class="quiz-question-counter">${index+1}/${quiz.questions.length}</span>
      </div>
      ${chaptersHTML()}
      ${progressHTML()}
      <div class="quiz-question-nav" aria-label="Quiz questions">
        ${quiz.questions.map((question,i)=>{
          const a=attempt.answers[i];
          const state=a===null?"pending":answerMatches(question,a)?"correct":"wrong";
          return `<button data-quiz-jump="${i}" data-state="${state}" class="${i===index?"active":""}" aria-label="Question ${i+1}">${i+1}</button>`;
        }).join("")}
      </div>
      <div class="muted">Question ${index+1} of ${quiz.questions.length}${q.multiple?" · Select all correct options":""}</div>
      <h3 class="quiz-prompt">${escapeHTML(q.prompt)}</h3>
      ${illustration?`<figure class="quiz-illustration"><img src="${escapeHTML(illustration)}" alt="Illustration for question ${index+1}" loading="lazy"></figure>`:""}
      <div class="quiz-options">
        ${q.choices.map((choice,i)=>{
          const classes=[];
          if(answered&&q.correctAnswers.includes(i))classes.push('data-correct="true"');
          const chosen=q.multiple?draft.includes(i):selected===i;
          if(answered&&chosen&&!q.correctAnswers.includes(i))classes.push('data-wrong="true"');
          return `<button class="quiz-option" data-choice="${i}" ${answered?"disabled":""}
            ${q.multiple?`aria-pressed="${chosen}"`:""} ${classes.join(" ")}>
            <span class="quiz-choice-key">${i+1}</span><span>${escapeHTML(choice)}</span></button>`;
        }).join("")}
      </div>
      ${q.multiple&&!answered&&!review?`<div class="quiz-nav-actions">
        <button class="btn primary" id="quiz-submit-multiple" type="button" ${!draft.length?"disabled":""}>Check answers</button>
      </div>`:""}
      <div id="quiz-feedback">
        ${answered?`<div class="quiz-feedback ${correct?"correct":"wrong"}"><strong>${correct?"Correct":"Not quite"}</strong><p>${escapeHTML(q.explanation||"")}</p></div>`:""}
      </div>
      <div class="quiz-nav-actions">
        <button class="btn" id="quiz-prev" ${index===0?"disabled":""}>Previous</button>
        <div class="top-spacer"></div>
        ${answered&&index+1<quiz.questions.length?`<button class="btn primary" id="quiz-next">Next</button>`:""}
        ${answered&&index+1===quiz.questions.length?`<button class="btn primary" id="quiz-finish">Results</button>`:""}
      </div>
      <p class="quiz-shortcuts muted">Keys 1–9 answer or toggle · ←/→ navigate · Enter submits/continues</p>
    </div>`;
  }

  function draw(){
    const s=score();
    container.dispatchEvent(new CustomEvent("viewer-info-update",{detail:`${s.total} questions · ${s.answered} answered · ${s.correct} correct`}));
    if(attempt.completed&&!review){
     container.innerHTML=resultHTML();
      bindChapters();
      if(!mistakeMode&&selectedChapter==="all"&&quiz.questions.length===wholeQuiz.questions.length){
        void mountQuizLeaderboard(container.querySelector("#quiz-leaderboard"),{
          resource,quiz,attempt,expectedQuestionCount:Math.min(catalogQuiz.select,catalogQuiz.questions.length)
        });
      }
      container.querySelector("#quiz-review")?.addEventListener("click",()=>{
        review=true;
        attempt.current=0;
        draw();
      });
      container.querySelector("#quiz-restart")?.addEventListener("click",()=>{
        wholeQuiz=selectQuizQuestions(catalogQuiz,resource,{reset:true});
        quiz=wholeQuiz;selectedChapter="all";mistakeMode=false;
        storageKey=quizChapterStorageKey(resource);
        drafts.clear();
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

    const submitMultiple=()=>{
      if(review||attempt.answers[index]!==null)return;
      const chosen=drafts.get(index)||[];
      if(!chosen.length)return;
      attempt=answerQuestion(quiz,attempt,index,chosen);
      recordQuizChoice(resource,quiz.questions[index],chosen);
      drafts.delete(index);
      persist();draw();
    };
    container.querySelectorAll("[data-choice]").forEach(button=>button.addEventListener("click",()=>{
      if(review||attempt.answers[index]!==null)return;
      const choice=Number(button.dataset.choice);
      if(quiz.questions[index].multiple){
        const selected=new Set(drafts.get(index)||[]);
        if(selected.has(choice))selected.delete(choice);else selected.add(choice);
        drafts.set(index,[...selected].sort((a,b)=>a-b));
        draw();
        return;
      }
      attempt=answerQuestion(quiz,attempt,index,choice);
      recordQuizChoice(resource,quiz.questions[index],choice);
      persist();draw();
    }));
    container.querySelector("#quiz-submit-multiple")?.addEventListener("click",submitMultiple);

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
        if(quiz.questions[index].multiple){
          const values=new Set(drafts.get(index)||[]);
          if(values.has(choice))values.delete(choice);else values.add(choice);
          drafts.set(index,[...values].sort((a,b)=>a-b));
        }else{
          attempt=answerQuestion(quiz,attempt,index,choice);
          recordQuizChoice(resource,quiz.questions[index],choice);
          persist();
        }
        draw();
      }
      return;
    }
    if(event.key==="ArrowLeft"&&index>0){
      event.preventDefault();attempt.current=index-1;persist();draw();
    }else if(event.key==="ArrowRight"&&index+1<quiz.questions.length){
      event.preventDefault();attempt.current=index+1;persist();draw();
    }else if(event.key==="Enter"&&attempt.answers[index]===null&&
        !review&&quiz.questions[index].multiple&&(drafts.get(index)||[]).length){
      event.preventDefault();
      const chosen=drafts.get(index);
      attempt=answerQuestion(quiz,attempt,index,chosen);
      recordQuizChoice(resource,quiz.questions[index],chosen);
      drafts.delete(index);persist();draw();
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
