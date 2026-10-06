let promise;

export function getJSZip(){
  if(!promise){
    promise=import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm")
      .then(module=>module.default||module);
  }
  return promise;
}
