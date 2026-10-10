import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {groupProductsByEan,matprisProxyUrl,matprisBackendAvailable,normalizeProduct,unwrapProducts} from "../src/diverse/matpris-api.js";
import {matprisPageHTML} from "../src/diverse/matpris-page.js";

test("Matpris normalizes current API price shapes",()=>{
  const a=normalizeProduct({id:1,ean:"12345678",name:"A",current_price:19.9,current_unit_price:39.8,store:{name:"Meny",code:"MENY_NO"}});
  const b=normalizeProduct({id:2,ean:"12345678",name:"A",current_price:{price:17.5,store:{name:"Kiwi",code:"KIWI"}}});
  assert.equal(a.price,19.9);
  assert.equal(a.unitPrice,39.8);
  assert.equal(b.price,17.5);
  assert.equal(b.store.code,"KIWI");
});

test("Matpris groups equal EAN and sorts offers cheapest first",()=>{
  const products=unwrapProducts({data:[
    {id:1,ean:"7038010055737",name:"Pepsi Max",current_price:31.9,store:{name:"Bunnpris",code:"BUNNPRIS"}},
    {id:2,ean:"7038010055737",name:"Pepsi Max",current_price:29.9,store:{name:"Kiwi",code:"KIWI"}}
  ]});
  const groups=groupProductsByEan(products);
  assert.equal(groups.length,1);
  assert.equal(groups[0].storeCount,2);
  assert.equal(groups[0].cheapest.price,29.9);
  assert.equal(groups[0].offers[0].store.code,"KIWI");
});

test("Matpris client only targets the server proxy",()=>{
  const url=matprisProxyUrl("compare",{ean:"7038010055737"},"/includes/matpris/api.php");
  assert.equal(url,"/includes/matpris/api.php?action=compare&ean=7038010055737");
  const html=matprisPageHTML();
  assert.match(html,/id="matpris-search-form"/);
  assert.match(html,/data-go="\/diverse"/);
  assert.doesNotMatch(html,/kassal\.app\/api\/v1/);
});

test("Matpris server proxy reads the API key from the environment",()=>{
  const source=fs.readFileSync(new URL("../server/matpris.php",import.meta.url),"utf8");
  assert.match(source,/getenv\('KASSALAPP_API_KEY'\)/);
  assert.match(source,/Authorization: Bearer/);
  assert.doesNotMatch(source,/KASSALAPP_API_KEY\s*=\s*['"][^'"]+['"]/);
});

test("Matpris fails closed on static GitHub Pages without probing missing PHP endpoints",()=>{
  assert.equal(matprisBackendAvailable({hostname:"tormt.github.io"}),false);
  assert.equal(matprisBackendAvailable({hostname:"user.github.io"}),false);
  assert.equal(matprisBackendAvailable({hostname:"tormt.folk.ntnu.no"}),true);
  assert.equal(matprisBackendAvailable({hostname:"localhost"}),true);
  assert.equal(matprisBackendAvailable({hostname:"tormt.github.io",endpoint:"https://api.example.org/matpris"}),true);
});
