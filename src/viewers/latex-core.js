/**
 * Small, deliberately limited LaTeX preview parser. KaTeX supplies equation
 * typesetting; unsupported document commands stay readable in source mode.
 * Source is never executed as HTML or JavaScript.
 */
export function latexDocumentBody(source){
  const body=String(source).match(/\\begin\s*\{document\}([\s\S]*?)\\end\s*\{document\}/);
  return body?body[1]:String(source);
}
export function latexBlocks(input){
 const body=latexDocumentBody(input);
 const token=/\\begin\s*\{(equation\*?|align\*?|gather\*?|multline\*?|displaymath)\}([\s\S]*?)\\end\s*\{\1\}|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\\\(([\s\S]*?)\\\)|(?<!\\)\$((?:\\\$|[^$\n])+)\$/g;
 const out=[];
 let position=0,match;
 while((match=token.exec(body))!==null){
   if(match.index>position)out.push({kind:"text",source:body.slice(position,match.index)});
   const environment=match[1]||"";
   let source=match[2]??match[3]??match[4]??match[5]??match[6]??"";
   // align and gather work as a multi-row array in KaTeX; equation is a
   // single display block. Do not evaluate arbitrary TeX macros.
   if(environment.startsWith("align")||environment.startsWith("gather")){
     source="\\begin{"+environment+"}"+source+"\\end{"+environment+"}";
   }
   out.push({kind:"math",source:source.trim(),display:Boolean(match[2]!==undefined||match[3]!==undefined||match[4]!==undefined)});
   position=token.lastIndex;
 }
 if(position<body.length)out.push({kind:"text",source:body.slice(position)});
 return out.filter(item=>item.source.trim());
}
export function latexSectionTitle(line){
 const match=String(line).trim().match(/^\\(section|subsection|subsubsection)\*?\{([^{}]*)\}/);
 return match?{level:{section:2,subsection:3,subsubsection:4}[match[1]],title:match[2]}:null;
}
