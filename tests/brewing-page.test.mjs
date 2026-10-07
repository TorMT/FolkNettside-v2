import test from "node:test";
import assert from "node:assert/strict";
import {brewingPageHTML,LEGACY_BREWING_URL} from "../src/diverse/brewing-page.js";

test("signed-out Brewing stays local and never renders a module OAuth control",()=>{
  const html=brewingPageHTML({account:{status:"signed-out"}});
  assert.match(html,/Hydrometer/);
  assert.match(html,/Brew logs/);
  assert.match(html,/Recipes/);
  assert.match(html,/value="local"/);
  assert.doesNotMatch(html,/connectGoogleDriveBtn/);
  assert.doesNotMatch(html,/syncSelectedDriveBtn/);
  assert.doesNotMatch(html,/Default Drive folder/);
  assert.ok(html.includes(LEGACY_BREWING_URL));
});

test("signed-in Brewing exposes Drive sync but still has no second login button",()=>{
  const html=brewingPageHTML({account:{status:"signed-in",profile:{name:"Test User"}}});
  assert.match(html,/Signed in · Test User/);
  assert.match(html,/syncSelectedDriveBtn/);
  assert.match(html,/driveRootUrlInput/);
  assert.match(html,/site account connected/);
  assert.doesNotMatch(html,/connectGoogleDriveBtn/);
});

test("raw-material view is explicit fallback instead of invented data",()=>{
  const html=brewingPageHTML();
  assert.match(html,/data-view="raw-materials"/);
  assert.match(html,/data\/logic is not present/);
  assert.match(html,/Legacy fallback retained/);
});
