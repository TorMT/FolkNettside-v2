import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync,statSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

// The browser clears event.currentTarget when the listener returns, which for
// an async listener is at its first await. Reading it afterwards gives null,
// so `event.currentTarget.textContent=...` throws and the user gets no feedback
// (this broke every Copy button). Handlers must keep the element in a variable.

const SRC=fileURLToPath(new URL("../src/",import.meta.url));

function sourceFiles(directory){
  const out=[];
  for(const name of readdirSync(directory)){
    const path=join(directory,name);
    if(statSync(path).isDirectory()){if(name!=="vendor")out.push(...sourceFiles(path));}
    else if(name.endsWith(".js"))out.push(path);
  }
  return out;
}

export function currentTargetAfterAwait(text){
  // Blank out comments (same length, so line numbers hold): a comment that says "await" is not an await.
  const source=text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,comment=>comment.replace(/[^\n]/g," "));
  const hits=[];
  const handler=/async\s*\(?\s*(\w+)\s*\)?\s*=>\s*\{/g;
  for(let match;(match=handler.exec(source));){
    const name=match[1];
    let depth=1,end=handler.lastIndex;
    while(end<source.length&&depth){const char=source[end++];if(char==="{")depth++;else if(char==="}")depth--;}
    const body=source.slice(handler.lastIndex,end);
    const firstAwait=body.search(/\bawait\b/);
    if(firstAwait<0)continue;
    const use=body.indexOf(`${name}.currentTarget`,firstAwait);
    if(use>=0)hits.push(source.slice(0,handler.lastIndex+use).split("\n").length);
  }
  return hits;
}

test("detector flags currentTarget read after await and accepts a saved element",()=>{
  assert.deepEqual(currentTargetAfterAwait(`el.onclick=async event=>{\n await work();\n event.currentTarget.textContent="x";\n};`),[3]);
  assert.deepEqual(currentTargetAfterAwait(`el.onclick=async event=>{\n const button=event.currentTarget;\n await work();\n button.textContent="x";\n};`),[]);
  assert.deepEqual(currentTargetAfterAwait(`el.onclick=event=>{event.currentTarget.blur();};`),[]);
  assert.deepEqual(currentTargetAfterAwait(`el.onclick=async event=>{\n // null after the first await\n const button=event.currentTarget;\n await work();\n};`),[]);
});

test("no async event handler in src reads event.currentTarget after an await",()=>{
  const problems=[];
  for(const file of sourceFiles(SRC)){
    for(const line of currentTargetAfterAwait(readFileSync(file,"utf8")))problems.push(`${file.slice(SRC.length)}:${line}`);
  }
  assert.deepEqual(problems,[]);
});
