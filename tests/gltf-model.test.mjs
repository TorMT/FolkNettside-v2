import test from "node:test";
import assert from "node:assert/strict";
import {gltfEngineeringPoint,gltfPartDescriptor,gltfPartSemantic} from "../src/model/parsers/gltf.js";
import {applyModelRules} from "../src/model/load-model.js";

test("glTF Y-up coordinates map to Engineering Z-up",()=>{
  assert.deepEqual(gltfEngineeringPoint([3,4,5]),[3,-5,4]);
  assert.deepEqual(gltfEngineeringPoint([3,4,5],"z-up"),[3,4,5]);
  assert.throws(()=>gltfEngineeringPoint([0,0,0],"bad"),/Unsupported/);
});

test("Gunnerus published part ids map to semantic engineering roles",()=>{
  assert.deepEqual(gltfPartSemantic({node:"part19",label:"PM azimuth drive, port"}),{
    role:"thruster",subtype:"azimuth",subsystem:"propulsion",tags:["stern","port"]
  });
  assert.deepEqual(gltfPartSemantic({node:"part20",label:"PM azimuth drive, starboard"}),{
    role:"thruster",subtype:"azimuth",subsystem:"propulsion",tags:["stern","starboard"]
  });
  assert.deepEqual(gltfPartSemantic({node:"part23",label:"Bow tunnel thruster 200 kW"}),{
    role:"thruster",subtype:"tunnel",subsystem:"propulsion",tags:["bow"]
  });
  assert.equal(gltfPartSemantic({node:"part00",group_key:"hull"}).role,"hull");
});

test("glTF part descriptor retains published SFI provenance",()=>{
  const descriptor=gltfPartDescriptor({
    node:"part23",sfi:"6",group:"Propulsion and machinery",group_key:"g4",
    item:"75",label:"Bow tunnel thruster 200 kW",objects:14,source_triangles:45046
  });
  assert.equal(descriptor.id,"gltf-part23");
  assert.equal(descriptor.name,"Bow tunnel thruster 200 kW");
  assert.equal(descriptor.semantic.subtype,"tunnel");
  assert.equal(descriptor.sourceMetadata.sfi,"6");
  assert.equal(descriptor.sourceMetadata.sourceTriangles,45046);
});

test("model rules match source object ids and do not silently enable hydro",()=>{
  const model={components:[{
    id:"gltf-part19",name:"PM azimuth drive, port",sourceObjectId:"part19",
    metadata:{semantic:{role:"thruster",subtype:"azimuth"}}
  }]};
  applyModelRules(model,[{
    match:"^part19$",
    semantic:{subsystem:"propulsion",tags:["sourced"]},
    propulsion:{ratedPowerKw:500}
  }]);
  assert.equal(model.components[0].metadata.hydro,undefined);
  assert.equal(model.components[0].metadata.semantic.subsystem,"propulsion");
  assert.deepEqual(model.components[0].metadata.semantic.tags,["sourced"]);
  assert.equal(model.components[0].metadata.propulsion.ratedPowerKw,500);
});
