import {initSettings,getSettings,setSetting} from "./settings.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {clearLocalStudyProgress,settingsPageHTML} from "./settings/settings-page.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {mountViewer} from "./viewer.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {loadContent} from "./content.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {renderResourceTree} from "./components/resource-tree.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {karakterwebUrl} from "./courses/external-links.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {hydroPanelHTML} from "./engineering/hydro-panel.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {renderProjectCard,renderProjectDetail} from "./components/project-card.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {buildSearchIndex} from "./search/search-index.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {createSearchController} from "./components/search-dialog.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {toolsIndexHTML} from "./tools/tools-index.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {activeTools} from "./tools/tool-registry.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {fluidCalculatorHTML} from "./tools/fluid-calculator.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {modelInspectorHTML,bindModelInspector} from "./tools/model-inspector.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {chemEditorHTML,bindChemEditor} from "./tools/chem-editor.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {coolPropToolHTML,bindCoolPropTool} from "./tools/coolprop-tool.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {loadPeriodicFixture,periodicTableHTML} from "./tools/periodic-table.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {crystalToolHTML,mountCrystalViewer} from "./tools/crystal-viewer.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {editFromState,readCrystalEditorState} from "./tools/crystal-editor-panel.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {loadModelDocument} from "./model/load-model.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {mountModelScene} from "./model/model-scene.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {analyzeModelDiagnostics} from "./model/mesh-diagnostics.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {componentSemantic,semanticComponents,semanticSummary} from "./model/semantic-assembly.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {analyzeHydroAsync,attitudeHydroAsync,gzCurveAsync,hydroCurveAsync,solveAttitudeEquilibriumAsync,solveHydroDraftAsync} from "./hydro/hydro-client.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {downloadTextFile,gzCurveCSV,hydrostaticRowsCSV} from "./hydro/export.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {loadStructureFixture,structurePanelHTML} from "./engineering/structure-panel.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {analysisCapability,capabilityLabel} from "./engineering/capabilities.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {downloadEngineeringCase,engineeringCaseReport} from "./engineering/case-report.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {loadResistanceFixture,resistancePanelHTML} from "./engineering/resistance-panel.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {loadPropulsionFixture,propulsionPanelHTML} from "./engineering/propulsion-panel.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {analyzeThrusterSystem,thrustersFromModelDocument} from "./propulsion/thruster-system.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {renderTopShell,bindShellNavigation} from "./shell/navigation.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {bindWorkspaceDrawers} from "./shell/workspace-drawers.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {themeStudioHTML,bindThemeStudio} from "./settings/theme-studio.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {diversePageHTML} from "./diverse/diverse-page.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {DIVERSE_MODULES} from "./diverse/diverse-registry.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {diveMapHTML,mountDiveMap} from "./diverse/dive-map.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";

initSettings();

const app=document.querySelector("#app");
const content=await loadContent();
const {site,semesters,navLabels,projects}=content;
const engineeringModels=content.models?.length?content.models:[content.model];
let engineeringModelId=engineeringModels[0]?.id||"fixture";
let model=engineeringModels.find(item=>item.id===engineeringModelId)||engineeringModels[0]||content.model;
let configuredComponents=model?.components||[];

let engineeringDocument=null;
let engineeringDocumentPromise=null;
let engineeringCleanup=null;
let engineeringRenderId=0;
let selectedComponentId=null;
let engineeringMode="Model";
let hydroDraft=Number(model.hydro?.defaultDraft??1.20);
let hydroTargetTonnes="";
let hydroKg="";
let hydroLcg="";
let hydroTcg="";
let hydroHeel=0;
let hydroTrim=0;
let hydroGzRequested=false;
let hydroAttitudeAction="";
let hydroCurveCache={model:null,data:null};
let structureLoadKn=-20;
let resistanceSpeedKn=10;
let propulsionThrustKn=20;
let propulsionInflow=3;
let propulsionDiameter=1.5;
let propulsionInitialized=false;
let fluidToolState={fluid:"air",temperature:20,unit:"C"};
let coolPropState={fluid:"Air",input1:"P",value1:1,input2:"T",value2:25};
let periodicToolState={search:"",phase:"all",category:"all",material:"all",period:"all",group:"all",crystal:"all",property:"atomic_mass",quick:"",temperature:298,selected:null};
let crystalToolState={type:"bcc",preset:"",nx:1,ny:1,nz:1,a:1,c:"",showTetra:false,showOcta:false,measure:false,showBonds:false,visibility:"both",editMode:"none",manualAtom:"fe",manualRadius:.14,manualColor:"#9aa6ad",placeX:.5,placeY:.5,placeZ:.5,planeFamily:"none",h:1,k:0,l:0,edits:[]};
let crystalCleanup=null;
let coolPropCleanup=null;
let chemEditorCleanup=null;
let modelInspectorCleanup=null;
let workspaceDrawerCleanup=null;
let themeStudioState={mode:"manual",name:"custom-theme",colors:{},palette:[],imageSrc:""};
let settingsSection="appearance";
let diveMapCleanup=null;
let diveMapMountId=0;

function getEngineeringDocument(){
  if(!engineeringDocumentPromise){
    engineeringDocumentPromise=loadModelDocument(model).then(documentModel=>{
      engineeringDocument=documentModel;
      selectedComponentId=selectedComponentId
        || documentModel.components.find(component=>componentSemantic(component).role==="hull"&&component.geometry)?.id
        || documentModel.components.find(component=>component.geometry)?.id
        || documentModel.components[0]?.id
        || null;
      return documentModel;
    });
  }
  return engineeringDocumentPromise;
}

function engineeringModelReadinessLabel(item){
  const names=["hydro","structure","resistance","propulsion"];
  const ready=names.filter(name=>analysisCapability(item,name).enabled).length;
  if(ready===names.length)return "all analyses ready";
  if(ready===0)return "visual only";
  return `${ready}/${names.length} analyses ready`;
}

function engineeringModelSelectHTML(){
  if(engineeringModels.length<2)return "";
  const capability=engineeringMode==="Model"
    ?analysisCapability(model,"model")
    :analysisCapability(model,engineeringMode.toLowerCase());
  return `<div class="engineering-model-control">
    <label class="engineering-model-select"><span>Model</span><select id="engineering-model-select">${engineeringModels.map(item=>`<option value="${item.id}" ${item.id===engineeringModelId?"selected":""}>${item.label||item.name} · ${engineeringModelReadinessLabel(item)}</option>`).join("")}</select></label>
    <span class="engineering-mode-capability ${capability.enabled?"ready":"blocked"}">${capabilityLabel(capability)}</span>
  </div>`;
}

function selectEngineeringModel(id){
  const next=engineeringModels.find(item=>item.id===id);
  if(!next||next===model)return false;
  model=next;
  engineeringModelId=next.id;
  configuredComponents=model.components||[];
  engineeringDocument=null;
  engineeringDocumentPromise=null;
  selectedComponentId=null;
  hydroDraft=Number(model.hydro?.defaultDraft??1.2);
  hydroTargetTonnes="";
  hydroKg="";
  hydroLcg="";
  hydroTcg="";
  hydroHeel=0;
  hydroTrim=0;
  hydroGzRequested=false;
  hydroAttitudeAction="";
  hydroCurveCache={model:null,data:null};
  propulsionInitialized=false;
  return true;
}

function bindEngineeringModelSelector(){
  app.querySelector("#engineering-model-select")?.addEventListener("change",event=>{
    if(selectEngineeringModel(event.currentTarget.value))engineeringPage();
  });
}

function engineeringExportButtonHTML(enabled=true){
  return `<button class="engineering-export-case" id="engineering-export-case" ${enabled?"":"disabled"}>Export case</button>`;
}

