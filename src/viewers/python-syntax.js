import {escapeHTML} from "./utils.js?v=a86c590a4cc4c2a711867cba41af767bff1478b9";

const KEYWORDS=new Set(("False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case").split(" "));
const BUILTINS=new Set(("abs all any bool bytes callable chr classmethod dict dir divmod enumerate filter float format frozenset getattr hasattr hash help hex id input int isinstance issubclass iter len list map max memoryview min next object oct open ord pow print property range repr reversed round set setattr slice sorted staticmethod str sum super tuple type vars zip __name__ __file__").split(" "));
const numberPattern=/^(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*(?:\.\d[\d_]*)?|\.\d[\d_]+)(?:[eE][+-]?[\d_]+)?[jJ]?)/;
const namePattern=/^[A-Za-z_][A-Za-z_\d]*/;
const wrap=(kind,text)=>'<span class="hljs-'+kind+'">'+escapeHTML(text)+'</span>';

function readString(line,start,quote,triple){
 let pos=start+(triple?3:1);
 while(pos<line.length){
   if(line[pos]==="\\"){pos+=Math.min(2,line.length-pos);continue}
   if(triple?line.slice(pos,pos+3)===quote:line[pos]===quote){
     return {end:pos+(triple?3:1),closed:true};
   }
   pos++;
 }
 return {end:line.length,closed:false};
}
/** Per-line Python lexer with persistent triple-quote state.
 * Source is always HTML-escaped; output contains only controlled token spans.
 * It is not an interpreter or full Python AST parser.
 */
export function pythonHighlightedLines(source){
 const rows=String(source??"").replace(/\r\n?/g,"\n").split("\n");
 let triple=null,definition=false;
 return rows.map(line=>{
   let i=0,html="";
   if(triple){
     const block=readString(line,-3,triple,true);
     html+=wrap("string",line.slice(0,block.end));
     i=block.end;
     if(block.closed)triple=null;
     else return html||" ";
   }
   while(i<line.length){
     const rest=line.slice(i),char=line[i];
     if(char==="#"){html+=wrap("comment",rest);break}
     const decorator=(i===0||!line.slice(0,i).trim())&&rest.match(/^@[A-Za-z_]\w*/);
     if(decorator){
       html+=wrap("meta",decorator[0]);i+=decorator[0].length;continue;
     }
     const literal=rest.match(/^([rRuUbBfF]{0,2})("""|'''|"|')/);
     if(literal){
       const prefix=literal[1],q=literal[2],isTriple=q.length===3;
       const start=i+prefix.length;
       const string=readString(line,start,q,isTriple);
       html+=wrap("string",line.slice(i,string.end));
       i=string.end;
       if(isTriple&&!string.closed)triple=q;
       continue;
     }
     const number=rest.match(numberPattern);
     if(number&&(!i||!/[A-Za-z_]/.test(line[i-1]))){
       html+=wrap("number",number[0]);i+=number[0].length;continue;
     }
     const name=rest.match(namePattern);
     if(name){
       const value=name[0];
       let style=null;
       if(definition){style="title";definition=false}
       else if(KEYWORDS.has(value)){
         style=value==="True"||value==="False"||value==="None"?"literal":"keyword";
         if(value==="def"||value==="class")definition=true;
       }else if(BUILTINS.has(value))style="built_in";
       else if(value==="self"||value==="cls")style="variable";
       if(style)html+=wrap(style,value);else html+=escapeHTML(value);
       i+=value.length;continue;
     }
     if(/[+\-*/%=&|^~<>!]/.test(char)){
       html+=wrap("operator",char);
     }else html+=escapeHTML(char);
     i++;
   }
   definition=false;
   return html||" ";
 });
}
export function renderPythonLines(source,{lineNumbers=true}={}){
 return pythonHighlightedLines(source).map((markup,index)=>
  '<span class="python-code-line">'+
   '<span class="python-code-number" aria-hidden="true">'+(index+1)+'</span>'+
   '<span class="python-code-content">'+markup+'</span></span>'
 ).join("\n");
}
/** Return new editor value and selection for VS Code-style Tab/Shift+Tab. */
export function changeIndent(source,start,end,{shift=false,tab="    "}={}){
 const value=String(source),from=Math.max(0,Math.min(start,value.length)),to=Math.max(from,Math.min(end,value.length));
 const single=from===to;
 if(single&&!shift){
   return {value:value.slice(0,from)+tab+value.slice(to),start:from+tab.length,end:from+tab.length};
 }
 const first=value.lastIndexOf("\n",from-1)+1;
 const lastSelected=to>from&&value[to-1]==="\n"?to-1:to;
 const finalNewline=value.indexOf("\n",lastSelected);
 const limit=finalNewline===-1?value.length:finalNewline;
 const chunk=value.slice(first,limit);
 const parts=chunk.split("\n");
 const changed=parts.map(line=>shift?line.replace(/^(?:\t| {1,4})/,""):tab+line);
 const replacement=changed.join("\n");
 const newValue=value.slice(0,first)+replacement+value.slice(limit);
 const firstDelta=changed[0].length-parts[0].length;
 const totalDelta=replacement.length-chunk.length;
 return {value:newValue,
   start:Math.max(first,from+firstDelta),
   end:Math.max(first,to+totalDelta)};
}
export function insertPythonNewline(value,start,end){
 const source=String(value),from=Math.max(0,start),to=Math.max(from,end);
 const line=source.slice(source.lastIndexOf("\n",from-1)+1,from);
 const whitespace=line.match(/^[ \t]*/)?.[0]||"";
 const add=/:\s*(?:#.*)?$/.test(line)&&!/^([ \t]*)#/.test(line)?"    ":"";
 const text="\n"+whitespace+add;
 const cursor=from+text.length;
 return {value:source.slice(0,from)+text+source.slice(to),start:cursor,end:cursor};
}
