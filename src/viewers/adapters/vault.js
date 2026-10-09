import {decryptVault,safeVaultMime,assertVaultEnvelope} from "../vault-core.js";
import {escapeHTML} from "../utils.js";

/** Static host vault: even knowing this URL reveals ciphertext only. */
export async function render(container,resource){
 const uri=resource.url||resource.path;
 const parsed=new URL(uri,location.href);
 if(parsed.origin!==location.origin)throw Error("Encrypted resources must be same-origin");
 const response=await fetch(parsed,{cache:"no-store"});
 if(!response.ok)throw Error("Encrypted file unavailable (HTTP "+response.status+")");
 const vault=await response.json();
 assertVaultEnvelope(vault);
 const status=document.createElement("p");status.setAttribute("role","status");
 const section=document.createElement("section");section.className="vault-view";
 section.innerHTML=`<h2>Encrypted resource</h2>
   <p>The stored file is encrypted before publishing. Unlocking happens only in your browser.
   A weak password can still be guessed offline; never use this for highly sensitive records.</p>
   <form class="vault-form">
     <label>Passphrase <input type="password" required autocomplete="off" minlength="20" maxlength="512"></label>
     <button class="btn primary" type="submit">Unlock in browser</button>
   </form><div class="vault-preview"></div>`;
 section.insertBefore(status,section.querySelector(".vault-preview"));
 container.replaceChildren(section);
 const form=section.querySelector("form"),secret=form.querySelector("input"),preview=section.querySelector(".vault-preview");
 let activeURL=null,disposed=false;
 const clear=()=>{if(activeURL)URL.revokeObjectURL(activeURL);activeURL=null;preview.replaceChildren()};
 form.addEventListener("submit",async event=>{
   event.preventDefault();
   const phrase=secret.value;secret.value=""; // Never keep submitted phrase in the DOM.
   const submit=form.querySelector("button");submit.disabled=true;
   clear();status.textContent="Deriving decryption key locally…";
   try{
     const bytes=await decryptVault(vault,phrase);
     if(disposed)return;
     const mime=safeVaultMime(vault);
     const blob=new Blob([bytes],{type:mime});
     activeURL=URL.createObjectURL(blob);
     status.textContent="Unlocked locally. Contents are not uploaded.";
     if(mime.startsWith("image/")){
       const img=document.createElement("img");
       img.src=activeURL;img.alt="Decrypted local preview";
       img.style.cssText="display:block;max-width:100%;max-height:78vh;margin:12px auto";
       preview.append(img);
     }else if(mime.startsWith("text/")||mime==="application/json"){
       const pre=document.createElement("pre");
       pre.className="code-view";pre.textContent=new TextDecoder("utf-8",{fatal:true}).decode(bytes);
       preview.append(pre);
     }else if(mime==="application/pdf"){
       const frame=document.createElement("iframe");
       frame.title="Decrypted PDF";frame.src=activeURL;
       frame.style.cssText="width:100%;height:70vh;border:0";
       preview.append(frame);
     }
     const dl=document.createElement("a");dl.className="btn";
     dl.href=activeURL;dl.download="unlocked-resource";
     dl.textContent="Save decrypted file locally";
     preview.append(dl);
   }catch(error){if(!disposed)status.textContent=String(error.message||error)}
   finally{submit.disabled=false}
 });
 return {info:"Encrypted static file · unlock locally",cleanup:()=>{disposed=true;secret.value="";clear()}};
}
