import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateNTNUAutoCatalog} from "../src/courses/ntnu-autocatalog.js";
import {editorCandidates,changeAlias,exportAliases} from "../src/courses/name-editor.js";
import {applyNTNUDisplayNames} from "../src/courses/ntnu-display-names.js";

const raw=JSON.parse(readFileSync(new URL("../data/ntnu-autocatalog.json",import.meta.url),"utf8"));
const initial=JSON.parse(readFileSync(new URL("../config/ntnu-display-names.json",import.meta.url),"utf8"));
const manifest=validateNTNUAutoCatalog(raw);
const get=(sid,code)=>manifest.semesters.find(s=>s.id===sid)?.courses.find(c=>c.code===code);

test("editor uses original NTNU paths as stable keys for file renaming",()=>{
 const course=get(5,"Marin-Dynamikk");
 const candidates=editorCandidates(course);
 assert.ok(candidates.sections.some(x=>x.key==="5/Marin-Dynamikk/Øving3"));
 assert.ok(candidates.files.some(x=>
   x.key==="5/Marin-Dynamikk/filer/Øving3/const_avg_acc.py"&&
   x.original==="const_avg_acc.py"));
 assert.ok(candidates.files.every(x=>x.path.startsWith("filer/")));
 const nested=editorCandidates(get(4,"marin-Hydro"));
 assert.ok(nested.folders.some(x=>
   x.key==="4/marin-Hydro/filer/Øving3/oppgave2"&&x.original==="oppgave2"));
});

test("editor export produces safe public alias JSON without mutating course paths",()=>{
 const config=JSON.parse(exportAliases(initial,manifest));
 const key="5/Marin-Dynamikk/filer/Øving3/const_avg_acc.py";
 changeAlias(config,"files",key,"Gjennomsnittsakselerasjon");
 changeAlias(config,"courses","5/Marin-Dynamikk","Mitt marinfag");
 const exported=JSON.parse(exportAliases(config,manifest));
 assert.equal(exported.files[key],"Gjennomsnittsakselerasjon");
 assert.equal(exported.courses["5/Marin-Dynamikk"].title,"Mitt marinfag");
 const before=get(5,"Marin-Dynamikk").resources.find(x=>x.relativePath==="filer/Øving3/const_avg_acc.py");
 const after=applyNTNUDisplayNames(manifest,exported).semesters.find(x=>x.id===5).courses
   .find(x=>x.code==="Marin-Dynamikk").resources.find(x=>x.relativePath==="filer/Øving3/const_avg_acc.py");
 assert.equal(after.label,"Gjennomsnittsakselerasjon");
 assert.equal(after.name,before.name);
 assert.equal(after.path,before.path);
 assert.equal(after.url,before.url);
 assert.equal(after.relativePath,before.relativePath);
});

test("clearing a name restores the original instead of writing an empty alias",()=>{
 const draft=JSON.parse(exportAliases(initial,manifest));
 changeAlias(draft,"files","5/Marin-Dynamikk/filer/Øving3/const_avg_acc.py","  ");
 assert.equal(Object.hasOwn(draft.files,"5/Marin-Dynamikk/filer/Øving3/const_avg_acc.py"),false);
 changeAlias(draft,"courses","5/Marin-Dynamikk","  ");
 assert.ok(!draft.courses["5/Marin-Dynamikk"]?.title);
 assert.doesNotMatch(exportAliases(draft,manifest),/"const_avg_acc\.py": ""/);
});

test("editor export refuses HTML injection and duplicate section labels",()=>{
 const draft=JSON.parse(exportAliases(initial,manifest));
 changeAlias(draft,"files","5/Marin-Dynamikk/filer/Øving3/const_avg_acc.py","<img src=x>");
 assert.throws(()=>exportAliases(draft,manifest),/Invalid NTNU display name/);
 changeAlias(draft,"files","5/Marin-Dynamikk/filer/Øving3/const_avg_acc.py","Rett navn");
 const sections=get(5,"Marin-Dynamikk").sections;
 assert.ok(sections.length>=2);
 changeAlias(draft,"sections","5/Marin-Dynamikk/"+sections[0],"Samme gruppe");
 changeAlias(draft,"sections","5/Marin-Dynamikk/"+sections[1],"Samme gruppe");
 assert.throws(()=>exportAliases(draft,manifest),/Duplicate renamed section/);
});

test("HTML editor now gates publication behind Supabase auth and keeps offline export",()=>{
 const html=readFileSync(new URL("../src/courses/name-editor.html",import.meta.url),"utf8");
 const code=readFileSync(new URL("../src/courses/name-editor.js",import.meta.url),"utf8");
 assert.match(html,/id="admin-gate"/);
 assert.match(html,/id="admin-login-form"/);
 assert.match(html,/type="password"/);
 assert.match(html,/id="publish"/);
 assert.match(html,/Last ned reservekopi/);
 assert.match(html,/NTNU-mapper, originale filnavn, lenker og filinnhold endres aldri/);
 assert.match(code,/Blob\\(/);
 assert.match(code,/validateNTNUDisplayNames/);
 assert.match(code,/isFolkCourseAdmin/);
 assert.match(code,/saveCloudDisplayNames/);
 assert.doesNotMatch(code,/github\\.com\\/TorMT\\/FolkNettside-v2\\/edit/);
});
