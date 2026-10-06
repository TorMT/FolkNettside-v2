import {initSettings,getSettings,setSetting} from "./settings.js";
import {mountViewer} from "./viewer.js";
import {loadContent} from "./content.js";
import {renderResourceTree} from "./components/resource-tree.js";
import {hydroPanelHTML} from "./engineering/hydro-panel.js";
import {renderProjectCard,renderProjectDetail} from "./components/project-card.js";
import {buildSearchIndex} from "./search/search-index.js";
import {createSearchController} from "./components/search-dialog.js";
import {toolsIndexHTML} from "./tools/tools-index.js";
import {activeTools} from "./tools/tool-registry.js";
import {fluidCalculatorHTML} from "./tools/fluid-calculator.js";
import {coolPropToolHTML,bindCoolPropTool} from "./tools/coolprop-tool.js";
import {loadPeriodicFixture,periodicTableHTML} from "./tools/periodic-table.js";
import {crystalToolHTML,mountCrystalViewer} from "./tools/crystal-viewer.js";
import {loadModelDocument} from "./model/load-model.js";
import {mountModelScene} from "./model/model-scene.js";
import {analyzeModelDiagnostics} from "./model/mesh-diagnostics.js";
import {analyzeHydroAsync,hydroCurveAsync,solveHydroDraftAsync} from "./hydro/hydro-client.js";
import {loadStructureFixture,structurePanelHTML} from "./engineering/structure-panel.js";
import {loadResistanceFixture,resistancePanelHTML} from "./engineering/resistance-panel.js";
import {loadPropulsionFixture,propulsionPanelHTML} from "./engineering/propulsion-panel.js";
import {renderTopShell,bindShellNavigation} from "./shell/navigation.js";
import {bindWorkspaceDrawers} from "./shell/workspace-drawers.js";

initSettings();

const app=document.querySelector("#app");
const content=await loadContent();
const {site,semesters,model,components:configuredComponents,navLabels,projects}=content;

let engineeringDocument=null;
let engineeringDocumentPromise=null;
let engineeringCleanup=null;
let engineeringRenderId=0;
let selectedComponentId=null;
let engineeringMode="Model";
let hydroDraft=Number(model.hydro?.defaultDraft??1.20);
let hydroTargetTonnes="";
let hydroCurveCache={model:null,data:null};
let structureLoadKn=-20;
let resistanceSpeedKn=10;
let propulsionThrustKn=20;
let propulsionInflow=3;
let propulsionDiameter=1.5;
let propulsionInitialized=false;
let fluidToolState={fluid:"air",temperature:20,unit:"C"};
let coolPropState={fluid:"Air",input1:"P",value1:1,input2:"T",value2:25};
let periodicToolState={search:"",phase:"all",category:"all",material:"all",period:"all",group:"all",crystal:"all",property:"atomic_mass",temperature:298,selected:null};
let crystalToolState={type:"bcc",preset:"",nx:1,ny:1,nz:1,a:1,c:"",showTetra:false,showOcta:false,measure:false};
let crystalCleanup=null;
let workspaceDrawerCleanup=null;

function getEngineeringDocument(){
  if(!engineeringDocumentPromise){
    engineeringDocumentPromise=loadModelDocument(model).then(documentModel=>{
      engineeringDocument=documentModel;
      selectedComponentId=selectedComponentId
        || documentModel.components.find(component=>component.type==="hull"&&component.geometry)?.id
        || documentModel.components.find(component=>component.geometry)?.id
        || documentModel.components[0]?.id
        || null;
      return documentModel;
    });
  }
  return engineeringDocumentPromise;
}

const vessel='<svg viewBox="0 0 760 380"><path d="M120 236 L560 236 L642 265 L603 305 L184 306 L104 268 Z" fill="#bccbd2" stroke="#eff7fa" stroke-width="3"/><path d="M250 151 L486 151 L541 230 L196 230 Z" fill="#dbe7ec" stroke="#eff7fa" stroke-width="3"/><rect x="292" y="109" width="165" height="39" rx="4" fill="#dbe7ec"/><path d="M326 109V45" stroke="#eff7fa" stroke-width="4"/><g fill="#17384c"><rect x="276" y="168" width="35" height="17" rx="3"/><rect x="321" y="168" width="35" height="17" rx="3"/><rect x="366" y="168" width="35" height="17" rx="3"/><rect x="411" y="168" width="35" height="17" rx="3"/></g><path d="M160 273 Q370 325 615 274" fill="none" stroke="#6dc6eb" stroke-width="3"/></svg>';

const route=()=>location.hash.slice(1)||"/portfolio";
const go=path=>{location.hash=path};
const globalSearch=createSearchController({index:buildSearchIndex({semesters,projects,tools:activeTools()}),onNavigate:go});
function parseCourseRoute(path){const m=path.match(/^\/(?:courses|study)\/(\d+)\/([^/]+)$/i);return m?{semester:Number(m[1]),code:decodeURIComponent(m[2])}:null}
function parseViewerRoute(path){const m=path.match(/^\/viewer\/(\d+)\/([^/]+)\/(\d+)$/i);return m?{semester:Number(m[1]),code:decodeURIComponent(m[2]),resourceIndex:Number(m[3])}:null}
function getSemester(id){return semesters.find(s=>Number(s.id)===Number(id))}
function getCourse(semesterId,code){return getSemester(semesterId)?.courses.find(c=>c.code.toLowerCase()===String(code).toLowerCase())}
function courseRoute(semester,code){return `/courses/${semester}/${encodeURIComponent(code)}`}
function viewerRoute(semester,code,index){return `/viewer/${semester}/${encodeURIComponent(code)}/${index}`}
function engineeringModeRoute(mode){return `/engineering/${String(mode).toLowerCase()}`}

