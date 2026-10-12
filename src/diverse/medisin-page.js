import {getGoogleSessionSnapshot,subscribeGoogleSession} from "../platform/google-session.js?v=143ce2ba2c492aff2d441de71e89a31c1409e580";
import {mergeMedisinBackups,newMedisinBackup,validateMedisinBackup} from "../platform/medisin-drive.js?v=143ce2ba2c492aff2d441de71e89a31c1409e580";
import {readEncryptedMedisinDriveBackup,writeEncryptedMedisinDriveBackup} from "../platform/medisin-encrypted-drive.js?v=143ce2ba2c492aff2d441de71e89a31c1409e580";
import {encryptMedisinVault,decryptMedisinVault,isEncryptedMedisinVault} from "../platform/medisin-vault.js?v=143ce2ba2c492aff2d441de71e89a31c1409e580";
import {medisinDriveFolder,setMedisinDriveFolder} from "../platform/medisin-folder.js?v=143ce2ba2c492aff2d441de71e89a31c1409e580";
import {medisinCloudSyncAllowed,setMedisinCloudSyncAllowed} from "../platform/medisin-cloud-consent.js?v=143ce2ba2c492aff2d441de71e89a31c1409e580";
import {CONCENTRATION_UNITS,medisinConcentrations,medisinSolutionVolume} from "./medisin-concentration.js?v=143ce2ba2c492aff2d441de71e89a31c1409e580";
import {medisinStorageKey,medisinTimers,medisinDoses,medisinNextAt,medisinRemainingLevel,medisinChart,medisinApply,medisinCreateTimer,medisinCreateDose,medisinDelete} from "./medisin-model.js?v=143ce2ba2c492aff2d441de71e89a31c1409e580";

