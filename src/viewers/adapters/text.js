import {escapeHTML,fetchText,extension} from "../utils.js?v=bcbda2770f311c5ecf06e6b0fcbdc44951da6c2e";
import {getHighlighter} from "../../vendor/highlight.js?v=bcbda2770f311c5ecf06e6b0fcbdc44951da6c2e";
import {createDomFinder} from "../dom-search.js?v=bcbda2770f311c5ecf06e6b0fcbdc44951da6c2e";
import {codeRows} from "../highlighted-lines.js?v=bcbda2770f311c5ecf06e6b0fcbdc44951da6c2e";

const languageByExtension={
  py:"python",js:"javascript",mjs:"javascript",ts:"typescript",tsx:"typescript",jsx:"javascript",
  json:"json",jsonl:"json",ndjson:"json",yaml:"yaml",yml:"yaml",md:"markdown",tex:"latex",c:"c",cpp:"cpp",
  h:"c",hpp:"cpp",cs:"csharp",java:"java",rs:"rust",go:"go",php:"php",sql:"sql",
  css:"css",scss:"scss",xml:"xml",sh:"bash",bash:"bash",zsh:"bash",toml:"ini",rb:"ruby",swift:"swift"
};
const labelByExtension={
  py:"Python",js:"JavaScript",mjs:"JavaScript",ts:"TypeScript",tsx:"TSX",jsx:"JSX",
  json:"JSON",yaml:"YAML",yml:"YAML",md:"Markdown",tex:"LaTeX",c:"C",cpp:"C++",
  h:"C/C++ header",hpp:"C++ header",cs:"C#",java:"Java",txt:"Text"
};

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
    <div class="code-meta"><span>${escapeHTML(labelByExtension[ext]||ext.toUpperCase())}</span>
      <div class="code-view-actions" role="group" aria-label="Code view options">
        <button type="button" class="code-wrap" aria-pressed="false">Wrap</button>
        <button type="button" class="code-lines" aria-pressed="true">Lines</button>
        <button type="button" class="code-copy">Copy</button>
      </div>
    </div>
    <pre class="code-view"><code>${codeRows(highlighted)}</code></pre>
  </div>`;

  const block=container.querySelector(".code-view");
  container.querySelector(".code-wrap").addEventListener("click",event=>{
    const enabled=event.currentTarget.getAttribute("aria-pressed")!=="true";
    event.currentTarget.setAttribute("aria-pressed",String(enabled));
    block.classList.toggle("is-wrapped",enabled);
  });
  container.querySelector(".code-lines").addEventListener("click",event=>{
    const enabled=event.currentTarget.getAttribute("aria-pressed")!=="true";
    event.currentTarget.setAttribute("aria-pressed",String(enabled));
    block.classList.toggle("no-line-numbers",!enabled);
  });

  container.querySelector(".code-copy").onclick=async event=>{
    try{if(!navigator.clipboard?.writeText)throw Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      event.currentTarget.textContent="Copied";
    }catch{event.currentTarget.textContent="Copy unavailable"}
  };

  return {info:`${labelByExtension[ext]||"Text"} · ${text.split("\n").length} lines · ${text.length.toLocaleString()} chars`,actions:{find:createDomFinder(container)}};
}
