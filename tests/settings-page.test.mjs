import test from "node:test";
import assert from "node:assert/strict";
import {clearLocalStudyProgress,settingsPageHTML,SETTINGS_SECTIONS} from "../src/settings/settings-page.js";

function memoryStorage(entries={}){
  const data=new Map(Object.entries(entries));
  return {
    get length(){return data.size},
    key(index){return [...data.keys()][index]??null},
    getItem(key){return data.has(key)?data.get(key):null},
    setItem(key,value){data.set(key,String(value))},
    removeItem(key){data.delete(key)},
    dump(){return Object.fromEntries(data)}
  };
}

const settings={mode:"system",accent:"magenta",density:"comfortable",motion:"system",contrast:"standard"};

test("Settings renders every declared section as a real panel",()=>{
  for(const section of SETTINGS_SECTIONS){
    const html=settingsPageHTML({settings,section,stats:{semesters:1,courses:2,resources:3,models:2}});
    assert.match(html,new RegExp(`data-settings-panel="${section}"`));
    assert.match(html,new RegExp(`data-settings-section="${section}" class="active"`));
  }
});

test("Appearance exposes all persisted global preferences",()=>{
  const html=settingsPageHTML({settings,section:"appearance"});
  for(const key of ["mode","accent","density","motion","contrast"]){
    assert.match(html,new RegExp(`data-setting="${key}"`),key+" missing");
  }
});

test("Connections are honest non-connected capability states",()=>{
  const html=settingsPageHTML({settings,section:"connections"});
  assert.match(html,/Google \/ Drive/);
  assert.match(html,/Autodesk \/ APS/);
  assert.match(html,/Not configured/g);
  assert.doesNotMatch(html,/data-connect=/);
});

test("Clear progress removes only quiz and video records",()=>{
  const storage=memoryStorage({
    "folk-v2-video:one":"{}",
    "folknet:quiz:two":"{}",
    "folk-v2-settings":"{\"mode\":\"dark\"}",
    "unrelated":"keep"
  });
  assert.equal(clearLocalStudyProgress(storage),2);
  assert.deepEqual(storage.dump(),{
    "folk-v2-settings":"{\"mode\":\"dark\"}",
    "unrelated":"keep"
  });
});
