export const CHEM_IMPORT_EXTENSIONS=["mol","sdf","rxn","json","kcx","cml","smi","smiles","txt"];

export const CHEM_HOTKEYS={
  "ctrl+z":"undo",
  "ctrl+shift+z":"redo",
  "ctrl+y":"redo",
  "ctrl+l":"clean",
  "ctrl+m":"exportMol",
  "ctrl+e":"exportSmiles",
  "ctrl+k":"copySmiles",
  "ctrl+n":"new",
  "ctrl+i":"import"
};

export function normalizedHotkey(event){
  if(!(event.ctrlKey||event.metaKey))return null;
  const parts=["ctrl"];
  if(event.shiftKey)parts.push("shift");
  parts.push(String(event.key||"").toLowerCase());
  return parts.join("+");
}

export function chemActionForEvent(event){
  return CHEM_HOTKEYS[normalizedHotkey(event)]||null;
}

export function acceptedChemFile(name){
  const ext=String(name||"").split(".").pop()?.toLowerCase()||"";
  return CHEM_IMPORT_EXTENSIONS.includes(ext);
}