function bindEngineeringCaseExport(report){
  const button=app.querySelector("#engineering-export-case");
  if(!button||!report)return;
  button.disabled=false;
  button.addEventListener("click",()=>downloadEngineeringCase(report));
}

function blockedEngineeringReport(documentModel,mode,capability){
  return engineeringCaseReport({
    modelConfig:model,
    modelDocument:documentModel,
    mode,
    capability,
    method:{name:"capability gate",scope:"no numerical analysis executed"},
    inputs:{},
    results:{status:"blocked"},
    assumptions:[],
    warnings:[capability.reason||"Analysis capability is not configured."]
  });
}

function blockedEngineeringWorkspaceHTML(documentModel,mode,capability){
  const requirements=capability.requirements?.length
    ?`<div class="engineering-requirements"><strong>Required before analysis</strong><ul>${capability.requirements.map(item=>`<li>${item}</li>`).join("")}</ul></div>`
    :"";
  return `<main class="workspace">
    <div class="workspace-bar"><strong>${documentModel.name}</strong>${engineeringModelSelectHTML()}${engineeringExportButtonHTML()}<div class="mode-tabs">
      ${["Model","Hydro","Structure","Resistance","Propulsion"].map(item=>`<button data-engineering-mode="${item}" class="${mode===item?"active":""}">${item}</button>`).join("")}
    </div></div>
    <aside class="tree">
      <div class="tree-label">Analysis capability</div>
      <div class="tree-row selected"><span>!</span><span class="tree-row-copy">${mode}<small>${capabilityLabel(capability)}</small></span></div>
      <div class="tree-label">Model source</div>
      <div class="tree-row"><span>◇</span><span class="tree-row-copy">${model.name}<small>${model.source?.datasetVersion?"dataset "+model.source.datasetVersion:"configured model"}</small></span></div>
    </aside>
    <section class="viewport"><div id="engineering-scene" class="engineering-scene"></div><div class="hud">${mode} · sourced geometry only</div></section>
    <aside class="inspector">
      <h3>${mode} unavailable</h3>
      <div class="readout"><span>Status</span><strong class="status-warn">${capabilityLabel(capability)}</strong></div>
      <p class="muted hydro-note">${capability.reason||"This analysis is not configured for the selected model."}</p>
      ${requirements}
    </aside>
    <section class="results">
      <div class="results-summary"><strong>No fabricated result</strong><div class="readout"><span>Model</span><strong>${documentModel.name}</strong></div></div>
      <div class="engineering-empty-analysis"><strong>${mode} is capability-gated</strong><p>${capability.reason||"Required analysis inputs are not available."}</p></div>
    </section>
    <footer class="statusbar"><span>Units SI</span><span>${capabilityLabel(capability)}</span><span>Mode ${mode}</span><span class="top-spacer"></span><span>Sourced geometry</span></footer>
  </main><div class="preview-badge">${mode} · capability gated</div>`;
}

function bindBlockedEngineeringWorkspace(documentModel,renderId,mode,capability){
  bindNav();
  bindEngineeringModelSelector();
  bindEngineeringCaseExport(blockedEngineeringReport(documentModel,mode,capability));
  app.querySelectorAll("[data-engineering-mode]").forEach(button=>button.onclick=()=>go(engineeringModeRoute(button.dataset.engineeringMode)));
  mountModelScene(app.querySelector("#engineering-scene"),documentModel,{
    showSidebar:false,selectedComponentId
  }).then(handle=>{
    if(renderId!==engineeringRenderId){handle.cleanup();return}
    engineeringCleanup=handle.cleanup;
  }).catch(error=>{
    const target=app.querySelector("#engineering-scene");
    if(target)target.innerHTML=`<pre class="code-view">3D render error: ${String(error?.message||error)}</pre>`;
  });
}

const vessel='<svg viewBox="0 0 760 380"><path d="M120 236 L560 236 L642 265 L603 305 L184 306 L104 268 Z" fill="#bccbd2" stroke="#eff7fa" stroke-width="3"/><path d="M250 151 L486 151 L541 230 L196 230 Z" fill="#dbe7ec" stroke="#eff7fa" stroke-width="3"/><rect x="292" y="109" width="165" height="39" rx="4" fill="#dbe7ec"/><path d="M326 109V45" stroke="#eff7fa" stroke-width="4"/><g fill="#17384c"><rect x="276" y="168" width="35" height="17" rx="3"/><rect x="321" y="168" width="35" height="17" rx="3"/><rect x="366" y="168" width="35" height="17" rx="3"/><rect x="411" y="168" width="35" height="17" rx="3"/></g><path d="M160 273 Q370 325 615 274" fill="none" stroke="#6dc6eb" stroke-width="3"/></svg>';

const route=()=>location.hash.slice(1)||"/portfolio";
const go=path=>{location.hash=path};
const globalSearch=createSearchController({index:buildSearchIndex({semesters,projects,tools:activeTools(),diverse:DIVERSE_MODULES}),onNavigate:go});
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

function diversePage(){
  document.documentElement.dataset.lens="portfolio";
  app.innerHTML=top("diverse")+diversePageHTML()+'<div class="preview-badge">Diverse · shared v2 shell</div>';
  bindNav();
}

async function diveMapPage(){
  const mountId=++diveMapMountId;
  document.documentElement.dataset.lens="study";
  app.innerHTML=top("diverse")+diveMapHTML()+'<div class="preview-badge">Dive map · sourced snapshot</div>';
  bindNav();
  try{
    const cleanup=await mountDiveMap(app,{onBack:()=>go("/diverse")});
    if(mountId!==diveMapMountId||!["/diverse/diving","/diverse/dive-map"].includes(route())){
      cleanup?.();
      return;
    }
    diveMapCleanup=cleanup;
  }catch(error){
    if(mountId!==diveMapMountId)return;
    const note=app.querySelector("#dive-map-note");
    if(note)note.textContent=`Dive map load error: ${String(error?.message||error)}`;
    const list=app.querySelector("#dive-list");
    if(list)list.innerHTML='<div class="dive-empty"><strong>Dataset unavailable</strong><span>Could not load the local dive snapshot.</span></div>';
  }
}

function coursesPage(requestedSemester){
  document.documentElement.dataset.lens="study";
  const semesterId=Number(requestedSemester)||Number(site.defaultSemester)||semesters.find(s=>s.courses.length)?.id||semesters[0]?.id;
  const semester=getSemester(semesterId)||semesters[0];
  const semesterTabs=semesters.map(s=>`<button class="${Number(s.id)===Number(semester.id)?"active":""}" data-semester="${s.id}" aria-label="${s.label}" title="${s.label}">
    <span class="semester-label-long">${s.label}</span>
    <span class="semester-label-short">S${s.id}</span>
  </button>`).join("");
  const courseCards=semester.courses.map(course=>{
    const resourceCount=course.resources?.length||0;
    const sectionCount=course.sections?.length||0;
    return `<article class="course-card" data-course="${course.code}" tabindex="0">
      <div class="course-card-top">
        <span class="course-code">${course.code}</span>
        <span class="course-count">${resourceCount} ressurs${resourceCount===1?"":"er"}</span>
      </div>
      <h3>${course.title}</h3>
      <p>${course.description}</p>
      <div class="course-card-bottom">
        <div class="tags">${(course.tags||[]).slice(0,3).map(tag=>`<span class="tag">${tag}</span>`).join("")}</div>
        <span class="course-sections">${sectionCount} seksjon${sectionCount===1?"":"er"} <span aria-hidden="true">→</span></span>
      </div>
    </article>`;
  }).join("");

  app.innerHTML=top("courses")+`<main class="study courses-overview">
    <section class="study-hero courses-hero">
      <div>
        <span class="project-kicker">Study archive</span>
        <h1>Courses</h1>
        <p>Fag, ressurser, Kok, øvinger, videoer, quiz og verktøy — organisert per semester.</p>
      </div>
      <button class="btn dark courses-tools-button" data-go="/tools">Open Tools</button>
    </section>

    <div class="semester-navigation">
      <div class="semester-tabs" aria-label="Semester navigation">${semesterTabs}</div>
    </div>

    <section class="study-main courses-main">
      <div class="title-row courses-title-row">
        <div>
          <span class="project-kicker">Selected semester</span>
          <h2>${semester.label}</h2>
          <div class="muted">${semester.courses.length} fag · ${semester.courses.reduce((sum,course)=>sum+(course.resources?.length||0),0)} ressurser</div>
        </div>
      </div>
      ${semester.courses.length
        ?`<div class="course-grid">${courseCards}</div>`
        :'<div class="course-header"><h3>Ingen eksempeldata i dette semesteret ennå.</h3><p>Legg inn en fagmappe og kjør <code>python scripts/update_site.py</code>.</p></div>'}
    </section>
  </main><div class="preview-badge">Courses exposes Kok; Portfolio does not</div>`;

  bindNav();
  app.querySelectorAll("[data-semester]").forEach(button=>button.onclick=()=>go("/courses/"+button.dataset.semester));
  const activeSemester=app.querySelector(".semester-tabs .active");
  activeSemester?.scrollIntoView?.({behavior:"instant",block:"nearest",inline:"center"});
  app.querySelectorAll("[data-course]").forEach(card=>{
    const open=()=>go(courseRoute(semester.id,card.dataset.course));
    card.onclick=open;
    card.onkeydown=event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();open()}};
  });
}

