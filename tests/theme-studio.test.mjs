import test from "node:test";
import assert from "node:assert/strict";
import {
  adjustColor,autoAssignTheme,brightness,hexToRgb,kMeansPalette,
  normalizeTheme,rgbToHex,themeCss,themeJSON,themeRegistrySnippet
} from "../src/settings/theme-studio-core.js";

test("color conversion and adjustment are deterministic",()=>{
  assert.equal(rgbToHex({r:255,g:0,b:128}),"#ff0080");
  assert.deepEqual(hexToRgb("#ff0080"),{r:255,g:0,b:128});
  assert.equal(adjustColor("#000000",10),"#1a1a1a");
  assert.ok(brightness("#ffffff")>brightness("#000000"));
});

test("k means palette returns stable number of hex colors",()=>{
  const colors=[
    ...Array.from({length:20},()=>({r:240,g:30,b:80})),
    ...Array.from({length:20},()=>({r:20,g:50,b:80})),
    ...Array.from({length:20},()=>({r:230,g:235,b:240}))
  ];
  const palette=kMeansPalette(colors,3);
  assert.equal(palette.length,3);
  assert.ok(palette.every(value=>/^#[0-9a-f]{6}$/i.test(value)));
});

test("auto assign keeps vivid primary dark sidebar and light background",()=>{
  const result=autoAssignTheme(["#b3157a","#142c3b","#f4f8fa","#2f7fa4","#8f5a00"]);
  assert.ok(result.primary);
  assert.equal(result.sidebar,"#142c3b");
  assert.equal(result.background,"#f4f8fa");
});

test("theme exports preserve all legacy output types",()=>{
  const theme=normalizeTheme({name:"harbor",colors:{primary:"#b3157a"}});
  assert.match(themeCss(theme),/data-theme="harbor"/);
  assert.match(themeCss(theme),/--navbar-bg:/);
  assert.match(themeRegistrySnippet(theme),/"harbor"/);
  const json=JSON.parse(themeJSON(theme));
  assert.equal(json.name,"harbor");
  assert.equal(json.colors.primary,"#b3157a");
});
