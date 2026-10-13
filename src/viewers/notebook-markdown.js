import {escapeHTML} from "./utils.js?v=09814fa18005854a7a30f680db55df32e29e8bf7";
import {pythonHighlightedLines} from "./python-syntax.js?v=09814fa18005854a7a30f680db55df32e29e8bf7";

function renderInline(text){
 const parts=String(text).split(/(\u0060[^\u0060\n]+\u0060)/g);
 return parts.map(part=>{
   if(part.startsWith("\u0060")&&part.endsWith("\u0060"))
     return "<code>"+escapeHTML(part.slice(1,-1))+"</code>";
   let html=escapeHTML(part);
   // Links are opt-in for http(s) only. Never trust notebook Markdown as HTML.
   html=html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s<>"']+)\)/g,
     (_,title,url)=>'<a href="'+url+'" target="_blank" rel="noopener noreferrer">'+title+"</a>");
   html=html.replace(/\*\*([^*\n]+)\*\*/g,"<strong>$1</strong>")
     .replace(/__([^_\n]+)__/g,"<strong>$1</strong>")
     .replace(/(^|[^*])\*([^*\n]+)\*/g,"$1<em>$2</em>")
     .replace(/~~([^~\n]+)~~/g,"<del>$1</del>");
   return html;
 }).join("");
}
/** Minimal safe notebook Markdown: headings, lists, inline code, fenced code,
 * emphasis, links and blockquotes. No arbitrary HTML, scripts or remote images.
 */
export function notebookMarkdownHTML(source){
 const rows=(Array.isArray(source)?source.join(""):String(source||"")).replace(/\r\n?/g,"\n").split("\n");
 let html="",para=[],list=null,fence=null,code=[],quote=[];
 const flushParagraph=()=>{if(para.length){html+="<p>"+para.map(renderInline).join(" ")+"</p>";para=[]}};
 const flushList=()=>{if(list){html+="</"+list+">";list=null}};
 const flushQuote=()=>{if(quote.length){html+="<blockquote><p>"+quote.map(renderInline).join(" ")+"</p></blockquote>";quote=[]}};
 const flushText=()=>{flushParagraph();flushList();flushQuote()};
 const flushCode=()=>{
   const raw=code.join("\n");
   const language=String(fence||"").trim().toLowerCase();
   const highlighted=language==="python"||language==="py"?
     pythonHighlightedLines(raw).join("\n"):escapeHTML(raw);
   html+='<pre class="notebook-fenced-code"><code>'+highlighted+"</code></pre>";
   code=[];fence=null;
 };
 for(const line of rows){
   if(fence!==null){
     if(/^\s*\u0060{3}\s*$/.test(line)){flushCode();continue}
     code.push(line);continue;
   }
   const start=line.match(/^\s*\u0060{3}\s*([\w+-]*)\s*$/);
   if(start){flushText();fence=start[1];code=[];continue}
   if(!line.trim()){flushText();continue}
   const header=line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
   if(header){
     flushText();const n=header[1].length;
     html+="<h"+n+">"+renderInline(header[2])+"</h"+n+">";continue;
   }
   const item=line.match(/^\s*([-*+]|\d+\.)\s+(.+)$/);
   if(item){
     flushParagraph();flushQuote();
     const tag=/^\d/.test(item[1])?"ol":"ul";
     if(list!==tag){flushList();html+="<"+tag+">";list=tag}
     html+="<li>"+renderInline(item[2])+"</li>";continue;
   }
   if(/^\s*>/.test(line)){
     flushParagraph();flushList();
     quote.push(line.replace(/^\s*>\s?/,""));continue;
   }
   flushList();flushQuote();para.push(line);
 }
 if(fence!==null)flushCode();
 flushText();
 return html||"<p>No markdown content.</p>";
}
