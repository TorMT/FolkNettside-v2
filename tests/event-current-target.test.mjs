import test from "node:test";
import assert from "node:assert/strict";
import {readdirSync,readFileSync,statSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

// event.currentTarget is only set while the listener runs synchronously. After an
// `await`, or inside a timer callback, it is null, so "button says Copied" code
// throws instead. Copy path, the text viewer's Copy and the Python cell's Copy all
// had this bug. Keep the element in a variable before awaiting.

const SRC=fileURLToPath(new URL("../src/",import.meta.url));

function sourceFiles(dir){
  const out=[];
  for(const name of readdirSync(dir)){
    const path=join(dir,name);
    if(statSync(path).isDirectory()){if(name!=="vendor")out.push(...sourceFiles(path))}
    else if(name.endsWith(".js"))out.push(path);
  }
  return out;
}

function body(text,start){
  let depth=1,i=start;
  while(i<text.length&&depth){const c=text[i];if(c==="{")depth++;else if(c==="}")depth--;i++}
  return text.slice(start,i);
}

export function lateCurrentTargetUses(source){
  // Blank out line comments (keeping length, so line numbers hold) so that the word
  // "await" in a comment is not taken for code. "https://" is left alone.
  const text=source.replace(/(^|[\s;{}])\/\/[^\n]*/g,(all,lead)=>lead+" ".repeat(all.length-lead.length));
  const found=[];
  const line=index=>text.slice(0,index).split("\n").length;
  const asyncHandler=/async\s*(?:function\s*\w*\s*)?\(?\s*(\w+)\s*\)?\s*=>\s*\{|async\s+function\s*\w*\s*\(\s*(\w+)\s*\)\s*\{/g;
  for(const match of text.matchAll(asyncHandler)){
    const name=match[1]||match[2],start=match.index+match[0].length,code=body(text,start);
    const awaited=code.indexOf("await ");
    if(awaited<0)continue;
    const use=new RegExp(`\\b${name}\\.currentTarget`,"g");
    for(const hit of code.slice(awaited).matchAll(use))found.push(line(start+awaited+hit.index));
  }
  for(const match of text.matchAll(/set(?:Timeout|Interval)\s*\(\s*(?:\(\s*\)|\w+)\s*=>\s*\{?[^\n]*?\.currentTarget/g))found.push(line(match.index));
  return [...new Set(found)].sort((a,b)=>a-b);
}

test("the detector catches both forms of the bug and accepts the fix",()=>{
  assert.deepEqual(lateCurrentTargetUses(`b.onclick=async event=>{\n await copy();\n event.currentTarget.textContent="x";\n};`),[3]);
  assert.deepEqual(lateCurrentTargetUses(`b.onclick=event=>{\n setTimeout(()=>{event.currentTarget.textContent="x"},9);\n};`),[2]);
  assert.deepEqual(lateCurrentTargetUses(`b.onclick=async event=>{\n const button=event.currentTarget;\n await copy();\n button.textContent="x";\n};`),[]);
  assert.deepEqual(lateCurrentTargetUses(`b.onclick=async event=>{\n // null after an await below\n const button=event.currentTarget;\n await copy();\n};`),[]);
});

test("no listener in src reads event.currentTarget after an await or in a timer",()=>{
  const problems=[];
  for(const file of sourceFiles(SRC)){
    for(const line of lateCurrentTargetUses(readFileSync(file,"utf8")))problems.push(`${file.slice(SRC.length)}:${line}`);
  }
  assert.deepEqual(problems,[]);
});
