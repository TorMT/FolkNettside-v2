import test from "node:test";
import assert from "node:assert/strict";
import {extractDeckSurfaceCandidates,deckSurfaceAt,sampledDeckFootprint,
  worldDeckVertex,triangleCoversXY} from "../src/engineering/deck-surface-projection.js";
const top=[-2,-1,3, 2,-1,3, 2,1,3, -2,1,3];
const deck={
 id:"deck",name:"Main deck",type:"deck",metadata:{semantic:{role:"deck"}},
 geometry:{positions:top,indices:[0,1,2,0,2,3]}
};
const hull={
 id:"side",name:"Vertical shell",type:"hull",
 geometry:{positions:[-2,-1,0,2,-1,0,2,-1,3],indices:[0,1,2]}
};
const bounds=(x0,x1,y0,y1)=>({x0,x1,y0,y1});
test("deck candidates use world-space transform, units and actual horizontal triangles",()=>{
 const model={unitScaleToMeters:1,components:[deck,hull]};
 const surfaces=extractDeckSurfaceCandidates(model);
 assert.equal(surfaces.length,1);
 assert.equal(surfaces[0].declaredDeck,true);
 assert.equal(surfaces[0].triangles.length,2);
 assert.equal(surfaces[0].z,3);
 assert.ok(Math.abs(surfaces[0].areaM2-8)<1e-10);
 assert.equal(deckSurfaceAt(surfaces[0],1,0),true);
 assert.equal(deckSurfaceAt(surfaces[0],1.9,1.5),false);
 assert.deepEqual(sampledDeckFootprint(surfaces[0],bounds(-1,1,-.5,.5)),
   {accepted:true,coverage:1,checked:225});
 assert.equal(sampledDeckFootprint(surfaces[0],bounds(-1,1,-1.5,.5)).accepted,false);
});
test("visual shell horizontal faces are only unverified candidates, not invented decks",()=>{
 const model={components:[{...deck,name:"Hull plating",type:"hull",metadata:{}}]};
 const surfaces=extractDeckSurfaceCandidates(model);
 assert.equal(surfaces.length,1);
 assert.equal(surfaces[0].declaredDeck,false);
});
test("coplanar mesh faces respect metre scale and model transforms",()=>{
 const model={unitScaleToMeters:.001,components:[{...deck,
   geometry:{positions:top.map(v=>v*1000),indices:[0,1,2,0,2,3]},
   transform:[1,0,0,0,0,1,0,0,0,0,1,0,1000,0,2000,1]
 }]};
 const surfaces=extractDeckSurfaceCandidates(model);
 assert.equal(surfaces.length,1);
 assert.ok(Math.abs(surfaces[0].z-5)<1e-10);
 assert.equal(deckSurfaceAt(surfaces[0],2.5,0),true);
 assert.deepEqual(worldDeckVertex([1000,2000,3000],0,model.components[0].transform,.001),[2,2,5]);
});
test("projection does not accept gaps or triangles too steep to be deck surfaces",()=>{
 const model={components:[{...deck,geometry:{positions:top,indices:[0,1,2]}}]};
 const surface=extractDeckSurfaceCandidates(model)[0];
 assert.equal(triangleCoversXY(surface.triangles[0],-1.9,.9),false);
 assert.equal(sampledDeckFootprint(surface,bounds(-1.8,1.8,-.8,.8)).accepted,false);
 assert.equal(extractDeckSurfaceCandidates({components:[hull]}).length,0);
 assert.equal(extractDeckSurfaceCandidates({components:[deck]},{maxTriangles:1}).length,0);
});
