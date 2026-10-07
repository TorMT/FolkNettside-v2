const SECTIONS=[
  ["appearance","Appearance"],
  ["connections","Account & connections"],
  ["courses","Courses"],
  ["engineering","Engineering"],
  ["privacy","Privacy & data"],
  ["advanced","Advanced"]
];

const ACCENTS={
  magenta:"#b3157a",
  teal:"#0b6e72",
  blue:"#1f57c9",
  amber:"#8f5a00",
  graphite:"#394d5b"
};

function esc(value){
  return String(value??"").replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
}

function segment(key,values,current){
  return `<div class="segment">${values.map(value=>`<button data-setting="${key}" data-value="${value}" class="${current===value?"active":""}">${esc(value)}</button>`).join("")}</div>`;
}

function settingRow(title,description,control){
  return `<div class="setting-row"><div><strong>${title}</strong><small>${description}</small></div><div>${control}</div></div>`;
}

function appearanceHTML(settings){
  return `
    <h1>Appearance</h1>
    <p class="muted">One global appearance state. Viewers, courses and Engineering inherit it; analysis colours remain independent.</p>
    <div class="settings-card">
      ${settingRow("Mode","Follow system, or force light/dark.",segment("mode",["system","light","dark"],settings.mode))}
      ${settingRow("Accent","Shared interface accent.",`<div class="swatches">${Object.entries(ACCENTS).map(([key,color])=>`<button class="swatch ${settings.accent===key?"active":""}" data-setting="accent" data-value="${key}" style="background:${color}" title="${key}" aria-label="${key}"></button>`).join("")}</div>`)}
      ${settingRow("Density","Comfortable is the default; compact reduces workspace spacing.",segment("density",["comfortable","compact"],settings.density))}
      ${settingRow("Motion","Respect system preference or reduce non-essential motion.",segment("motion",["system","reduced"],settings.motion))}
      ${settingRow("Contrast","Standard theme contrast or stronger UI borders/text.",segment("contrast",["standard","high"],settings.contrast))}
    </div>
    <div class="settings-card">
      ${settingRow("Theme Studio","Manual authoring and Image → Theme live under Settings.",'<div class="settings-shortcuts"><button class="btn" data-go="/settings/theme-studio/manual">Manual</button><button class="btn" data-go="/settings/theme-studio/image">Image → theme</button></div>')}
    </div>`;
}

function connectionsHTML(){
  return `
    <h1>Account & connections</h1>
    <p class="muted">The public site and local engineering/study tools do not require authentication.</p>
    <div class="settings-card">
      <div class="setting-row"><div><strong>Google / Drive</strong><small>Optional future cloud-file workflow. No connection is required for course resources.</small></div><span class="settings-status planned">Not configured</span></div>
      <div class="setting-row"><div><strong>Autodesk / APS</strong><small>Optional future native F3D/F3Z conversion path. Embedded 3MF/STL F3Z remains local.</small></div><span class="settings-status planned">Not configured</span></div>
    </div>
    <div class="settings-note"><strong>Local-first rule</strong><span>Features remain usable without an account whenever the underlying format can be handled locally.</span></div>`;
}

function coursesHTML(stats){
  return `
    <h1>Courses</h1>
    <p class="muted">Course navigation is generated from one manifest, not hand-maintained HTML.</p>
    <div class="settings-metrics">
      <div><strong>${Number(stats.courses)||0}</strong><span>courses</span></div>
      <div><strong>${Number(stats.resources)||0}</strong><span>resources</span></div>
      <div><strong>${Number(stats.semesters)||0}</strong><span>semesters</span></div>
    </div>
    <div class="settings-card">
      <div class="setting-row"><div><strong>Manifest freshness</strong><small>CI rebuilds and checks the manifest on every deploy.</small></div><span class="settings-status ready">CI gated</span></div>
      <div class="setting-row"><div><strong>Large resources</strong><small>Indexed from filesystem metadata; ordinary course files are not read during indexing.</small></div><span class="settings-status ready">Metadata only</span></div>
    </div>`;
}

