import test from "node:test";
import assert from "node:assert/strict";
import {clearLocalStudyProgress,settingsPageHTML,SETTINGS_SECTIONS} from "../src/settings/settings-page.js";
import {readFileSync} from "node:fs";

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

test("Connections use one optional site-level Google session",()=>{
  const html=settingsPageHTML({settings,section:"connections",account:{status:"signed-out"}});
  assert.match(html,/Google \/ Drive/);
  assert.match(html,/Fusion CAD import/);
  assert.match(html,/Local mode available/);
  assert.match(html,/data-go="\/engineering\/cad"/);
  assert.match(html,/data-google-connect/);
  assert.match(html,/Brewing and Dive log stay local/);
});

test("Connections render signed-in Google identity without a second module login",()=>{
  const html=settingsPageHTML({settings,section:"connections",account:{status:"signed-in",profile:{name:"Test User",email:"test@example.com"}}});
  assert.match(html,/Connected/);
  assert.match(html,/Test User/);
  assert.match(html,/data-google-disconnect/);
  assert.doesNotMatch(html,/data-google-connect/);
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

test("FolkNet admin login is invite-only in V2 and available on narrow screens",()=>{
  const signedOut=settingsPageHTML({settings,section:"connections",
    folkAccount:{status:"signed-out"}});
  assert.match(signedOut,/data-folk-auth-form/);
  assert.match(signedOut,/data-folk-login/);
  assert.match(signedOut,/Kun forhåndsopprettede FolkNet-kontoer/);
  assert.doesNotMatch(signedOut,/data-folk-signup/);
  const signedIn=settingsPageHTML({settings,section:"connections",
    folkAccount:{status:"signed-in",user:{id:"owner-id",email:"owner@example.org"}}});
  assert.match(signedIn,/href="#\/admin\/courses"/);
  assert.match(signedIn,/data-folk-signout/);
  assert.doesNotMatch(signedIn,/data-folk-signup/);
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.doesNotMatch(app,/data-folk-signup/);
});
