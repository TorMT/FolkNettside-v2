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
   assert.ok(url,p.slug+" has an image source that is neither NTNU portfolio nor a checked-in demo image");
   if(url.startsWith("./assets/demos/"))
     assert.ok(existsSync(new URL("../"+url.slice(2),import.meta.url)),p.slug+" demo image must be checked in: "+url);
   else assert.ok(images.has(new URL(url).pathname.split("/").at(-1)));
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

test("current dive computer project: badge, local links, sandboxed simulator embed and log",async()=>{
 const {projectEmbedURL,projectLocalFileURL}=await import("../src/components/project-card.js");
 const project=projects.find(item=>item.slug==="dykkecomputer");
 assert.ok(project&&project.current===true,"dive computer must be listed as a current project");
 const card=renderProjectCard(project);
 assert.match(card,/project-row-current/);
 assert.match(card,/class="project-current-badge">Pågående</);
 const detail=renderProjectDetail(project);
 assert.match(detail,/Pågående prosjekt/);
 assert.match(detail,/<iframe class="project-model-frame project-embed-frame" src="\.\/assets\/demos\/dykkecomputer\/simulator\.html"/);
 assert.match(detail,/loading="lazy" sandbox="allow-scripts" referrerpolicy="no-referrer"/);
 assert.doesNotMatch(detail,/sandbox="[^"]*allow-same-origin/);
 assert.match(detail,/class="project-log-table"/);
 assert.match(detail,/href="\.\/assets\/demos\/dykkecomputer\/index\.html"/);
 assert.match(detail,/Dette gjenstår/);
 for(const item of [...project.links.filter(l=>!l.url.startsWith("#/")),{url:project.logUrl},...project.embeds.map(e=>({url:e.src})),...project.gallery.map(g=>({url:g.src}))])
   assert.ok(existsSync(new URL("../"+item.url.slice(2),import.meta.url)),"missing "+item.url);
 for(const bad of ["javascript:alert(1)","./assets/demos/dykkecomputer/../../secret.html",
   "./assets/demos/dykkecomputer/simulator.html?x=1","https://evil.invalid/simulator.html","./assets/demos/dykkecomputer/app.html",null]){
   assert.equal(projectEmbedURL(bad),"",String(bad));
 }
 for(const bad of ["javascript:alert(1)","./assets/demos/x/../y.html","./assets/demos/x/y.html#z","//evil.invalid/a.zip"])
   assert.equal(projectLocalFileURL(bad),"",bad);
 const unsafe=renderProjectDetail({...project,embeds:[{src:"javascript:alert(1)",title:"<script>"}],links:[{url:"javascript:alert(1)",label:"x"}],log:[{date:"<b>",title:"<script>alert(1)</script>"}]});
 assert.doesNotMatch(unsafe,/<script>|javascript:/);
});

test("dive computer opens its checked-in 3D model in the CAD workbench",async()=>{
 const {projectModelRoute}=await import("../src/components/project-card.js");
 const project=projects.find(p=>p.slug==="dykkecomputer");
 const link=project.links.find(l=>l.url.startsWith("#/"));
 assert.equal(projectModelRoute(link.url),"#/engineering/cad/dykkecomputer");
 assert.match(renderProjectDetail(project),/href="#\/engineering\/cad\/dykkecomputer">3D-modell \(sprengbar\)</);
 for(const bad of ["#/engineering/cad/../x","javascript:alert(1)","#/engineering/cad/x?y=1","https://evil.invalid/#/engineering/cad/x"])
   assert.equal(projectModelRoute(bad),"");
 assert.ok(existsSync(new URL("../assets/models/dykkecomputer-revb3.glb",import.meta.url)));
 const {DIVE_PARTS}=await import("../src/engineering/dive-parts.js");
 assert.equal(DIVE_PARTS.length,120);
 assert.equal(new Set(DIVE_PARTS.map(p=>p.node)).size,120);
});

test("current DPV project: badge, local links, log and checked-in 3D model in the CAD workbench",async()=>{
 const {projectModelRoute}=await import("../src/components/project-card.js");
 const project=projects.find(item=>item.slug==="dpv");
 assert.ok(project&&project.current===true,"DPV must be listed as a current project");
 assert.match(renderProjectCard(project),/class="project-current-badge">Pågående</);
 const detail=renderProjectDetail(project);
 assert.match(detail,/class="project-log-table"/);
 assert.match(detail,/href="\.\/assets\/demos\/dpv\/index\.html"/);
 assert.match(detail,/href="#\/engineering\/cad\/dpv">3D-modell \(sprengbar\)</);
 assert.match(detail,/href="\.\/assets\/demos\/dpv\/dpv-reva2-step\.zip" download/);
 assert.match(detail,/Dette gjenstår/);
 const link=project.links.find(l=>l.url.startsWith("#/"));
 assert.equal(projectModelRoute(link.url),"#/engineering/cad/dpv");
 for(const item of [...project.links.filter(l=>!l.url.startsWith("#/")),{url:project.logUrl},...project.gallery.map(g=>({url:g.src}))])
   assert.ok(existsSync(new URL("../"+item.url.slice(2),import.meta.url)),"missing "+item.url);
 assert.ok(existsSync(new URL("../assets/models/dpv-reva2.glb",import.meta.url)));
 const {DPV_PARTS}=await import("../src/engineering/dpv-parts.js");
 assert.equal(DPV_PARTS.length,32);
 assert.equal(new Set(DPV_PARTS.map(p=>p.node)).size,32);
 assert.ok(DPV_PARTS.every(p=>p.node.startsWith("dpv-")&&p.label&&p.viewerGroup));
});

test("dive light is an ongoing project with checked-in page, sketch and 3D package",()=>{
 const project=projects.find(p=>p.slug==="dykkelykt");
 assert.ok(project,"dive light project card must exist");
 assert.equal(project.current,true);
 for(const file of ["index.html","dykkelykt-reva0-3d.zip","img/startdesign-snitt.png","img/reva0-3d-snitt.png"])
   assert.ok(existsSync(new URL(`../assets/demos/dykkelykt/${file}`,import.meta.url)),"missing: "+file);
 const card=renderProjectCard(project);
 assert.match(card,/project-row-current/);
 assert.match(card,/href="#\/projects\/dykkelykt"/);
 const detail=renderProjectDetail(project);
 assert.match(detail,/href="\.\/assets\/demos\/dykkelykt\/index\.html"/);
 assert.match(detail,/href="\.\/assets\/demos\/dykkelykt\/dykkelykt-reva0-3d\.zip"/);
});
