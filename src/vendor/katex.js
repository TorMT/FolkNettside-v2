let promise;
const ROOTS=[
 "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/",
 "https://unpkg.com/katex@0.16.11/dist/"
];
function ensureStyles(root){
 const attr="data-v2-katex";
 if(document.querySelector('link['+attr+'][href^="'+root+'"]'))return;
 const link=document.createElement("link");
 link.rel="stylesheet";link.href=root+"katex.min.css";
 link.dataset.v2Katex="";
 document.head.append(link);
}
function limit(promise,ms){
 let timer;
 const timeout=new Promise((_,reject)=>{
   timer=setTimeout(()=>reject(new Error("KaTeX CDN timed out")),ms);
 });
 return Promise.race([promise,timeout]).finally(()=>clearTimeout(timer));
}
async function load(){
 let error;
 for(const root of ROOTS){
   try{
     const module=await limit(import(root+"katex.mjs"),5000);
     if(typeof module.renderToString!=="function")throw Error("KaTeX module missing renderer");
     ensureStyles(root);
     return module;
   }catch(cause){error=cause}
 }
 throw error||new Error("KaTeX renderer unavailable");
}
export function getKaTeX(){
 if(!promise)promise=load().catch(error=>{promise=null;throw error});
 return promise;
}
