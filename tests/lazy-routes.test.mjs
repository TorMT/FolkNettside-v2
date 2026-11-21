import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {LAZY_ROUTE_KEYS,lazyRouteKeys} from "../src/shell/lazy-routes.js";

const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
const routesSource=readFileSync(new URL("../src/shell/lazy-routes.js",import.meta.url),"utf8");
const lazyPaths=[...routesSource.matchAll(/^\s*"(\/[^"]+)":\[/gm)].map(match=>match[1]);
const loaders=[...app.matchAll(/^\s*"([a-z-]+)":async\(\)=>\{\(\{[^}]+\}=await import\("(\.\/[^"]+\.js)"\)\)\}/gm)].map(match=>({key:match[1],path:match[2]}));

test("only the listed routes need on-demand modules",()=>{
  assert.ok(lazyPaths.length>=20);
  for(const path of lazyPaths)assert.ok(lazyRouteKeys(path).length>0,path);
  for(const path of ["","/","/portfolio","/courses","/diverse","/tools","/engineering","/settings","/tools/coolprop/","/TOOLS/COOLPROP","/nope",undefined,null,"__proto__","constructor"]){
    assert.deepEqual(lazyRouteKeys(path),[],String(path));
  }
  assert.deepEqual(lazyRouteKeys("/tools/crystal"),["crystal","crystal-editor"]);
  assert.deepEqual(lazyRouteKeys("/diverse/dive-map"),lazyRouteKeys("/diverse/diving"));
});

test("every lazy route is a path the router really dispatches on",()=>{
  for(const path of lazyPaths)assert.ok(app.includes(`path==="${path}"`),`router has no exact dispatch for ${path}`);
});

test("every key has exactly one loader for an existing module, and no key is unused",()=>{
  assert.deepEqual(loaders.map(loader=>loader.key).sort(),[...LAZY_ROUTE_KEYS].sort());
  for(const {key,path} of loaders)assert.ok(existsSync(new URL("../src/"+path.slice(2),import.meta.url)),`${key}: ${path}`);
});

test("on-demand modules are not also imported statically by app.js",()=>{
  for(const {path} of loaders){
    assert.ok(!new RegExp(`^import[^\\n]*from "${path.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}";`,"m").test(app),`${path} is still a static import`);
  }
});

test("render waits for the route's modules and gives way to a newer navigation",()=>{
  const start=app.indexOf("async function render(){");
  const wait=app.indexOf("await loadLazyRouteModules(path)",start);
  assert.ok(start>0&&wait>start);
  for(const name of ["coolPropToolPage()","brewingPage()","medisinPage()","diveMapPage()","cadToolHTML()","kisssoftPageHTML()","themeStudioPage(","courseAdminPage()"]){
    assert.ok(app.indexOf(name,start)>wait,`${name} is dispatched before its module is loaded`);
  }
  assert.match(app.slice(wait,wait+1400),/if\(route\(\)!==path\)return;\s*\}/);
  assert.match(app,/lazyRouteLoads\.delete\(key\);throw error/);
});
