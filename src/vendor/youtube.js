let promise;

export function getYouTubeAPI(){
  if(globalThis.YT?.Player)return Promise.resolve(globalThis.YT);

  if(!promise){
    promise=new Promise((resolve,reject)=>{
      const previous=globalThis.onYouTubeIframeAPIReady;
      globalThis.onYouTubeIframeAPIReady=()=>{
        try{previous?.()}catch{}
        if(globalThis.YT?.Player)resolve(globalThis.YT);
        else reject(new Error("YouTube IFrame API loaded without Player"));
      };

      const existing=document.querySelector('script[data-v2-youtube-api]');
      if(!existing){
        const script=document.createElement("script");
        script.src="https://www.youtube.com/iframe_api";
        script.async=true;
        script.dataset.v2YoutubeApi="";
        script.onerror=()=>reject(new Error("Could not load YouTube IFrame API"));
        document.head.append(script);
      }

      setTimeout(()=>{
        if(globalThis.YT?.Player)resolve(globalThis.YT);
      },0);
    });
  }
  return promise;
}
