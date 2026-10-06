let promise;
export function getHighlighter(){
  if(!promise){
    promise=import("https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/+esm")
      .then(module=>module.default||module);
  }
  return promise;
}
