let promise;
function ensureStyles(){
  if(document.querySelector('link[data-v2-katex]'))return;
  const link=document.createElement("link");link.rel="stylesheet";link.href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";link.dataset.v2Katex="";document.head.append(link);
}
export function getKaTeX(){ensureStyles();if(!promise)promise=import("https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.mjs");return promise}