function top(active){
  return renderTopShell(active,{coursesLabel:navLabels.courses});
}

function bindNav(){
  workspaceDrawerCleanup?.();
  workspaceDrawerCleanup=null;
  bindShellNavigation(app,{
    navigate:go,
    openSearch:()=>globalSearch.open(),
    onHome:()=>go("/portfolio")
  });
  workspaceDrawerCleanup=bindWorkspaceDrawers(app);
}

function portfolioPage(){
  document.documentElement.dataset.lens="portfolio";
  app.innerHTML=top("portfolio")+
    '<main><section class="hero"><div><h1>Engineering for real-world challenges</h1><p>Marine technology, CAD, analysis, practical fabrication and repair projects — presented without the course archive clutter.</p><div class="hero-actions"><button class="btn primary" data-go="/engineering">Explore engineering</button><button class="btn dark" data-go="/courses">Open Courses</button></div></div><div class="vessel-card">'+vessel+'<div class="waterline"></div></div></section>'+
    '<section class="section"><div class="section-head"><div><h2>Selected projects</h2><p class="muted">Design, analysis, software and hands-on engineering work.</p></div></div><div class="project-list">'+projects.map(renderProjectCard).join("")+'</div></section></main><div class="preview-badge">v2 preview · separate repo</div>';
  bindNav();
  app.querySelectorAll("[data-project]").forEach(card=>card.onclick=()=>go("/projects/"+encodeURIComponent(card.dataset.project)));
}

function projectPage(slug){
  const project=projects.find(item=>item.slug===slug);
  if(!project)return notFoundPage("Project was not found.");
  document.documentElement.dataset.lens="portfolio";
  app.innerHTML=top("portfolio")+renderProjectDetail(project)+'<div class="preview-badge">Physical + digital engineering portfolio</div>';
  bindNav();
}

function coursesPage(requestedSemester){document.documentElement.dataset.lens="study";const semesterId=Number(requestedSemester)||Number(site.defaultSemester)||semesters.find(s=>s.courses.length)?.id||semesters[0]?.id;const semester=getSemester(semesterId)||semesters[0];app.innerHTML=top("courses")+'<main class="study"><section class="study-hero"><h1>Courses</h1><p>Semester, fag og ressurser — inkludert Kok, øvinger, videoer, quiz og verktøy.</p><div class="hero-actions"><button class="btn dark" data-go="/tools">Open Tools</button></div></section><div class="semester-tabs">'+semesters.map(s=>'<button class="'+(Number(s.id)===Number(semester.id)?"active":"")+'" data-semester="'+s.id+'">'+s.label+'</button>').join("")+'</div><section class="study-main"><div class="title-row"><div><h2>'+semester.label+'</h2><div class="muted">'+semester.courses.length+' fag i manifestet</div></div></div>'+(semester.courses.length?'<div class="course-grid">'+semester.courses.map(c=>'<article class="course-card" data-course="'+c.code+'"><span class="course-code">'+c.code+'</span><h3>'+c.title+'</h3><p>'+c.description+'</p><div class="tags">'+c.tags.map(t=>'<span class="tag">'+t+'</span>').join("")+'</div></article>').join("")+'</div>':'<div class="course-header"><h3>Ingen eksempeldata i dette semesteret ennå.</h3><p>Legg inn en fagmappe og kjør <code>python scripts/update_site.py</code>.</p></div>')+'</section></main><div class="preview-badge">Courses exposes Kok; Portfolio does not</div>';bindNav();app.querySelectorAll("[data-semester]").forEach(b=>b.onclick=()=>go("/courses/"+b.dataset.semester));app.querySelectorAll("[data-course]").forEach(c=>c.onclick=()=>go(courseRoute(semester.id,c.dataset.course)))}

function coursePage(semesterId,code){const course=getCourse(semesterId,code);if(!course)return notFoundPage("Course "+code+" was not found in semester "+semesterId);document.documentElement.dataset.lens="study";const grouped=course.resources.reduce((a,r)=>((a[r.section]??=[]).push(r),a),{});const navItems=["Oversikt",...course.sections,"Karakterweb"];app.innerHTML=top("courses")+'<main class="layout"><aside class="side"><div class="side-title">'+course.code+'</div>'+[...new Set(navItems)].map((x,i)=>'<button class="'+(i===0?"active":"")+'">'+x+'</button>').join("")+'</aside><section class="content"><div class="crumbs">Courses / '+getSemester(semesterId).label+' / '+course.code+'</div><header class="course-header"><span class="course-code">'+course.code+'</span><h1>'+course.title+'</h1><p>'+course.description+'</p></header>'+course.sections.map(section=>{const items=grouped[section]||[];if(!items.length)return"";return'<section class="resource-section"><h2>'+section+'</h2><div class="resource-list">'+renderResourceTree(items,item=>course.resources.indexOf(item))+'</div></section>'}).join("")+'<section class="resource-section"><h2>Karakterweb</h2><div class="resource-list"><div class="resource-row" id="karakterweb"><span class="file-icon">KW</span><div><strong>Karakterweb</strong><div class="muted">karakterweb.no/ntnu/'+course.code+'</div></div><span class="muted">Open ↗</span></div></div></section></section></main><div class="preview-badge">Manifest-driven Course layout</div>';bindNav();app.querySelectorAll("[data-resource]").forEach(e=>e.onclick=()=>go(viewerRoute(semesterId,course.code,e.dataset.resource)));app.querySelector("#karakterweb").onclick=()=>open("https://karakterweb.no/ntnu/"+course.code,"_blank","noopener")}

