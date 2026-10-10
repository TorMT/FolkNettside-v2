import test from "node:test";
import assert from "node:assert/strict";

const moduleURL=new URL("../src/vendor/kekule-runtime.js",import.meta.url);
function mockElements(onAppend){
  const elements=[];
  const document={
    querySelector(selector){
      const type=selector.startsWith("link")?"link":selector.startsWith("script")?"script":null;
      return elements.find(el=>el.tagName===type&&Object.hasOwn(el.dataset,"v2Kekule"))||null;
    },
    createElement(tagName){
      const el={tagName,dataset:{},onload:null,onerror:null,
        sheet:tagName==="link"?{}:undefined,
        remove(){const index=elements.indexOf(el);if(index>=0)elements.splice(index,1)}};
      return el;
    },
    head:{append(el){elements.push(el);queueMicrotask(()=>onAppend(el))}}
  };
  return {document,elements};
}

test("Kekule script error does not permanently poison the chemistry tool",async()=>{
  let attempt=0;
  const fixture=mockElements(el=>{
    if(el.tagName==="link"){el.onload?.();return}
    attempt++;
    if(attempt===1){el.onerror?.();return}
    globalThis.Kekule={Editor:{Composer:class Composer{}}};
    el.onload?.();
  });
  const previous={document:globalThis.document,Kekule:globalThis.Kekule};
  globalThis.document=fixture.document;
  delete globalThis.Kekule;
  try{
    const {getKekule}=await import(moduleURL.href+"?retry-script");
    await assert.rejects(getKekule(),/Could not load Kekule runtime/);
    assert.equal(fixture.document.querySelector("script[data-v2-kekule]"),null,
      "Broken CDN tag must be removed");
    const K=await getKekule();
    assert.equal(typeof K.Editor.Composer,"function");
    assert.equal(attempt,2);
  }finally{
    if(previous.document===undefined)delete globalThis.document;
    else globalThis.document=previous.document;
    if(previous.Kekule===undefined)delete globalThis.Kekule;
    else globalThis.Kekule=previous.Kekule;
  }
});
test("Kekule CSS failure can be retried even after JS has loaded",async()=>{
  let cssRequests=0;
  const fixture=mockElements(el=>{
    if(el.tagName==="link"){
      cssRequests++;
      if(cssRequests===1){el.onerror?.();return}
      el.onload?.();return;
    }
    globalThis.Kekule={Editor:{Composer:class Composer{}}};
    el.onload?.();
  });
  const previous={document:globalThis.document,Kekule:globalThis.Kekule};
  globalThis.document=fixture.document;
  delete globalThis.Kekule;
  try{
    const {getKekule}=await import(moduleURL.href+"?retry-css");
    await assert.rejects(getKekule(),/Could not load Kekule stylesheet/);
    assert.equal(fixture.document.querySelector("link[data-v2-kekule]"),null);
    const K=await getKekule();
    assert.equal(typeof K.Editor.Composer,"function");
    assert.equal(cssRequests,2);
  }finally{
    if(previous.document===undefined)delete globalThis.document;
    else globalThis.document=previous.document;
    if(previous.Kekule===undefined)delete globalThis.Kekule;
    else globalThis.Kekule=previous.Kekule;
  }
});
