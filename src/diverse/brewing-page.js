import {mountBrewingIngredients} from "./brewing/inventory.js?v=a4378975be23aedfd2ed9bc2fc9eec4e1ba3692e";
import {brewingEndpoint,loadBrewingServiceConfig} from "./brewing/backend-config.js?v=a4378975be23aedfd2ed9bc2fc9eec4e1ba3692e";
import {folkBrewingFetch,LEGACY_READ_BASE} from "./brewing/legacy-read-client.js?v=a4378975be23aedfd2ed9bc2fc9eec4e1ba3692e";
const LEGACY_BREWING_URL="https://tormt.folk.ntnu.no/diverse/Brygging/";
const MODULES=[
  "./src/diverse/brewing/legacy/hydrometer-filter.js",
  "./src/diverse/brewing/legacy/hydrometer-intelligence.js",
  "./src/diverse/brewing/legacy/hydrometer-render.js",
  "./src/diverse/brewing/legacy/google-drive-sync.js",
  "./src/diverse/brewing/legacy/brewing-log-tools.js",
  "./src/diverse/brewing/legacy/brewing-log-viewer.js",
  "./src/diverse/brewing/legacy/recipe-engine.js",
  "./src/diverse/brewing/legacy/sandalen-tools-viewer.js",
  "./src/diverse/brewing/legacy/brewing-app.js"
];

function esc(value){
  return String(value??"").replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
}

function driveControls(account){
  if(account?.status!=="signed-in")return "";
  return `<div class="brewing-drive-panel" data-google-auth-only>
    <div class="brewing-drive-head">
      <div><strong>Google Drive</strong><span>Uses the account already signed in to FolkNettside. No second OAuth prompt here.</span></div>
      <span class="info-pill" id="driveAuthPill">Google Drive: site account connected</span>
    </div>
    <div class="content-grid brewing-drive-grid">
      <label class="form-field"><span>Default Drive folder</span><input id="driveRootUrlInput" type="url" placeholder="Drive folder URL"></label>
      <div class="action-stack">
        <button class="action-btn" id="saveStorageConfigBtn" type="button">Save storage setup</button>
        <button class="action-btn subtle-action" id="openDriveLibraryBtn" type="button">Open Drive library</button>
      </div>
    </div>
  </div>`;
}

