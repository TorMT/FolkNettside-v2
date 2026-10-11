/**
 * Global 2D hull-girder equilibrium independent of the FEM stiffness solve.
 *
 * Convention: +Fy upward, +Mz counterclockwise in the global X/Y beam plane.
 * A positive vertical force at +X generates a positive +Mz.
 *
 * No restriction to "floating" loads: a pinned/roller fixture may provide
 * any physically necessary reactions, but they must close BOTH balances.
 */
const finite=v=>typeof v==="number"&&Number.isFinite(v);

export function auditGirderReactions({
  externalForceN,externalMomentNm,reactions=[],referenceX=0,spanM
}={}){
  if(![externalForceN,externalMomentNm,referenceX,spanM].every(finite)||!(spanM>0))
    throw new Error("Girder equilibrium audit requires finite loads and a positive beam span");
  if(!Array.isArray(reactions)||reactions.some(r=>
    !r||!finite(r.x)||!finite(r.verticalN)))
    throw new Error("Girder equilibrium audit received an invalid structural reaction");
  const reactionForceN=reactions.reduce((sum,r)=>sum+r.verticalN,0);
  const reactionMomentNm=reactions.reduce((sum,r)=>sum+(r.x-referenceX)*r.verticalN,0);
  const externalMomentAboutReferenceNm=externalMomentNm-referenceX*externalForceN;
  const forceResidualN=externalForceN+reactionForceN;
  const momentResidualNm=externalMomentAboutReferenceNm+reactionMomentNm;
  const forceScale=Math.abs(externalForceN)+reactions.reduce((sum,r)=>sum+Math.abs(r.verticalN),0);
  const momentScale=Math.abs(externalMomentAboutReferenceNm)+
    reactions.reduce((sum,r)=>sum+Math.abs((r.x-referenceX)*r.verticalN),0);
  const forceToleranceN=Math.max(.01,forceScale*1e-7);
  const momentToleranceNm=Math.max(.01,momentScale*1e-7,forceScale*spanM*1e-9);
  return {
    passed:Math.abs(forceResidualN)<=forceToleranceN&&
      Math.abs(momentResidualNm)<=momentToleranceNm,
    externalForceN,externalMomentAboutReferenceNm,
    reactionForceN,reactionMomentNm,
    forceResidualN,momentResidualNm,forceToleranceN,momentToleranceNm,
    referenceX
  };
}

/**
 * Cubic Hermite element displacement extremes, including interior stationary
 * positions that are missed by checking only mesh nodes.
 *
 * w(t) = a0+a1*t+a2*t^2+a3*t^3, 0<=t<=1.
 */
export function hermiteDeflectionExtrema({x0,length,v1,theta1,v2,theta2}={}){
  if(![x0,length,v1,theta1,v2,theta2].every(finite)||!(length>0))
    throw new Error("Invalid Euler-Bernoulli element displacement");
  const a0=v1,a1=length*theta1;
  const a2=-3*v1-2*length*theta1+3*v2-length*theta2;
  const a3=2*v1+length*theta1-2*v2+length*theta2;
  const evaluate=t=>((a3*t+a2)*t+a1)*t+a0;
  const candidates=[0,1];
  const limit=1e-14*Math.max(1,Math.abs(a1),Math.abs(a2),Math.abs(a3));
  if(Math.abs(3*a3)<=limit){
    if(Math.abs(2*a2)>limit)candidates.push(-a1/(2*a2));
  }else{
    const discriminant=a2*a2-3*a3*a1;
    if(discriminant>=0){
      const root=Math.sqrt(discriminant);
      candidates.push((-a2+root)/(3*a3),(-a2-root)/(3*a3));
    }
  }
  return candidates.filter(t=>t>=0&&t<=1&&finite(t))
    .map(t=>({x:x0+t*length,deflectionM:evaluate(t)}));
}
