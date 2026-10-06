import {escapeHTML,fetchText} from "../utils.js?v=c4d711984d388bef3791c769968f6ea69188349b";import {getKaTeX} from "../../vendor/katex.js?v=c4d711984d388bef3791c769968f6ea69188349b";
import {createDomFinder} from "../dom-search.js?v=c4d711984d388bef3791c769968f6ea69188349b";
function documentBody(source){const match=source.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);return match?match[1]:source}
export async function render(container,resource){
  const source=await fetchText(resource.path),katex=await getKaTeX(),body=documentBody(source),blocks=[];let last=0,match;
  const pattern=/\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g;
  while((match=pattern.exec(body))){
    const before=body.slice(last,match.index).trim();if(before)blocks.push(`<p>${escapeHTML(before)}</p>`);
    const expression=(match[1]??match[2]??"").trim();
    try{blocks.push(`<div class="latex-equation">${katex.renderToString(expression,{displayMode:true,throwOnError:false})}</div>`)}
    catch{blocks.push(`<pre>${escapeHTML(expression)}</pre>`)}
    last=pattern.lastIndex;
  }
  const rest=body.slice(last).trim();if(rest)blocks.push(`<p>${escapeHTML(rest)}</p>`);
  container.innerHTML=`<article class="latex-view"><div class="latex-rendered"><h2>${escapeHTML(resource.label)}</h2>${blocks.join("")}</div><details><summary>LaTeX source</summary><pre>${escapeHTML(source)}</pre></details></article>`;
  return {info:"KaTeX preview · source fallback included",actions:{find:createDomFinder(container)}};
}