export function brewingPageHTML({account={}}={}){
  const signedIn=account?.status==="signed-in";
  const accountName=signedIn?(account?.profile?.name||account?.profile?.email||"Google account"):"";
  return `<main class="brewing-page">
    <header class="dive-hero brewing-page-hero">
      <div>
        <span class="project-kicker">Diverse / Brewing</span>
        <h1>Brewing</h1>
        <p>Hydrometer telemetry, fermentation analysis, brew logs, recipes and Sandalen tools in the shared v2 interface.</p>
      </div>
      <div class="brewing-hero-actions">
        ${signedIn?`<span class="brewing-account-pill">Signed in · ${esc(accountName)}</span>`:""}
        <button class="btn" data-brewing-back type="button">Back to Diverse</button>
        <a class="btn" href="${LEGACY_BREWING_URL}" target="_blank" rel="noopener">Legacy fallback ↗</a>
      </div>
    </header>

    <div class="brew-shell">
      <div class="brewing-runtime-note" id="brewing-backend-note">Loading Brewing modules…</div>

      <section class="brew-card brew-toolbar-card">
        <div class="view-row" id="viewTabs" role="tablist" aria-label="Brewing views">
          <button class="view-tab active" data-view="hydrometer" type="button">Hydrometer</button>
          <button class="view-tab" data-view="logs" type="button">Brew logs</button>
          <button class="view-tab" data-view="recipes" type="button">Recipes</button>
          <button class="view-tab" data-view="raw-materials" type="button">Raw materials</button>
          <button class="view-tab" data-view="tools" type="button">Tools</button>
        </div>

        <div class="hydrometer-controls" id="hydrometerControls">
          <div class="toolbar-row" id="rangeRow">
            ${["1","3","7","14","30","60","max"].map(days=>`<button class="range-btn ${days==="max"?"active":""}" data-days="${days}" type="button">${days==="max"?"Max":days+" d"}</button>`).join("")}
            <button class="action-btn" id="refreshBtn" type="button">Force refresh</button>
          </div>
          <div class="date-filter-group">
            <label class="field-inline"><span>From</span><input id="fromDateInput" type="datetime-local"></label>
            <label class="field-inline"><span>To</span><input id="toDateInput" type="datetime-local"></label>
            <button class="action-btn subtle-action" id="clearDateBtn" type="button">Clear dates</button>
          </div>
        </div>

        <div class="meta-row">
          <span class="meta-chip" id="accountPill">Account: --</span>
          <span class="meta-chip" id="updatedPill">Updated: --</span>
          <span class="meta-chip" id="sourcePill">Data source: --</span>
          <span class="meta-chip" id="windowPill">Window: --</span>
        </div>
      </section>

      <section class="view-panel active" data-view="hydrometer">
        <div class="stat-grid" id="topStats"></div>
        <div class="split-shell">
          <aside class="brew-card sidebar-card">
            <div class="panel-top"><div><span class="brew-kicker">Devices</span><strong>Hydrometers</strong></div></div>
            <div class="device-list" id="deviceList"><div class="loading">Loading hydrometer data…</div></div>
          </aside>
          <section class="content-grid">
            <article class="brew-card panel-card">
              <div class="panel-top"><div><span class="brew-kicker">Selected fermentation</span><h2 id="deviceTitle">Hydrometer</h2><p id="deviceSubtitle">Choose a device to inspect telemetry and fermentation state.</p></div><div class="pill-row" id="devicePills"></div></div>
              <div class="metrics-grid" id="metricsGrid"></div>
              <div class="beer-overview-grid" id="beerOverviewGrid"></div>
              <div class="alert-stack" id="alertStack"></div>
            </article>
            <div class="chart-grid" id="chartGrid"></div>
            <article class="brew-card panel-card" id="fermentationLog"><h3>Fermentation log</h3><p>Waiting for telemetry.</p></article>
          </section>
        </div>
      </section>

      <section class="view-panel" data-view="logs">
        <div class="split-shell">
          <aside class="brew-card sidebar-card">
            <div class="panel-top"><div><span class="brew-kicker">Archive</span><strong>Brew logs</strong></div><button class="action-btn subtle-action" id="refreshLogsBtn" type="button">Refresh</button></div>
            <div class="stack-list" id="brewLogList"><div class="loading">Loading logs…</div></div>
          </aside>
          <section class="content-grid">
            <article class="brew-card panel-card">
              <div class="panel-top"><div><span class="brew-kicker">Export current fermentation</span><h2>Save brew log</h2></div><span class="info-pill" id="exportHintPill">Export: --</span></div>
              <div class="content-grid brewing-export-grid">
                <label class="form-field"><span>Hydrometer</span><select id="exportDeviceSelect"><option>Loading…</option></select></label>
                <label class="form-field"><span>Batch name</span><input id="batchNameInput" type="text" placeholder="Batch name"></label>
                <label class="form-field"><span>Storage</span><select id="storageModeSelect"><option value="local">Local</option>${signedIn?'<option value="hybrid">Local + Drive</option><option value="google-drive">Google Drive</option>':""}</select></label>
                <button class="action-btn primary" id="downloadLogBtn" type="button">Save brew log</button>
              </div>
              <div class="meta-row"><span class="info-pill subtle" id="storageHintPill">Storage: Local</span><span class="sidebar-note" id="logStorageOptions">Local storage is always available.</span></div>
              ${driveControls(account)}
            </article>

            <article class="brew-card panel-card">
              <div class="panel-top"><div><span class="brew-kicker">Selected log</span><h2 id="brewLogTitle">Choose a brew log</h2><p id="brewLogSubtitle">Log details appear here.</p></div><div class="pill-row" id="brewLogPills"></div></div>
              ${signedIn?`<div class="brewing-log-drive" data-google-auth-only>
                <label class="form-field"><span>Log-specific Drive folder</span><input id="logDriveUrlInput" type="url" placeholder="Optional Drive folder URL"></label>
                <div class="toolbar-row">
                  <button class="action-btn subtle-action" id="saveLogDriveBtn" type="button">Connect selected log to Drive</button>
                  <button class="action-btn" id="syncSelectedDriveBtn" type="button">Sync selected log</button>
                </div>
              </div>`:""}
              <div class="detail-text" id="brewLogText"><div class="empty-state">No brew log selected.</div></div>
              <div class="gallery-head"><strong>Images</strong><span id="brewLogImageMeta">No images loaded.</span></div>
              <div class="image-grid" id="brewLogImages"></div>
            </article>
          </section>
        </div>
      </section>

      <section class="view-panel" data-view="recipes">
        <div class="split-shell">
          <aside class="brew-card sidebar-card">
            <div class="panel-top"><div><span class="brew-kicker">Recipe library</span><strong>Recipes</strong></div><button class="action-btn subtle-action" id="refreshRecipesBtn" type="button">Refresh</button></div>
            <div class="provider-pills" id="recipeProviderPills"></div>
            <div class="stack-list" id="recipeList"><div class="loading">Loading recipes…</div></div>
          </aside>
          <section class="content-grid">
            <article class="brew-card panel-card">
              <div class="panel-top"><div><span class="brew-kicker">Find / compose</span><h2>Recipe search</h2></div><button class="action-btn subtle-action" id="downloadRecipeTemplateBtn" type="button">Template</button></div>
              <div class="content-grid brewing-recipe-search">
                <label class="form-field"><span>Malt</span><input id="recipeMaltInput" type="text" placeholder="e.g. pilsner malt"></label>
                <label class="form-field"><span>Hops</span><input id="recipeHopInput" type="text" placeholder="e.g. Saaz"></label>
                <label class="form-field"><span>Other ingredient</span><input id="recipeIngredientInput" type="text" placeholder="yeast, adjunct…"></label>
                <label class="form-field"><span>Volume (L)</span><input id="recipeVolumeInput" type="number" min="1" step="1" value="20"></label>
                <button class="action-btn primary" id="searchRecipesBtn" type="button">Search recipes</button>
              </div>
              <div class="sidebar-note" id="recipeSearchMeta"></div>
            </article>
            <article class="brew-card panel-card">
              <div class="panel-top"><div><span class="brew-kicker">Selected recipe</span><h2 id="recipeTitle">Choose a recipe</h2><p id="recipeSubtitle">Recipe detail and source references.</p></div><div class="pill-row" id="recipePills"></div></div>
              <div class="recipe-detail" id="recipeText"><div class="empty-state">No recipe selected.</div></div>
              <div class="reference-grid" id="referenceList"></div>
              <div class="sidebar-note" id="referenceMeta"></div>
            </article>
          </section>
        </div>
      </section>

      <section class="view-panel" data-view="raw-materials"><article class="brew-card panel-card" id="brew-local-inventory"></article></section>

      <section class="view-panel" data-view="tools">
        <article class="brew-card panel-card">
          <div class="panel-top"><div><span class="brew-kicker">Sandalen</span><h2>Brewing tools</h2></div><button class="action-btn primary" id="openToolsBtn" type="button">Open tools</button></div>
          <div class="tools-slot" id="toolsViewerSlot"></div>
        </article>
      </section>
    </div>
  </main>`;
}

