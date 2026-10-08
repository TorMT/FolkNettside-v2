import test from "node:test";
import assert from "node:assert/strict";
import {safeCatalogUrl,validateDiverseCatalog,filterKokSites,filterLAOSAssignments,
        courseExerciseResources,distinctValues} from "../src/diverse/study-catalog-core.js";
import {studyCatalogPageHTML} from "../src/diverse/study-catalog-pages.js";
import {DIVERSE_MODULES,diverseModule} from "../src/diverse/diverse-registry.js";
import {diversePageHTML} from "../src/diverse/diverse-page.js";

const kok={schemaVersion:1,source:"Legacy export",sourceUrl:"https://example.org/source",verified:true,items:[
  {name:"B-kok",url:"https://example.org/b",study:"Marin",specialization:"Design",cohort:"24",rating:4.1},
  {name:"A-kok",url:"https://example.org/a",study:"Kjemi",specialization:"Prosessteknikk",cohort:"25",rating:4.9},
  {name:"C-kok",url:"https://example.org/c",study:"Marin",specialization:"Design",cohort:"22"}
]};
const laos={schemaVersion:1,verified:true,source:"Legacy export",items:[
  {title:"Oblig 1",url:"https://example.org/1.pdf",courseCode:"TMR1234",semester:"3"},
  {title:"Oblig 2",url:"https://example.org/2.pdf",courseCode:"TMA1234",semester:"2"}
]};
test("source manifest includes real URLs and rejects scripts or malformed records",()=>{
 const result=validateDiverseCatalog(kok,"kok");
 assert.equal(result.items.length,3);
 assert.equal(result.items[0].rating,4.1);
 assert.equal(safeCatalogUrl("javascript:alert(1)"),"");
 assert.equal(safeCatalogUrl("data:text/html,hi"),"");
 assert.equal(safeCatalogUrl("//evil.example.org"),"");
 assert.equal(safeCatalogUrl("https://example.org/resource"),"https://example.org/resource");
 assert.throws(()=>validateDiverseCatalog({...kok,items:[{name:"X",url:"javascript:evil()"}]},"kok"));
 assert.throws(()=>validateDiverseCatalog({...kok,items:[{name:"X",url:"https://example.org",rating:99}]},"kok"));
});
test("student sites filter by study, specialization, cohort and sort by rating",()=>{
 const items=validateDiverseCatalog(kok,"kok").items;
 assert.deepEqual(filterKokSites(items).map(x=>x.name),["A-kok","B-kok","C-kok"]);
 assert.deepEqual(filterKokSites(items,{study:"Marin",specialization:"Design"}).map(x=>x.name),["B-kok","C-kok"]);
 assert.deepEqual(filterKokSites(items,{cohort:"25"}).map(x=>x.name),["A-kok"]);
 assert.deepEqual(filterKokSites(items,{query:"prosess"}).map(x=>x.name),["A-kok"]);
 assert.deepEqual(filterKokSites(items,{sort:"rating"}).map(x=>x.name),["A-kok","B-kok","C-kok"]);
 assert.deepEqual(distinctValues(items,"cohort"),["22","24","25"]);
});
test("LAOS source catalog and already-indexed Courses assignments remain separate",()=>{
 const imported=validateDiverseCatalog(laos,"laos");
 assert.deepEqual(filterLAOSAssignments(imported.items,{course:"TMR1234"}).map(x=>x.name),["Oblig 1"]);
 const resources=courseExerciseResources([{id:3,courses:[{code:"TMR1234",resources:[
   {title:"Obligatorisk øving 1",path:"/files/one.pdf"}, {title:"Forelesning 1",path:"/files/two.pdf"}
 ]}]}]);
 assert.equal(resources.length,1);
 assert.equal(resources[0].route,"/viewer/3/TMR1234/0");
});
test("native catalog pages retain source attribution but no obsolete embedded iframe",()=>{
 for(const kind of ["laos","kok"]){
   const html=studyCatalogPageHTML(kind);
   assert.match(html,/id="catalog-results"/);
   assert.match(html,/id="catalog-search"/);
   assert.match(html,/Opprinnelig kilde/);
   assert.doesNotMatch(html,/<iframe/);
   assert.doesNotMatch(html,/data-legacy-src=/);
 }
 assert.match(studyCatalogPageHTML("kok"),/catalog-specialization/);
 assert.match(studyCatalogPageHTML("laos"),/catalog-course-resources/);
});
test("LeseRavnen is strictly an external GitHub Pages demo",()=>{
 const entry=diverseModule("leseravnen");
 assert.equal(entry.externalUrl,"https://tormt.github.io/LeseRavnen/");
 assert.equal(entry.route,null);
 assert.equal(entry.legacyUrl,null);
 assert.equal(entry.status,"preserved");
 assert.match(diversePageHTML(),/href="https:\/\/tormt.github.io\/LeseRavnen\/"/);
 assert.doesNotMatch(diversePageHTML(),/LeseRavnen-v0\.9\.0-demo/);
 assert.ok(DIVERSE_MODULES.find(x=>x.id==="laos"&&x.route));
 assert.ok(DIVERSE_MODULES.find(x=>x.id==="andrekok"&&x.route));
});