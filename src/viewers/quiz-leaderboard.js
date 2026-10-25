/** Optional PHP leaderboard, never required for local quiz progress. */
import {escapeHTML} from "./utils.js?v=555e981d1c77521faa9186a5ca45a1d21179f379";

const NTNU_ORIGIN="https://tormt.folk.ntnu.no";

export function leaderboardQuizId(resource={}){
  if(resource.source!=="ntnu")return null;
  let url;
  try{url=new URL(resource.url||resource.path,NTNU_ORIGIN)}catch{return null}
  if(url.origin!==NTNU_ORIGIN||url.search||url.hash)return null;
  const match=/^\/semestre\/([1-9]|1\d|20)\/([a-zA-Z0-9_-]{1,100})\/quiz\/quiz\.json$/.exec(url.pathname);
  return match?`${match[1]}/${match[2]}`:null;
}

export function leaderboardPayload(resource,quiz,attempt,expectedQuestionCount){
  const id=leaderboardQuizId(resource);
  if(!id||!attempt?.completed||!Array.isArray(quiz?.questions)||
     !Number.isInteger(expectedQuestionCount)||quiz.questions.length!==expectedQuestionCount||
     !Array.isArray(attempt.answers)||attempt.answers.length!==quiz.questions.length||
     attempt.answers.some(value=>value===null||value===undefined)||
     new Set(quiz.questions.map(question=>question.id)).size!==quiz.questions.length)return null;
  return {quiz:id,answers:quiz.questions.map((question,index)=>({
    id:question.id,selected:attempt.answers[index]
  }))};
}

export function leaderboardEndpoint(config,{base=globalThis.location?.href,origin=globalThis.location?.origin}={}){
  if(config?.quizLeaderboard?.enabled!==true||typeof config.quizLeaderboard.endpoint!=="string")return null;
  try{
    const url=new URL(config.quizLeaderboard.endpoint,base);
    if(url.origin!==origin||url.protocol!=="https:"||
       !url.pathname.endsWith("/api/quiz-leaderboard.php")||url.search||url.hash)return null;
    return url.href;
  }catch{return null}
}

export function normalizeLeaderboardEntries(data){
  if(!Array.isArray(data?.entries))throw Error("Invalid leaderboard response");
  return data.entries.slice(0,15).map(entry=>{
    if(typeof entry.nickname!=="string"||entry.nickname.length>24||
       !Number.isInteger(entry.correct)||!Number.isInteger(entry.total)||
       entry.correct<0||entry.total<1||entry.correct>entry.total)
      throw Error("Invalid leaderboard score");
    return {nickname:entry.nickname,correct:entry.correct,total:entry.total};
  });
}

async function readResponse(response){
  if(!response.ok)throw Error(`Leaderboard unavailable (HTTP ${response.status})`);
  return response.json();
}

/** Mounted only after a complete full-quiz attempt, with optional server config. */
export async function mountQuizLeaderboard(host,{resource,quiz,attempt,expectedQuestionCount,
  fetchImpl=fetch,base=globalThis.location?.href,origin=globalThis.location?.origin}={}){
  if(!host)return;
  const payload=leaderboardPayload(resource,quiz,attempt,expectedQuestionCount);
  if(!payload)return;
  let config;
  try{
    const response=await fetchImpl(new URL("./data/service-endpoints.json",document.baseURI).href,{cache:"no-store"});
    config=await readResponse(response);
  }catch{return}
  const endpoint=leaderboardEndpoint(config,{base,origin});
  if(!endpoint||!host.isConnected)return;

  const paint=entries=>{
    if(!host.isConnected)return;
    host.innerHTML=`<section class="quiz-leaderboard">
      <h3>Resultatliste for ${escapeHTML(quiz.title)}</h3>
      <p class="muted">Frivillig, offentlig rangering med selvvalgt kallenavn. Navn er ikke verifisert.</p>
      <ol class="quiz-leaderboard-list">${entries.length?entries.map(entry=>
        `<li><span>${escapeHTML(entry.nickname)}</span><strong>${entry.correct}/${entry.total}</strong></li>`).join(""): 
        '<li class="muted">Ingen resultater registrert ennå.</li>'}</ol>
      <form id="quiz-leaderboard-form">
        <label for="quiz-leaderboard-name">Kallenavn</label>
        <input id="quiz-leaderboard-name" name="nickname" minlength="2" maxlength="24" required autocomplete="off" placeholder="Kallenavn">
        <button class="btn primary" type="submit">Publiser resultat</button>
      </form>
      <p class="muted" role="status" id="quiz-leaderboard-message"></p>
    </section>`;
    host.querySelector("#quiz-leaderboard-form")?.addEventListener("submit",async event=>{
      event.preventDefault();
      const form=event.currentTarget;
      const button=form.querySelector("button");
      const message=host.querySelector("#quiz-leaderboard-message");
      const nickname=form.elements.namedItem("nickname")?.value?.trim()||"";
      if(!/^[\p{L}\p{N} _.-]{2,24}$/u.test(nickname)){
        if(message)message.textContent="Bruk 2–24 tegn (bokstaver, tall, mellomrom, _ eller -).";
        return;
      }
      if(button)button.disabled=true;
      try{
        const response=await fetchImpl(endpoint,{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({...payload,nickname}),credentials:"same-origin",cache:"no-store"
        });
        const result=normalizeLeaderboardEntries(await readResponse(response));
        paint(result);
        const updated=host.querySelector("#quiz-leaderboard-message");
        if(updated)updated.textContent="Resultatet er sendt til serveren.";
      }catch(error){
        if(message)message.textContent=String(error.message||"Resultat kunne ikke sendes.");
        if(button)button.disabled=false;
      }
    });
  };
  try{
    const response=await fetchImpl(endpoint+"?quiz="+encodeURIComponent(payload.quiz),{
      credentials:"same-origin",cache:"no-store"});
    const entries=normalizeLeaderboardEntries(await readResponse(response));
    paint(entries);
  }catch{
    // Offline/unsupported PHP must never block reviewing quiz answers.
  }
}
