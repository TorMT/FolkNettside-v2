import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {isStartRoute} from "../src/shell/start-route.js";

test("only the bare address, /portfolio and non-route fragments show the start page",()=>{
  for(const path of ["","/","/portfolio","/portfolio/","main","top",undefined,null])assert.equal(isStartRoute(path),true,String(path));
  for(const path of ["/portfolioo","/nope","/courses/9/NOPE","/tools/unknown","/diverse/missing","/Portfolio"])assert.equal(isStartRoute(path),false,path);
});

test("the router ends in an explicit Not found page, not a silent start page",()=>{
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(app,/if\(isStartRoute\(path\)\)return portfolioPage\(\);\s*return notFoundPage\(/);
  assert.doesNotMatch(app,/return engineeringPage\(\)\}return portfolioPage\(\)\}/);
});

test("the optional Google config placeholder exists and leaves sign-in unconfigured",()=>{
  const config=JSON.parse(readFileSync(new URL("../data/google-auth.json",import.meta.url),"utf8"));
  assert.equal(config.googleDriveAuth.clientId,"");
});
