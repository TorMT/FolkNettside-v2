import {escapeHTML,fetchText,extension} from "../utils.js";

const languageByExtension={
  py:"Python",js:"JavaScript",mjs:"JavaScript",ts:"TypeScript",tsx:"TSX",jsx:"JSX",
  json:"JSON",yaml:"YAML",yml:"YAML",md:"Markdown",tex:"LaTeX",c:"C",cpp:"C++",
  h:"C/C++ header",hpp:"C++ header",cs:"C#",java:"Java",txt:"Text"
};

export async function render(container,resource){
  const text=await fetchText(resource.path);
  const ext=extension(resource.path);
  const lines=text.split("\n");
  container.innerHTML=`<pre class="code-view" data-language="${escapeHTML(languageByExtension[ext]||ext.toUpperCase())}">${escapeHTML(text)}</pre>`;
  return {info:`${languageByExtension[ext]||"Text"} · ${lines.length} lines · ${text.length.toLocaleString()} chars`};
}
