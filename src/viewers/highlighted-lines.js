/** Convert highlight.js spans to independent HTML lines without breaking
 * open markup in multiline strings and template literals.
 * Accept only highlight.js span tags; source text must already be escaped.
 */
export function splitHighlightedLines(html){
 const tokens=String(html).split(/(<span class="hljs-[a-zA-Z_-]+">|<\/span>)/g);
 const lines=[""],opened=[];
 const append=text=>{lines[lines.length-1]+=text};
 for(const part of tokens){
   if(!part)continue;
   if(/^<span class="hljs-[a-zA-Z_-]+">$/.test(part)){
     opened.push(part);append(part);
   }else if(part==="</span>"){
     if(opened.length){opened.pop();append("</span>")}
   }else{
     const segments=part.split("\n");
     segments.forEach((segment,index)=>{
       if(index){
         append("</span>".repeat(opened.length));
         lines.push(opened.join(""));
       }
       // HTML received from highlighter contains only escaped text & spans.
       // Raw non-span markup is escaped, avoiding accidental DOM injection.
       append(segment.replace(/</g,"&lt;"));
     });
   }
 }
 return lines.map(line=>line||" ");
}
export function codeRows(html){
 return splitHighlightedLines(html).map((line,index)=>
   '<span class="code-line"><span class="code-line-number" aria-hidden="true">'+
     (index+1)+'</span><span class="code-line-text">'+line+"</span></span>"
 ).join("\n");
}
