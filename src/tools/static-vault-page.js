import {encryptVault} from "../viewers/vault-core.js?v=c314d33bbaad672fe8cee5ba13143c9415125fb5";
function downloadBlob(blob,filename){
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=filename;a.click();
 setTimeout(()=>URL.revokeObjectURL(url),800);
}
export function staticVaultPageHTML(){
 return `<main class="tool-page vault-tool-page"><div class="crumbs">Tools / Encrypted resources</div>
 <header class="tool-header"><div><span class="project-kicker">Privacy on a static site</span>
 <h1>Encrypt a resource</h1><p>Encrypt locally before including the result in a public GitHub Pages course folder.
 The original file and passphrase never leave this browser. No Google login or backend required.</p></div></header>
 <section class="panel-card brew-card"><h2>Create .vault.json</h2>
 <form id="vault-encrypt-form" class="vault-form">
 <label>File to encrypt (up to 25 MiB)<input id="vault-source" type="file" required></label>
 <label>Strong passphrase (20+ characters)<input id="vault-passphrase" type="password"
 autocomplete="new-password" minlength="20" maxlength="512" required></label>
 <label>Repeat passphrase<input id="vault-confirm" type="password"
 autocomplete="new-password" minlength="20" maxlength="512" required></label>
 <button type="submit" class="btn primary">Encrypt locally</button>
 </form><p id="vault-encrypt-status" role="status" aria-live="polite"></p>
 </section>
 <section class="panel-card brew-card"><h2>Publish securely</h2>
 <p>Download the generated encrypted file. Only add that <code>.vault.json</code> file
 to a public course folder and run SiteUpdater. Keep the original private and
 share its passphrase separately. Students can open the file in the Courses viewer
 and unlock it locally.</p>
 <p><strong>Limit:</strong> Because ciphertext is public, weak passphrases can be attacked offline.
 Encryption cannot revoke a shared key, distinguish individual users or prevent redistribution
 after decryption. Highly sensitive documents must stay outside GitHub Pages.</p></section></main>`;
}
export function bindStaticVaultPage(root){
 const form=root.querySelector("#vault-encrypt-form"),status=root.querySelector("#vault-encrypt-status");
 if(!form)return ()=>{};
 let disposed=false;
 const onSubmit=async event=>{
  event.preventDefault();
  const button=form.querySelector('[type="submit"]'),file=form.querySelector("#vault-source").files?.[0];
  const password=form.querySelector("#vault-passphrase"),confirm=form.querySelector("#vault-confirm");
  const phrase=password.value;
  password.value="";const match=confirm.value;confirm.value="";
  if(!file){status.textContent="Choose a local file";return}
  if(phrase!==match){status.textContent="Passphrases do not match";return}
  if(file.size>25*1024*1024){status.textContent="File exceeds 25 MiB";return}
  button.disabled=true;status.textContent="Deriving key and encrypting on this device…";
  try{
    const result=await encryptVault(await file.arrayBuffer(),phrase,{mime:file.type});
    if(disposed)return;
    downloadBlob(new Blob([JSON.stringify(result)+"\n"],{type:"application/json"}),"protected-resource.vault.json");
    status.textContent="Encrypted archive downloaded. Keep the original file off the public site.";
  }catch(error){if(!disposed)status.textContent=String(error?.message||error)}
  finally{button.disabled=false}
 };
 form.addEventListener("submit",onSubmit);
 return ()=>{disposed=true;form.removeEventListener("submit",onSubmit);form.reset()};
}
