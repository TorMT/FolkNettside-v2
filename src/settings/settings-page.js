import {readSpaceMouseSettings} from "../model/spacemouse-settings.js?v=9381df14d503bbbe82d8b77c2584a1d5d5f823ba";
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

function connectionsHTML(account={},folkAccount={}){
  const signedIn=account?.status==="signed-in";
  const connecting=account?.status==="connecting"||account?.status==="loading";
  const profile=account?.profile||{};
  const accountLabel=profile.name||profile.email||"Google account";
  const googleControl=signedIn
    ? `<div class="settings-connection-actions"><span class="settings-status ready">Connected</span><button class="btn" data-google-disconnect>Sign out</button></div>`
    : `<div class="settings-connection-actions"><span class="settings-status ${account?.status==="unavailable"?"planned":"ready"}">${connecting?"Loading":account?.status==="unavailable"?"Unavailable":"Signed out"}</span><button class="btn" data-google-connect ${connecting?"disabled":""}>Sign in with Google</button></div>`;
  const folkSigned=folkAccount?.status==="signed-in";
  const folkBusy=folkAccount?.status==="loading"||folkAccount?.status==="connecting";
  const folkDescription=folkSigned
    ? "Private cloud identity: "+esc(folkAccount.user?.email||"Authenticated user")+
      ". This is separate from the existing Google Drive session."
    : "Optional private account for FolkNettside. Google Drive retains its own connection; nothing is migrated automatically.";
  const folkControl=folkSigned
    ? `<div class="settings-connection-actions"><span class="settings-status ready">Connected</span>
        <a class="btn" href="#/admin/courses">Administrer kurs</a>
        <button type="button" class="btn" data-folk-signout>Sign out of FolkNet</button></div>`
    : `<form data-folk-auth-form class="folk-auth-form" autocomplete="on">
         <label>Email <input type="email" name="folk-email" required maxlength="254"
           autocomplete="email" placeholder="name@example.com"></label>
         <label>Password <input type="password" name="folk-password" required minlength="6"
           autocomplete="current-password" placeholder="FolkNet password"></label>
         <div class="settings-connection-actions">
          <button class="btn" type="submit" data-folk-login ${folkBusy?"disabled":""}>Sign in</button>

         </div>
         <small>Kun forhåndsopprettede FolkNet-kontoer. Administratorkontoen må
           opprettes og gis tilgang i riktig Supabase-prosjekt.</small>
       </form>`;
  const googleDescription=signedIn
    ? `${esc(accountLabel)}${profile.email&&profile.email!==accountLabel?` · ${esc(profile.email)}`:""}. This one site-level session is reused by Brewing and Dive log.`
    : "Optional site-level sign-in. Brewing and Dive log stay local and never open their own Google prompt while you are signed out.";
  return `
    <h1>Account & connections</h1>
    <p class="muted">The public site and local engineering/study tools do not require authentication. Sign-in is only used for account-backed features.</p>
    <div class="settings-card">
      <div class="setting-row"><div><strong>Google / Drive</strong><small>${googleDescription}</small></div>${googleControl}</div>
      <div class="setting-row"><div><strong>FolkNet private cloud / Supabase</strong>
        <small>${folkDescription}</small></div><div>${folkControl}</div></div>
      ${folkSigned?`<div class="setting-row"><div><strong>Appearance backup</strong>
        <small>Only light/dark mode, colours, density and contrast. Save and restore manually.
        Existing cloud backup changes are confirmed before overwrite.</small></div>
        <div class="settings-connection-actions">
          <button class="btn" type="button" data-folk-backup>Back up appearance</button>
          <button class="btn" type="button" data-folk-restore>Restore appearance</button>
        </div></div>
        <div class="settings-feedback" data-folk-backup-status role="status" aria-live="polite"></div>`:""}
      ${folkSigned?`<div class="setting-row"><div><strong>Verify private cloud</strong>
        <small>Check the deployed Supabase backend against your current FolkNet identity.
        This test does not upload files or change account data.</small></div>
        <button class="btn" type="button" data-folk-probe>Check backend</button></div>
        <div class="settings-feedback" data-folk-probe-result role="status" aria-live="polite"></div>`:""}
      ${folkSigned?`<div class="setting-row"><div><strong>Linked sign-in methods</strong>
        <small>Read verified providers from your FolkNet account. This is not your Google Drive connection, and checking does not link or merge accounts.</small></div>
        <button class="btn" type="button" data-folk-identities>Check providers</button></div>
        <div class="settings-feedback" data-folk-identities-result role="status" aria-live="polite"></div>`:""}
      <div class="setting-row"><div><strong>Fusion CAD import</strong><small>Local Fusion export needs no APS login. Install the script once, then import the engineering ZIP in CAD. Optional cloud Hub browsing requires a separately configured Autodesk account.</small></div><div class="settings-connection-actions"><span class="settings-status ready">Local mode available</span><button type="button" class="btn" data-go="/engineering/cad">Open CAD</button></div></div>
    </div>
    ${account?.error?`<div class="settings-note"><strong>Google status</strong><span>${esc(account.error)}</span></div>`:""}
    ${folkAccount?.error?`<div class="settings-note"><strong>FolkNet account</strong><span>${esc(folkAccount.error)}</span></div>`:""}
    <div class="settings-note"><strong>Private account scope</strong><span>Signing in prepares access to private storage; it does not import previous Drive data or connect Autodesk automatically. Account tokens are held in this tab only.</span></div>
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
      <div class="setting-row"><div><strong>Administrer fagnavn og filer</strong><small>Én verifisert FolkNet-administrator kan endre visningsnavn uten å flytte NTNU-filer. Krever Supabase-innlogging og servergodkjente rettigheter.</small></div><a class="btn" href="#/admin/courses">Åpne adminredigering</a></div>
      <div class="setting-row"><div><strong>Manifest freshness</strong><small>CI rebuilds and checks the manifest on every deploy.</small></div><span class="settings-status ready">CI gated</span></div>
      <div class="setting-row"><div><strong>Large resources</strong><small>Indexed from filesystem metadata; ordinary course files are not read during indexing.</small></div><span class="settings-status ready">Metadata only</span></div>
    </div>`;
}

