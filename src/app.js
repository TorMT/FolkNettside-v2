import {initSettings,getSettings,setSetting} from "./settings.js";
import {mountViewer} from "./viewer.js";
import {loadContent} from "./content.js";
import {renderResourceTree} from "./components/resource-tree.js";
import {hydroPanelHTML} from "./engineering/hydro-panel.js";
import {renderProjectCard,renderProjectDetail} from "./components/project-card.js";

initSettings();

const app=document.querySelector("#app");
const content=await loadContent();
const {site,semesters,model,components,navLabels,projects}=content;

let selectedComponentId=components.find(c=>c.type==="hull")?.id || components[0]?.id;
let engineeringMode="Model";
let hydroDraft=1.20;

const vessel='<svg viewBox="0 0 760 380"><path d="M120 236 L560 236 L642 265 L603 305 L184 306 L104 268 Z" fill="#bccbd2" stroke="#eff7fa" stroke-width="3"/><path d="M250 151 L486 151 L541 230 L196 230 Z" fill="#dbe7ec" stroke="#eff7fa" stroke-width="3"/><rect x="292" y="109" width="165" height="39" rx="4" fill="#dbe7ec"/><path d="M326 109V45" stroke="#eff7fa" stroke-width="4"/><g fill="#17384c"><rect x="276" y="168" width="35" height="17" rx="3"/><rect x="321" y="168" width="35" height="17" rx="3"/><rect x="366" y="168" width="35" height="17" rx="3"/><rect x="411" y="168" width="35" height="17" rx="3"/></g><path d="M160 273 Q370 325 615 274" fill="none" stroke="#6dc6eb" stroke-width="3"/></svg>';

const route=()=>location.hash.slice(1)||"/portfolio";
const go=path=>{location.hash=path};
function parseCourseRoute(path){const m=path.match(/^\/(?:courses|study)\/(\d+)\/([^/]+)$/i);return m?{semester:Number(m[1]),code:decodeURIComponent(m[2])}:null}
function parseViewerRoute(path){const m=path.match(/^\/viewer\/(\d+)\/([^/]+)\/(\d+)$/i);return m?{semester:Number(m[1]),code:decodeURIComponent(m[2]),resourceIndex:Number(m[3])}:null}
function getSemester(id){return semesters.find(s=>Number(s.id)===Number(id))}
function getCourse(semesterId,code){return getSemester(semesterId)?.courses.find(c=>c.code.toLowerCase()===String(code).toLowerCase())}
function courseRoute(semester,code){return `/courses/${semester}/${encodeURIComponent(code)}`}
function viewerRoute(semester,code,index){return `/viewer/${semester}/${encodeURIComponent(code)}/${index}`}

function top(active){return '<header class="topbar"><div class="brand" id="home"><span class="brand-mark"></span>FolkNettside</div><nav class="nav"><button data-go="/portfolio" class="'+(active==="portfolio"?"active":"")+'">Projects</button><button data-go="/engineering" class="'+(active==="engineering"?"active":"")+'">Engineering</button><button data-go="/portfolio">About</button><button data-go="/portfolio">CV</button><button data-go="/portfolio">Contact</button></nav><span class="top-spacer"></span><nav class="nav"><button data-go="/courses" class="'+(active==="courses"?"active":"")+'">'+navLabels.courses+'</button></nav><div class="top-actions"><button class="icon-btn" aria-label="Search">⌕</button><button class="icon-btn" data-go="/settings" aria-label="Settings">⚙</button></div></header>'}
function bindNav(){app.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));app.querySelector("#home")?.addEventListener("click",()=>go("/portfolio"))}

function portfolioPage(){
  document.documentElement.dataset.lens="portfolio";
  app.innerHTML=top("portfolio")+
    '<main><section class="hero"><div><h1>Engineering for real-world challenges</h1><p>Marine technology, CAD, analysis, practical fabrication and repair projects — presented without the course archive clutter.</p><div class="hero-actions"><button class="btn primary" data-go="/engineering">Explore engineering</button><button class="btn dark" data-go="/courses">Open Courses</button></div></div><div class="vessel-card">'+vessel+'<div class="waterline"></div></div></section>'+
    '<section class="section"><div class="section-head"><div><h2>Selected projects</h2><p class="muted">Design, analysis, software and hands-on engineering work.</p></div></div><div class="project-list">'+
    projects.map(renderProjectCard).join("")+
    '</div></section></main><div class="preview-badge">v2 preview · separate repo</div>';
  bindNav();
  app.querySelectorAll("[data-project]").forEach(card=>card.onclick=()=>go("/projects/"+encodeURIComponent(card.dataset.project)));
}
function notFoundPage(message){app.innerHTML=top("")+'<main class="study"><section class="study-main"><div class="course-header"><h1>Not found</h1><p>'+message+'</p><button class="btn" data-go="/courses">Back to Courses</button></div></section></main>';bindNav()}
async function viewerPage(info){const course=getCourse(info.semester,info.code),resource=course?.resources[info.resourceIndex];if(!course||!resource)return notFoundPage("Viewer resource was not found.");app.innerHTML=top("courses");bindNav();const holder=document.createElement("div");app.append(holder);await mountViewer(holder,{...resource,semester:info.semester,courseCode:course.code},()=>go(courseRoute(info.semester,course.code)))}

async function render(){const path=route(),viewer=parseViewerRoute(path);if(path.startsWith("/projects/"))return projectPage(decodeURIComponent(path.split("/")[2]||""));if(viewer)return viewerPage(viewer);const course=parseCourseRoute(path);if(course)return coursePage(course.semester,course.code);const sem=path.match(/^\/(?:courses|study)\/(\d+)$/i);if(sem)return coursesPage(Number(sem[1]));if(path==="/courses"||path==="/study")return coursesPage();if(path==="/settings")return settingsPage();if(path==="/engineering")return engineeringPage();return portfolioPage()}
window.addEventListener("hashchange",render);render();
