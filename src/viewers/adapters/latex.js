import {escapeHTML,fetchText} from "../utils.js?v=2431dc69726b5ee070d346ec2eaba1196510df35";
import {getKaTeX} from "../../vendor/katex.js?v=2431dc69726b5ee070d346ec2eaba1196510df35";
import {createDomFinder} from "../dom-search.js?v=2431dc69726b5ee070d346ec2eaba1196510df35";
import {latexBlocks,latexSectionTitle} from "../latex-core.js?v=2431dc69726b5ee070d346ec2eaba1196510df35";
import {simpleLatexMathHTML} from "../latex-native.js?v=2431dc69726b5ee070d346ec2eaba1196510df35";

function textNodes(input){
 return input.split(/\n/).map(line=>{
   const section=latexSectionTitle(line);
   if(section)return "<h"+section.level+">"+escapeHTML(section.title)+"</h"+section.level+">";
   const trimmed=line.trim();
   if(!trimmed)return "";
   return "<p>"+escapeHTML(trimmed)+"</p>";
 }).join("");
}
export function latexPreviewHTML(source,katex=null){
 const nodes=[];
 for(const block of latexBlocks(source)){
   if(block.kind==="text"){nodes.push(textNodes(block.source));continue}
   if(katex){
     try{
       nodes.push('<span class="latex-math '+(block.display?"latex-math-display":"latex-math-inline")+
         '">'+katex.renderToString(block.source,{
           displayMode:block.display,throwOnError:true,
           trust:false,maxExpand:1000,strict:"ignore"
         })+"</span>");
       continue;
     }catch(error){
       nodes.push('<p class="muted">Equation could not be rendered. Original LaTeX:</p>');
     }
   }
   // Readable, safe fallback if a CDN is blocked/offline or TeX uses an
   // unsupported package. Never show an empty preview.
   nodes.push('<span class="latex-math-fallback">'+simpleLatexMathHTML(block.source)+"</span>");
 }
 return nodes.join("")||'<p>No LaTeX document content found.</p>';
}
export async function render(container,resource){
 const source=await fetchText(resource.path||resource.url);
 let renderer=null,warning="";
 try{renderer=await getKaTeX()}catch{
   warning="KaTeX is unavailable (offline or CDN blocked). Using a limited built-in math preview; use Show LaTeX source for the complete document.";
 }
 container.innerHTML='<article class="latex-view">'+
   '<div class="latex-viewer-toolbar"><button class="btn latex-formula-toggle" type="button" aria-pressed="false">Show LaTeX source</button></div>'+
   (warning?'<p class="muted latex-preview-warning" role="status">'+escapeHTML(warning)+'</p>':"")+
   '<div class="latex-rendered" data-latex-preview><h2>'+escapeHTML(resource.label||resource.name||"LaTeX document")+
     '</h2>'+latexPreviewHTML(source,renderer)+'</div>'+
   '<pre data-latex-source hidden>'+escapeHTML(source)+'</pre></article>';
 const toggle=container.querySelector(".latex-formula-toggle");
 toggle.addEventListener("click",()=>{
   const show=toggle.getAttribute("aria-pressed")!=="true";
   toggle.setAttribute("aria-pressed",String(show));
   toggle.textContent=show?"Show rendered equations":"Show LaTeX source";
   container.querySelector("[data-latex-preview]").hidden=show;
   container.querySelector("[data-latex-source]").hidden=!show;
 });
 return {info:renderer?"LaTeX math preview · source switch":"LaTeX source preview · math CDN unavailable",
   actions:{find:createDomFinder(container)}};
}
