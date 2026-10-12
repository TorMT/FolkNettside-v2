import {getGoogleSessionSnapshot,subscribeGoogleSession} from "../../platform/google-session.js?v=f5b1d9e30c3521ab27a462ab0b2fdd77ba0e851f";
import {
  readAccountVault,writeAccountVault,encryptAccountVault,decryptAccountVault,
  validateAccountVaultFolder
} from "../../platform/account-vault-sync.js?v=f5b1d9e30c3521ab27a462ab0b2fdd77ba0e851f";
import {
  validateIngredient,parseIngredientArchive,ingredientId,validateInventory,newInventory,
  importInventory,upsertInventory,deleteInventory,mergeInventory,visibleInventory
} from "./inventory-model.js?v=f5b1d9e30c3521ab27a462ab0b2fdd77ba0e851f";
export {validateIngredient,parseIngredientArchive} from "./inventory-model.js?v=f5b1d9e30c3521ab27a462ab0b2fdd77ba0e851f";

const STORAGE="folk-v2-brewing-ingredients-v1";
const PURPOSE="brew-inventory";
const html=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const accountId=()=>{const s=getGoogleSessionSnapshot();return s.status==="signed-in"&&s.profile?.sub?s.profile.sub:""};
const storageKey=sub=>STORAGE+(sub?":"+sub:"");
const folderKey=sub=>"folk-v2:brew-inventory-folder:"+sub;