function toolsPage(){
  document.documentElement.dataset.lens="study";
  app.innerHTML=top("courses")+toolsIndexHTML();
  bindNav();
  app.querySelectorAll("[data-tool-route]").forEach(button=>button.onclick=()=>go(button.dataset.toolRoute));
  app.querySelectorAll("[data-tool-legacy]").forEach(button=>button.onclick=()=>{
    window.open(button.dataset.toolLegacy,"_blank","noopener");
  });
}

function fluidToolPage(){
  document.documentElement.dataset.lens="study";
  app.innerHTML=top("courses")+fluidCalculatorHTML(fluidToolState);
  bindNav();
  app.querySelector("#fluid-calculate")?.addEventListener("click",()=>{
    fluidToolState={
      fluid:app.querySelector("#fluid-id")?.value||"air",
      temperature:Number(app.querySelector("#fluid-temperature")?.value)||0,
      unit:app.querySelector("#fluid-unit")?.value||"C"
    };
    fluidToolPage();
  });
}

function coolPropToolPage(){
  document.documentElement.dataset.lens="study";
  app.innerHTML=top("courses")+coolPropToolHTML(coolPropState);
  bindNav();
  bindCoolPropTool(app,coolPropState,(next,rerender=true)=>{
    coolPropState={...coolPropState,...next};
    if(rerender)coolPropToolPage();
  });
}

async function periodicToolPage(){
  document.documentElement.dataset.lens="study";
  try{
    const elements=await loadPeriodicFixture();
    app.innerHTML=top("courses")+periodicTableHTML(elements,periodicToolState);
    bindNav();

    const rerender=()=>{
      periodicToolState={
        ...periodicToolState,
        search:app.querySelector("#periodic-search")?.value||"",
        category:app.querySelector("#periodic-category")?.value||"all",
        material:app.querySelector("#periodic-material")?.value||"all",
        period:app.querySelector("#periodic-period")?.value||"all",
        group:app.querySelector("#periodic-group")?.value||"all",
        phase:app.querySelector("#periodic-phase")?.value||"all",
        crystal:app.querySelector("#periodic-crystal")?.value||"all",
        property:app.querySelector("#periodic-property")?.value||"atomic_mass",
        temperature:Number(app.querySelector("#periodic-temperature")?.value)||298
      };
      periodicToolPage();
    };

    app.querySelector("#periodic-search")?.addEventListener("change",rerender);
    app.querySelector("#periodic-property")?.addEventListener("change",rerender);
    app.querySelector("#periodic-category")?.addEventListener("change",rerender);
    app.querySelector("#periodic-material")?.addEventListener("change",rerender);
    app.querySelector("#periodic-period")?.addEventListener("change",rerender);
    app.querySelector("#periodic-group")?.addEventListener("change",rerender);
    app.querySelector("#periodic-phase")?.addEventListener("change",rerender);
    app.querySelector("#periodic-crystal")?.addEventListener("change",rerender);
    app.querySelector("#periodic-temperature")?.addEventListener("change",rerender);
    app.querySelectorAll("[data-element]").forEach(button=>button.onclick=()=>{
      periodicToolState={...periodicToolState,selected:Number(button.dataset.element)};
      periodicToolPage();
    });
  }catch(error){
    app.innerHTML=top("courses")+`<main class="tool-page"><div class="course-header"><h1>Periodic table error</h1><p>${String(error?.message||error)}</p></div></main>`;
    bindNav();
  }
}

async function crystalToolPage(){
  document.documentElement.dataset.lens="study";
  crystalCleanup?.();
  crystalCleanup=null;
  app.innerHTML=top("courses")+crystalToolHTML(crystalToolState);
  bindNav();

  const readState=()=>({
    ...crystalToolState,
    type:app.querySelector("#crystal-type")?.value||"bcc",
    preset:app.querySelector("#crystal-preset")?.value||"",
    nx:Number(app.querySelector("#crystal-nx")?.value)||1,
    ny:Number(app.querySelector("#crystal-ny")?.value)||1,
    nz:Number(app.querySelector("#crystal-nz")?.value)||1,
    a:Number(app.querySelector("#crystal-a")?.value)||1,
    c:app.querySelector("#crystal-c")?.value||""
  });
  const rerender=()=>{crystalToolState=readState();crystalToolPage()};
  app.querySelector("#crystal-type")?.addEventListener("change",rerender);
  app.querySelector("#crystal-preset")?.addEventListener("change",event=>{
    const value=event.target.value;
    if(value){
      const preset={Na:"sc",Fe:"bcc",Cu:"fcc",Al:"fcc",Ni:"fcc",Si:"diamond",C:"diamond",MgAl2O4:"spinel",Fe3O4:"spinel"}[value];
      crystalToolState={...readState(),preset:value,type:preset||crystalToolState.type};
      crystalToolPage();
    }else{
      crystalToolState={...readState(),preset:""};
      crystalToolPage();
    }
  });
  for(const id of ["#crystal-nx","#crystal-ny","#crystal-nz","#crystal-a","#crystal-c"]){
    app.querySelector(id)?.addEventListener("change",rerender);
  }
  app.querySelector("#crystal-tetra")?.addEventListener("click",()=>{
    crystalToolState={...readState(),showTetra:!crystalToolState.showTetra};
    crystalToolPage();
  });
  app.querySelector("#crystal-octa")?.addEventListener("click",()=>{
    crystalToolState={...readState(),showOcta:!crystalToolState.showOcta};
    crystalToolPage();
  });
  app.querySelector("#crystal-measure")?.addEventListener("click",()=>{
    crystalToolState={...readState(),measure:!crystalToolState.measure};
    crystalToolPage();
  });

  try{
    const handle=await mountCrystalViewer(app.querySelector("#crystal-stage"),crystalToolState);
    crystalCleanup=handle.cleanup;
  }catch(error){
    const target=app.querySelector("#crystal-stage");
    if(target)target.textContent="3D render error: "+String(error?.message||error);
  }
}

