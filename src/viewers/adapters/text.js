import {escapeHTML,fetchText,extension} from "../utils.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34";
import {getHighlighter} from "../../vendor/highlight.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34";

const languageByExtension={
  py:"python",js:"javascript",mjs:"javascript",ts:"typescript",tsx:"typescript",jsx:"javascript",
  json:"json",yaml:"yaml",yml:"yaml",md:"markdown",tex:"latex",c:"c",cpp:"cpp",
  h:"c",hpp:"cpp",cs:"csharp",java:"java"
};
const labelByExtension={
  py:"Python",js:"JavaScript",mjs:"JavaScript",ts:"TypeScript",tsx:"TSX",jsx:"JSX",
  json:"JSON",yaml:"YAML",yml:"YAML",md:"Markdown",tex:"LaTeX",c:"C",cpp:"C++",
  h:"C/C++ header",hpp:"C++ header",cs:"C#",java:"Java",txt:"Text"
};

function withLineNumbers(html){
  return html.split("\n").map((line,index)=>
    `<span class="code-line"><span class="code-line-number">${index+1}</span><span class="code-line-text">${line||" "}</span></span>`
  ).join("\n");
}

export async function render(container,resource){
  const text=await fetchText(resource.path);
  const ext=extension(resource.path);
  const language=languageByExtension[ext];
  let highlighted=escapeHTML(text);

  if(language){
    try{
      const hljs=await getHighlighter();
      highlighted=hljs.highlight(text,{language,ignoreIllegals:true}).value;
    }catch{
      highlighted=escapeHTML(text);
    }
  }

  container.innerHTML=`<div class="code-shell">
    <div class="code-meta"><span>${escapeHTML(labelByExtension[ext]||ext.toUpperCase())}</span><button class="code-copy">Copy</button></div>
    <pre class="code-view"><code>${withLineNumbers(highlighted)}</code></pre>
  </div>`;

  container.querySelector(".code-copy").onclick=async event=>{
    await navigator.clipboard?.writeText(text);
    event.currentTarget.textContent="Copied";
    setTimeout(()=>event.currentTarget.textContent="Copy",1200);
  };

  return {info:`${labelByExtension[ext]||"Text"} · ${text.split("\n").length} lines · ${text.length.toLocaleString()} chars`};
}