export function mountBrewingIngredients(root){
 if(!root)return()=>{};
 let disposed=false,sub=accountId(),key=storageKey(sub),backup=newInventory(),passphrase=null;
 let busy=false,pending=false,timer=null;
 root.innerHTML='<h2>Raw material inventory</h2>'+
 '<p>Own local inventory (not legacy server stock). Signed-in accounts have separate storage. Cloud backup is encrypted before upload; legacy brewing logs still use their separate service.</p>'+
 '<form id="brew-ingredient-form" class="toolbar-row">'+
 '<input required maxlength="100" name="name" placeholder="Ingredient name">'+
 '<input required min="0" step="any" type="number" name="quantity" placeholder="Amount">'+
 '<select name="unit"><option>kg</option><option>g</option><option>L</option><option>mL</option><option>pcs</option></select>'+
 '<button class="btn" type="submit">Save / update</button></form>'+
 '<div id="brew-inventory-list"></div>'+
 '<div class="toolbar-row"><button class="btn" type="button" id="brew-inventory-export">Export JSON (not encrypted)</button>'+
 '<button class="btn" type="button" id="brew-inventory-export-secure">Export encrypted</button>'+
 '<label class="btn">Import JSON or encrypted<input id="brew-inventory-import" type="file" accept=".json" hidden></label></div>'+
 '<section class="medisin-sync-panel" aria-label="Encrypted inventory sync">'+
 '<div><strong>Inventory · Google Drive</strong><p id="brew-inventory-cloud-state"></p>'+
 '<small>Cloud sync is optional. Use the same folder and passphrase on each device. Passwords are never stored. This only syncs this inventory, not old PHP brewing records.</small></div>'+
 '<div class="medisin-buttons"><label>Passphrase<input type="password" id="brew-inventory-password" minlength="12" autocomplete="new-password" placeholder="At least 12 characters"></label>'+
 '<label>Drive folder ID (optional)<input type="text" id="brew-inventory-folder" autocomplete="off" spellcheck="false" placeholder="Empty = My Drive"></label>'+
 '<button class="btn" type="button" id="brew-inventory-folder-save">Save folder</button>'+
 '<button class="btn" type="button" id="brew-inventory-cloud">Unlock / sync</button>'+
 '<button class="btn" type="button" id="brew-inventory-cloud-disable">Lock and stop sync</button></div></section>'+
 '<p id="brew-inventory-message" aria-live="polite"></p>';
 const msg=root.querySelector("#brew-inventory-message");
 const state=root.querySelector("#brew-inventory-cloud-state");
 const passInput=root.querySelector("#brew-inventory-password");
 const folderInput=root.querySelector("#brew-inventory-folder");
 const notify=t=>{if(!disposed)msg.textContent=t};
 const getFolder=()=>{
   try{return sub?validateAccountVaultFolder(localStorage.getItem(folderKey(sub))):null}
   catch{return null}
 };
 const readLocal=()=>{
   try{
     const raw=localStorage.getItem(key);
     return raw?importInventory(JSON.parse(raw)):newInventory();
   }catch(error){
     notify("Stored inventory is invalid: "+error.message+". It has NOT been overwritten.");
     return null;
   }
 };
 const saveLocal=value=>{
   validateInventory(value);
   localStorage.setItem(key,JSON.stringify(value));
   backup=value;render();
 };
 const render=()=>{
   const list=root.querySelector("#brew-inventory-list");
   if(!backup){list.textContent="Cannot load this local inventory. Export or restore the original data before editing.";return}
   const rows=visibleInventory(backup);
   list.innerHTML=rows.length?'<table><thead><tr><th>Ingredient</th><th>Amount</th><th></th></tr></thead><tbody>'+
     rows.map(item=>'<tr><td>'+html(item.name)+'</td><td>'+html(item.quantity)+' '+html(item.unit)+
       '</td><td><button type="button" class="btn" data-ingredient-remove="'+html(item.id)+'">Remove</button></td></tr>').join("")+
     '</tbody></table>':"<p>No materials recorded for this account.</p>";
   const signedIn=Boolean(sub);
   state.textContent=signedIn?(passphrase?"Unlocked for this tab · "+getGoogleSessionSnapshot().profile?.email:
     "Signed in · encrypted sync locked until explicitly activated."):"Local guest inventory · sign in through Settings to use Drive.";
   root.querySelector("#brew-inventory-cloud").disabled=!signedIn||busy||!backup;
   root.querySelector("#brew-inventory-folder-save").disabled=!signedIn||busy;
   root.querySelector("#brew-inventory-cloud-disable").disabled=!passphrase;
   folderInput.disabled=!signedIn||busy;
 };
 function schedule(){
   if(!passphrase||!sub||!backup)return;
   clearTimeout(timer);
   timer=setTimeout(()=>{void syncCloud()},900);
 }
 function apply(next){
   try{saveLocal(next);notify("Saved locally.");schedule()}
   catch(error){notify("Save failed: "+error.message)}
 }
 async function syncCloud(){
   if(busy){pending=true;return}
   if(!sub||!passphrase||!backup||disposed)return;
   const currentSub=sub,currentPass=passphrase,folderId=getFolder();
   busy=true;render();state.textContent="Reading and merging encrypted Drive inventory…";
   try{
     const remote=await readAccountVault(currentSub,PURPOSE,currentPass,{folderId});
     if(disposed||sub!==currentSub||passphrase!==currentPass)return;
     const local=readLocal();
     if(!local)throw new Error("Local data invalid; cannot merge safely");
     const merged=remote?mergeInventory(local,validateInventory(remote.data)):local;
     saveLocal(merged);
     if(merged.entries.length&&(!remote||JSON.stringify(merged.entries)!==JSON.stringify(remote.data.entries))){
       await writeAccountVault(currentSub,PURPOSE,currentPass,merged,{
         folderId,expectedRevision:remote?.revision||null});
     }
     notify("Encrypted Drive inventory synchronized.");
   }catch(error){
     notify("Cloud sync failed: "+error.message+". Local data retained; no blind overwrite.");
     if(/Cannot unlock|Unsupported or mismatched/.test(error.message)){passphrase=null;passInput.value=""}
   }finally{
     busy=false;
     if(!disposed){render();if(pending){pending=false;queueMicrotask(()=>{void syncCloud()})}}
   }
 }
 function download(payload,name){
   const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
   const a=document.createElement("a");a.href=url;a.download=name;a.click();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 root.querySelector("#brew-ingredient-form").addEventListener("submit",e=>{
   e.preventDefault();if(!backup)return;
   try{apply(upsertInventory(backup,Object.fromEntries(new FormData(e.currentTarget))));e.currentTarget.reset()}
   catch(error){notify(error.message)}
 });
 root.querySelector("#brew-inventory-list").addEventListener("click",e=>{
   const button=e.target.closest("[data-ingredient-remove]");
   if(!button||!backup||!confirm("Remove this material?"))return;
   try{apply(deleteInventory(backup,button.dataset.ingredientRemove))}
   catch(error){notify(error.message)}
 });
 root.querySelector("#brew-inventory-export").addEventListener("click",()=>{
   if(!backup)return;download(backup,"brewing-ingredients.json");notify("Unencrypted JSON downloaded; store it privately.");
 });
 root.querySelector("#brew-inventory-export-secure").addEventListener("click",async()=>{
   if(!backup)return;
   const password=passphrase||passInput.value;
   try{
     download(await encryptAccountVault(PURPOSE,backup,password),"brewing-ingredients.enc.json");
     notify("Encrypted offline backup saved. Retain the passphrase separately.");
   }catch(error){notify("Encryption failed: "+error.message)}
 });
 const importInput=root.querySelector("#brew-inventory-import");
 importInput.addEventListener("change",async()=>{
   const file=importInput.files?.[0];if(!file)return;
   try{
     if(!backup)throw Error("Existing inventory unreadable; fix local storage first");
     if(file.size>750_000)throw Error("Import exceeds 750 KB");
     const value=JSON.parse(await file.text());
     const decrypted=value?.format==="folk-v2-private-vault"?
       await decryptAccountVault(PURPOSE,value,passphrase||passInput.value):value;
     const imported=importInventory(decrypted);
     if(!confirm("Merge this imported inventory into your current account? Newer entries win."))return;
     apply(mergeInventory(backup,imported));notify("Inventory merged; existing items retained unless a newer deletion applies.");
   }catch(error){notify("Import failed: "+error.message)}
   finally{importInput.value=""}
 });
 root.querySelector("#brew-inventory-folder-save").addEventListener("click",()=>{
   if(!sub||busy)return;
   try{
     const folder=validateAccountVaultFolder(folderInput.value.trim());
     if(folder)localStorage.setItem(folderKey(sub),folder);
     else localStorage.removeItem(folderKey(sub));
     notify("Drive folder saved for this account on this device.");
   }catch(error){notify(error.message)}
 });
 root.querySelector("#brew-inventory-cloud").addEventListener("click",()=>{
   if(!sub||busy||!backup)return;
   if(!passphrase){
     const password=passInput.value;
     if(password.length<12||password.length>1024){notify("Passphrase must have 12–1024 characters.");return}
     if(!confirm("Enable encrypted Google Drive inventory synchronization for this account? Old brewing server records will not be changed."))return;
     passphrase=password;passInput.value="";
   }
   void syncCloud();
 });
 root.querySelector("#brew-inventory-cloud-disable").addEventListener("click",()=>{
   clearTimeout(timer);pending=false;passphrase=null;passInput.value="";
   notify("Inventory cloud sync locked for this tab. Drive files were not deleted.");render();
 });
 const unsubscribe=subscribeGoogleSession(()=>{
   const next=accountId();
   if(next===sub)return;
   clearTimeout(timer);pending=false;passphrase=null;passInput.value="";
   sub=next;key=storageKey(sub);backup=readLocal();
   folderInput.value=getFolder()||"";notify("Inventory changed to the current account storage.");render();
 });
 backup=readLocal();folderInput.value=getFolder()||"";render();
 return ()=>{disposed=true;passphrase=null;clearTimeout(timer);unsubscribe()};
}
