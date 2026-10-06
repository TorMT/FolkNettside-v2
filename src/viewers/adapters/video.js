export async function render(container,resource){
  const video=document.createElement("video");video.className="video-view";video.controls=true;video.preload="metadata";video.playsInline=true;video.src=resource.path;container.replaceChildren(video);
  const duration=await new Promise(resolve=>{video.addEventListener("loadedmetadata",()=>resolve(Number.isFinite(video.duration)?video.duration:null),{once:true});video.addEventListener("error",()=>resolve(null),{once:true})});
  return {info:duration?`Video · ${duration.toFixed(1)} s`:"Video"};
}
