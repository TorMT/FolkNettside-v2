/**
 * Couple a validated hydrostatic pressure field to a longitudinal Euler beam.
 * This is a declared LINE-LOAD IDEALISATION, not a shell-FEM pressure transfer.
 *
 * Every station is mapped to:
 *  - uniform qz = Fz / Δx (N/m), plus
 *  - equal and opposite nodal forces at its ends to conserve ∫x dFz.
 *
 * Nodal correction is a first-moment-preserving FE projection, not an
 * independently applied physical load. Summed vertical force and its X first
 * moment are conserved before the beam solver is allowed to run.
 */
const finite=v=>typeof v==="number"&&Number.isFinite(v);
export function projectPressureToBeam(pressure,{xMin,xMax}={}){
  if(!pressure?.crossCheck?.passed||!pressure?.stationAudit?.passed)
    throw Error("Pressure-to-beam requires passing Hydro force/moment AND station integration checks");
  if(!finite(xMin)||!finite(xMax)||!(xMax>xMin))
    throw Error("Beam X bounds must be finite and increasing");
  const strips=pressure.strips;
  if(!Array.isArray(strips)||strips.length<2||strips.length>120)
    throw Error("Pressure integration needs between 2 and 120 station strips");
  const span=xMax-xMin,tol=Math.max(1e-7*span,1e-8);
  const lineLoads=[],nodalCorrections=[],audited=[];
  let totalForceN=0,totalFirstMomentXN=0,projectedForceN=0,projectedMomentXN=0;
  for(const [i,s] of strips.entries()){
    const {x0,x1,forceZKN,firstMomentXN}=s;
    if(![x0,x1,forceZKN,firstMomentXN].every(finite)||!(x1>x0)||
      x0<xMin-tol||x1>xMax+tol)
      throw Error("Pressure station "+(i+1)+" has invalid coordinates, force moments, or extends outside structural beam");
    const L=x1-x0,forceN=forceZKN*1000,mid=(x0+x1)/2;
    const uniformMomentXN=forceN*mid;
    const deltaMomentXN=firstMomentXN-uniformMomentXN;
    const endCorrectionN=deltaMomentXN/L;
    const qy=forceN/L;
    if(![forceN,uniformMomentXN,deltaMomentXN,endCorrectionN,qy].every(finite))
      throw Error("Station "+(i+1)+" pressure projection is not finite");
    lineLoads.push({from:x0,to:x1,qy,source:"wetted-pressure",station:i});
    // The correction pair has zero total force and exactly Δ(∫x dF).
    if(Math.abs(endCorrectionN)>1e-12){
      nodalCorrections.push({x:x0,fy:-endCorrectionN,station:i,source:"moment-preserving transfer"});
      nodalCorrections.push({x:x1,fy:+endCorrectionN,station:i,source:"moment-preserving transfer"});
    }
    totalForceN+=forceN;
    totalFirstMomentXN+=firstMomentXN;
    projectedForceN+=forceN;
    projectedMomentXN+=uniformMomentXN+endCorrectionN*L;
    audited.push({x0,x1,forceN,firstMomentXN,qy,endCorrectionN});
  }
  const forceErrorN=projectedForceN-totalForceN;
  const firstMomentErrorNm=projectedMomentXN-totalFirstMomentXN;
  const forceToleranceN=Math.max(.01,Math.abs(totalForceN)*1e-8);
  const momentToleranceNm=Math.max(.01,Math.abs(totalForceN)*span*1e-8);
  if(Math.abs(forceErrorN)>forceToleranceN||Math.abs(firstMomentErrorNm)>momentToleranceNm)
    throw Error("Pressure-to-beam force/first-moment conservation failed");
  // The original global pressure integration may contain horizontal forces,
  // which a scalar vertical Euler-Bernoulli beam cannot represent.
  const hmax=Math.max(Math.abs(pressure.forceN?.[0]??Infinity),
    Math.abs(pressure.forceN?.[1]??Infinity));
  if(hmax>Math.max(1,Math.abs(totalForceN)*1e-6))
    throw Error("Non-negligible horizontal pressure force requires a 3D structural idealisation");
  return {
    model:"exact X-clipped pressure strips; piecewise-constant qz plus moment-preserving end-node force pairs",
    sourceWaterlineM:pressure.waterline,
    sourceDensityKgM3:pressure.densityKgM3,
    lineLoads,nodalCorrections,stations:audited,
    totalForceN,totalFirstMomentXN,
    conservation:{passed:true,forceErrorN,firstMomentErrorNm,forceToleranceN,momentToleranceNm},
    disclaimer:"Station-integrated external hydrostatic pressure, mapped to a longitudinal vertical beam. Not shell stress, torsion, horizontal pressure, hydrodynamic waves or certified deck/longitudinal structure."
  };
}