function mobilePreviewPage(){
  document.documentElement.dataset.lens="study";
  const targets=[
    ["Portfolio","/portfolio"],
    ["Courses","/courses"],
    ["Engineering","/engineering"],
    ["Tools","/tools"]
  ];
  app.innerHTML=top("")+`<main class="mobile-preview-page">
    <section class="mobile-preview-copy">
      <div class="crumbs">Developer preview / Mobile</div>
      <h1>Mobile preview</h1>
      <p class="muted">This is the real v2 site rendered inside a 390 × 844 CSS-pixel viewport.</p>
      <div class="mobile-preview-tabs">${targets.map(([label,path],index)=>`<button data-preview-route="${path}" class="${index===0?"active":""}">${label}</button>`).join("")}</div>
    </section>
    <div class="device-frame">
      <div class="device-speaker"></div>
      <iframe id="mobile-preview-frame" title="Mobile site preview" src="./?mobile-preview=1#/portfolio"></iframe>
      <div class="device-home"></div>
    </div>
  </main>`;
  bindNav();
  const frame=app.querySelector("#mobile-preview-frame");
  app.querySelectorAll("[data-preview-route]").forEach(button=>button.onclick=()=>{
    app.querySelectorAll("[data-preview-route]").forEach(item=>item.classList.toggle("active",item===button));
    frame.src="./?mobile-preview=1#"+button.dataset.previewRoute;
  });
}

function settingsPage(){const s=getSettings(),acc={magenta:"#b3157a",teal:"#0b6e72",blue:"#1f57c9",amber:"#8f5a00",graphite:"#394d5b"};document.documentElement.dataset.lens="study";app.innerHTML=top("")+'<main class="settings"><aside class="side"><div class="side-title">Settings</div><button class="active">Appearance</button><button>Account & connections</button><button>Courses</button><button>Engineering</button><button>Privacy & data</button><button>Advanced</button></aside><section class="settings-main"><h1>Appearance</h1><p class="muted">Theme lives here only. Viewers and workspaces inherit the same global state.</p><div class="settings-card"><div class="setting-row"><div><strong>Mode</strong><small>Follow system, or force light/dark.</small></div><div class="segment">'+["system","light","dark"].map(v=>'<button data-setting="mode" data-value="'+v+'" class="'+(s.mode===v?"active":"")+'">'+v+'</button>').join("")+'</div></div><div class="setting-row"><div><strong>Accent</strong><small>Shared UI accent. Analysis colormaps remain independent.</small></div><div class="swatches">'+Object.entries(acc).map(([k,v])=>'<button class="swatch '+(s.accent===k?"active":"")+'" data-setting="accent" data-value="'+k+'" style="background:'+v+'" title="'+k+'"></button>').join("")+'</div></div></div><div class="settings-card"><div class="setting-row"><div><strong>Google</strong><small>Optional; only needed for Drive/cloud features.</small></div><button class="btn">Not connected</button></div><div class="setting-row"><div><strong>Autodesk</strong><small>Optional; future Fusion/APS connection.</small></div><button class="btn">Not connected</button></div></div></section></main><div class="preview-badge">Public by default · auth optional</div>';bindNav();app.querySelectorAll("[data-setting]").forEach(b=>b.onclick=()=>{setSetting(b.dataset.setting,b.dataset.value);settingsPage()})}

function depthFor(component,list){
  const byId=new Map(list.map(c=>[c.id,c]));
  let depth=0,current=component;
  while(current?.parentId&&depth<20){depth++;current=byId.get(current.parentId)}
  return depth;
}

