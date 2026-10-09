import test from "node:test";
import assert from "node:assert/strict";
import {pythonHighlightedLines,renderPythonLines,changeIndent,insertPythonNewline} from "../src/viewers/python-syntax.js";
import {notebookMarkdownHTML} from "../src/viewers/notebook-markdown.js";

test("Python lexer highlights decorators, functions, strings, numbers, builtins and triple strings offline",()=>{
 const sample='@dataclass\n'+'def area(L, B):\n'+'    text = """first\n# still in string\nlast"""\n'+'    return L * B + 1.25 # volume';
 const markup=pythonHighlightedLines(sample);
 assert.equal(markup.length,6);
 assert.match(markup[0],/hljs-meta/);
 assert.match(markup[1],/hljs-keyword[^>]*>def/);
 assert.match(markup[1],/hljs-title[^>]*>area/);
 assert.match(markup[3],/hljs-string[^>]*># still in string/);
 assert.doesNotMatch(markup[3],/hljs-comment/);
 assert.match(markup[5],/hljs-number[^>]*>1\.25/);
 assert.match(markup[5],/hljs-comment[^>]*># volume/);
 assert.equal((renderPythonLines(sample).match(/class="python-code-line"/g)||[]).length,6);
});
test("HTML-like code cannot escape syntax spans, including multiline strings",()=>{
 const sample='print("<img src=x onerror=alert(1)>")\n"""<script>alert(1)</script>"""';
 const html=renderPythonLines(sample);
 assert.ok(html.includes("&lt;script&gt;"));
 assert.doesNotMatch(html,/<script>|<img /i);
 assert.match(html,/hljs-built_in/);
 assert.equal((html.match(/class="python-code-line"/g)||[]).length,2);
});
test("Python editing preserves source and supports Tab Shift+Tab and colon autoindent",()=>{
 const once=changeIndent("print(1)",0,0);
 assert.equal(once.value,"    print(1)");
 assert.deepEqual([once.start,once.end],[4,4]);
 const multiline=changeIndent("a\nb",0,3);
 assert.equal(multiline.value,"    a\n    b");
 const reversed=changeIndent(multiline.value,0,multiline.value.length,{shift:true});
 assert.equal(reversed.value,"a\nb");
 const newline=insertPythonNewline("if True:",8,8);
 assert.equal(newline.value,"if True:\n    ");
 assert.equal(insertPythonNewline("    x = 1",9,9).value,"    x = 1\n    ");
 assert.equal(insertPythonNewline("    # note",10,10).value,"    # note\n    ");
});
test("Jupyter Markdown renders formatting but never executes or trusts cell HTML",()=>{
 const tick=String.fromCharCode(96),fence=tick.repeat(3);
 const sample='# Lab\n\n**Important** and '+tick+'F=ma'+tick+'\n\n- Step A\n- Step B\n\n'+
   fence+'python\nprint("ok")\n'+fence+
   '\n\n[Reference](https://example.com/doc)\n\n<script>alert(1)</script>';
 const html=notebookMarkdownHTML(sample);
 assert.match(html,/<h1>Lab<\/h1>/);
 assert.match(html,/<strong>Important<\/strong>/);
 assert.match(html,/<code>F=ma<\/code>/);
 assert.match(html,/<ul><li>Step A<\/li><li>Step B<\/li><\/ul>/);
 assert.match(html,/hljs-built_in[^>]*>print/);
 assert.match(html,/rel="noopener noreferrer"/);
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/<script>/);
 const attack=notebookMarkdownHTML('[click](javascript:alert(1))');
 assert.doesNotMatch(attack,/<a href=/);
});