function engineeringHTML(stats){
  return `
    <h1>Engineering</h1>
    <p class="muted">Analysis is capability-gated per model. Missing validation or inputs block numerical output rather than silently falling back to fixture assumptions.</p>
    <div class="settings-metrics">
      <div><strong>${Number(stats.models)||0}</strong><span>model configs</span></div>
      <div><strong>SI</strong><span>analysis units</span></div>
      <div><strong>JSON</strong><span>case export</span></div>
    </div>
    <div class="settings-card">
      <div class="setting-row"><div><strong>Provenance</strong><small>Engineering case exports retain model source, capability status, method, inputs, results and assumptions.</small></div><span class="settings-status ready">Enabled</span></div>
      <div class="setting-row"><div><strong>Unvalidated geometry</strong><small>Hydro/Structure/Resistance/Propulsion stay blocked until their declared requirements are met.</small></div><span class="settings-status ready">Fail closed</span></div>
    </div>`;
}

function privacyHTML(){
  return `
    <h1>Privacy & data</h1>
    <p class="muted">Study progress and UI preferences are stored locally in this browser. No course login is required.</p>
    <div class="settings-card">
      <div class="setting-row"><div><strong>Study progress</strong><small>Quiz attempts and video resume/watched state.</small></div><button class="btn" id="settings-clear-study-progress">Clear progress</button></div>
      <div class="setting-row"><div><strong>Appearance preferences</strong><small>Stored locally so the interface remains consistent between visits.</small></div><span class="settings-status ready">Local</span></div>
    </div>
    <div class="settings-feedback" id="settings-feedback" aria-live="polite"></div>`;
}

function advancedHTML(){
  return `
    <h1>Advanced</h1>
    <p class="muted">Developer-facing controls and architectural status, kept separate from ordinary study workflows.</p>
    <div class="settings-card">
      ${settingRow("Theme Studio","Generate theme CSS/registry/JSON while preserving the single Settings-owned runtime.",'<div class="settings-shortcuts"><button class="btn" data-go="/settings/theme-studio/manual">Open Theme Studio</button></div>')}
      <div class="setting-row"><div><strong>Viewer architecture</strong><small>ViewerShell adapters expose only supported actions; browser matrix gates migrated file types.</small></div><span class="settings-status ready">Verified</span></div>
      <div class="setting-row"><div><strong>Legacy policy</strong><small>Legacy is a read-only reference. New implementation work belongs in v2.</small></div><span class="settings-status ready">Read only</span></div>
    </div>`;
}

export function settingsPageHTML({settings,section="appearance",stats={}}={}){
  const active=SECTIONS.some(([id])=>id===section)?section:"appearance";
  const bodies={
    appearance:()=>appearanceHTML(settings||{}),
    connections:connectionsHTML,
    courses:()=>coursesHTML(stats),
    engineering:()=>engineeringHTML(stats),
    privacy:privacyHTML,
    advanced:advancedHTML
  };
  return `<main class="settings">
    <aside class="side settings-side">
      <div class="side-title">Settings</div>
      ${SECTIONS.map(([id,label])=>`<button data-settings-section="${id}" class="${id===active?"active":""}">${label}</button>`).join("")}
    </aside>
    <section class="settings-main" data-settings-panel="${active}">${bodies[active]()}</section>
  </main><div class="preview-badge">Public by default · auth optional</div>`;
}

export function clearLocalStudyProgress(storage=globalThis.localStorage){
  const prefixes=["folk-v2-video:","folknet:quiz:"];
  let removed=0;
  try{
    const keys=[];
    for(let i=0;i<(storage?.length||0);i++){
      const key=storage.key(i);
      if(key&&prefixes.some(prefix=>key.startsWith(prefix)))keys.push(key);
    }
    for(const key of keys){storage.removeItem(key);removed++}
  }catch{}
  return removed;
}

export const SETTINGS_SECTIONS=SECTIONS.map(([id])=>id);
