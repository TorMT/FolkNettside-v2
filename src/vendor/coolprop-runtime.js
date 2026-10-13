let runtimePromise;

export function getCoolProp(){
  if(runtimePromise)return runtimePromise;

  runtimePromise=new Promise((resolve,reject)=>{
    const wasmUrl=new URL("./coolprop/coolprop.wasm",import.meta.url).href;
    const scriptUrl=new URL("./coolprop/coolprop.js?v=613f1bf06f03c71e4e3782328409464d1ab91dac",import.meta.url).href;
    const timeout=setTimeout(()=>reject(new Error("CoolProp runtime timed out")),30000);

    const previous=globalThis.Module;
    const moduleConfig={
      ...(previous&&typeof previous==="object"?previous:{}),
      locateFile(path){
        if(path.endsWith(".wasm"))return wasmUrl;
        return new URL(path,scriptUrl).href;
      },
      onRuntimeInitialized(){
        clearTimeout(timeout);
        const module=globalThis.Module;
        if(typeof module?.PropsSI!=="function"){
          reject(new Error("CoolProp initialized without PropsSI"));
          return;
        }
        resolve({
          propsSI:module.PropsSI.bind(module),
          props1SI:typeof module.Props1SI==="function"?module.Props1SI.bind(module):null,
          phaseSI:typeof module.PhaseSI==="function"?module.PhaseSI.bind(module):null
        });
      }
    };
    globalThis.Module=moduleConfig;

    const existing=document.querySelector('script[data-v2-coolprop]');
    if(existing){
      if(typeof globalThis.Module?.PropsSI==="function"){
        clearTimeout(timeout);
        resolve({
          propsSI:globalThis.Module.PropsSI.bind(globalThis.Module),
          props1SI:globalThis.Module.Props1SI?.bind(globalThis.Module)||null,
          phaseSI:globalThis.Module.PhaseSI?.bind(globalThis.Module)||null
        });
      }
      return;
    }

    const script=document.createElement("script");
    script.src=scriptUrl;
    script.async=true;
    script.dataset.v2Coolprop="";
    script.onerror=()=>{
      clearTimeout(timeout);
      reject(new Error("Could not load CoolProp runtime"));
    };
    document.head.append(script);
  });

  return runtimePromise;
}