function coursePage(semesterId,code){
  const course=getCourse(semesterId,code);
  if(!course)return notFoundPage("Course "+code+" was not found in semester "+semesterId);
  document.documentElement.dataset.lens="study";

  const grouped=course.resources.reduce((groups,resource)=>{
    (groups[resource.section]??=[]).push(resource);
    return groups;
  },{});
  const sections=course.sections
    .map((label,index)=>({label,index,items:grouped[label]||[]}))
    .filter(section=>section.items.length);
  const karakterwebHref=karakterwebUrl(course.code);
  const resourceCount=course.resources.length;

  app.innerHTML=top("courses")+`<main class="layout">
    <aside class="side course-side">
      <div class="side-title">${course.code}</div>
      <button class="active" data-course-nav="overview"><span>Overview</span><small>${resourceCount} resources</small></button>
      ${sections.map(section=>`<button data-course-nav="section-${section.index}"><span>${section.label}</span><small>${section.items.length}</small></button>`).join("")}
      <button data-course-nav="karakterweb"><span>Karakterweb</span><small>external ↗</small></button>
    </aside>
    <section class="content">
      <div class="crumbs">Courses / ${getSemester(semesterId).label} / ${course.code}</div>
      <header class="course-header" id="course-overview">
        <div class="course-header-meta"><span class="course-code">${course.code}</span><span>${resourceCount} resources · ${sections.length} sections</span></div>
        <h1>${course.title}</h1>
        <p>${course.description}</p>
      </header>
      ${sections.map(section=>`<section class="resource-section" id="course-section-${section.index}" data-course-section="section-${section.index}">
        <div class="resource-section-head"><h2>${section.label}</h2><span>${section.items.length} item${section.items.length===1?"":"s"}</span></div>
        <div class="resource-list">${renderResourceTree(section.items,item=>course.resources.indexOf(item))}</div>
      </section>`).join("")}
      <section class="resource-section" id="course-karakterweb" data-course-section="karakterweb">
        <div class="resource-section-head"><h2>Karakterweb</h2><span>external course statistics</span></div>
        <div class="resource-list">
          <button class="resource-row resource-row-button" id="karakterweb">
            <span class="file-icon">KW</span>
            <div><strong>Open ${course.code} on Karakterweb</strong><div class="muted">karakterweb.no/ntnu/${course.code}</div></div>
            <span class="muted">Open ↗</span>
          </button>
        </div>
      </section>
    </section>
  </main><div class="preview-badge">Manifest-driven course workspace</div>`;

  bindNav();
  app.querySelectorAll("[data-resource]").forEach(element=>{
    element.onclick=()=>go(viewerRoute(semesterId,course.code,element.dataset.resource));
  });
  app.querySelector("#karakterweb")?.addEventListener("click",()=>{
    window.open(karakterwebHref,"_blank","noopener");
  });

  const navButtons=[...app.querySelectorAll("[data-course-nav]")];
  const activate=id=>navButtons.forEach(button=>button.classList.toggle("active",button.dataset.courseNav===id));
  const scrollToTarget=id=>{
    const target=id==="overview"
      ?app.querySelector("#course-overview")
      :app.querySelector(id==="karakterweb"?"#course-karakterweb":"#course-"+id);
    target?.scrollIntoView({behavior:"smooth",block:"start"});
    activate(id);
  };
  navButtons.forEach(button=>button.addEventListener("click",()=>scrollToTarget(button.dataset.courseNav)));

  const observed=[
    {element:app.querySelector("#course-overview"),id:"overview"},
    ...sections.map(section=>({element:app.querySelector("#course-section-"+section.index),id:"section-"+section.index})),
    {element:app.querySelector("#course-karakterweb"),id:"karakterweb"}
  ].filter(item=>item.element);
  const observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(entry=>entry.isIntersecting)
      .sort((a,b)=>Math.abs(a.boundingClientRect.top)-Math.abs(b.boundingClientRect.top))[0];
    const match=visible&&observed.find(item=>item.element===visible.target);
    if(match)activate(match.id);
  },{rootMargin:"-15% 0px -70% 0px",threshold:[0,0.05]});
  observed.forEach(item=>observer.observe(item.element));
  app.__courseObserver=observer;
}
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

async function modelInspectorPage(){
  document.documentElement.dataset.lens="study";
  modelInspectorCleanup?.();
  modelInspectorCleanup=null;
  app.innerHTML=top("courses")+modelInspectorHTML();
  bindNav();
  try{
    const handle=await bindModelInspector(app);
    modelInspectorCleanup=handle?.cleanup||null;
  }catch(error){
    const target=app.querySelector("#model-inspector-status");
    if(target)target.textContent="Inspector error: "+String(error?.message||error);
  }
}

async function chemEditorPage(){
  document.documentElement.dataset.lens="study";
  chemEditorCleanup?.();
  chemEditorCleanup=null;
  app.innerHTML=top("courses")+chemEditorHTML();
  bindNav();
  try{
    const handle=await bindChemEditor(app);
    chemEditorCleanup=handle?.cleanup||null;
  }catch(error){
    const target=app.querySelector("#chem-message");
    if(target)target.textContent="Editor error: "+String(error?.message||error);
  }
}

