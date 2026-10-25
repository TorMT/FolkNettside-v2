import {getYouTubeAPI} from "../../vendor/youtube.js?v=517fa01abd7ebd8a6697b3d6b38db560a425a684";
import {localVideoProgress} from "../../video/progress-store.js?v=517fa01abd7ebd8a6697b3d6b38db560a425a684";

export function youtubeVideoId(value){
  const raw=String(value||"").trim();
  if(/^[A-Za-z0-9_-]{11}$/.test(raw))return raw;
  try{
    const url=new URL(raw);
    if(url.hostname==="youtu.be")return url.pathname.slice(1).split("/")[0]||null;
    if(url.hostname.endsWith("youtube.com")){
      if(url.pathname==="/watch")return url.searchParams.get("v");
      const match=url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/);
      if(match)return match[1];
    }
  }catch{}
  return null;
}

function watchedState(position,duration){
  return Number.isFinite(duration)&&duration>0&&position/duration>=.9;
}

export async function render(container,resource){
  const videoId=resource.videoId||youtubeVideoId(resource.url||resource.path);
  if(!videoId)throw new Error("Could not determine YouTube video id");

  const shell=document.createElement("div");
  shell.className="video-shell youtube-shell";
  const playerHost=document.createElement("div");
  const resume=document.createElement("div");
  resume.className="video-resume muted";
  shell.append(playerHost,resume);
  container.replaceChildren(shell);

  const YT=await getYouTubeAPI();
  let saved=localVideoProgress.read(resource);
  let timer=null;
  let player=null;

  const ready=new Promise((resolve,reject)=>{
    player=new YT.Player(playerHost,{
      videoId,
      playerVars:{rel:0,playsinline:1,modestbranding:1},
      events:{
        onReady:event=>{
          const duration=Number(event.target.getDuration())||0;
          if(saved.position>0&&saved.position<duration-2){
            event.target.seekTo(Math.min(saved.position,Math.max(0,duration-1)),true);
            resume.textContent=`Resumed at ${formatTime(saved.position)}`;
          }else if(saved.watched){
            resume.textContent="Watched";
          }
          timer=setInterval(()=>{
            const position=Number(event.target.getCurrentTime())||0;
            const total=Number(event.target.getDuration())||0;
            localVideoProgress.write(resource,{
              position,
              duration:total,
              watched:watchedState(position,total)||Boolean(saved.watched),
              updatedAt:Date.now()
            });
          },2000);
          resolve(duration);
        },
        onStateChange:event=>{
          if(event.data===YT.PlayerState.ENDED){
            const duration=Number(event.target.getDuration())||0;
            localVideoProgress.write(resource,{position:0,duration,watched:true,updatedAt:Date.now()});
            resume.textContent="Watched";
          }
        },
        onError:event=>reject(new Error(`YouTube player error ${event.data}`))
      }
    });
  });

  const duration=await ready;
  return {
    info:`YouTube · ${formatTime(duration)} · local progress enabled`,
    actions:{
      resetProgress(){
        localVideoProgress.clear(resource);
        saved={};
        try{player?.seekTo(0,true)}catch{}
        resume.textContent="Progress reset";
      }
    },
    cleanup(){
      if(timer)clearInterval(timer);
      try{player?.destroy()}catch{}
    }
  };
}

function formatTime(seconds){
  const total=Math.max(0,Math.round(seconds||0));
  const h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
  return h?`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${m}:${String(s).padStart(2,"0")}`;
}
