/**
 * Read-only numerical diagnostics for a calculated hydrostatic curve.
 *
 * T is the world-space Z waterline in metres, V(T) the displaced m³,
 * and A(T)=dV/dT the waterplane area in m² on smooth intervals.
 *
 * Finite differences are estimated using supplied hydro curve data,
 * independent of the Newton/bisection implementation. The check never
 * marks a real vessel validated; it flags suspicious numeric results.
 */
export function auditHydroCurve(curve,{
  monotonicAbsTolerance=1e-7,
  monotonicRelativeTolerance=1e-9,
  derivativeRelativeTolerance=0.12,
  derivativeAbsTolerance=0.025
}={}){
  if(!Array.isArray(curve)||curve.length<2)
    return {passed:false,status:"invalid",errors:["At least two curve samples are required"],warnings:[],intervals:[]};
  const rows=curve.map(row=>({
    waterline:Number(row?.waterline),
    volume:Number(row?.volume),
    area:Number(row?.waterplane?.area)
  }));
  if(rows.some(row=>!Object.values(row).every(Number.isFinite)||row.volume<0||row.area<0)){
    return {passed:false,status:"invalid",errors:["Curve contains non-finite or negative hydrostatic values"],warnings:[],intervals:[]};
  }
  const errors=[],warnings=[],intervals=[];
  let maxDerivativeRelativeError=0,maxMonotonicDecrease=0;
  const maxVolume=Math.max(1,...rows.map(r=>r.volume));
  for(let i=1;i<rows.length;i++){
    const a=rows[i-1],b=rows[i],dt=b.waterline-a.waterline;
    if(!(dt>0)){
      errors.push("Waterline samples must be strictly increasing");
      continue;
    }
    const dv=b.volume-a.volume;
    const areaSecant=dv/dt;
    const meanArea=(a.area+b.area)/2;
    const allowedDecrease=monotonicAbsTolerance+monotonicRelativeTolerance*maxVolume;
    if(dv< -allowedDecrease){
      maxMonotonicDecrease=Math.max(maxMonotonicDecrease,-dv);
      errors.push("Displacement decreased between "+a.waterline+" m and "+b.waterline+" m");
    }
    // Trapezoid approximation is informative but not exact for highly
    // non-linear A(T), corners or discontinuous waterplane derivatives.
    const areaDifference=Math.abs(areaSecant-meanArea);
    const areaScale=Math.max(1e-10,Math.abs(areaSecant),Math.abs(meanArea));
    const relativeError=areaDifference/areaScale;
    maxDerivativeRelativeError=Math.max(maxDerivativeRelativeError,relativeError);
    if(areaDifference>derivativeAbsTolerance&&relativeError>derivativeRelativeTolerance){
      warnings.push("Finite-difference dV/dT differs from average waterplane area over "+
        a.waterline+"–"+b.waterline+" m; refine the draft sampling near chines or discontinuities");
    }
    intervals.push({
      from:a.waterline,to:b.waterline,deltaVolume:dv,
      slopeArea:areaSecant,meanWaterplaneArea:meanArea,
      relativeDerivativeError:relativeError
    });
  }
  return {passed:errors.length===0,status:errors.length?"fail":warnings.length?"review":"pass",
    errors,warnings,intervals,checkedIntervals:intervals.length,
    maxDerivativeRelativeError,maxMonotonicDecrease,
    caveat:"Numerical geometry consistency only; no source hull, loading or stability approval."};
}

/**
 * Independent bracket/volume convergence check on an inverse draft result.
 * Must be true before reporting an equilibrium draft.
 */
export function draftSolutionResidual(solved,targetVolume,tolerance=1e-6){
  const residual=Number(solved?.result?.volume)-Number(targetVolume);
  const target=Number(targetVolume);
  const draft=Number(solved?.waterline);
  const allowed=Number(tolerance);
  if(!Number.isFinite(residual)||!Number.isFinite(target)||target<0
    ||!Number.isFinite(draft)||!Number.isFinite(allowed)||allowed<=0)
    return {passed:false,residual:null,absoluteResidual:null,
      reason:"Invalid draft solution or convergence tolerance"};
  return {passed:Math.abs(residual)<=allowed,residual,
    absoluteResidual:Math.abs(residual),volumeTolerance:allowed,
    reason:Math.abs(residual)<=allowed?"Converged volume target":"Volume residual exceeds requested tolerance"};
}


/**
 * GMt from upright waterplane inertia must agree with GZ/sin(phi) in the
 * small-angle limit for an upright, symmetric loading case (TCG=0).
 * Evaluate only positive heel samples up to maxAngleDeg, never infer
 * a verified GM from coarse 10°/30° stability-curve samples.
 */
export function auditSmallAngleGz(curve,gmTransverse,{
  maxAngleDeg=5,relativeTolerance=0.08,absoluteTolerance=0.025
}={}){
  const gm=Number(gmTransverse);
  if(!Number.isFinite(gm))return {status:"unavailable",passed:false,
    reason:"GM must be calculated from a known KG and upright hydrostatics"};
  const candidates=(curve||[]).filter(p=>
    Number.isFinite(p?.heelDeg)&&Number.isFinite(p?.gz)&&
    p.heelDeg>0&&p.heelDeg<=maxAngleDeg).sort((a,b)=>a.heelDeg-b.heelDeg);
  if(!candidates.length)return {status:"unavailable",passed:false,
    reason:"GZ curve has no positive small-angle samples within "+maxAngleDeg+"°"};
  const point=candidates[0];
  const estimated=point.gz/Math.sin(point.heelDeg*Math.PI/180);
  const error=estimated-gm;
  const allowed=absoluteTolerance+relativeTolerance*Math.max(Math.abs(gm),Math.abs(estimated));
  const passed=Math.abs(error)<=allowed;
  return {status:passed?"pass":"review",passed,
    angleDeg:point.heelDeg,estimatedGm:estimated,hydrostaticGm:gm,
    error,allowedError:allowed,
    reason:passed?"Small-angle GZ/GM consistent at sampled heel":"GZ/GM disagreement; check KG, TCG, datum and model source"};
}