function coolPropToolPage(){
  document.documentElement.dataset.lens="study";
  coolPropCleanup?.();
  coolPropCleanup=null;
  app.innerHTML=top("courses")+coolPropToolHTML(coolPropState);
  bindNav();
  const handle=bindCoolPropTool(app,coolPropState,(next,rerender=true)=>{
    coolPropState={...coolPropState,...next};
    if(rerender)coolPropToolPage();
  });
  coolPropCleanup=handle?.cleanup||null;
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
        quick:periodicToolState.quick||"",
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
    app.querySelectorAll("[data-periodic-quick]").forEach(button=>button.onclick=()=>{
      periodicToolState={...periodicToolState,quick:periodicToolState.quick===button.dataset.periodicQuick?"":button.dataset.periodicQuick};
      periodicToolPage();
    });
    app.querySelector("#periodic-reset")?.addEventListener("click",()=>{
      periodicToolState={search:"",phase:"all",category:"all",material:"all",period:"all",group:"all",crystal:"all",property:"atomic_mass",quick:"",temperature:298,selected:null};
      periodicToolPage();
    });
    app.querySelector("#periodic-clear-selection")?.addEventListener("click",()=>{
      periodicToolState={...periodicToolState,selected:null};
      periodicToolPage();
    });
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

  const readState=()=>{
    const base={
      ...crystalToolState,
      type:app.querySelector("#crystal-type")?.value||"bcc",
      preset:app.querySelector("#crystal-preset")?.value||"",
      nx:Number(app.querySelector("#crystal-nx")?.value)||1,
      ny:Number(app.querySelector("#crystal-ny")?.value)||1,
      nz:Number(app.querySelector("#crystal-nz")?.value)||1,
      a:Number(app.querySelector("#crystal-a")?.value)||1,
      c:app.querySelector("#crystal-c")?.value||""
    };
    return readCrystalEditorState(app,base);
  };
  const rerender=()=>{crystalToolState=readState();crystalToolPage()};
  app.querySelector("#crystal-type")?.addEventListener("change",()=>{crystalToolState={...readState(),edits:[]};crystalToolPage()});
  app.querySelector("#crystal-preset")?.addEventListener("change",event=>{
    const value=event.target.value;
    if(value){
      const preset={Na:"sc",Fe:"bcc",Cu:"fcc",Al:"fcc",Ni:"fcc",Si:"diamond",C:"diamond",MgAl2O4:"spinel",Fe3O4:"spinel"}[value];
      crystalToolState={...readState(),preset:value,type:preset||crystalToolState.type,edits:[]};
      crystalToolPage();
    }else{
      crystalToolState={...readState(),preset:"",edits:[]};
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
  app.querySelector("#crystal-bonds")?.addEventListener("click",()=>{
    crystalToolState={...readState(),showBonds:!crystalToolState.showBonds};
    crystalToolPage();
  });
  for(const id of ["#crystal-visibility","#crystal-edit-mode","#crystal-plane-family"]){
    app.querySelector(id)?.addEventListener("change",rerender);
  }
  for(const id of ["#crystal-manual-atom","#crystal-x","#crystal-y","#crystal-z","#crystal-radius","#crystal-color","#crystal-h","#crystal-k","#crystal-l"]){
    app.querySelector(id)?.addEventListener("change",()=>{crystalToolState=readState()});
  }
  app.querySelector("#crystal-add-edit")?.addEventListener("click",()=>{
    const next=readState();
    const edit=editFromState(next);
    if(!edit)return;
    crystalToolState={...next,edits:[...(next.edits||[]),edit]};
    crystalToolPage();
  });
  app.querySelector("#crystal-undo-edit")?.addEventListener("click",()=>{
    const next=readState();
    crystalToolState={...next,edits:(next.edits||[]).slice(0,-1)};
    crystalToolPage();
  });
  app.querySelector("#crystal-clear-edits")?.addEventListener("click",()=>{
    crystalToolState={...readState(),edits:[]};
    crystalToolPage();
  });

  app.querySelector("#crystal-stage")?.addEventListener("crystal-site-edit",event=>{
    const next=readState();
    const edit=editFromState(next,Number(event.detail?.baseIndex));
    if(!edit)return;
    crystalToolState={...next,edits:[...(next.edits||[]),edit]};
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

function themeStudioPage(mode="manual"){
  document.documentElement.dataset.lens="study";
  themeStudioState={...themeStudioState,mode:mode==="image"?"image":"manual"};
  app.innerHTML=top("")+themeStudioHTML(themeStudioState);
  bindNav();
  bindThemeStudio(app,themeStudioState,(next,rerender=true)=>{
    themeStudioState={...themeStudioState,...next};
    if(rerender)themeStudioPage(themeStudioState.mode);
  });
}

function settingsPage(){
  const settings=getSettings();
  const stats={
    semesters:semesters.length,
    courses:semesters.reduce((sum,semester)=>sum+(semester.courses?.length||0),0),
    resources:semesters.reduce((sum,semester)=>sum+(semester.courses||[]).reduce((courseSum,course)=>courseSum+(course.resources?.length||0),0),0),
    models:engineeringModels.length
  };
  document.documentElement.dataset.lens="study";
  app.innerHTML=top("")+settingsPageHTML({settings,section:settingsSection,stats});
  bindNav();

  app.querySelectorAll("[data-settings-section]").forEach(button=>button.addEventListener("click",()=>{
    settingsSection=button.dataset.settingsSection||"appearance";
    settingsPage();
  }));

  app.querySelectorAll("[data-setting]").forEach(button=>button.addEventListener("click",()=>{
    setSetting(button.dataset.setting,button.dataset.value);
    settingsPage();
  }));

  app.querySelector("#settings-clear-study-progress")?.addEventListener("click",event=>{
    const removed=clearLocalStudyProgress();
    const feedback=app.querySelector("#settings-feedback");
    if(feedback)feedback.textContent=removed?`Cleared ${removed} local progress record${removed===1?"":"s"}.`:"No local study progress was stored.";
    event.currentTarget.textContent="Cleared";
    setTimeout(()=>{if(event.currentTarget?.isConnected)event.currentTarget.textContent="Clear progress"},1200);
  });
}

function depthFor(component,list){
  const byId=new Map(list.map(c=>[c.id,c]));
  let depth=0,current=component;
  while(current?.parentId&&depth<20){depth++;current=byId.get(current.parentId)}
  return depth;
}
function engineeringRoleIcon(component){
  const role=componentSemantic(component).role;
  if(role==="assembly")return "▾";
  if(role==="hull")return "◇";
  if(role==="thruster")return "◎";
  if(role==="structure")return "⌗";
  if(role==="tank")return "▣";
  return component.geometry?"○":"▾";
}

async function engineeringPage(){
  const renderId=++engineeringRenderId;
  engineeringCleanup?.();
  engineeringCleanup=null;
  document.documentElement.dataset.lens="workspace";
  const modes=["Model","Hydro","Structure","Resistance","Propulsion"];

  if(engineeringMode==="Structure"){
    try{
      const capability=analysisCapability(model,"structure");
      if(!capability.enabled){
        const documentModel=await getEngineeringDocument();
        if(renderId!==engineeringRenderId)return;
        app.innerHTML=top("engineering")+blockedEngineeringWorkspaceHTML(documentModel,"Structure",capability);
        bindBlockedEngineeringWorkspace(documentModel,renderId,"Structure",capability);
        return;
      }

      const fixture=await loadStructureFixture();
      if(renderId!==engineeringRenderId)return;
      const structure=structurePanelHTML(fixture,{loadFy:structureLoadKn*1000});
      const caseModel=structure.model;
      app.innerHTML=top("engineering")+`<main class="workspace">
        <div class="workspace-bar"><strong>${caseModel.name}</strong>${engineeringModelSelectHTML()}${engineeringExportButtonHTML()}<div class="mode-tabs">
          ${modes.map(mode=>`<button data-engineering-mode="${mode}" class="${engineeringMode===mode?"active":""}">${mode}</button>`).join("")}
        </div></div>
        <aside class="tree">
          <div class="tree-label">Frame nodes</div>
          ${caseModel.nodes.map(node=>`<div class="tree-row"><span>○</span>${node.id} <span class="muted">(${node.x}, ${node.y})</span></div>`).join("")}
          <div class="tree-label">Elements</div>
          ${caseModel.elements.map(element=>`<div class="tree-row"><span>─</span>${element.id} <span class="muted">${element.n1}→${element.n2}</span></div>`).join("")}
          <div class="tree-label">Capability</div>
          <div class="tree-row selected"><span>✓</span><span class="tree-row-copy">Structure<small>${capabilityLabel(capability)}</small></span></div>
        </aside>
        <section class="viewport">${structure.viewport}<div class="hud">2D frame FEM · Euler–Bernoulli</div></section>
        <aside class="inspector">${structure.inspector}</aside>
        <section class="results"><div class="results-summary">${structure.summary}</div>${structure.results}</section>
        <footer class="statusbar"><span>Units SI</span><span>2D frame</span><span>${capabilityLabel(capability)}</span><span class="top-spacer"></span><span>Linear static</span></footer>
      </main><div class="preview-badge">Structure · tested frame FEM</div>`;
      bindNav();
      bindEngineeringModelSelector();
      bindEngineeringCaseExport(engineeringCaseReport({
        modelConfig:model,
        mode:"Structure",
        capability,
        method:{name:"2D Euler-Bernoulli frame FEM",caseModel:caseModel.name,scope:"linear static"},
        inputs:{loadFy:structureLoadKn*1000,nodes:caseModel.nodes,elements:caseModel.elements,supports:caseModel.supports},
        results:structure.result,
        assumptions:["2D frame idealisation","linear elastic response","small displacements"]
      }));
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
      const capability=analysisCapability(model,"resistance");
      if(!capability.enabled){
        const documentModel=await getEngineeringDocument();
        if(renderId!==engineeringRenderId)return;
        app.innerHTML=top("engineering")+blockedEngineeringWorkspaceHTML(documentModel,"Resistance",capability);
        bindBlockedEngineeringWorkspace(documentModel,renderId,"Resistance",capability);
        return;
      }

      const fixture=await loadResistanceFixture();
      if(renderId!==engineeringRenderId)return;
      const resistance=resistancePanelHTML(fixture,{speedKnots:resistanceSpeedKn});
      app.innerHTML=top("engineering")+`<main class="workspace">
        <div class="workspace-bar"><strong>${fixture.name}</strong>${engineeringModelSelectHTML()}${engineeringExportButtonHTML()}<div class="mode-tabs">
          ${modes.map(mode=>`<button data-engineering-mode="${mode}" class="${engineeringMode===mode?"active":""}">${mode}</button>`).join("")}
        </div></div>
        <aside class="tree">
          <div class="tree-label">Method</div>
          <div class="tree-row selected"><span>≈</span>ITTC-1957 friction line</div>
          <div class="tree-label">Inputs</div>
          <div class="tree-row"><span>L</span>Length <span class="muted">${fixture.length} m</span></div>
          <div class="tree-row"><span>S</span>Wetted surface <span class="muted">${fixture.wettedSurface} m²</span></div>
          <div class="tree-label">Capability</div>
          <div class="tree-row selected"><span>✓</span><span class="tree-row-copy">Resistance<small>${capabilityLabel(capability)}</small></span></div>
        </aside>
        <section class="viewport">${resistance.viewport}<div class="hud">Resistance · friction baseline</div></section>
        <aside class="inspector">${resistance.inspector}</aside>
        <section class="results"><div class="results-summary">${resistance.summary}</div>${resistance.results}</section>
        <footer class="statusbar"><span>Units SI</span><span>ITTC-1957</span><span>${capabilityLabel(capability)}</span><span class="top-spacer"></span><span>Not total resistance</span></footer>
      </main><div class="preview-badge">Resistance · ITTC friction baseline</div>`;
      bindNav();
      bindEngineeringModelSelector();
      bindEngineeringCaseExport(engineeringCaseReport({
        modelConfig:model,
        mode:"Resistance",
        capability,
        method:{name:"ITTC-1957 friction line",scope:"frictional resistance only"},
        inputs:{
          speedKnots:resistance.speedKnots,
          length:fixture.length,
          wettedSurface:fixture.wettedSurface,
          density:fixture.density,
          kinematicViscosity:fixture.kinematicViscosity
        },
        results:resistance.result,
        assumptions:["smooth flat-plate friction correlation","no form, wave, appendage or air resistance"]
      }));
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
        getEngineeringDocument()
      ]);
      if(renderId!==engineeringRenderId)return;

      const capability=analysisCapability(model,"propulsion");
      const thrusters=documentModel?semanticComponents(documentModel,{role:"thruster"}).map(node=>node.component):[];
      const sourceThruster=thrusters.find(component=>component.id===selectedComponentId)||thrusters[0]||null;
      const sourceSemantic=sourceThruster?componentSemantic(sourceThruster):null;
      const sourceCase=sourceSemantic?.thruster||{};
      const hasForceModel=capability.enabled&&(!sourceThruster||(
        sourceCase.forceModel!=="unset"
        &&sourceCase.thrust!==null&&sourceCase.thrust!==undefined&&sourceCase.thrust!==""
        &&Number.isFinite(Number(sourceCase.thrust))
        &&Number(sourceCase.diameter)>0
      ));

      if(!capability.enabled||sourceThruster&&!hasForceModel){
        const ratedPower=Number(sourceCase.ratedPowerKw);
        app.innerHTML=top("engineering")+`<main class="workspace">
          <div class="workspace-bar"><strong>${documentModel.name}</strong>${engineeringModelSelectHTML()}${engineeringExportButtonHTML()}<div class="mode-tabs">
            ${modes.map(mode=>`<button data-engineering-mode="${mode}" class="${engineeringMode===mode?"active":""}">${mode}</button>`).join("")}
          </div></div>
          <aside class="tree">
            <div class="tree-label">Sourced thruster components</div>
            ${thrusters.map(component=>{const semantic=componentSemantic(component);return `<div class="tree-row ${component.id===sourceThruster.id?"selected":""}" data-propulsion-component="${component.id}"><span>◎</span><span class="tree-row-copy">${component.name}<small>${semantic.subtype||semantic.role}</small></span></div>`}).join("")}
          </aside>
          <section class="viewport"><div id="engineering-scene" class="engineering-scene"></div><div class="hud">Propulsion · sourced geometry</div></section>
          <aside class="inspector">
            <h3>${sourceThruster?.name||"Propulsion capability"}</h3>
            <div class="readout"><span>Type</span><strong>${sourceSemantic?.subtype||"thruster"}</strong></div>
            <div class="readout"><span>Rated power</span><strong>${Number.isFinite(ratedPower)?ratedPower+" kW":"—"}</strong></div>
            <div class="readout"><span>Source node</span><strong>${sourceThruster.sourceObjectId||"—"}</strong></div>
            <div class="readout"><span>Capability</span><strong class="status-warn">${capabilityLabel(capability)}</strong></div>
            <div class="readout"><span>Force model</span><strong class="status-warn">${hasForceModel?"Configured":"Not configured"}</strong></div>
            <p class="muted hydro-note">${capability.reason||"Geometry and component identity are sourced. Thrust, actuator diameter and local thrust axis are intentionally not inferred from rated power or appearance."}</p>
            ${capability.requirements?.length?`<div class="engineering-requirements"><strong>Required before analysis</strong><ul>${capability.requirements.map(item=>`<li>${item}</li>`).join("")}</ul></div>`:""}
          </aside>
          <section class="results"><div class="results-summary"><strong>Propulsion analysis blocked</strong><div class="readout"><span>Reason</span><strong>Missing force model</strong></div></div>
            <div class="engineering-empty-analysis"><strong>No fabricated thrust result</strong><p>Add sourced or explicitly assumed thrust/diameter/axis metadata before actuator-disk and rigid-body force/moment analysis is enabled.</p></div>
          </section>
          <footer class="statusbar"><span>Units SI</span><span>${capabilityLabel(capability)}</span><span>No thrust assumption</span><span class="top-spacer"></span><span>ModelDocument</span></footer>
        </main><div class="preview-badge">Propulsion · sourced identity only</div>`;

        bindNav();
        bindEngineeringModelSelector();
        bindEngineeringCaseExport(engineeringCaseReport({
          modelConfig:model,
          modelDocument:documentModel,
          mode:"Propulsion",
          capability,
          method:{name:"capability gate",scope:"no thrust calculation executed"},
          inputs:{
            componentId:sourceThruster?.id||null,
            ratedPowerKw:Number.isFinite(ratedPower)?ratedPower:null
          },
          results:{status:"blocked",forceModelConfigured:hasForceModel},
          warnings:[capability.reason||"Thruster force model is not configured."]
        }));
        app.querySelectorAll("[data-engineering-mode]").forEach(button=>button.onclick=()=>go(engineeringModeRoute(button.dataset.engineeringMode)));
        app.querySelectorAll("[data-propulsion-component]").forEach(row=>row.onclick=()=>{
          selectedComponentId=row.dataset.propulsionComponent;
          propulsionInitialized=false;
          engineeringPage();
        });
        mountModelScene(app.querySelector("#engineering-scene"),documentModel,{
          showSidebar:false,selectedComponentId:sourceThruster.id,
          onSelect:component=>{
            if(componentSemantic(component||{}).role==="thruster"){
              selectedComponentId=component.id;
              propulsionInitialized=false;
              engineeringPage();
            }
          }
        }).then(handle=>{
          if(renderId!==engineeringRenderId){handle.cleanup();return}
          engineeringCleanup=handle.cleanup;
        }).catch(error=>{
          const target=app.querySelector("#engineering-scene");
          if(target)target.innerHTML=`<pre class="code-view">3D render error: ${String(error?.message||error)}</pre>`;
        });
        return;
      }

      if(!propulsionInitialized){
        propulsionThrustKn=Number(sourceCase.thrust??fixture.thrust)/1000;
        propulsionInflow=Number(sourceCase.inflowSpeed??fixture.inflowSpeed);
        propulsionDiameter=Number(sourceCase.diameter??fixture.diameter);
        propulsionInitialized=true;
      }

      const systemThrusters=documentModel?thrustersFromModelDocument(documentModel):[];
      const selectedSystemThrusters=systemThrusters.map(item=>item.id===sourceThruster?.id?{
        ...item,
        thrust:propulsionThrustKn*1000,
        inflowSpeed:propulsionInflow,
        diameter:propulsionDiameter
      }:item);
      const system=selectedSystemThrusters.length
        ?analyzeThrusterSystem(selectedSystemThrusters,{reference:[0,0,0]})
        :null;

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
          diameter:propulsionDiameter,
          system
        }
      );

      app.innerHTML=top("engineering")+`<main class="workspace">
        <div class="workspace-bar"><strong>${sourceThruster?.name||fixture.name}</strong>${engineeringModelSelectHTML()}${engineeringExportButtonHTML()}<div class="mode-tabs">
          ${modes.map(mode=>`<button data-engineering-mode="${mode}" class="${engineeringMode===mode?"active":""}">${mode}</button>`).join("")}
        </div></div>
        <aside class="tree">
          <div class="tree-label">Thruster components</div>
          ${thrusters.length?thrusters.map(component=>{const semantic=componentSemantic(component);return `<div class="tree-row ${component.id===sourceThruster?.id?"selected":""}" data-propulsion-component="${component.id}"><span>◎</span><span class="tree-row-copy">${component.name}<small>${semantic.subtype||semantic.role}</small></span></div>`}).join(""):'<div class="tree-row"><span>○</span>No tagged thruster</div>'}
          <div class="tree-label">Method</div>
          <div class="tree-row selected"><span>≈</span>Ideal actuator disk</div>
          <div class="tree-row"><span>Σ</span>Rigid-body force/moment <span class="muted">${system?.thrusters.length||0} thruster(s)</span></div>
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
      bindEngineeringModelSelector();
      bindEngineeringCaseExport(engineeringCaseReport({
        modelConfig:model,
        modelDocument:documentModel,
        mode:"Propulsion",
        capability,
        method:{
          name:"ideal actuator disk + rigid-body force/moment balance",
          scope:"momentum-theory estimate"
        },
        inputs:{
          componentId:sourceThruster?.id||null,
          thrustN:propulsionThrustKn*1000,
          inflowSpeed:propulsionInflow,
          diameter:propulsionDiameter,
          density:Number(fixture.density)||1025
        },
        results:{actuatorDisk:propulsion.result,system},
        assumptions:[
          "ideal actuator disk",
          "uniform inflow",
          "no cavitation, swirl, blade geometry or hull interaction"
        ]
      }));
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
      <div class="workspace-bar"><strong>${model.name}</strong>${engineeringModelSelectHTML()}<div class="mode-tabs">
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
    bindEngineeringModelSelector();
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
  const semanticInfo=semanticSummary(documentModel);
  const selected=uiComponents.find(c=>c.id===selectedComponentId)||uiComponents.find(c=>c.geometry)||uiComponents[0];
  const selectedSemantic=selected?componentSemantic(selected):null;
  const selectedDiagnostics=diagnostics.components.find(item=>item.componentId===selected?.id)||null;
  if(selected&&!selectedComponentId)selectedComponentId=selected.id;

  let hydro=null;
  let engineeringReport=null;
  if(engineeringMode==="Hydro"){
    const config=model.hydro||{};
    const capability=analysisCapability(model,"hydro");
    if(!capability.enabled||config.enabled===false){
      const reason=capability.reason||config.reason||"Hydro analysis is not enabled for this model.";
      const requirements=capability.requirements?.length
        ?`<div class="engineering-requirements"><strong>Required before analysis</strong><ul>${capability.requirements.map(item=>`<li>${item}</li>`).join("")}</ul></div>`
        :"";
      engineeringReport=engineeringCaseReport({
        modelConfig:model,
        modelDocument:documentModel,
        mode:"Hydro",
        capability,
        method:{name:"capability gate",scope:"no hydrostatic solve executed"},
        inputs:{draft:Number(config.defaultDraft)||0,density:Number(config.density)||1025},
        results:{status:"blocked"},
        warnings:[reason]
      });
      hydro={
        inspector:`<h3>Hydro validation required</h3>
          <div class="geometry-warning"><strong>${capabilityLabel(capability)}</strong><span>${reason}</span></div>
          <div class="readout"><span>Model</span><strong>${documentModel.name}</strong></div>
          <div class="readout"><span>Geometry</span><strong>Sourced visual assembly</strong></div>
          <p class="muted hydro-note">The 3D model remains available for inspection. Hydrostatic results stay disabled until the capability requirements are met.</p>
          ${requirements}`,
        summary:`<strong>Hydro not yet validated</strong><div class="readout"><span>Status</span><strong class="status-warn">${capabilityLabel(capability)}</strong></div>`,
        results:`<div class="engineering-empty-analysis"><strong>No hydrostatic result shown</strong><p>${reason}</p></div>`,
        draft:Number(config.defaultDraft)||0,
        density:Number(config.density)||1025,
        waterlinePercent:0
      };
    }else{
    const minWaterline=Number(config.minDraft??0);
    const maxWaterline=Number(config.maxDraft??10);
    const samples=Math.max(3,Number(config.curveSamples??9));
    const density=Number(config.density)||1025;
    try{
      const analysisPromise=analyzeHydroAsync(documentModel,hydroDraft);
      const curvePromise=hydroCurveCache.model===documentModel&&hydroCurveCache.data
        ? Promise.resolve(hydroCurveCache.data)
        : hydroCurveAsync(documentModel,{minWaterline,maxWaterline,samples});
      let solvePromise=Promise.resolve(null);
      let gzPromise=Promise.resolve({value:null,error:null});
      let attitudePromise=Promise.resolve({value:null,error:null});

      const target=Number(hydroTargetTonnes);
      const targetVolume=Number.isFinite(target)&&target>0?target*1000/density:null;
      const hasKg=hydroKg!==""&&Number.isFinite(Number(hydroKg));
      const centerOfGravity=[
        Number.isFinite(Number(hydroLcg))?Number(hydroLcg):0,
        Number.isFinite(Number(hydroTcg))?Number(hydroTcg):0,
        hasKg?Number(hydroKg):0
      ];

      if(hydroGzRequested&&hasKg){
        gzPromise=(async()=>{
          try{
            const upright=targetVolume??(await analysisPromise).volume;
            const value=await gzCurveAsync(documentModel,{
              targetVolume:upright,
              kg:Number(hydroKg),
              density,
              minHeel:-30,
              maxHeel:30,
              step:5,
              tolerance:1e-9,
              maxIterations:80
            });
            return {value,error:null};
          }catch(error){
            return {value:null,error:String(error?.message||error)};
          }
        })();
      }

      if(hydroAttitudeAction&&hasKg){
        attitudePromise=(async()=>{
          try{
            const referenceVolume=targetVolume??(await analysisPromise).volume;
            const common={
              targetVolume:referenceVolume,
              centerOfGravity,
              density,
              tolerance:1e-8,
              maxIterations:80
            };
            let value;
            if(hydroAttitudeAction==="heelEq"){
              value=await solveAttitudeEquilibriumAsync(documentModel,{
                ...common,axis:"heel",minAngle:-30,maxAngle:30,
                trimDeg:Number(hydroTrim)||0,
                angleTolerance:1e-5,leverTolerance:1e-7
              });
            }else if(hydroAttitudeAction==="trimEq"){
              value=await solveAttitudeEquilibriumAsync(documentModel,{
                ...common,axis:"trim",minAngle:-15,maxAngle:15,
                heelDeg:Number(hydroHeel)||0,
                angleTolerance:1e-5,leverTolerance:1e-7
              });
            }else{
              value=await attitudeHydroAsync(documentModel,{
                ...common,
                heelDeg:Number(hydroHeel)||0,
                trimDeg:Number(hydroTrim)||0
              });
            }
            return {value,error:null};
          }catch(error){
            return {value:null,error:String(error?.message||error)};
          }
        })();
      }

      if(targetVolume){
        solvePromise=solveHydroDraftAsync(documentModel,targetVolume,{
          minWaterline,maxWaterline,tolerance:1e-7,maxIterations:60
        }).then(value=>({value,error:null})).catch(error=>({value:null,error:String(error?.message||error)}));
      }

      const [result,curve,solvedState,gzState,attitudeState]=await Promise.all([
        analysisPromise,curvePromise,solvePromise,gzPromise,attitudePromise
      ]);
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
        kg:hydroKg,
        lcg:hydroLcg,
        tcg:hydroTcg,
        heel:hydroHeel,
        trim:hydroTrim,
        gz:gzState?.value||null,
        gzError:gzState?.error||null,
        attitude:attitudeState?.value||null,
        attitudeError:attitudeState?.error||null,
        attitudeAction:hydroAttitudeAction,
        geometryWarnings,
        config
      });
      engineeringReport=engineeringCaseReport({
        modelConfig:model,
        modelDocument:documentModel,
        mode:"Hydro",
        capability,
        method:{
          name:"clipped-triangle hydrostatics",
          scope:"world-space ModelDocument geometry with constant-displacement stability"
        },
        inputs:{
          draft:hydroDraft,
          targetDisplacementTonnes:hydroTargetTonnes===""?null:Number(hydroTargetTonnes),
          density,
          centerOfGravity:hasKg?centerOfGravity:null,
          heelDeg:Number(hydroHeel)||0,
          trimDeg:Number(hydroTrim)||0
        },
        results:{
          hydro:result,
          particulars:hydro.particulars||null,
          hydrostaticCurve:hydro.curveRows||[],
          solvedDraft:solvedState?.value||null,
          gz:gzState?.value||null,
          gzMetrics:hydro.gzSummary||null,
          attitude:attitudeState?.value||null
        },
        assumptions:["rigid body","constant water density","hydro geometry selected by semantic metadata"],
        warnings:geometryWarnings.map(item=>`${item.name||item.componentId}: geometry is not watertight`)
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
  }

  if(!engineeringReport){
    const capability=analysisCapability(model,"model");
    engineeringReport=engineeringCaseReport({
      modelConfig:model,
      modelDocument:documentModel,
      mode:engineeringMode,
      capability,
      method:{name:"semantic ModelDocument inspection",scope:"geometry and metadata inspection only"},
      inputs:{selectedComponentId:selected?.id||null},
      results:{
        components:semanticInfo.components,
        geometryComponents:semanticInfo.geometryComponents,
        roles:semanticInfo.roles,
        triangles:diagnostics.triangles,
        watertight:diagnostics.watertight,
        bounds:diagnostics.bounds
      },
      warnings:diagnostics.watertight?[]:["Model topology requires review before geometry-dependent engineering analysis."]
    });
  }

  const semanticRoleText=Object.entries(semanticInfo.roles)
    .map(([role,count])=>`${role} ${count}`).join(" · ")||"unclassified";
  const inspector=hydro?hydro.inspector:`
    <h3>Properties</h3>
    <div class="readout"><span>Component</span><strong id="prop-component">${selected?.name||"—"}</strong></div>
    <div class="readout"><span>Semantic role</span><strong id="prop-role">${selectedSemantic?.subtype||selectedSemantic?.role||selected?.type||"—"}</strong></div>
    <div class="readout"><span>Subsystem</span><strong id="prop-subsystem">${selectedSemantic?.subsystem||"—"}</strong></div>
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
    <div class="readout"><span>Components</span><strong>${semanticInfo.components}</strong></div>
    <div class="readout"><span>Geometry nodes</span><strong>${semanticInfo.geometryComponents}</strong></div>
    <div class="readout"><span>Roles</span><strong class="semantic-summary">${semanticRoleText}</strong></div>
    <div class="readout"><span>Triangles</span><strong>${diagnostics.triangles}</strong></div>
    <div class="readout"><span>Topology</span><strong class="${diagnostics.watertight?"status-ok":"status-warn"}">${diagnostics.watertight?"Watertight":"Check geometry"}</strong></div>
    <div class="readout"><span>Size</span><strong>${diagnostics.bounds.size.map(v=>v.toFixed(3)).join(" × ")} m</strong></div>
    <div class="readout"><span>Format</span><strong>${documentModel.format}</strong></div>`;
  const resultContent=hydro?hydro.results:`<div class="chart"><svg viewBox="0 0 700 170"><path d="M20 135 C90 132 122 80 190 92 S315 60 372 82 S502 35 675 46" fill="none" stroke="var(--accent)" stroke-width="3"/><path d="M20 145H680M20 20V145" stroke="var(--line-strong)"/></svg></div>`;
  const waterline=hydro?`<div class="workspace-waterline" style="bottom:${hydro.waterlinePercent}%"><span>WL ${hydro.draft.toFixed(2)} m</span></div>`:"";

  app.innerHTML=top("engineering")+`<main class="workspace">
    <div class="workspace-bar"><strong>${documentModel.name}</strong>${engineeringModelSelectHTML()}${engineeringExportButtonHTML()}<div class="mode-tabs">
      ${modes.map(mode=>`<button data-engineering-mode="${mode}" class="${engineeringMode===mode?"active":""}">${mode}</button>`).join("")}
    </div></div>
    <aside class="tree"><input id="component-filter" placeholder="Filter name, role or subsystem"><div class="tree-label">Semantic assembly</div>
      <div id="component-tree">${uiComponents.map(component=>{
        const semantic=componentSemantic(component);
        const semanticLabel=semantic.subtype||semantic.role||component.type;
        const searchable=[component.name,semantic.role,semantic.subtype,semantic.subsystem,...semantic.tags].filter(Boolean).join(" ").toLowerCase();
        return `<div class="tree-row ${component.id===selectedComponentId?"selected":""}" data-component="${component.id}" data-component-name="${searchable}" style="padding-left:${8+depthFor(component,uiComponents)*16}px"><span class="tree-role-icon">${engineeringRoleIcon(component)}</span><span class="tree-row-copy">${component.name}<small>${semanticLabel}${semantic.subsystem?` · ${semantic.subsystem}`:""}</small></span></div>`;
      }).join("")}</div>
    </aside>
    <section class="viewport"><div id="engineering-scene" class="engineering-scene"></div><div class="hud">${engineeringMode==="Hydro"?"Hydro · semantic hull selection":"Selected: "+(selected?.name||"—")}</div>${waterline}</section>
    <aside class="inspector">${inspector}</aside>
    <section class="results"><div class="results-summary">${summary}</div>${resultContent}</section>
    <footer class="statusbar"><span>Units SI</span><span>Source ${documentModel.unit}</span><span>Mode ${engineeringMode}</span><span>Semantic ModelDocument</span><span class="top-spacer"></span><span>Ready</span></footer>
  </main><div class="preview-badge">${engineeringMode==="Hydro"?"Hydro · stability workspace":"Semantic ModelDocument"}</div>`;

  bindNav();
  bindEngineeringModelSelector();
  bindEngineeringCaseExport(engineeringReport);
  let sceneHandle=null;
  const updateSelection=component=>{
    if(!component)return;
    selectedComponentId=component.id;
    app.querySelectorAll("[data-component]").forEach(row=>row.classList.toggle("selected",row.dataset.component===component.id));
    const semantic=componentSemantic(component);
    const name=app.querySelector("#prop-component");
    const role=app.querySelector("#prop-role");
    const subsystem=app.querySelector("#prop-subsystem");
    const source=app.querySelector("#prop-source");
    if(name)name.textContent=component.name;
    if(role)role.textContent=semantic.subtype||semantic.role||component.type;
    if(subsystem)subsystem.textContent=semantic.subsystem||"—";
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

  const readHydroCaseInputs=()=>{
    hydroTargetTonnes=app.querySelector("#hydro-target")?.value??hydroTargetTonnes;
    hydroKg=app.querySelector("#hydro-kg")?.value??hydroKg;
    hydroLcg=app.querySelector("#hydro-lcg")?.value??hydroLcg;
    hydroTcg=app.querySelector("#hydro-tcg")?.value??hydroTcg;
    hydroHeel=Number(app.querySelector("#hydro-heel")?.value??hydroHeel)||0;
    hydroTrim=Number(app.querySelector("#hydro-trim")?.value??hydroTrim)||0;
  };

  app.querySelector("#hydro-draft")?.addEventListener("change",event=>{
    hydroDraft=Number(event.target.value)||0;
    hydroAttitudeAction="";
    engineeringPage();
  });
  for(const selector of ["#hydro-kg","#hydro-lcg","#hydro-tcg","#hydro-heel","#hydro-trim"]){
    app.querySelector(selector)?.addEventListener("change",()=>{
      readHydroCaseInputs();
      hydroGzRequested=false;
      hydroAttitudeAction="";
      engineeringPage();
    });
  }
  app.querySelector("#hydro-solve")?.addEventListener("click",()=>{
    readHydroCaseInputs();
    hydroGzRequested=false;
    hydroAttitudeAction="";
    engineeringPage();
  });
  app.querySelector("#hydro-gz")?.addEventListener("click",()=>{
    readHydroCaseInputs();
    hydroGzRequested=true;
    engineeringPage();
  });
  app.querySelector("#hydro-attitude")?.addEventListener("click",()=>{
    readHydroCaseInputs();
    hydroAttitudeAction="analyze";
    engineeringPage();
  });
  app.querySelector("#hydro-equilibrium-heel")?.addEventListener("click",()=>{
    readHydroCaseInputs();
    hydroAttitudeAction="heelEq";
    engineeringPage();
  });
  app.querySelector("#hydro-equilibrium-trim")?.addEventListener("click",()=>{
    readHydroCaseInputs();
    hydroAttitudeAction="trimEq";
    engineeringPage();
  });
  app.querySelector("#hydro-target")?.addEventListener("keydown",event=>{
    if(event.key==="Enter"){
      readHydroCaseInputs();
      hydroAttitudeAction="";
      engineeringPage();
    }
  });
  app.querySelector("#hydro-export-table")?.addEventListener("click",()=>{
    if(!hydro?.curveRows?.length)return;
    downloadTextFile(hydrostaticRowsCSV(hydro.curveRows),"hydrostatic-table.csv");
  });
  app.querySelector("#hydro-export-gz")?.addEventListener("click",()=>{
    const gzCurve=engineeringReport?.analysis?.results?.gz||[];
    if(gzCurve.length)downloadTextFile(gzCurveCSV(gzCurve),"gz-curve.csv");
  });
}
function notFoundPage(message){app.innerHTML=top("")+'<main class="study"><section class="study-main"><div class="course-header"><h1>Not found</h1><p>'+message+'</p><button class="btn" data-go="/courses">Back to Courses</button></div></section></main>';bindNav()}
async function viewerPage(info){const course=getCourse(info.semester,info.code),resource=course?.resources[info.resourceIndex];if(!course||!resource)return notFoundPage("Viewer resource was not found.");app.innerHTML=top("courses");bindNav();const holder=document.createElement("div");app.append(holder);await mountViewer(holder,{...resource,semester:info.semester,courseCode:course.code},()=>go(courseRoute(info.semester,course.code)))}

async function render(){app.__courseObserver?.disconnect();app.__courseObserver=null;const path=route();if(path!=="/tools/crystal"){crystalCleanup?.();crystalCleanup=null;}if(path!=="/tools/chemistry-editor"){chemEditorCleanup?.();chemEditorCleanup=null;}if(path!=="/tools/model-inspector"){modelInspectorCleanup?.();modelInspectorCleanup=null;}if(path!=="/tools/coolprop"){coolPropCleanup?.();coolPropCleanup=null;}if(!["/diverse/diving","/diverse/dive-map"].includes(path)){diveMapMountId++;diveMapCleanup?.();diveMapCleanup=null;}const viewer=parseViewerRoute(path);if(path.startsWith("/projects/"))return projectPage(decodeURIComponent(path.split("/")[2]||""));if(viewer)return viewerPage(viewer);const course=parseCourseRoute(path);if(course)return coursePage(course.semester,course.code);const sem=path.match(/^\/(?:courses|study)\/(\d+)$/i);if(sem)return coursesPage(Number(sem[1]));if(path==="/courses"||path==="/study")return coursesPage();if(path==="/diverse")return diversePage();if(path==="/diverse/diving"||path==="/diverse/dive-map")return diveMapPage();if(path==="/tools")return toolsPage();if(path==="/tools/fluid")return fluidToolPage();if(path==="/tools/model-inspector")return modelInspectorPage();if(path==="/tools/chemistry-editor")return chemEditorPage();if(path==="/tools/coolprop")return coolPropToolPage();if(path==="/tools/periodic")return periodicToolPage();if(path==="/tools/crystal")return crystalToolPage();if(path==="/mobile-preview")return mobilePreviewPage();if(path==="/settings/theme-studio/manual")return themeStudioPage("manual");if(path==="/settings/theme-studio/image")return themeStudioPage("image");if(path==="/settings")return settingsPage();const engineering=path.match(/^\/engineering(?:\/(model|hydro|structure|resistance|propulsion))?$/i);if(engineering){const requested=engineering[1]||"model";engineeringMode=requested.charAt(0).toUpperCase()+requested.slice(1).toLowerCase();return engineeringPage()}return portfolioPage()}
window.addEventListener("keydown",event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){event.preventDefault();globalSearch.open()}});window.addEventListener("hashchange",render);render();
