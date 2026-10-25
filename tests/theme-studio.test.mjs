import test from "node:test";
import assert from "node:assert/strict";
import {
  adjustColor,autoAssignTheme,brightness,hexToRgb,kMeansPalette,
  normalizeTheme,rgbToHex,themeCss,themeJSON,themeRegistrySnippet,
  relativeLuminance,contrastRatio,ensureTextContrast,readableTextColor,themeContrastReport
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


test("flat color regions yield distinct deterministic palette colors",()=>{
  const colors=[
    ...Array.from({length:100},()=>({r:179,g:21,b:122})),
    ...Array.from({length:20},()=>({r:47,g:127,b:164})),
    ...Array.from({length:10},()=>({r:143,g:90,b:0})),
    ...Array.from({length:8},()=>({r:244,g:248,b:250}))
  ];
  const palette=kMeansPalette(colors,5);
  assert.equal(new Set(palette).size,palette.length);
  assert.equal(palette.length,4);
  assert.ok(palette.includes("#b3157a"));
  assert.ok(palette.includes("#2f7fa4"));
  assert.ok(palette.includes("#8f5a00"));
  assert.ok(palette.includes("#f4f8fa"));
});

test("WCAG sRGB relative luminance and known contrast pairs",()=>{
  assert.equal(relativeLuminance("#000000"),0);
  assert.equal(relativeLuminance("#ffffff"),1);
  assert.equal(contrastRatio("#000000","#ffffff"),21);
  assert.ok(Math.abs(contrastRatio("#777777","#ffffff")-4.478)<0.02);
  assert.ok(contrastRatio("#777777","#ffffff")<4.5);
  assert.ok(contrastRatio("#767676","#ffffff")>=4.5);
});

test("arbitrary custom themes always export readable preview foreground pairs",()=>{
  const palettes=[
    {primary:"#ffffff",navbar1:"#000000",navbar2:"#ffffff",sidebar:"#ffffff",background:"#ffffff"},
    {primary:"#000000",navbar1:"#ffffff",navbar2:"#000000",sidebar:"#000000",background:"#000000"},
    {primary:"#777777",navbar1:"#ccdde8",navbar2:"#223344",sidebar:"#ababab",background:"#777777"},
    {primary:"#fafafa",navbar1:"#fafafa",navbar2:"#f3f3f3",sidebar:"#f8f8f8",background:"#ebf0f4"},
    {primary:"#123456",navbar1:"#010203",navbar2:"#122334",sidebar:"#080a0c",background:"#070a0d"},
    {primary:"#ff0000",navbar1:"#ffbbaa",navbar2:"#ff0011",sidebar:"#ffeeee",background:"#ffff00"}
  ];
  for(const colors of palettes){
    const report=themeContrastReport({name:"contrast-test",colors});
    for(const item of report.checks){
      assert.ok(item.ratio>=4.5,
        item.label+" failed at "+item.ratio+" with "+JSON.stringify(colors));
      assert.ok(item.ratio<=21);
    }
    const css=themeCss({name:"contrast-test",colors});
    assert.match(css,/--primary-text: #[0-9a-f]{6};/);
    assert.match(css,/--primary-readable: #[0-9a-f]{6};/);
    assert.match(css,/--navbar-text: #[0-9a-f]{6};/);
    assert.match(css,/--text-muted: #[0-9a-f]{6};/);
    assert.match(css,/--sidebar-text: #[0-9a-f]{6};/);
    assert.ok(contrastRatio(report.colors.heading,colors.background)>=4.5);
  }
});

test("contrast correction preserves user palette but marks preview modifications",()=>{
  const colors={primary:"#ffffff",navbar1:"#000000",navbar2:"#ffffff",
    sidebar:"#ffffff",background:"#ffffff"};
  const original=normalizeTheme({name:"bright",colors});
  const report=themeContrastReport(original);
  assert.equal(original.colors.primary,"#ffffff");
  assert.equal(original.colors.navbar2,"#ffffff");
  assert.ok(report.adjustments.some(x=>x.includes("gradient")));
  assert.ok(report.adjustments.some(x=>x.includes("Heading")));
  assert.notEqual(report.colors.heading,original.colors.primary);
  assert.ok(contrastRatio(report.colors.navbarText,report.colors.navbar1)>=4.5);
  assert.ok(contrastRatio(report.colors.navbarText,report.colors.navbar2)>=4.5);
  assert.equal(JSON.parse(themeJSON(original)).colors.primary,"#ffffff");
  const css=themeCss(original);
  assert.match(css,/--primary: #ffffff;/);
  assert.ok(!css.includes("linear-gradient(135deg, #000000 0%, #ffffff 100%)"),
    "The unreadable source gradient must not be exported without correction");
});

test("text contrast correction blends to a valid readable color",()=>{
  const target=ensureTextContrast("#777777","#777777");
  assert.ok(contrastRatio(target,"#777777")>=4.5);
  assert.equal(readableTextColor("#000000"),"#ffffff");
  assert.equal(readableTextColor("#ffffff"),"#000000");
  assert.equal(ensureTextContrast("#112233","#ffffff"),"#112233");
});

test("invalid input or CSS selector name is constrained in theme exports",()=>{
  const theme=normalizeTheme({name:'x"] { color: red }',colors:{
    primary:"red",navbar1:"url(javascript:bad)",background:"#F0F0F0"
  }});
  assert.match(theme.name,/^[a-z0-9_-]+$/i);
  assert.equal(theme.colors.primary,"#b3157a");
  assert.equal(theme.colors.navbar1,"#142c3b");
  assert.equal(theme.colors.background,"#f0f0f0");
  assert.doesNotMatch(themeCss(theme),/javascript:bad|color: red/);
});
