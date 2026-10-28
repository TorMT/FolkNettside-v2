import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {projectImageURL,projectModelURL,renderProjectCard,renderProjectDetail}
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
 let sourceBacked=0,unillustrated=0;
 for(const p of projects){
   const src=p.coverImage||p.gallery?.[0]?.src;
   if(!src){
     unillustrated++;
     assert.match(renderProjectCard(p),/project-art-mark/,
       p.slug+" must have a visible honest placeholder instead of a fabricated image");
     continue;
   }
   const url=projectImageURL(src);
   assert.ok(url,p.slug+" has non-NTNU image source");
   assert.ok(images.has(new URL(url).pathname.split("/").at(-1)));
   assert.ok(p.gallery?.[0]?.alt);
   assert.ok(p.gallery?.[0]?.caption);
   sourceBacked++;
 }
 assert.ok(sourceBacked>=7,"Must retain original source-backed project media");
 assert.ok(unillustrated>=0);
});

test("project cards are accessible native anchors with real image and navigable route",()=>{
 const project=projects.find(item=>item.slug==="equipment-mount-fixture");
 assert.ok(project,"Documented dive computer mount should still exist");
 const card=renderProjectCard(project);
 assert.match(card,/^<a class="project-row project-row-link"/);
 assert.match(card,/href="#\/projects\/equipment-mount-fixture"/);
 assert.match(card,/class="project-card-image"/);
 assert.match(card,/loading="lazy" decoding="async"/);
 assert.match(card,/alt="[^"]+"/);
 assert.match(card,/data-project-image="card"/);
 assert.match(card,/data-project-image-fallback hidden role="img"/);
 assert.match(card,/Bilde utilgjengelig/);
 assert.doesNotMatch(card,/project-art-mark/);
 const detail=renderProjectDetail(project);
 assert.match(detail,/class="project-gallery"/);
 assert.match(detail,/data-project-image="gallery"/);
 assert.match(detail,/data-project-image-fallback hidden role="img"/);
 assert.match(detail,/Prosjektbildet kunne ikke lastes/);
 assert.match(detail,/Project log|Prosjektrapport/);
 assert.match(detail,/dive-computer-mount\.pdf/);
 assert.match(detail,/Engineering Portfolio/);
});

test("pitch-drive full model is local, present, sandboxed and isolated from remote-image fallback",()=>{
 const project=projects.find(item=>item.slug==="pitch-drive-wind-turbine");
 assert.ok(project,"Pitch-drive project must be in the portfolio");
 assert.equal(projectModelURL(project.modelURL),"./assets/pitch-drive/planetgirdrift-3d.html");
 assert.ok(existsSync(new URL("../assets/pitch-drive/planetgirdrift-3d.html",import.meta.url)),
   "Embedded 3D model asset must exist in the deployed repository");
 const detail=renderProjectDetail(project);
 assert.match(detail,/href="\.\/assets\/pitch-drive\/planetgirdrift-3d\.html" target="_blank" rel="noopener noreferrer">Full modell/);
 assert.match(detail,/<section class="project-model" aria-label="Interaktiv pitch drive-modell">/);
 assert.match(detail,/<iframe class="project-model-frame" src="\.\/assets\/pitch-drive\/planetgirdrift-3d\.html"/);
 assert.match(detail,/loading="lazy" sandbox="allow-scripts" referrerpolicy="no-referrer"/);
 assert.match(detail,/Ringgir\/pinjong har tannforhold 125\/25 = 5:1/);
 assert.doesNotMatch(detail,/sandbox="[^"]*allow-same-origin/);
 assert.doesNotMatch(renderProjectDetail(projects.find(p=>p.slug==="equipment-mount-fixture")),/class="project-model"/);
 assert.match(renderProjectDetail(projects.find(p=>p.slug==="equipment-mount-fixture")) ,/data-project-image-fallback hidden/);
 for(const untrusted of ["javascript:alert(1)","//evil.invalid/attack",
   "https://evil.invalid/model.html","./assets/pitch-drive/planetgirdrift-3d.html?next=evil",
   "./assets/pitch-drive/../private.html","./assets/pitch-drive/planetgirdrift-3d.html#unsafe",null])
   assert.equal(projectModelURL(untrusted),"");
 const malicious={...project,modelURL:"javascript:alert(1)",modelNote:"<script>alert(1)</script>"};
 const unsafe=renderProjectDetail(malicious);
 assert.doesNotMatch(unsafe,/class="project-model"|Full modell|<script>|javascript:/);
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
