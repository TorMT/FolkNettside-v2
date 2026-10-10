let runtimePromise;

const CSS_URL="https://unpkg.com/kekule@1.0.4/dist/themes/default/kekule.css";
const JS_URL="https://unpkg.com/kekule@1.0.4/dist/kekule.min.js";

function loadCss(){
  if(document.querySelector('link[data-v2-kekule]'))return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const link=document.createElement("link");
    link.rel="stylesheet";
    link.href=CSS_URL;
    link.dataset.v2Kekule="";
    link.onload=()=>resolve();
    link.onerror=()=>reject(new Error("Could not load Kekule stylesheet"));
    document.head.append(link);
  });
}

function loadJs(){
  if(globalThis.Kekule?.Editor?.Composer)return Promise.resolve(globalThis.Kekule);
  const existing=document.querySelector('script[data-v2-kekule]');
  if(existing){
    return new Promise((resolve,reject)=>{
      existing.addEventListener("load",()=>resolve(globalThis.Kekule),{once:true});
      existing.addEventListener("error",()=>reject(new Error("Could not load Kekule runtime")),{once:true});
    });
  }
  return new Promise((resolve,reject)=>{
    const script=document.createElement("script");
    script.src=JS_URL;
    script.defer=true;
    script.dataset.v2Kekule="";
    script.onload=()=>resolve(globalThis.Kekule);
    script.onerror=()=>reject(new Error("Could not load Kekule runtime"));
    document.head.append(script);
  });
}

export function getKekule(){
  if(globalThis.Kekule?.Editor?.Composer)return Promise.resolve(globalThis.Kekule);
  if(!runtimePromise){
    runtimePromise=Promise.race([
      Promise.all([loadCss(),loadJs()]).then(([,Kekule])=>{
        if(!Kekule?.Editor?.Composer)throw new Error("Kekule loaded without Editor.Composer");
        return Kekule;
      }),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error("Kekule runtime timed out after 12 seconds")),12000))
    ]);
  }
  return runtimePromise;
}