async function engineeringPage(){
  const renderId=++engineeringRenderId;
  engineeringCleanup?.();
  engineeringCleanup=null;
  document.documentElement.dataset.lens="workspace";
  const modes=["Model","Hydro","Structure","Resistance","Propulsion"];

  if(engineeringMode==="Structure"){
    try{
      const fixture=await loadStructureFixture();
      if(renderId!==engineeringRenderId)return;
      const structure=structurePanelHTML(fixture,{loadFy:structureLoadKn*1000});
      const caseModel=structure.model;
      app.innerHTML=top("engineering")+`<main class="workspace">
        <div class="workspace-bar"><strong>${caseModel.name}</strong><div class="mode-tabs">
          ${modes.map(mode=>`<button data-engineering-mode="${mode}" class="${engineeringMode===mode?"active":""}">${mode}</button>`).join("")}
        </div></div>
        <aside class="tree">
          <div class="tree-label">Frame nodes</div>
          ${caseModel.nodes.map(node=>`<div class="tree-row"><span>○</span>${node.id} <span class="muted">(${node.x}, ${node.y})</span></div>`).join("")}
          <div class="tree-label">Elements</div>
          ${caseModel.elements.map(element=>`<div class="tree-row"><span>─</span>${element.id} <span class="muted">${element.n1}→${element.n2}</span></div>`).join("")}
        </aside>
        <section class="viewport">${structure.viewport}<div class="hud">2D frame FEM · Euler–Bernoulli</div></section>
        <aside class="inspector">${structure.inspector}</aside>
        <section class="results"><div class="results-summary">${structure.summary}</div>${structure.results}</section>
        <footer class="statusbar"><span>Units SI</span><span>2D frame</span><span>Mode Structure</span><span class="top-spacer"></span><span>Linear static</span></footer>
      </main><div class="preview-badge">Structure · tested frame FEM</div>`;
      bindNav();
      app.querySelectorAll("[data-engineering-mode]").forEach(button=>button.onclick=()=>go(engineeringModeRoute(button.dataset.engineeringMode)));
      app.querySelector("#structure-load")?.addEventListener("change",event=>{
        structureLoadKn=Number(event.target.value)||0;
        engineeringPage();
      });
    }catch(error){
      if(renderId!==engineeringRenderId)return;
      app.innerHTML=top("engineering")+`<main class="study"><section class="study-main"><div class="course-header"><h1>Structure error</h1><p>${String(error?.message||error)}</p></div></section></main>`;
      bindNav();
    }
    return;
  }

  if(engineeringMode==="Resistance"){
    try{
      const fixture=await loadResistanceFixture();
      if(renderId!==engineeringRenderId)return;
      const resistance=resistancePanelHTML(fixture,{speedKnots:resistanceSpeedKn});
      app.innerHTML=top("engineering")+`<main class="workspace">
        <div class="workspace-bar"><strong>${fixture.name}</strong><div class="mode-tabs">
          ${modes.map(mode=>`<button data-engineering-mode="${mode}" class="${engineeringMode===mode?"active":""}">${mode}</button>`).join("")}
        </div></div>
        <aside class="tree">
          <div class="tree-label">Method</div>
          <div class="tree-row selected"><span>≈</span>ITTC-1957 friction line</div>
          <div class="tree-label">Inputs</div>
          <div class="tree-row"><span>L</span>Length <span class="muted">${fixture.length} m</span></div>
          <div class="tree-row"><span>S</span>Wetted surface <span class="muted">${fixture.wettedSurface} m²</span></div>
        </aside>
        <section class="viewport">${resistance.viewport}<div class="hud">Resistance · friction baseline</div></section>
        <aside class="inspector">${resistance.inspector}</aside>
        <section class="results"><div class="results-summary">${resistance.summary}</div>${resistance.results}</section>
        <footer class="statusbar"><span>Units SI</span><span>ITTC-1957</span><span>Mode Resistance</span><span class="top-spacer"></span><span>Not total resistance</span></footer>
      </main><div class="preview-badge">Resistance · ITTC friction baseline</div>`;
      bindNav();
      app.querySelectorAll("[data-engineering-mode]").forEach(button=>button.onclick=()=>go(engineeringModeRoute(button.dataset.engineeringMode)));
      app.querySelector("#resistance-speed")?.addEventListener("change",event=>{
        resistanceSpeedKn=Number(event.target.value)||0;
        engineeringPage();
      });
    }catch(error){
      if(renderId!==engineeringRenderId)return;
      app.innerHTML=top("engineering")+`<main class="study"><section class="study-main"><div class="course-header"><h1>Resistance error</h1><p>${String(error?.message||error)}</p></div></section></main>`;
      bindNav();
    }
    return;
  }

  if(engineeringMode==="Propulsion"){
    try{
      const [fixture,documentModel]=await Promise.all([
        loadPropulsionFixture(),
        getEngineeringDocument().catch(()=>null)
      ]);
      if(renderId!==engineeringRenderId)return;

      const thrusters=documentModel?.components?.filter(component=>component.type==="thruster")||[];
      const sourceThruster=thrusters.find(component=>component.id===selectedComponentId)||thrusters[0]||null;
      const sourceCase=sourceThruster?.metadata?.propulsion||{};
      if(!propulsionInitialized){
        propulsionThrustKn=Number(sourceCase.thrust??fixture.thrust)/1000;
        propulsionInflow=Number(sourceCase.inflowSpeed??fixture.inflowSpeed);
        propulsionDiameter=Number(sourceCase.diameter??fixture.diameter);
        propulsionInitialized=true;
      }

      const propulsion=propulsionPanelHTML(
        {
          ...fixture,
          name:sourceThruster?`${sourceThruster.name} · actuator-disk estimate`:fixture.name,
          diameter:Number(sourceCase.diameter??fixture.diameter),
          thrust:Number(sourceCase.thrust??fixture.thrust),
          inflowSpeed:Number(sourceCase.inflowSpeed??fixture.inflowSpeed)
        },
        {
          thrustKn:propulsionThrustKn,
          inflowSpeed:propulsionInflow,
          diameter:propulsionDiameter
        }
      );

      app.innerHTML=top("engineering")+`<main class="workspace">
        <div class="workspace-bar"><strong>${sourceThruster?.name||fixture.name}</strong><div class="mode-tabs">
          ${modes.map(mode=>`<button data-engineering-mode="${mode}" class="${engineeringMode===mode?"active":""}">${mode}</button>`).join("")}
        </div></div>
        <aside class="tree">
          <div class="tree-label">Thruster components</div>
          ${thrusters.length?thrusters.map(component=>`<div class="tree-row ${component.id===sourceThruster?.id?"selected":""}" data-propulsion-component="${component.id}"><span>◎</span>${component.name}</div>`).join(""):'<div class="tree-row"><span>○</span>No tagged thruster</div>'}
          <div class="tree-label">Method</div>
          <div class="tree-row selected"><span>≈</span>Ideal actuator disk</div>
          <div class="tree-label">Source metadata</div>
          <div class="tree-row"><span>D</span>Diameter <span class="muted">${sourceCase.diameter??"fixture"} m</span></div>
          <div class="tree-row"><span>→</span>Axis <span class="muted">${Array.isArray(sourceCase.axis)?sourceCase.axis.join(", "):"not set"}</span></div>
          <div class="tree-row"><span>↝</span>OpenFOAM body force <span class="muted">later</span></div>
        </aside>
        <section class="viewport">${propulsion.viewport}<div class="hud">Propulsion · ${sourceThruster?.name||"fixture"}</div></section>
        <aside class="inspector">${propulsion.inspector}</aside>
        <section class="results"><div class="results-summary">${propulsion.summary}</div>${propulsion.results}</section>
        <footer class="statusbar"><span>Units SI</span><span>Momentum theory</span><span>Source ${sourceThruster?"ModelDocument":"fixture"}</span><span class="top-spacer"></span><span>Ideal estimate</span></footer>
      </main><div class="preview-badge">Propulsion · component-linked actuator disk</div>`;

      bindNav();
      app.querySelectorAll("[data-engineering-mode]").forEach(button=>button.onclick=()=>go(engineeringModeRoute(button.dataset.engineeringMode)));
      app.querySelectorAll("[data-propulsion-component]").forEach(row=>row.onclick=()=>{
        selectedComponentId=row.dataset.propulsionComponent;
        propulsionInitialized=false;
        engineeringPage();
      });
      const rerun=()=>{
        propulsionThrustKn=Number(app.querySelector("#propulsion-thrust")?.value)||0;
        propulsionInflow=Number(app.querySelector("#propulsion-inflow")?.value)||0;
        propulsionDiameter=Number(app.querySelector("#propulsion-diameter")?.value)||Number(sourceCase.diameter??fixture.diameter);
        engineeringPage();
      };
      app.querySelector("#propulsion-thrust")?.addEventListener("change",rerun);
      app.querySelector("#propulsion-inflow")?.addEventListener("change",rerun);
      app.querySelector("#propulsion-diameter")?.addEventListener("change",rerun);
    }catch(error){
      if(renderId!==engineeringRenderId)return;
      app.innerHTML=top("engineering")+`<main class="study"><section class="study-main"><div class="course-header"><h1>Propulsion error</h1><p>${String(error?.message||error)}</p></div></section></main>`;
      bindNav();
    }
    return;
  }

  if(!engineeringDocument){
    const fallback=configuredComponents||[];
    app.innerHTML=top("engineering")+`<main class="workspace">
      <div class="workspace-bar"><strong>${model.name}</strong><div class="mode-tabs">
        ${modes.map(mode=>`<button data-engineering-mode="${mode}" class="${engineeringMode===mode?"active":""}">${mode}</button>`).join("")}
      </div></div>
      <aside class="tree"><div class="tree-label">Components</div>
        ${fallback.map(c=>`<div class="tree-row" style="padding-left:${8+depthFor(c,fallback)*16}px">${c.type==="assembly"?"▾":"○"} ${c.name}</div>`).join("")}
      </aside>
      <section class="viewport"><div class="engineering-loading"><strong>Loading ${model.format}</strong><span>${model.sourcePath}</span></div></section>
      <aside class="inspector"><h3>Model</h3><p class="muted">Parsing component hierarchy and geometry…</p></aside>
      <section class="results"><div class="results-summary"><strong>Preparing workspace</strong></div><div class="chart"></div></section>
      <footer class="statusbar"><span>Units SI</span><span class="top-spacer"></span><span>Loading model…</span></footer>
    </main>`;
    bindNav();
    app.querySelectorAll("[data-engineering-mode]").forEach(button=>button.onclick=()=>go(engineeringModeRoute(button.dataset.engineeringMode)));
    getEngineeringDocument()
      .then(()=>{if(renderId===engineeringRenderId)engineeringPage()})
      .catch(error=>{
        if(renderId!==engineeringRenderId)return;
        const viewport=app.querySelector(".viewport");
        if(viewport)viewport.innerHTML=`<pre class="code-view">Model load error: ${String(error?.message||error)}</pre>`;
      });
    return;
  }

  const documentModel=engineeringDocument;
  const uiComponents=documentModel.components;
  const diagnostics=analyzeModelDiagnostics(documentModel);
  const selected=uiComponents.find(c=>c.id===selectedComponentId)||uiComponents.find(c=>c.geometry)||uiComponents[0];
  const selectedDiagnostics=diagnostics.components.find(item=>item.componentId===selected?.id)||null;
  if(selected&&!selectedComponentId)selectedComponentId=selected.id;

  let hydro=null;
  if(engineeringMode==="Hydro"){
    const config=model.hydro||{};
    const minWaterline=Number(config.minDraft??0);
    const maxWaterline=Number(config.maxDraft??10);
    const samples=Math.max(3,Number(config.curveSamples??9));
    try{
      const analysisPromise=analyzeHydroAsync(documentModel,hydroDraft);
      const curvePromise=hydroCurveCache.model===documentModel&&hydroCurveCache.data
        ? Promise.resolve(hydroCurveCache.data)
        : hydroCurveAsync(documentModel,{minWaterline,maxWaterline,samples});
      let solvePromise=Promise.resolve(null);
      const target=Number(hydroTargetTonnes);
      if(Number.isFinite(target)&&target>0){
        const density=Number(config.density)||1025;
        solvePromise=solveHydroDraftAsync(documentModel,target*1000/density,{
          minWaterline,maxWaterline,tolerance:1e-7,maxIterations:60
        }).then(value=>({value,error:null})).catch(error=>({value:null,error:String(error?.message||error)}));
      }
      const [result,curve,solvedState]=await Promise.all([analysisPromise,curvePromise,solvePromise]);
      if(renderId!==engineeringRenderId)return;
      hydroCurveCache={model:documentModel,data:curve};
      const includedIds=new Set(result.components.map(item=>item.componentId));
      const geometryWarnings=diagnostics.components.filter(item=>includedIds.has(item.componentId)&&!item.watertight);
      hydro=hydroPanelHTML({
        modelDocument:documentModel,result,curve,
        solved:solvedState?.value||null,
        solveError:solvedState?.error||null,
        draft:hydroDraft,
        targetDisplacementTonnes:hydroTargetTonnes,
        geometryWarnings,
        config
      });
    }catch(error){
      if(renderId!==engineeringRenderId)return;
      hydro={
        inspector:`<h3>Hydro error</h3><p class="hydro-solve-error">${String(error?.message||error)}</p>`,
        summary:"<strong>Hydro unavailable</strong>",results:"",
        draft:hydroDraft,density:Number(model.hydro?.density)||1025,waterlinePercent:0
      };
    }
  }

  const inspector=hydro?hydro.inspector:`
    <h3>Properties</h3>
    <div class="readout"><span>Component</span><strong id="prop-component">${selected?.name||"—"}</strong></div>
    <div class="readout"><span>Role</span><strong id="prop-role">${selected?.type||"—"}</strong></div>
    <div class="readout"><span>Source ID</span><strong id="prop-source">${selected?.sourceObjectId||"—"}</strong></div>
    <div class="readout"><span>Units</span><strong>${documentModel.unit}</strong></div>
    ${selectedDiagnostics?`
      <div class="readout"><span>Triangles</span><strong>${selectedDiagnostics.triangleCount}</strong></div>
      <div class="readout"><span>Watertight</span><strong class="${selectedDiagnostics.watertight?"status-ok":"status-warn"}">${selectedDiagnostics.watertight?"Yes":"No"}</strong></div>
      <div class="readout"><span>Boundary edges</span><strong>${selectedDiagnostics.boundaryEdges}</strong></div>
      <div class="readout"><span>Non-manifold</span><strong>${selectedDiagnostics.nonManifoldEdges}</strong></div>
      <div class="readout"><span>Degenerate</span><strong>${selectedDiagnostics.degenerateTriangles}</strong></div>
    `:""}`;
  const summary=hydro?hydro.summary:`
    <strong>Model summary</strong>
    <div class="readout"><span>Components</span><strong>${uiComponents.length}</strong></div>
    <div class="readout"><span>Geometry nodes</span><strong>${diagnostics.geometryComponents}</strong></div>
    <div class="readout"><span>Triangles</span><strong>${diagnostics.triangles}</strong></div>
    <div class="readout"><span>Topology</span><strong class="${diagnostics.watertight?"status-ok":"status-warn"}">${diagnostics.watertight?"Watertight":"Check geometry"}</strong></div>
    <div class="readout"><span>Size</span><strong>${diagnostics.bounds.size.map(v=>v.toFixed(3)).join(" × ")} m</strong></div>
    <div class="readout"><span>Format</span><strong>${documentModel.format}</strong></div>`;
  const resultContent=hydro?hydro.results:`<div class="chart"><svg viewBox="0 0 700 170"><path d="M20 135 C90 132 122 80 190 92 S315 60 372 82 S502 35 675 46" fill="none" stroke="var(--accent)" stroke-width="3"/><path d="M20 145H680M20 20V145" stroke="var(--line-strong)"/></svg></div>`;
  const waterline=hydro?`<div class="workspace-waterline" style="bottom:${hydro.waterlinePercent}%"><span>WL ${hydro.draft.toFixed(2)} m</span></div>`:"";

  app.innerHTML=top("engineering")+`<main class="workspace">
    <div class="workspace-bar"><strong>${documentModel.name}</strong><div class="mode-tabs">
      ${modes.map(mode=>`<button data-engineering-mode="${mode}" class="${engineeringMode===mode?"active":""}">${mode}</button>`).join("")}
    </div></div>
    <aside class="tree"><input id="component-filter" placeholder="Filter components"><div class="tree-label">Components</div>
      <div id="component-tree">${uiComponents.map(c=>`<div class="tree-row ${c.id===selectedComponentId?"selected":""}" data-component="${c.id}" data-component-name="${c.name.toLowerCase()}" style="padding-left:${8+depthFor(c,uiComponents)*16}px">${c.geometry?"○":"▾"} ${c.name}</div>`).join("")}</div>
    </aside>
    <section class="viewport"><div id="engineering-scene" class="engineering-scene"></div><div class="hud">${engineeringMode==="Hydro"?"Hydro · imported geometry":"Selected: "+(selected?.name||"—")}</div>${waterline}</section>
    <aside class="inspector">${inspector}</aside>
    <section class="results"><div class="results-summary">${summary}</div>${resultContent}</section>
    <footer class="statusbar"><span>Units SI</span><span>Source ${documentModel.unit}</span><span>Mode ${engineeringMode}</span><span class="top-spacer"></span><span>Ready</span></footer>
  </main><div class="preview-badge">${engineeringMode==="Hydro"?"Hydro · ModelDocument":"Shared ModelDocument"}</div>`;

  bindNav();
  let sceneHandle=null;
  const updateSelection=component=>{
    if(!component)return;
    selectedComponentId=component.id;
    app.querySelectorAll("[data-component]").forEach(row=>row.classList.toggle("selected",row.dataset.component===component.id));
    const name=app.querySelector("#prop-component"),role=app.querySelector("#prop-role"),source=app.querySelector("#prop-source");
    if(name)name.textContent=component.name;
    if(role)role.textContent=component.type;
    if(source)source.textContent=component.sourceObjectId||"—";
  };

  mountModelScene(app.querySelector("#engineering-scene"),documentModel,{
    showSidebar:false,selectedComponentId,onSelect:updateSelection
  }).then(handle=>{
    if(renderId!==engineeringRenderId){handle.cleanup();return}
    sceneHandle=handle;engineeringCleanup=handle.cleanup;
  }).catch(error=>{
    const target=app.querySelector("#engineering-scene");
    if(target)target.innerHTML=`<pre class="code-view">3D render error: ${String(error?.message||error)}</pre>`;
  });

  app.querySelectorAll("[data-component]").forEach(row=>row.onclick=()=>{
    const component=uiComponents.find(c=>c.id===row.dataset.component);
    if(!component)return;
    updateSelection(component);sceneHandle?.selectById(component.id);
  });
  app.querySelector("#component-filter")?.addEventListener("input",event=>{
    const query=event.target.value.trim().toLowerCase();
    app.querySelectorAll("[data-component]").forEach(row=>row.hidden=query&&!row.dataset.componentName.includes(query));
  });
  app.querySelectorAll("[data-engineering-mode]").forEach(button=>button.onclick=()=>go(engineeringModeRoute(button.dataset.engineeringMode)));
  app.querySelector("#hydro-draft")?.addEventListener("change",event=>{hydroDraft=Number(event.target.value)||0;engineeringPage()});
  app.querySelector("#hydro-solve")?.addEventListener("click",()=>{
    hydroTargetTonnes=app.querySelector("#hydro-target")?.value??"";engineeringPage();
  });
  app.querySelector("#hydro-target")?.addEventListener("keydown",event=>{
    if(event.key==="Enter"){hydroTargetTonnes=event.currentTarget.value;engineeringPage()}
  });
}
function notFoundPage(message){app.innerHTML=top("")+'<main class="study"><section class="study-main"><div class="course-header"><h1>Not found</h1><p>'+message+'</p><button class="btn" data-go="/courses">Back to Courses</button></div></section></main>';bindNav()}
async function viewerPage(info){const course=getCourse(info.semester,info.code),resource=course?.resources[info.resourceIndex];if(!course||!resource)return notFoundPage("Viewer resource was not found.");app.innerHTML=top("courses");bindNav();const holder=document.createElement("div");app.append(holder);await mountViewer(holder,{...resource,semester:info.semester,courseCode:course.code},()=>go(courseRoute(info.semester,course.code)))}

