/**
 * Versioned, mergeable raw-material inventory. Legacy schema 1 imports without
 * altering the original backup. Tombstones prevent deleted rows reappearing.
 */
export const INVENTORY_MAX_ROWS=500;
export function validateIngredient(value){
 if(!value||typeof value!=="object")throw Error("Ingredient must be an object");
 const name=String(value.name||"").trim(),unit=String(value.unit||"").trim();
 const quantity=Number(value.quantity);
 if(!name||name.length>100)throw Error("Ingredient name is required (max 100 chars)");
 if(!["kg","g","L","mL","pcs"].includes(unit))throw Error("Choose a valid unit");
 if(!Number.isFinite(quantity)||quantity<0||quantity>1e8)throw Error("Quantity must be a nonnegative number");
 return {name,quantity,unit};
}
export function ingredientId(value){
 const {name,unit}=validateIngredient(value);
 return "ingredient:"+encodeURIComponent(name.toLowerCase())+":"+unit;
}
export function parseIngredientArchive(input){
 if(!input||input.schemaVersion!==1||!Array.isArray(input.items)||input.items.length>INVENTORY_MAX_ROWS)
  throw Error("Invalid ingredients archive");
 return input.items.map(validateIngredient);
}
export function newInventory(entries=[]){
 return validateInventory({schemaVersion:2,entries});
}
export function validateInventory(input){
 if(!input||input.schemaVersion!==2||!Array.isArray(input.entries)||input.entries.length>INVENTORY_MAX_ROWS)
  throw Error("Invalid inventory version");
 const ids=new Set();
 for(const row of input.entries){
  if(!row||typeof row.id!=="string"||!row.id.startsWith("ingredient:")||ids.has(row.id)||
    !Number.isFinite(Date.parse(row.updatedAt))||typeof row.deleted!=="boolean")
   throw Error("Invalid or duplicate inventory entry");
  if(!row.deleted&&ingredientId(row)!==row.id)throw Error("Inventory ID mismatch");
  if(row.deleted&&("name" in row||"quantity" in row||"unit" in row))
   throw Error("Inventory tombstone must not retain ingredient values");
  if(!row.deleted)validateIngredient(row);
  ids.add(row.id);
 }
 if(JSON.stringify(input).length>500_000)throw Error("Inventory exceeds 500 KB");
 return input;
}
export function importInventory(input,at=new Date().toISOString()){
 if(input?.schemaVersion===2)return validateInventory(input);
 const items=parseIngredientArchive(input),rows=new Map();
 for(const item of items)rows.set(ingredientId(item),{...item,id:ingredientId(item),updatedAt:at,deleted:false});
 return newInventory([...rows.values()]);
}
export function upsertInventory(backup,value,at=new Date().toISOString()){
 validateInventory(backup);
 const ingredient=validateIngredient(value),id=ingredientId(ingredient);
 const entries=backup.entries.filter(row=>row.id!==id);
 entries.push({...ingredient,id,updatedAt:at,deleted:false});
 return newInventory(entries.sort((a,b)=>a.id.localeCompare(b.id)));
}
export function deleteInventory(backup,id,at=new Date().toISOString()){
 validateInventory(backup);
 const existing=backup.entries.find(row=>row.id===id);
 if(!existing)throw Error("Unknown inventory entry");
 const entries=backup.entries.filter(row=>row.id!==id);
 entries.push({id,updatedAt:at,deleted:true});
 return newInventory(entries.sort((a,b)=>a.id.localeCompare(b.id)));
}
export function mergeInventory(a,b){
 validateInventory(a);validateInventory(b);
 const map=new Map();
 for(const row of [...a.entries,...b.entries]){
  const old=map.get(row.id);
  if(!old||Date.parse(row.updatedAt)>Date.parse(old.updatedAt)||
    (row.updatedAt===old.updatedAt&&row.deleted&&!old.deleted))
   map.set(row.id,row);
 }
 return newInventory([...map.values()].sort((x,y)=>x.id.localeCompare(y.id)));
}
export function visibleInventory(backup){
 return validateInventory(backup).entries.filter(row=>!row.deleted).sort((a,b)=>a.name.localeCompare(b.name,"no"));
}