const LEGACY_URL="https://tormt.folk.ntnu.no/diverse/MedisinTimer/";
const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const date=value=>new Intl.DateTimeFormat("nb-NO",{dateStyle:"short",timeStyle:"short"}).format(value instanceof Date?value:new Date(value));
const num=value=>{const n=Number(value);return !Number.isFinite(n)?"—":n!==0&&Math.abs(n)<0.0001?n.toExponential(3):n.toLocaleString("nb-NO",{maximumFractionDigits:5});};
const uuid=()=>globalThis.crypto?.randomUUID?.()||Date.now()+"-"+Math.random().toString(36).slice(2);
function accountId(){
  const a=getGoogleSessionSnapshot();
  return a.status==="signed-in"&&a.profile?.sub?a.profile.sub:"";
}
export function medisinPageHTML(){
  return `<main class="diverse-page medisin-page">
    <header class="diverse-hero">
      <div><span class="project-kicker">Diverse / Utility</span><h1>MedisinTimer</h1>
      <p>Registrer egne timere og dosehistorikk, med valgfri synkronisering via sidens Google-innlogging.</p></div>
      <div class="legacy-diverse-actions"><button class="btn" data-medisin-back type="button">Til Diverse</button>
        <a class="btn" href="${LEGACY_URL}" target="_blank" rel="noopener">Gammel versjon ↗</a></div>
    </header>
    <div class="medisin-sync-panel" aria-live="polite"><div>
      <strong>Lagring</strong><p id="medisin-sync-status">Laster lokal historikk …</p>
      <small>Lokale oppføringer ligger på denne enheten. Drive-backuper krypteres i nettleseren (AES-256-GCM) før opplasting. Passfrasen lagres ikke. Delte Drive-brukere kan se den krypterte filen og metadata, men ikke åpne innholdet uten passfrasen. Gamle ukrypterte Drive-filer slettes ikke automatisk.</small>
    </div><div class="medisin-buttons">
      <label>Passfrase for kryptert backup<input type="password" id="medisin-vault-passphrase" minlength="12" maxlength="1024" autocomplete="new-password" placeholder="Minst 12 tegn, oppbevares av deg"></label>
      <label>Google Drive-mappe-ID (valgfritt, også delt mappe)<input type="text" id="medisin-drive-folder" autocomplete="off" spellcheck="false" placeholder="Tomt = Min disk"></label>
      <button class="btn" type="button" id="medisin-folder-save">Bruk valgt mappe</button>
      <button class="btn" type="button" id="medisin-sync">Aktiver kryptert Drive-synk</button>
      <button class="btn" type="button" id="medisin-cloud-disable" hidden>Slå av sky-synk</button>
      <button class="btn" type="button" id="medisin-export">Eksporter JSON (ukryptert)</button>
      <button class="btn" type="button" id="medisin-export-encrypted">Eksporter kryptert sikkerhetskopi</button>
      <button class="btn" type="button" id="medisin-import">Importer JSON eller kryptert backup</button>
      <input type="file" accept=".json,application/json" id="medisin-import-file" hidden>
    </div></div>
    <div class="medisin-layout">
      <section class="medisin-panel">
        <h2>Ny timer</h2>
        <form id="medisin-add-form" class="medisin-form">
          <label>Navn<input name="name" type="text" maxlength="160" required placeholder="Navn på timer"></label>
          <div class="medisin-form-grid">
            <label>Intervall (timer)<input name="interval" type="number" min="0.01" max="8760" step="any" value="24" required></label>
            <label>Halveringstid (timer)<input name="halflife" type="number" min="0" max="8760" step="any" value="0"></label>
            <label>Mengde per registrering<input name="amount" type="number" min="0.000001" step="any" value="1" required></label>
            <label>Enhet<select name="unit"><option value="mg">mg</option><option value="mcg">mcg</option><option value="g">g</option><option value="IU">IU</option><option value="enheter">enheter</option></select></label>
          </div><button class="btn primary" type="submit">Legg til timer</button>
        </form>
        <p class="medisin-disclaimer">Tider, mengder og halveringstid legges inn av deg. Nivåkurver er kun en forenklet eksponentialmodell, ikke grunnlag for medisinske beslutninger. Ingen varsler sendes når siden er lukket.</p>
        <h3>Funksjoner under overføring</h3>
        <p class="muted">Den eldre komplette peptide-kalkulatoren, FARE-galleriet og gammel delingskode er foreløpig tilgjengelig i <a href="${LEGACY_URL}" target="_blank" rel="noopener">den bevarte appen</a>. Gammel historikk importeres ikke automatisk.</p>
      </section>
      <section class="medisin-panel">
        <div class="medisin-section-top"><h2>Mine timere</h2><span id="medisin-count"></span></div>
        <div id="medisin-timers" class="medisin-timers"><p class="muted">Ingen timere ennå.</p></div>
      </section>
    </div>
    <section class="medisin-panel medisin-calculator">
      <h2>Konsentrasjon og enhetsomregning</h2>
      <p class="muted">Ren masse-/mol-/volumregning, ikke veiledning om preparering eller dosering.</p>
      <form id="medisin-calc-form" class="medisin-form">
        <div class="medisin-form-grid">
          <label>Stoffmengde<input name="amount" type="number" step="any" min="0.0000001" value="10" required></label>
          <label>Mengdeenhet<select name="amountUnit"><option value="mg">mg</option><option value="mcg">mcg</option><option value="g">g</option><option value="nmol">nmol</option><option value="umol">µmol</option><option value="mmol">mmol</option><option value="mol">mol</option></select></label>
          <label>Sluttvolum<input name="volume" type="number" step="any" min="0.0000001" value="1" required></label>
          <label>Volumenhet<select name="volumeUnit"><option value="mL">mL</option><option value="uL">µL</option><option value="L">L</option></select></label>
          <label>Molekylvekt (g/mol), valgfritt<input name="molecularWeight" type="number" min="0.0000001" step="any" placeholder="Kun ved masse ↔ mol"></label>
          <label>Valgfri mål-mengde<input name="targetAmount" type="number" min="0.0000001" step="any" placeholder="For volumberegning"></label>
          <label>Enhet for mål-mengde<select name="targetUnit"><option value="mg">mg</option><option value="mcg">mcg</option><option value="g">g</option><option value="nmol">nmol</option><option value="umol">µmol</option><option value="mmol">mmol</option><option value="mol">mol</option></select></label>
        </div><button class="btn primary" type="submit">Regn om</button>
      </form>
      <div id="medisin-calc-result" class="medisin-calc-result" aria-live="polite"></div>
    </section>
    <p class="medisin-feedback" id="medisin-feedback" role="status"></p>
  </main>`;
}
function curveSVG(points,unit){
  if(points.length<2)return "";
  const levels=points.map(p=>p.level||0),max=Math.max(1e-6,...levels),minT=points[0].time,maxT=points.at(-1).time;
  const coords=points.map(p=>[12+(p.time-minT)/(maxT-minT||1)*456,102-(p.level||0)/max*87]);
  const poly=coords.map(p=>p.map(n=>n.toFixed(2)).join(",")).join(" ");
  return `<svg class="medisin-curve" viewBox="0 0 480 126" role="img" aria-label="Forenklet nivåestimat over tid i ${esc(unit)}">
    <path d="M12 10V102H468" stroke="currentColor" fill="none" opacity=".45"/>
    <polyline points="${poly}" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <text x="12" y="120" font-size="12" fill="currentColor">${esc(date(minT))}</text>
    <text x="468" y="120" text-anchor="end" font-size="12" fill="currentColor">${esc(date(maxT))}</text>
    <text x="16" y="19" font-size="12" fill="currentColor">Est. ${esc(num(max))} ${esc(unit)}</text></svg>`;
}
function card(backup,timer,now){
  const doses=medisinDoses(backup,timer.id);
  const next=medisinNextAt(backup,timer.id);
  const level=medisinRemainingLevel(backup,timer.id,now);
  const due=next&&now>=next;
  const history=doses.slice(0,12).map(d=>`<li class="medisin-history-item"><span>${esc(date(d.takenAt))} · ${esc(num(d.amount))} ${esc(d.unit)}</span><button class="btn" type="button" data-medisin-delete="${esc(d.id)}" aria-label="Slett registrering">Slett</button></li>`).join("");
  return `<article class="medisin-timer" data-medisin-timer="${esc(timer.id)}">
    <header class="medisin-timer-head"><div><h3>${esc(timer.name)}</h3><span>${esc(num(timer.amount))} ${esc(timer.unit)} · ${esc(num(timer.durationSeconds/3600))} t intervall</span></div>
    <button type="button" class="btn" data-medisin-delete="${esc(timer.id)}">Fjern</button></header>
    <div class="medisin-metrics"><div><small>Siste registrering</small><strong>${doses.length?esc(date(doses[0].takenAt)):"Ingen"}</strong></div>
    <div><small>Neste tidspunkt (egen innstilling)</small><strong class="${due?"medisin-due":""}">${next?esc(date(next)):"Ikke satt"}</strong></div>
    <div><small>Modellert restnivå</small><strong>${level!==null?esc(num(level))+" "+esc(timer.unit):"Ingen modell"}</strong></div></div>
    <div class="medisin-buttons"><button class="btn primary" type="button" data-medisin-dose="${esc(timer.id)}">Registrer nå</button></div>
    ${level!==null&&doses.length?curveSVG(medisinChart(backup,timer.id,now),timer.unit):""}
    <details><summary>Dosehistorikk (${doses.length})</summary><ul class="medisin-history">${history||"<li>Ingen registreringer</li>"}</ul></details></article>`;
}
export function mountMedisin(root,{onBack=()=>{}}={}){
  const list=root.querySelector("#medisin-timers");
  const count=root.querySelector("#medisin-count");
  const status=root.querySelector("#medisin-sync-status");
  const feedback=root.querySelector("#medisin-feedback");
  let profile=accountId(),key=medisinStorageKey(profile),backup=newMedisinBackup();
  let syncPromise=null,pendingSync=false,disposed=false,syncTimer=null;
  let vaultPassphrase=null;
  const signedIn=()=>Boolean(accountId());
  function readLocal(){
    try{const value=localStorage.getItem(key);return value?validateMedisinBackup(JSON.parse(value)):newMedisinBackup();}
    catch(error){message("Kunne ikke lese lokale data: "+error.message);return newMedisinBackup();}
  }
  function message(text){if(!disposed)feedback.textContent=text;}
  function saveLocal(value){
    validateMedisinBackup(value);
    localStorage.setItem(key,JSON.stringify(value));
    backup=value;
    renderCards();
  }
  function renderCards(){
    const timers=medisinTimers(backup),now=Date.now();
    count.textContent=timers.length+" timere";
    list.innerHTML=timers.map(t=>card(backup,t,now)).join("")||'<p class="muted">Ingen timere ennå. Legg til en timer til venstre.</p>';
  }
  function updateStatus(label=""){
    const a=getGoogleSessionSnapshot();
    const connected=a.status==="signed-in"&&Boolean(a.profile?.sub);
    const allowed=connected&&medisinCloudSyncAllowed(a.profile.sub);
    const unlocked=allowed&&Boolean(vaultPassphrase);
    const passInput=root.querySelector("#medisin-vault-passphrase");
    const folderInput=root.querySelector("#medisin-drive-folder");
    if(folderInput&&!folderInput.matches(":focus"))folderInput.value=connected?(medisinDriveFolder(a.profile.sub)||""):"";
    if(passInput)passInput.disabled=!connected;
    const trigger=root.querySelector("#medisin-sync");
    trigger.disabled=!connected||!!syncPromise;
    trigger.textContent=unlocked?"Synk nå":allowed?"Lås opp kryptert backup":"Aktiver kryptert Drive-synk";
    const disable=root.querySelector("#medisin-cloud-disable");
    disable.hidden=!allowed;
    disable.disabled=!!syncPromise;
    status.textContent=label||(connected
      ?unlocked
        ?"Google: "+(a.profile?.email||"tilkoblet")+" · kryptert Drive-synk er låst opp for denne fanen."
        :allowed
        ?"Google: "+(a.profile?.email||"tilkoblet")+" · kryptert Drive-synk er låst. Oppgi passfrasen for å synkronisere."
        :"Google: "+(a.profile?.email||"tilkoblet")+" · kun lokal lagring. Kryptert sky-synk krever aktivt valg."
      :a.status==="signed-in"?"Google-profilen kunne ikke bekreftes. Lokal lagring brukes."
      :"Lokal lagring · logg inn under Innstillinger → Connections for valgfri synk.");
  }
  async function syncCloud(){
    if(disposed||!signedIn()||!vaultPassphrase||!medisinCloudSyncAllowed(profile))return;
    if(syncPromise){pendingSync=true;return syncPromise;}
    const syncProfile=profile;
    const passphrase=vaultPassphrase;
    const folderId=medisinDriveFolder(syncProfile);
    syncPromise=(async()=>{
      updateStatus("Dekrypterer og synkroniserer kryptert Google Drive-backup …");
      const remote=await readEncryptedMedisinDriveBackup(syncProfile,passphrase,{folderId});
      if(disposed||accountId()!==syncProfile||vaultPassphrase!==passphrase||
        !medisinCloudSyncAllowed(syncProfile))return;
      // Decryption failure always stops here. No legacy plaintext fallback, and
      // no overwrite of a locked or incompatible encrypted remote backup.
      const local=readLocal();
      const merged=remote?mergeMedisinBackups(local,remote.backup):local;
      saveLocal(merged);
      if(merged.entries.length&&(!remote||JSON.stringify(merged.entries)!==JSON.stringify(remote.backup.entries))){
        if(disposed||accountId()!==syncProfile||vaultPassphrase!==passphrase||
          !medisinCloudSyncAllowed(syncProfile))return;
        await writeEncryptedMedisinDriveBackup(syncProfile,passphrase,merged,{
          folderId,allowReplace:Boolean(remote),expectedRevision:remote?.revision||null});
      }
      message("Kryptert Google Drive-backup synkronisert · "+date(Date.now()));
    })();
    try{await syncPromise;}catch(error){
      const detail=String(error?.message||error);
      if(/Vault could not be unlocked|Unsupported or incomplete encrypted MedisinTimer vault|Invalid encrypted MedisinTimer vault/i.test(detail)){
        vaultPassphrase=null;
        root.querySelector("#medisin-vault-passphrase").value="";
      }
      message("Kryptert synk feilet: "+detail+". Lokale data er ikke tapt; ingen gammel Drive-backup ble overskrevet.");
    }
    finally{
      syncPromise=null;
      updateStatus();
      if(pendingSync&&!disposed){pendingSync=false;queueMicrotask(()=>syncCloud());}
    }
  }
  function scheduleSync(){
    if(!signedIn()||!vaultPassphrase||!medisinCloudSyncAllowed(profile))return;
    clearTimeout(syncTimer);
    syncTimer=setTimeout(()=>{if(!disposed)syncCloud();},900);
  }
  function apply(record){
    try{saveLocal(medisinApply(backup,record));message("Lagret lokalt.");scheduleSync();}
    catch(error){message("Lagring feilet: "+error.message);}
  }
  root.querySelector("[data-medisin-back]")?.addEventListener("click",onBack);
  root.querySelector("#medisin-add-form")?.addEventListener("submit",event=>{
    event.preventDefault();
    const form=event.currentTarget,data=new FormData(form);
    try{
      const item=medisinCreateTimer({id:uuid(),name:data.get("name"),intervalHours:data.get("interval"),
        halfLifeHours:data.get("halflife"),amount:data.get("amount"),unit:data.get("unit")});
      apply(item);form.reset();
    }catch(error){message(error.message);}
  });
  list.addEventListener("click",event=>{
    const doseButton=event.target.closest("[data-medisin-dose]");
    if(doseButton){
      const timer=medisinTimers(backup).find(t=>t.id===doseButton.dataset.medisinDose);
      if(timer)apply(medisinCreateDose(timer,{id:uuid()}));
      return;
    }
    const del=event.target.closest("[data-medisin-delete]");
    if(del&&globalThis.confirm("Slette denne registreringen?")){
      try{saveLocal(medisinDelete(backup,del.dataset.medisinDelete));message("Slettet lokalt.");scheduleSync();}
      catch(error){message(error.message);}
    }
  });
  root.querySelector("#medisin-calc-form")?.addEventListener("submit",event=>{
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    const input=Object.fromEntries(data.entries());
    const output=root.querySelector("#medisin-calc-result");
    try{
      const result=medisinConcentrations(input);
      const rows=CONCENTRATION_UNITS.filter(unit=>result.concentrations[unit]!==null).map(unit=>
        `<div><span>${esc(unit)}</span><strong>${esc(num(result.concentrations[unit]))}</strong></div>`).join("");
      let detail="";
      if(input.targetAmount){
        const target=medisinSolutionVolume({totalAmount:input.amount,totalUnit:input.amountUnit,
          diluentVolume:input.volume,diluentUnit:input.volumeUnit,
          targetAmount:input.targetAmount,targetUnit:input.targetUnit,molecularWeight:input.molecularWeight});
        detail=`<p>Teoretisk volum for valgt mengde: <strong>${esc(num(target.volumeML))} mL (${esc(num(target.volumeUL))} µL)</strong>.
          ${target.withinMix?"":"Valgt mengde overstiger total mengde i løsningen."}</p>`;
      }
      output.innerHTML=`<div class="medisin-calc-grid">${rows}</div>${detail}`;
    }catch(error){output.textContent="Kan ikke beregne: "+String(error.message||error);}
  });
  root.querySelector("#medisin-folder-save")?.addEventListener("click",()=>{
    if(!signedIn())return;
    if(syncPromise){message("Vent til gjeldende synk er ferdig før du bytter Drive-mappe.");return}
    try{
      setMedisinDriveFolder(profile,root.querySelector("#medisin-drive-folder").value.trim());
      message("Valgt Drive-mappe er lagret på denne enheten. Tom mappe-ID betyr din private Min disk. Bytt mappe kun hvis du vet hvor eksisterende kryptert backup ligger.");
      updateStatus();
    }catch(error){message(error.message)}
  });
  root.querySelector("#medisin-sync")?.addEventListener("click",()=>{
    if(!signedIn())return;
    const input=root.querySelector("#medisin-vault-passphrase");
    const entered=input.value;
    if(!vaultPassphrase){
      if(entered.length<12||entered.length>1024){
        message("Oppgi en passfrase på minst 12 tegn. Den må brukes på alle enheter; mister du den kan ikke backupen dekrypteres.");
        return;
      }
      if(!medisinCloudSyncAllowed(profile)){
        const accepted=globalThis.confirm?.(
          "Aktivere ende-til-ende-kryptert MedisinTimer-synk? Data krypteres med passfrasen før Drive-opplasting. Passfrasen kan ikke gjenopprettes; lokale oppføringer lagres fortsatt i nettleseren. Tidligere ukrypterte Drive-filer slettes IKKE automatisk."
        );
        if(accepted!==true){message("Ingen data ble lastet opp. Lokal lagring fortsetter.");return}
        try{setMedisinCloudSyncAllowed(profile,true)}
        catch(error){message(error.message);return}
      }
      vaultPassphrase=entered;
      input.value="";
    }
    updateStatus();
    syncCloud();
  });
  root.querySelector("#medisin-cloud-disable")?.addEventListener("click",()=>{
    if(!profile)return;
    try{setMedisinCloudSyncAllowed(profile,false)}
    catch(error){message(error.message);return}
    clearTimeout(syncTimer);pendingSync=false;
    vaultPassphrase=null;
    root.querySelector("#medisin-vault-passphrase").value="";
    updateStatus();
    message("Kryptert sky-synk er av og passfrasen er tømt fra denne fanen. Gamle Drive-filer slettes ikke.");
  });
  function downloadBackup(payload,filename){
    const file=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const href=URL.createObjectURL(file),link=document.createElement("a");
    link.href=href;link.download=filename;link.click();
    setTimeout(()=>URL.revokeObjectURL(href),1000);
  }
  root.querySelector("#medisin-export-encrypted")?.addEventListener("click",async()=>{
    const passphrase=vaultPassphrase||root.querySelector("#medisin-vault-passphrase").value;
    if(!passphrase||passphrase.length<12){message("Lås opp med passfrasen eller skriv en ny passfrase på minst 12 tegn før kryptert eksport.");return}
    try{downloadBackup(await encryptMedisinVault(backup,passphrase),"medisintimer-v2-kryptert.enc.json");
      message("Kryptert lokal sikkerhetskopi eksportert. Oppbevar passfrasen separat; den kan ikke gjenopprettes.");}
    catch(error){message("Kryptert eksport feilet: "+error.message)}
  });
  root.querySelector("#medisin-export")?.addEventListener("click",()=>{
    downloadBackup(backup,"medisintimer-v2-backup.json");
    message("Ukryptert JSON eksportert. Filen kan inneholde sensitive opplysninger.");
  });
  const fileInput=root.querySelector("#medisin-import-file");
  root.querySelector("#medisin-import")?.addEventListener("click",()=>fileInput.click());
  fileInput?.addEventListener("change",async()=>{
    const file=fileInput.files?.[0];
    if(!file)return;
    try{
      if(file.size>4_000_000)throw new Error("Filen er for stor.");
      const parsed=JSON.parse(await file.text());
      const passphrase=vaultPassphrase||root.querySelector("#medisin-vault-passphrase").value;
      if(isEncryptedMedisinVault(parsed)&&!passphrase)throw new Error("Oppgi passfrasen til den krypterte filen først.");
      const imported=validateMedisinBackup(isEncryptedMedisinVault(parsed)?await decryptMedisinVault(parsed,passphrase):parsed);
      const merged=mergeMedisinBackups(backup,imported);
      saveLocal(merged);scheduleSync();message("Importert "+imported.entries.length+" oppføringer (sammenslått uten å slette eksisterende).");
    }catch(error){message("Import mislyktes: "+error.message);}
    fileInput.value="";
  });
  const unsubscribe=subscribeGoogleSession(()=>{
    const newProfile=accountId();
    if(newProfile!==profile){
      clearTimeout(syncTimer);vaultPassphrase=null;pendingSync=false;
      root.querySelector("#medisin-vault-passphrase").value="";
      profile=newProfile;key=medisinStorageKey(profile);
      backup=readLocal();renderCards();message("Byttet lagringsprofil.");
      // A new Google account must explicitly unlock its own encrypted vault.
    }
    updateStatus();
  });
  const clock=setInterval(()=>{if(!disposed)renderCards();},60000);
  backup=readLocal();renderCards();updateStatus();
  // Never request Drive data until the user unlocks this browser session.
  return {cleanup(){disposed=true;vaultPassphrase=null;clearTimeout(syncTimer);clearInterval(clock);unsubscribe();}};
}
