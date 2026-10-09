/** Optional syntax highlighter for non-Python source files.
 * Python/Jupyter uses the built-in lexer. A blocked CDN must not stall
 * CodeShell rendering or browser navigation on a static GitHub Pages host.
 */
let promise;
export function getHighlighter(){
 if(!promise){
   let timeoutId;
   const timeout=new Promise((_,reject)=>{
     timeoutId=setTimeout(()=>reject(new Error("Syntax CDN timed out")),4500);
   });
   promise=Promise.race([
     import("https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/+esm"),timeout
   ]).then(module=>module.default||module).catch(error=>{
     promise=null; // Permit retry if network availability changes.
     throw error;
   }).finally(()=>clearTimeout(timeoutId));
 }
 return promise;
}
