import {getGoogleSessionSnapshot,subscribeGoogleSession} from "../platform/google-session.js?v=a0d404486e2d896610962ef4b7b1358be575feed";
import {readAccountVault,writeAccountVault,encryptAccountVault,decryptAccountVault,validateAccountVaultFolder} from "../platform/account-vault-sync.js?v=a0d404486e2d896610962ef4b7b1358be575feed";
import {addDiveEntry,createDiveEntry,deleteDiveEntry,mergeDiveLogs,newDiveLog,validateDiveLog,visibleDiveEntries} from "./dive-log-model.js?v=a0d404486e2d896610962ef4b7b1358be575feed";
import {reconcileDiveLogLocalWrite} from "./dive-log-local-sync.js?v=a0d404486e2d896610962ef4b7b1358be575feed";

const PURPOSE="dive-log";
const STORAGE="folk-v2-dive-log-v1";
const html=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const accountId=()=>{const s=getGoogleSessionSnapshot();return s.status==="signed-in"&&s.profile?.sub?s.profile.sub:""};
const keyFor=sub=>STORAGE+(sub?":"+sub:"");
const folderFor=sub=>"folk-v2:dive-log-folder:"+sub;
function download(data,filename){
  const href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
  const a=document.createElement("a");a.href=href;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(href),1000);
}
export function mountDiveLog(root){
 if(!root)return{selectSite(){},cleanup(){}};
 let disposed=false,sub=accountId(),key=keyFor(sub),backup=newDiveLog(),password=null;
 let unreadableLocalRaw=null,recoveryExported=false,lastSeenRaw=null,removedExternally=false;
 let busy=false,pending=false,timer=null;
 root.innerHTML='<p>Personal dive records are stored locally per Google account. Cloud synchronization is optional and encrypted; public map data is never modified.</p>'+
 '<form id="dive-log-form" class="medisin-form">'+
 '<div class="medisin-form-grid">'+
 '<label>Site<input name="siteName" required maxlength="160" placeholder="Dive site"></label>'+
 '<input type="hidden" name="siteId">'+
 '<label>Date/time<input name="divedAt" type="datetime-local" required></label>'+
 '<label>Maximum depth (m)<input name="maxDepthM" type="number" min="0" max="500" step="any" required></label>'+
 '<label>Duration (minutes)<input name="durationMinutes" type="number" min="1" max="1440" step="any" required></label></div>'+
 '<label>Notes<input name="notes" maxlength="2000" placeholder="Conditions, equipment, observations…"></label>'+
 '<button class="btn primary" type="submit">Save dive</button></form>'+
 '<section id="dive-log-recovery" class="medisin-panel" hidden role="alert">'+
 '<strong>Local dive log cannot be read</strong>'+
 '<p>Saving, importing and cloud sync are blocked to protect the existing records. No local history has been erased.</p>'+
 '<p>Download the original unreadable text first. This export is unencrypted and may contain private information. Confirm that the file is saved before resetting this device profile.</p>'+
 '<div class="medisin-buttons">'+
 '<button class="btn" type="button" id="dive-log-recovery-export">Download original unreadable text</button>'+
 '<button class="btn" type="button" id="dive-log-recovery-reset" disabled>Start empty local profile after backup</button></div></section>'+
 '<div id="dive-log-list"></div>'+
 '<div class="medisin-buttons">'+
 '<button class="btn" type="button" id="dive-log-export">Export JSON (unencrypted)</button>'+
 '<button class="btn" type="button" id="dive-log-export-secure">Export encrypted</button>'+
 '<label class="btn">Import JSON or encrypted<input id="dive-log-import" type="file" accept=".json" hidden></label></div>'+
 '<div class="medisin-sync-panel"><div><strong>Encrypted Google Drive backup</strong><p id="dive-log-cloud-state"></p>'+
 '<small>Use one passphrase and the same folder on all devices. You must explicitly unlock to sync. Local browser storage and plain JSON export are not encrypted.</small></div>'+
 '<div class="medisin-buttons">'+
 '<label>Passphrase<input id="dive-log-password" type="password" minlength="12" autocomplete="new-password" placeholder="At least 12 characters"></label>'+
 '<label>Drive folder ID (optional)<input id="dive-log-folder" type="text" autocomplete="off" spellcheck="false" placeholder="Blank = My Drive"></label>'+
 '<button class="btn" type="button" id="dive-log-save-folder">Save folder</button>'+
 '<button class="btn" type="button" id="dive-log-sync">Unlock / sync</button>'+
 '<button class="btn" type="button" id="dive-log-lock">Lock / stop sync</button></div></div>'+
 '<p id="dive-log-message" aria-live="polite"></p>';
 const message=root.querySelector("#dive-log-message");
 const state=root.querySelector("#dive-log-cloud-state");
 const passInput=root.querySelector("#dive-log-password");
 const folderInput=root.querySelector("#dive-log-folder");
 const form=root.querySelector("#dive-log-form");
 const notify=t=>{if(!disposed)message.textContent=t};
 const folder=()=>{
   try{return sub?validateAccountVaultFolder(localStorage.getItem(folderFor(sub))):null}
   catch{return null}
 };
 const readLocal=()=>{
   let raw=null;
   try{
     raw=localStorage.getItem(key);
     // A missing key after previously loading records is an external reset,
     // not evidence that an empty profile should be silently resurrected.
     if(raw===null&&lastSeenRaw!==null){
       removedExternally=true;backup=null;
       notify("Dive log was removed in another tab. Reload before saving or syncing.");
       return null;
     }
     const valid=raw===null?newDiveLog():validateDiveLog(JSON.parse(raw));
     lastSeenRaw=raw;removedExternally=false;
     unreadableLocalRaw=null;recoveryExported=false;
     return valid;
   }catch{
     unreadableLocalRaw=raw;recoveryExported=false;backup=null;
     notify("Local dive log cannot be read. Saving and sync are blocked; the original data is unchanged.");
     return null;
   }
 };
 const saveLocal=value=>{
   if(!backup)throw Error("Local dive log unavailable; saving is blocked");
   let raw=null,merged;
   try{
     raw=localStorage.getItem(key);
     merged=reconcileDiveLogLocalWrite(value,raw,{previouslySeenRaw:lastSeenRaw});
   }catch(error){
     if(raw===null&&lastSeenRaw!==null){
       removedExternally=true;password=null;passInput.value="";
       clearTimeout(timer);pending=false;backup=null;render();
     }else if(raw!==null){
       try{validateDiveLog(JSON.parse(raw))}
       catch{
         unreadableLocalRaw=raw;recoveryExported=false;backup=null;render();
       }
     }
     throw error;
   }
   const serialized=JSON.stringify(merged);
   localStorage.setItem(key,serialized);
   lastSeenRaw=serialized;
   backup=merged;render();
   return merged;
 };
 const render=()=>{
   const list=root.querySelector("#dive-log-list");
   const recovery=root.querySelector("#dive-log-recovery");
   recovery.hidden=Boolean(backup)||removedExternally;
   root.querySelector("#dive-log-recovery-export").disabled=Boolean(backup)||unreadableLocalRaw===null;
   root.querySelector("#dive-log-recovery-reset").disabled=Boolean(backup)||!recoveryExported||unreadableLocalRaw===null;
   for(const id of ["#dive-log-form button[type=submit]","#dive-log-export",
                    "#dive-log-export-secure","#dive-log-import"]){
     root.querySelector(id).disabled=!backup;
   }
   root.querySelector("#dive-log-sync").disabled=!sub||busy||!backup;
   root.querySelector("#dive-log-save-folder").disabled=!sub||busy||!backup;
   root.querySelector("#dive-log-lock").disabled=!password;
   folderInput.disabled=!sub||busy||!backup;
   if(!backup){
     list.textContent=removedExternally
       ?"Another tab removed this dive-log profile. Reload the page before making changes."
       :"Stored data cannot be read. Download the original text before choosing to reset.";
     state.textContent=removedExternally
       ?"Local profile changed in another tab · synchronization blocked."
       :"Local dive log unreadable · cloud synchronization blocked.";
     return;
   }
   const rows=visibleDiveEntries(backup);
   list.innerHTML=rows.length?'<ul class="medisin-history">'+rows.map(row=>
     '<li class="medisin-history-item"><span><strong>'+html(row.siteName)+'</strong> · '+
     html(new Date(row.divedAt).toLocaleDateString("nb-NO"))+' · '+html(row.maxDepthM)+' m · '+
     html(row.durationMinutes)+' min'+(row.notes?' · '+html(row.notes):'')+
     '</span><button class="btn" type="button" data-dive-log-delete="'+html(row.id)+'">Delete</button></li>').join("")+
     '</ul>':"<p class='muted'>No saved dives in this storage profile.</p>";
   state.textContent=!sub?"Guest log · sign in in Settings for optional Drive sync.":
     password?"Unlocked for this tab · encrypted sync enabled.":
       "Signed in · cloud data locked until you opt in.";
 };
 function schedule(){
   if(!sub||!password||!backup)return;
   clearTimeout(timer);timer=setTimeout(()=>{void syncCloud()},900);
 }
 function apply(value){
   try{saveLocal(value);notify("Dive saved locally.");schedule();return true}
   catch(error){notify("Save failed: "+error.message);return false}
 }
 async function syncCloud(){
   if(busy){pending=true;return}
   if(disposed||!sub||!password||!backup)return;
   const account=sub,secret=password,folderId=folder();
   busy=true;render();state.textContent="Reading and merging encrypted Drive dive log…";
   try{
     const remote=await readAccountVault(account,PURPOSE,secret,{folderId});
     if(disposed||sub!==account||password!==secret)return;
     const local=readLocal();
     if(!local)throw Error("Local log unreadable; sync blocked");
     const combined=remote?mergeDiveLogs(local,validateDiveLog(remote.data)):local;
     const persisted=saveLocal(combined);
     if(persisted.entries.length&&(!remote||JSON.stringify(persisted.entries)!==JSON.stringify(remote.data.entries))){
       await writeAccountVault(account,PURPOSE,secret,persisted,{folderId,expectedRevision:remote?.revision||null});
     }
     notify("Encrypted Drive dive log synchronized.");
   }catch(error){
     notify("Dive-log sync failed: "+error.message+". No unverified cloud replacement.");
     if(/Cannot unlock|Unsupported or mismatched/.test(error.message)){password=null;passInput.value=""}
   }finally{
     busy=false;
     if(!disposed){render();if(pending){pending=false;queueMicrotask(()=>{void syncCloud()})}}
   }
 }
 form.addEventListener("submit",event=>{
   event.preventDefault();
   if(!backup)return;
   try{
     if(apply(addDiveEntry(backup,createDiveEntry(Object.fromEntries(new FormData(form)))))){
       form.reset();
     }
   }catch(error){notify(error.message)}
 });
 root.querySelector("#dive-log-list").addEventListener("click",event=>{
   const button=event.target.closest("[data-dive-log-delete]");
   if(!button||!backup||!confirm("Delete this private dive log record?"))return;
   try{apply(deleteDiveEntry(backup,button.dataset.diveLogDelete))}
   catch(error){notify(error.message)}
 });
 root.querySelector("#dive-log-export").addEventListener("click",()=>{
   if(!backup)return;
   download(backup,"folk-dive-log.json");notify("Plain JSON downloaded; keep the file private.");
 });
 root.querySelector("#dive-log-export-secure").addEventListener("click",async()=>{
   if(!backup)return;
   try{
     download(await encryptAccountVault(PURPOSE,backup,password||passInput.value),"folk-dive-log.enc.json");
     notify("Encrypted offline backup saved. The passphrase cannot be recovered.");
   }catch(error){notify("Encrypted export failed: "+error.message)}
 });
 // Recovery is local, explicit and does not remove any encrypted Drive file.
 root.querySelector("#dive-log-recovery-export").addEventListener("click",()=>{
   if(backup||unreadableLocalRaw===null)return;
   const href=URL.createObjectURL(new Blob([unreadableLocalRaw],
     {type:"text/plain;charset=utf-8"}));
   const a=document.createElement("a");
   a.href=href;a.download="folk-dive-log-unreadable-original.txt";a.click();
   setTimeout(()=>URL.revokeObjectURL(href),1000);
   recoveryExported=true;render();
   notify("Download started. Check that the unencrypted original is saved before resetting.");
 });
 root.querySelector("#dive-log-recovery-reset").addEventListener("click",()=>{
   if(backup||!recoveryExported||unreadableLocalRaw===null)return;
   if(!confirm("Have you saved the original unreadable file? Reset only this local dive-log profile? Encrypted Drive data will not be deleted."))return;
   try{
     // Another tab may have edited the value since the backup action.
     // Never remove bytes that are different from the exported snapshot.
     if(localStorage.getItem(key)!==unreadableLocalRaw){
       backup=readLocal();render();
       notify("Local data changed since export. Recheck and export the current original before resetting.");
       return;
     }
     localStorage.removeItem(key);
     password=null;passInput.value="";clearTimeout(timer);pending=false;
     lastSeenRaw=null;removedExternally=false;
     backup=readLocal();render();
     notify("Empty local dive-log profile opened after confirmation. Encrypted Drive data was not changed.");
   }catch{
     notify("Could not reset local storage. Existing data was not deliberately replaced.");
   }
 });
 const fileInput=root.querySelector("#dive-log-import");
 fileInput.addEventListener("change",async()=>{
   const file=fileInput.files?.[0];if(!file)return;
   try{
     if(!backup)throw Error("Local records unreadable");
     if(file.size>3_000_000)throw Error("File too large");
     const parsed=JSON.parse(await file.text());
     const decoded=parsed?.format==="folk-v2-private-vault"?
       await decryptAccountVault(PURPOSE,parsed,password||passInput.value):parsed;
     const imported=validateDiveLog(decoded);
     if(!confirm("Merge imported dives with this local account?"))return;
     if(apply(mergeDiveLogs(backup,imported)))
       notify("Dive-log records merged without dropping older independent entries.");
   }catch(error){notify("Import failed: "+error.message)}
   finally{fileInput.value=""}
 });
 root.querySelector("#dive-log-save-folder").addEventListener("click",()=>{
   if(!sub||busy)return;
   try{
     const id=validateAccountVaultFolder(folderInput.value.trim());
     if(id)localStorage.setItem(folderFor(sub),id);
     else localStorage.removeItem(folderFor(sub));
     notify("Dive-log folder saved for this Google account on this device.");
   }catch(error){notify(error.message)}
 });
 root.querySelector("#dive-log-sync").addEventListener("click",()=>{
   if(!sub||!backup||busy)return;
   if(!password){
     const value=passInput.value;
     if(value.length<12||value.length>1024){notify("Passphrase must contain 12–1024 characters.");return}
     if(!confirm("Enable encrypted Drive synchronization of your personal dive log for this account?"))return;
     password=value;passInput.value="";
   }
   void syncCloud();
 });
 root.querySelector("#dive-log-lock").addEventListener("click",()=>{
   password=null;passInput.value="";clearTimeout(timer);pending=false;
   render();notify("Dive log locked for this tab; Drive files were not deleted.");
 });
 const unsubscribe=subscribeGoogleSession(()=>{
   const next=accountId();if(next===sub)return;
   clearTimeout(timer);pending=false;password=null;passInput.value="";
   sub=next;key=keyFor(sub);lastSeenRaw=null;removedExternally=false;
   backup=readLocal();folderInput.value=folder()||"";
   render();notify("Dive log switched to the current storage profile.");
 });
 const onOtherTabChange=event=>{
   if(disposed||event.key!==key||event.storageArea!==localStorage)return;
   if(event.newValue===null&&lastSeenRaw!==null){
     removedExternally=true;backup=null;password=null;passInput.value="";
     clearTimeout(timer);pending=false;
     render();notify("Dive log removed in another tab. Reload before saving or syncing.");
     return;
   }
   backup=readLocal();render();
   if(backup)notify("Dive log updated from another browser tab.");
 };
 window.addEventListener("storage",onOtherTabChange);
 backup=readLocal();folderInput.value=folder()||"";render();
 return {
   selectSite(feature){
     const name=feature?.properties?.Navn;
     if(typeof name!=="string")return;
     form.elements.siteName.value=name;
     form.elements.siteId.value=String(feature.properties?.ID||"");
   },
   cleanup(){
     disposed=true;password=null;clearTimeout(timer);
     window.removeEventListener("storage",onOtherTabChange);
     unsubscribe();
   }
 };
}
