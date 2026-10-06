import test from "node:test";
import assert from "node:assert/strict";
import {acceptedChemFile,chemActionForEvent,normalizedHotkey} from "../src/tools/chem-editor-core.js";

test("chemical editor accepts the legacy import formats",()=>{
  for(const name of ["a.mol","a.sdf","a.rxn","a.json","a.kcx","a.cml","a.smi","a.smiles","a.txt"])assert.equal(acceptedChemFile(name),true);
  assert.equal(acceptedChemFile("a.pdf"),false);
});

test("chemical editor preserves legacy hotkeys",()=>{
  const event=(key,extra={})=>({key,ctrlKey:true,metaKey:false,shiftKey:false,...extra});
  assert.equal(normalizedHotkey(event("z")),"ctrl+z");
  assert.equal(chemActionForEvent(event("z")),"undo");
  assert.equal(chemActionForEvent(event("z",{shiftKey:true})),"redo");
  assert.equal(chemActionForEvent(event("m")),"exportMol");
  assert.equal(chemActionForEvent(event("e")),"exportSmiles");
  assert.equal(chemActionForEvent(event("k")),"copySmiles");
  assert.equal(chemActionForEvent(event("n")),"new");
  assert.equal(chemActionForEvent(event("i")),"import");
});