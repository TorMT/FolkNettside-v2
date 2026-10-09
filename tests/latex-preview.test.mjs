import test from "node:test";
import assert from "node:assert/strict";
import {latexDocumentBody,latexBlocks,latexSectionTitle} from "../src/viewers/latex-core.js";
import {latexPreviewHTML} from "../src/viewers/adapters/latex.js";
import {simpleLatexMathHTML} from "../src/viewers/latex-native.js";

const source=String.raw`\documentclass{article}
\begin{document}
\section*{Hydrostatics}
Displacement is \(\nabla= LBT\). Inline math $GM=KB+BM-KG$.
\[
I_T=\frac{LB^3}{12}
\]
\begin{align*}
F&=ma\\
V&=LBT
\end{align*}
\end{document}`;
test("LaTeX preview recognizes inline, display and align environments",()=>{
 const blocks=latexBlocks(source);
 assert.equal(blocks.filter(b=>b.kind==="math").length,4);
 assert.deepEqual(blocks.filter(b=>b.kind==="math").map(b=>b.display),[false,false,true,true]);
 assert.match(latexDocumentBody(source),/Hydrostatics/);
 assert.deepEqual(latexSectionTitle(String.raw`\subsection{Pressure}`),{level:3,title:"Pressure"});
 const fakeKaTeX={renderToString:(src,opt)=>'<span class="katex">'+src.length+" "+(opt.displayMode?"display":"inline")+"</span>"};
 const html=latexPreviewHTML(source,fakeKaTeX);
 assert.match(html,/<h2>Hydrostatics<\/h2>/);
 assert.equal((html.match(/class="katex"/g)||[]).length,4);
 assert.ok(html.includes("display"));
});
test("LaTeX unavailable CDN produces safe source fallback instead of a blank adapter",()=>{
 const html=latexPreviewHTML(source);
 assert.match(html,/latex-math-fallback/);
 assert.match(html,/latex-native-frac/);
 assert.match(html,/<sup>3<\/sup>/);
 assert.match(simpleLatexMathHTML(String.raw`\\nabla=\\frac{LB^3}{12}`),/∇/);
 assert.doesNotMatch(latexPreviewHTML(String.raw`\[<script>alert(1)<\/script>\]`),/<script>/);
});