function spaceMousePreferencesHTML(){
  const config=readSpaceMouseSettings();
  const number=(key,label,min,max,step=.05)=>
    '<label class="spacemouse-pref"><span>'+label+'</span><input type="range" data-spacemouse-setting="'+key+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+config[key]+'"><output data-spacemouse-output="'+key+'">'+config[key]+'</output></label>';
  const check=(key,label)=>
    '<label class="spacemouse-pref spacemouse-toggle"><input type="checkbox" data-spacemouse-setting="'+key+'" '+(config[key]?"checked":"")+'><span>'+label+'</span></label>';
  return `<div class="settings-card spacemouse-settings-card">
    <div class="spacemouse-settings-title"><div><strong>3Dconnexion SpaceMouse</strong>
      <small>Shared by CAD, KISSsoft and the model viewer. Saved only in this browser.</small></div>
      <button class="btn" type="button" data-spacemouse-reset>Reset to Fusion-like defaults</button></div>
    <p class="muted">Fusion / 3Dconnexion-inspired object mode. This website uses WebHID and cannot read Fusion's driver profile; speeds and axis signs are local approximations. Device drivers can also invert an axis.</p>
    <div class="spacemouse-fields">
      <label class="spacemouse-pref"><span>Navigation</span>
        <select data-spacemouse-setting="navigation"><option value="object" ${config.navigation==="object"?"selected":""}>Object (Fusion-like)</option><option value="camera" ${config.navigation==="camera"?"selected":""}>Camera (reversed)</option></select>
      </label>
      ${number("sensitivity","Overall sensitivity",.2,2,.1)}
      ${number("panSpeed","Pan / zoom speed",.2,2,.1)}
      ${number("rotationSpeed","Tilt / spin speed",.2,2,.1)}
      ${number("deadzone","HID deadzone",0,.35,.01)}
      ${check("panZoom","Enable pan / zoom")}
      ${check("rotation","Enable tilt / spin")}
      ${check("roll","Enable camera roll")}
      ${check("invertPanX","Reverse left / right")}
      ${check("invertPanY","Reverse up / down")}
      ${check("invertZoom","Reverse push / pull zoom")}
      ${check("invertTilt","Reverse tilt")}
      ${check("invertSpin","Reverse spin")}
      ${check("invertRoll","Reverse roll")}
    </div>
    <p class="settings-feedback" data-spacemouse-feedback role="status">Changes take effect immediately in connected viewers. HID access still requires your Connect click.</p>
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
    </div>
    ${spaceMousePreferencesHTML()}`;
}

function privacyHTML(){
  return `
    <h1>Privacy & data</h1>
    <p class="muted">Study progress and UI preferences are stored locally in this browser. No course login is required.</p>
    <div class="settings-card">
      <div class="setting-row"><div><strong>Google Analytics (optional)</strong><small>Same GA4 property as the original website, with V2-only page categories. Google tag script loads with consent denied; GA4 page-view measurement starts only after opt-in. Statistics are visible only in the owner's Google account; personal and health-related tools are excluded from page tracking. You can revoke consent here at any time.</small><small data-analytics-status role="status">Off by default</small></div><button class="btn" id="settings-analytics-toggle" type="button">Enable analytics</button></div>
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

export function settingsPageHTML({settings,section="appearance",stats={},account={},folkAccount={}}={}){
  const active=SECTIONS.some(([id])=>id===section)?section:"appearance";
  const bodies={
    appearance:()=>appearanceHTML(settings||{}),
    connections:()=>connectionsHTML(account||{},folkAccount||{}),
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
