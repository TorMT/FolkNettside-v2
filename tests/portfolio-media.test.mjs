import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {projectImageURL,renderProjectCard,renderProjectDetail}
 from "../src/components/project-card.js";

const projects=JSON.parse(readFileSync(new URL("../data/projects.json",import.meta.url),"utf8"));

test("V2 projects reuse actual screenshot filenames from the NTNU engineering portfolio",()=>{
 const images=new Set(["dive-explorer.png","dive-computer-mount.png",
   "platform-home.png","code-viewer.png","quiz-module-demo.png",
   "krystall-viewer.png","coolprop-workbench.png",
   "fluid-property-calculator.png","periodic-table-viewer.png",
   "brygging-dashboard.png","medisintimer-viewer.png"]);
 assert.ok(projects.length>=7);
 assert.equal(new Set(projects.map(p=>p.slug)).size,projects.length);
 for(const p of projects){
   assert.ok(p.coverImage, p.slug+" has no image");
   const url=projectImageURL(p.coverImage);
   assert.ok(url,p.slug+" has non-NTNU image source");
   assert.ok(images.has(new URL(url).pathname.split("/").at(-1)));
   assert.ok(p.gallery[0].alt);
   assert.ok(p.gallery[0].caption);
 }
});

test("project cards are accessible native anchors with real image and navigable route",()=>{
 const project=projects[0];
 const card=renderProjectCard(project);
 assert.match(card,/^<a class="project-row project-row-link"/);
 assert.match(card,/href="#\/projects\/equipment-mount-fixture"/);
 assert.match(card,/class="project-card-image"/);
 assert.match(card,/loading="lazy" decoding="async"/);
 assert.match(card,/alt="[^"]+"/);
 assert.doesNotMatch(card,/project-art-mark/);
 const detail=renderProjectDetail(project);
 assert.match(detail,/class="project-gallery"/);
 assert.match(detail,/Project log|Prosjektrapport/);
 assert.match(detail,/dive-computer-mount\.pdf/);
 assert.match(detail,/Engineering Portfolio/);
});

test("untrusted image URLs and project links cannot inject HTML or link schemes",()=>{
 for(const value of ["javascript:alert(1)","https://evil.example/x.png",
   "https://tormt.folk.ntnu.no/private/example.png",
   "https://tormt.folk.ntnu.no/diverse/portfolio/screenshots/../secret.png"])
  assert.equal(projectImageURL(value),"",value);
 const bad={...projects[0],title:"<script>alert(1)</script>",
   coverImage:"javascript:alert(1)",sourceUrl:"javascript:alert(1)",
   gallery:[{src:"javascript:alert(1)",alt:"<img>"}],files:[]};
 assert.doesNotMatch(renderProjectCard(bad),/<script>|href="javascript:|src="javascript:/);
 assert.doesNotMatch(renderProjectDetail(bad),/<script>|href="javascript:|src="javascript:/);
});