function loadScript(src){
  return new Promise((resolve,reject)=>{
    const script=document.createElement("script");
    script.src=src;
    script.async=false;
    script.dataset.brewingModule="1";
    script.onload=()=>resolve(script);
    script.onerror=()=>reject(new Error("Could not load "+src));
    document.head.append(script);
  });
}

export async function mountBrewing(root,{account={},onBack=()=>{}}={}){
  let disposed=false;
  const scripts=[];
  const cleanupInventory=mountBrewingIngredients(root.querySelector("#brew-local-inventory"));
  root.querySelector("[data-brewing-back]")?.addEventListener("click",onBack);
  const note=root.querySelector("#brewing-backend-note");
  const settings=await loadBrewingServiceConfig();
  if(disposed)return()=>{};
  // Legacy module adapters now resolve services only within the actual V2
  // deployment base. Never discover root-relative PHP on the V1 NTNU site.
  const endpoint=(service,file)=>brewingEndpoint(settings,service,file);
  const legacyRead=settings?.legacyReadProxy?.enabled===true&&
    settings.legacyReadProxy.base===LEGACY_READ_BASE;
  const backendFetch=(url,options)=>folkBrewingFetch(url,options);
  globalThis.FolkBrewingEndpoint=endpoint;
  globalThis.FolkBrewingFetch=backendFetch;
  globalThis.FolkBrewingPrivateProxy=legacyRead;
  if(legacyRead){
    for(const id of ["downloadLogBtn","saveStorageConfigBtn","saveLogDriveBtn",
      "syncSelectedDriveBtn"]){
      const button=root.querySelector("#"+id);
      if(button){button.disabled=true;button.title="V1 bridge provides read-only access";}
    }
    const maxButton=root.querySelector('[data-days="max"]');
    if(maxButton)maxButton.textContent="60 d max";
  }
  const raptEndpoint=endpoint("rapt","dashboard.php");
  if(note){
    note.textContent=raptEndpoint
      ?(legacyRead?"Read-only V1 bridge selected; FolkNet owner login is required.":"Brewing modules loaded; verifying this V2 deployment's RAPT backend…")
      :"V2 server APIs are not configured. Local inventory works; live RAPT, recipes and logs are unavailable here. Legacy fallback is preserved.";
    note.dataset.kind=raptEndpoint?"loading":"preview";
  }

  try{
    for(const src of MODULES){
      if(disposed)break;
      scripts.push(await loadScript(src));
    }
    if(disposed)return()=>{};
    if(note&&raptEndpoint){
      note.textContent="Checking the V2 RAPT backend; module loading does not prove API availability.";
      note.dataset.kind="preview";
      try{
        const response=await backendFetch(raptEndpoint+"?days=1",{method:"GET",cache:"no-store",signal:AbortSignal.timeout(7000)});
        const type=response.headers.get("content-type")||"";
        if(!response.ok||!type.includes("json"))throw new Error("Unexpected API status or response format");
        const payload=await response.json();
        if(!payload||typeof payload!=="object"||Array.isArray(payload))throw new Error("Invalid API response");
        if(!disposed){note.textContent="RAPT dashboard endpoint responded. Recipes, logs and Google Drive still need independent checks.";note.dataset.kind="ready";}
      }catch(error){
        if(!disposed){note.textContent="Brewing backend not verified: "+String(error.message||error)+". Legacy fallback is available.";note.dataset.kind="preview";}
      }
    }
  }catch(error){
    if(note){
      note.textContent="Brewing module load failed: "+String(error?.message||error);
      note.dataset.kind="error";
    }
  }

  return ()=>{
    disposed=true;
    cleanupInventory?.();
    scripts.forEach(script=>script.remove());
    if(globalThis.FolkBrewingEndpoint===endpoint)delete globalThis.FolkBrewingEndpoint;
    if(globalThis.FolkBrewingFetch===backendFetch)delete globalThis.FolkBrewingFetch;
    if(legacyRead)delete globalThis.FolkBrewingPrivateProxy;
    for(const key of ["BrewingApp","BrewingHydrometerFilter","HydrometerIntelligence","BrewingHydrometerRender","BrewingGoogleDrive","BrewingLogTools","BrewingLogViewer","BrewingRecipeEngine","BrewingSandalenTools"]){
      try{delete window[key]}catch{}
    }
  };
}

export {LEGACY_BREWING_URL};
