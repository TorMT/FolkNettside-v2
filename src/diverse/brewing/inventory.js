const STORAGE="folk-v2-brewing-ingredients-v1";
const html=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function validateIngredient(value){
 if(!value||typeof value!=="object")throw Error("Ingredient must be an object");
 const name=String(value.name||"").trim(),unit=String(value.unit||"").trim();
 const quantity=Number(value.quantity);
 if(!name||name.length>100)throw Error("Ingredient name is required (max 100 chars)");
 if(!["kg","g","L","mL","pcs"].includes(unit))throw Error("Choose a valid unit");
 if(!Number.isFinite(quantity)||quantity<0||quantity>1e8)throw Error("Quantity must be a nonnegative number");
 return {name,quantity,unit};
}
export function parseIngredientArchive(input){
 if(!input||input.schemaVersion!==1||!Array.isArray(input.items)||input.items.length>500)throw Error("Invalid ingredients archive");
 return input.items.map(validateIngredient);
}
export function mountBrewingIngredients(root){
 if(!root)return()=>{};
 let rows=[];
 try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'{"schemaVersion":1,"items":[]}');rows=parseIngredientArchive(saved)}
 catch{rows=[]}
 const save=()=>localStorage.setItem(STORAGE,JSON.stringify({schemaVersion:1,items:rows}));
 root.innerHTML=`<h2>Raw material inventory</h2><p>Local V2 inventory. This does not pretend to contain the legacy server's stock records. Import a backup to restore your data.</p>
 <form id="brew-ingredient-form" class="toolbar-row">
 <input required maxlength="100" name="name" placeholder="Ingredient name">
 <input required min="0" step="any" type="number" name="quantity" placeholder="Amount">
 <select name="unit"><option>kg</option><option>g</option><option>L</option><option>mL</option><option>pcs</option></select>
 <button class="btn" type="submit">Add</button></form>
 <div id="brew-inventory-list"></div><div class="toolbar-row">
 <button class="btn" type="button" id="brew-inventory-export">Export JSON</button>
 <label class="btn">Import JSON<input id="brew-inventory-import" type="file" accept=".json" hidden></label></div>
 <p id="brew-inventory-message" aria-live="polite"></p>`;
 const msg=root.querySelector("#brew-inventory-message");
 const display=()=>{
   const list=root.querySelector("#brew-inventory-list");
   list.innerHTML=rows.length?`<table><thead><tr><th>Ingredient</th><th>Amount</th><th></th></tr></thead><tbody>${rows.map((item,i)=>`<tr><td>${html(item.name)}</td><td>${html(item.quantity)} ${html(item.unit)}</td><td><button type="button" data-ingredient-remove="${i}" class="btn">Remove</button></td></tr>`).join("")}</tbody></table>`:"<p>No local ingredients yet.</p>";
   list.querySelectorAll("[data-ingredient-remove]").forEach(button=>button.addEventListener("click",()=>{
     rows.splice(Number(button.dataset.ingredientRemove),1);save();display();
   }));
 };
 root.querySelector("#brew-ingredient-form").addEventListener("submit",e=>{
   e.preventDefault();
   try{rows.push(validateIngredient(Object.fromEntries(new FormData(e.currentTarget))));save();display();e.currentTarget.reset();msg.textContent="Saved locally."}
   catch(error){msg.textContent=error.message}
 });
 root.querySelector("#brew-inventory-export").addEventListener("click",()=>{
   const objectUrl=URL.createObjectURL(new Blob([JSON.stringify({schemaVersion:1,items:rows},null,2)],{type:"application/json"}));
   const a=document.createElement("a");a.href=objectUrl;a.download="brewing-ingredients.json";a.click();
   setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
 });
 root.querySelector("#brew-inventory-import").addEventListener("change",async e=>{
   const file=e.target.files?.[0];if(!file)return;
   try{if(file.size>128_000)throw Error("Backup exceeds 128 KB");
     const imported=parseIngredientArchive(JSON.parse(await file.text()));
     if(!confirm("Replace all current local raw materials with this backup?"))return;
     rows=imported;save();display();msg.textContent="Imported backup."}
   catch(error){msg.textContent="Import failed: "+error.message}
 });
 display();
 return ()=>{};
}
