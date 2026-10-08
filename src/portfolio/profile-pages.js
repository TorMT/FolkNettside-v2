const GH="https://github.com/TorMT/FolkNettside-v2";
const OLD="https://github.com/TorMT/FolkNettside";
const FALLBACK_LINKEDIN="https://www.linkedin.com/in/tor-t%C3%B8nnessen-b9589a210";
const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
function safeURL(value){
 try{const u=new URL(String(value));return u.protocol==="https:"?u.href:""}catch{return ""}
}
function links(cv={}){
 const linkedin=safeURL(cv.linkedin)||FALLBACK_LINKEDIN;
 return `<div class="hero-actions"><a class="btn primary" target="_blank" rel="noopener noreferrer" href="${GH}">V2 source on GitHub ↗</a><a class="btn" target="_blank" rel="noopener noreferrer" href="${esc(linkedin)}">LinkedIn ↗</a></div>`;
}
function entries(items=[]){
 return `<div class="cv-entries">${items.map(item=>`<section class="cv-entry">
 <div class="cv-entry-head"><h3>${esc(item.title)}</h3><span class="muted">${esc(item.period)}</span></div>
 ${item.organization?`<p class="cv-entry-org">${esc(item.organization)}</p>`:""}
 ${item.description?`<p>${esc(item.description)}</p>`:""}
 ${safeURL(item.url)?`<a href="${esc(safeURL(item.url))}" target="_blank" rel="noopener noreferrer">View project ↗</a>`:""}
 </section>`).join("")}</div>`;
}
export function renderCV(cv){
 const mail=String(cv.email||"").trim(),phone=String(cv.phone||"").trim();
 return `<main class="section cv-page"><div class="section-head"><div><span class="project-kicker">Curriculum vitae · maintained as data</span><h1>${esc(cv.name)}</h1><p>${esc(cv.tagline)}</p></div></div>
 <div class="cv-layout"><article class="brew-card panel-card cv-main">
 <h2>Profile</h2><p>${esc(cv.profile)}</p>
 <h2>Education</h2>${entries(cv.education||[])}
 <h2>Experience</h2>${entries(cv.experience||[])}
 <h2>Projects</h2>${entries(cv.projects||[])}
 ${Array.isArray(cv.updates)&&cv.updates.length?`<h2>Recent updates</h2>${entries(cv.updates)}`:""}
 </article>
 <aside class="brew-card panel-card cv-side"><h2>Technical skills</h2><div class="tags">${(cv.skills||[]).map(skill=>`<span class="tag">${esc(skill)}</span>`).join("")}</div>
 ${cv.certifications?.length?`<h2>Certifications</h2>${entries(cv.certifications)}`:""}
 <h2>Contact</h2><p>${esc(cv.location)}</p>
 ${mail?`<p><a href="mailto:${esc(mail)}">${esc(mail)}</a></p>`:""}
 ${phone?`<p><a href="tel:${esc(phone.replace(/[^+0-9]/g,""))}">${esc(phone)}</a></p>`:""}
 ${links(cv)}
 <p class="muted">Updated through the versioned <code>data/cv.json</code> file. LinkedIn posts can be added as reviewed entries with their original URL.</p>
 </aside></div></main>`;
}
export async function loadCV(fetcher=fetch){
 const response=await fetcher("./data/cv.json",{cache:"no-cache"});
 if(!response.ok)throw new Error("CV could not be loaded (HTTP "+response.status+")");
 const cv=await response.json();
 if(cv?.schemaVersion!==1||typeof cv.name!=="string"||!Array.isArray(cv.experience)||!Array.isArray(cv.projects))throw new Error("CV data has an unsupported schema");
 return cv;
}
export function portfolioInfoPageHTML(page,cv={}){
 if(page==="cv")return renderCV(cv);
 if(page==="about")return `<main class="section"><div class="section-head"><div><span class="project-kicker">About</span><h1>${esc(cv.name||"Tor Markus Tønnessen")}</h1><p>Marine technology student at NTNU</p></div></div><article class="brew-card panel-card"><h2>About me</h2><p>${esc(cv.profile||"Marine engineering student interested in practical design, CAD and engineering software.")}</p>${links(cv)}<p><a target="_blank" rel="noopener noreferrer" href="${OLD}">Older FolkNettside repository (legacy) ↗</a></p></article></main>`;
 if(page==="contact")return `<main class="section"><div class="section-head"><div><span class="project-kicker">Contact</span><h1>Get in touch</h1></div></div><article class="brew-card panel-card"><p>For professional enquiries, contact me at <a href="mailto:${esc(cv.email||"tormtonnessen@gmail.com")}">${esc(cv.email||"tormtonnessen@gmail.com")}</a> or through LinkedIn. For code issues and contributions, use GitHub.</p>${links(cv)}<p><a target="_blank" rel="noopener noreferrer" href="${GH}/issues">Open an issue ↗</a></p></article></main>`;
 return "";
}
