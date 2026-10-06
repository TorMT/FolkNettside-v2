import test from "node:test";
import assert from "node:assert/strict";
import {enrichElement,filterElements,stateAtTemperature,propertyValue,formattedProperty} from "../src/tools/periodic-table-core.js";

const iron=enrichElement({number:26,symbol:"Fe",name:"Iron",category:"transition metal",phase:"Solid",melt:1811,boil:3134,ionization_energies:[7.9]});
const helium=enrichElement({number:2,symbol:"He",name:"Helium",category:"noble gas",phase:"Gas",melt:.95,boil:4.22});

test("element enrichment adds searchable material and crystal metadata",()=>{
  assert.equal(iron.material_tag,"metal");
  assert.equal(iron.crystal_structure,"bcc");
  assert.ok(iron.searchable.includes("iron"));
});

test("temperature phase follows melt and boil points",()=>{
  assert.equal(stateAtTemperature(iron,298),"solid");
  assert.equal(stateAtTemperature(helium,2),"liquid");
  assert.equal(stateAtTemperature(helium,10),"gas");
});

test("filters combine search category and crystal",()=>{
  const list=[
    iron,
    helium,
    enrichElement({number:29,symbol:"Cu",name:"Copper",category:"transition metal",phase:"Solid"})
  ];
  assert.equal(filterElements(list,{search:"iron"}).length,1);
  assert.equal(filterElements(list,{category:"transition metal"}).length,2);
  assert.equal(filterElements(list,{crystal:"bcc"}).length,1);
});

test("first ionization helper reads the first value",()=>{
  assert.equal(propertyValue(iron,"first_ionization"),7.9);
});


test("period group material and crystal filters compose",()=>{
  const list=[
    enrichElement({number:26,symbol:"Fe",name:"Iron",category:"transition metal",phase:"Solid",period:4,group:8}),
    enrichElement({number:29,symbol:"Cu",name:"Copper",category:"transition metal",phase:"Solid",period:4,group:11}),
    enrichElement({number:14,symbol:"Si",name:"Silicon",category:"metalloid",phase:"Solid",period:3,group:14})
  ];
  assert.equal(filterElements(list,{period:"4"}).length,2);
  assert.equal(filterElements(list,{group:"11"}).length,1);
  assert.equal(filterElements(list,{material:"metalloid"}).length,1);
  assert.equal(filterElements(list,{crystal:"fcc"}).length,1);
});

test("formatted properties include units and fallback",()=>{
  assert.equal(formattedProperty({atomic_mass:55.845},"atomic_mass"),"55.845 u");
  assert.equal(formattedProperty({},"density"),"—");
});
