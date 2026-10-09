import {escapeHTML,fetchText} from "../utils.js";import {getKaTeX} from "../../vendor/katex.js";
import {createDomFinder} from "../dom-search.js";
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
  container.innerHTML=`<article class="latex-view">
    <div class="latex-viewer-toolbar"><button class="btn latex-formula-toggle" type="button" aria-pressed="false">Show LaTeX source</button></div>
    <div class="latex-rendered" data-latex-preview><h2>${escapeHTML(resource.label)}</h2>${blocks.join("")}</div>
    <pre data-latex-source hidden>${escapeHTML(source)}</pre>
  </article>`;
  const toggle=container.querySelector(".latex-formula-toggle");
  toggle.addEventListener("click",()=>{
    const show=toggle.getAttribute("aria-pressed")!=="true";
    toggle.setAttribute("aria-pressed",String(show));
    toggle.textContent=show?"Show rendered equations":"Show LaTeX source";
    container.querySelector("[data-latex-preview]").hidden=show;
    container.querySelector("[data-latex-source]").hidden=!show;
  });
  return {info:"KaTeX preview · source fallback included",actions:{find:createDomFinder(container)}};
}
