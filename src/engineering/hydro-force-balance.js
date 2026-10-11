/**
 * Still-water force bookkeeping at the currently displayed reference draft.
 * Opposing resultants: buoyancy = rho_water*g*displaced volume through CB,
 * gravity = g*entered mass through CG. Areas/points are mass, not forces.
 * Neither a local pressure distribution nor a coupled trim/heel solver.
 */
const G=9.80665;
const finite=n=>typeof n==="number"&&Number.isFinite(n);
export function hydroForceBalance({
  hydroResult,densityKgM3=1025,loadedMass=null,centerOfGravity=null
}={}){
  const volume=hydroResult?.volume,density=densityKgM3,cb=hydroResult?.centerOfBuoyancy;
  if(!finite(volume)||volume<0||!finite(density)||density<=0||
    !Array.isArray(cb)||cb.length!==3||!cb.every(finite))
    throw new Error("Hydro force display requires valid submerged volume, water density and CB");
  const buoyancyKN=volume*density*G/1000;
  if(!finite(buoyancyKN))throw new Error("Buoyancy exceeds numeric limits");
  // Some legacy analyses only return aggregate hydrostatics. Never invent
  // per-component buoyancy when their decomposed volumes are unavailable.
  const components=(hydroResult.components||[]).flatMap((component,index)=>{
    if(component.volume===undefined||component.centerOfBuoyancy===undefined)return [];
    if(!finite(component.volume)||component.volume<0||
      !Array.isArray(component.centerOfBuoyancy)||component.centerOfBuoyancy.length!==3||
      !component.centerOfBuoyancy.every(finite))
      throw new Error("Invalid submerged volume / CB for component "+(index+1));
    return [{
      id:component.componentId??index,
      name:String(component.name||"Hull component "+(index+1)),
      displacedM3:component.volume,
      buoyancyKN:component.volume*density*G/1000,
      centerOfBuoyancy:[...component.centerOfBuoyancy]
    }];
  });
  const hasMass=loadedMass!==null&&loadedMass!==undefined;
  if(hasMass&&(!finite(loadedMass)||loadedMass<=0))
    throw new Error("Entered hull and load mass must be finite and positive");
  const gravityKN=hasMass?loadedMass*G:null;
  if(hasMass&&!finite(gravityKN))throw new Error("Gravity exceeds numeric limits");
  const cg=Array.isArray(centerOfGravity)&&centerOfGravity.length===3&&
    centerOfGravity.every(finite)?[...centerOfGravity]:null;
  const residualKN=hasMass?buoyancyKN-gravityKN:null;
  const toleranceKN=hasMass?Math.max(0.01,Math.max(buoyancyKN,gravityKN)*.001):null;
  return {
    waterDensityKgM3:density,referenceVolumeM3:volume,
    buoyancyKN,gravityKN,residualKN,
    centerOfBuoyancy:[...cb],centerOfGravity:hasMass?cg:null,
    massKnown:hasMass,positionKnown:hasMass&&Boolean(cg),
    components,gravityMassTonnes:hasMass?loadedMass:null,
    balanced:hasMass&&Math.abs(residualKN)<=toleranceKN,
    toleranceKN,
    scope:"Upright still-water reference draft; buoyancy is not distributed structural pressure"
  };
}
export function hydroForceInputs({
  pointWeightSummary=null,hullMassText="",kg="",lcg="",tcg=""
}={}){
  if(pointWeightSummary){
    return {loadedMass:pointWeightSummary.totalMassTonnes,
      centerOfGravity:pointWeightSummary.centerOfGravity};
  }
  const raw=String(hullMassText??"").trim();
  const mass=raw!==""?Number(raw):null;
  if(mass===null||!Number.isFinite(mass)||mass<=0)
    return {loadedMass:null,centerOfGravity:null};
  const coordinates=[lcg,tcg,kg];
  const cg=coordinates.every(v=>v!==null&&v!==undefined&&String(v).trim()!==""&&
    Number.isFinite(Number(v)))?coordinates.map(Number):null;
  return {loadedMass:mass,centerOfGravity:cg};
}