async function render(){const path=route();if(path!=="/tools/crystal"){crystalCleanup?.();crystalCleanup=null;}const viewer=parseViewerRoute(path);if(path.startsWith("/projects/"))return projectPage(decodeURIComponent(path.split("/")[2]||""));if(viewer)return viewerPage(viewer);const course=parseCourseRoute(path);if(course)return coursePage(course.semester,course.code);const sem=path.match(/^\/(?:courses|study)\/(\d+)$/i);if(sem)return coursesPage(Number(sem[1]));if(path==="/courses"||path==="/study")return coursesPage();if(path==="/tools")return toolsPage();if(path==="/tools/fluid")return fluidToolPage();if(path==="/tools/coolprop")return coolPropToolPage();if(path==="/tools/periodic")return periodicToolPage();if(path==="/tools/crystal")return crystalToolPage();if(path==="/mobile-preview")return mobilePreviewPage();if(path==="/settings")return settingsPage();const engineering=path.match(/^\/engineering(?:\/(model|hydro|structure|resistance|propulsion))?$/i);if(engineering){const requested=engineering[1]||"model";engineeringMode=requested.charAt(0).toUpperCase()+requested.slice(1).toLowerCase();return engineeringPage()}return portfolioPage()}
window.addEventListener("keydown",event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){event.preventDefault();globalSearch.open()}});window.addEventListener("hashchange",render);render();
