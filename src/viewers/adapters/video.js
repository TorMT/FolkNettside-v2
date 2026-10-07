import {localVideoProgress} from "../../video/progress-store.js?v=f3d774892c06685186973c87dab921f08453adf7";

export async function render(container,resource){
  const wrap=document.createElement("div");
  wrap.className="video-shell";
  const video=document.createElement("video");
  video.className="video-view";
  video.controls=true;
  video.preload="metadata";
  video.playsInline=true;
  video.src=resource.url||resource.path;
  const resume=document.createElement("div");
  resume.className="video-resume muted";
  wrap.append(video,resume);
  container.replaceChildren(wrap);

  const saved=localVideoProgress.read(resource);
  let lastWrite=0;

  const duration=await new Promise(resolve=>{
    video.addEventListener("loadedmetadata",()=>{
      if(saved.position>0&&saved.position<video.duration-2){
        video.currentTime=Math.min(saved.position,Math.max(0,video.duration-1));
        resume.textContent=`Resumed at ${formatTime(video.currentTime)}`;
      }else if(saved.watched){
        resume.textContent="Watched";
      }
      resolve(Number.isFinite(video.duration)?video.duration:null);
    },{once:true});
    video.addEventListener("error",()=>resolve(null),{once:true});
  });

  video.addEventListener("timeupdate",()=>{
    const now=performance.now();
    if(now-lastWrite<1500)return;
    lastWrite=now;
    const watched=Number.isFinite(video.duration)&&video.duration>0&&video.currentTime/video.duration>=0.9;
    localVideoProgress.write(resource,{
      position:video.currentTime,
      duration:video.duration,
      watched:watched||Boolean(saved.watched),
      updatedAt:Date.now()
    });
  });
  video.addEventListener("ended",()=>{
    localVideoProgress.write(resource,{position:0,duration:video.duration,watched:true,updatedAt:Date.now()});
    resume.textContent="Watched";
  });

  return {info:duration?`Video · ${formatTime(duration)} · local progress enabled`:"Video · local progress enabled"};
}

function formatTime(seconds){
  const total=Math.max(0,Math.round(seconds||0)),m=Math.floor(total/60),s=total%60;
  return `${m}:${String(s).padStart(2,"0")}`;
}
