import {solveFrame2D} from "./frame2d.js?v=a47b0660d66be142e6d11464c67ab316d5f94002";
import {combineHullLoading} from "../hydro/hull-loading.js?v=a47b0660d66be142e6d11464c67ab316d5f94002";
import {auditGirderReactions,hermiteDeflectionExtrema} from "./girder-equilibrium.js?v=a47b0660d66be142e6d11464c67ab316d5f94002";
import {validateGirderProfile,girderProfileAt,baselineMassAudit} from "./girder-profiles.js?v=a47b0660d66be142e6d11464c67ab316d5f94002";
import {stressFromSectionMoment} from "./girder-section-properties.js?v=a47b0660d66be142e6d11464c67ab316d5f94002";

const G=9.80665;
const number=(value,name)=>{
  const n=Number(value);
  if(!Number.isFinite(n))throw new Error(name+" must be finite");
  return n;
};
/**
 * Global Euler–Bernoulli HULL-GIRDER IDEALISATION (NOT 3D plate/shell FEM).
 *
 * Treat the hull as one longitudinal beam with manually declared E/I and
 * distance c to the extreme fibre. Pinned/roller support at its ends is a
 * structural TEST FIXTURE, not hydrostatic buoyancy for a floating vessel.
 * Baseline hull weight is uniform unless a complete audited longitudinal
 * mass profile is entered. Deck mass becomes a line load from its Y width.
 */
export function solveHullGirder({
  xMin=0,xMax, hullMassTonnes,hullCG=[0,0,0],
  pointWeights=[],areaLoads=[],
  E, I, extremeFiberM,segments=20,
  stiffnessStations=null,massStations=null,sectionModel=null,
  buoyancyTransfer=null,supportModel="pinned-roller"
}={}){
  const a=number(xMin,"Hull xMin"),b=number(xMax,"Hull xMax");
  const young=number(E,"E"),inertia=number(I,"Section I");
  const c=number(extremeFiberM,"Extreme fibre distance");
  const n=number(segments,"Segments");
  if(!(b>a)||!(young>0)||!(inertia>0)||!(c>0)||
     !Number.isSafeInteger(n)||n<2||n>50)
    throw new Error("Hull girder needs xMax>xMin, positive E/I/c and 2–50 elements");
  const loading=combineHullLoading({hullMassTonnes,hullCG,pointWeights,areaLoads});
  const span=b-a,tol=1e-8*span;
  if(sectionModel&&(stiffnessStations?.length))
    throw new Error("Choose either calculated structural cross-sections or manual EI stations, not both");
  if(sectionModel&&(!Array.isArray(sectionModel.sections)||!sectionModel.sections.length||
    sectionModel.sections.some(p=>!Array.isArray(p.stressFibers)||!(p.EI>0))))
    throw new Error("Calculated structural sections are invalid");
  const EIStations=validateGirderProfile(sectionModel?.sections??stiffnessStations,{
    xMin:a,xMax:b,kind:"stiffness"
  });
  const baselineStations=validateGirderProfile(massStations,{
    xMin:a,xMax:b,kind:"mass"
  });
  const baselineAudit=baselineMassAudit(baselineStations,{
    hullMassTonnes:loading.hullMassTonnes,
    hullCGx:loading.hullCG[0],xMin:a,xMax:b
  });
  if(!["pinned-roller","floating-equilibrium"].includes(supportModel))
    throw new Error("Unknown support model");
  if(supportModel==="floating-equilibrium"&&!buoyancyTransfer)
    throw new Error("Floating equilibrium requires a verified pressure-to-beam transfer");
  if(buoyancyTransfer&&!buoyancyTransfer.conservation?.passed)
    throw new Error("Buoyancy transfer must conserve force and X first moment");
  const buoyancyLines=buoyancyTransfer?.lineLoads||[];
  const correctionForces=buoyancyTransfer?.nodalCorrections||[];
  if(buoyancyLines.length>120||correctionForces.length>240)
    throw new Error("Excessive buoyancy station or correction count");
  for(const entry of buoyancyLines){
    if(![entry.from,entry.to,entry.qy].every(Number.isFinite)||
      !(entry.to>entry.from)||entry.from<a-tol||entry.to>b+tol)
      throw new Error("Buoyancy line load is outside structural beam X bounds");
  }
  for(const entry of correctionForces){
    if(!Number.isFinite(entry.x)||!Number.isFinite(entry.fy)||
      entry.x<a-tol||entry.x>b+tol)
      throw new Error("Invalid beam load-projection node");
  }
  const qBuoyancy=buoyancyLines.reduce((sum,line)=>sum+(line.to-line.from)*line.qy,0);
  const qFirstMoment=buoyancyLines.reduce((sum,line)=>
    sum+(line.to-line.from)*line.qy*(line.from+line.to)/2,0);
  const nodeBuoyancy=correctionForces.reduce((sum,entry)=>sum+entry.fy,0);
  const nodeFirstMoment=correctionForces.reduce((sum,entry)=>sum+entry.fy*entry.x,0);
  const projectionTol=Math.max(1e-4,Math.abs(qBuoyancy)*1e-7);
  if(buoyancyTransfer&&(
    Math.abs(qBuoyancy+nodeBuoyancy-buoyancyTransfer.totalForceN)>projectionTol||
    Math.abs(qFirstMoment+nodeFirstMoment-buoyancyTransfer.totalFirstMomentXN)>
      Math.max(.01,Math.abs(buoyancyTransfer.totalForceN)*span*1e-7)))
    throw new Error("Structural station projection has lost vertical force or first moment");
  const gravityN=-loading.totalMassTonnes*1000*G;
  const gravityFirstMomentXN=-G*1000*(
    baselineAudit.firstMomentTonnesM+
    loading.areaLoads.reduce((sum,w)=>sum+w.massTonnes*w.x,0)+
    loading.pointWeights.reduce((sum,w)=>sum+w.massTonnes*w.x,0)
  );
  const netForceN=gravityN+qBuoyancy+nodeBuoyancy;
  const netFirstMomentXN=gravityFirstMomentXN+qFirstMoment+nodeFirstMoment;
  const pitchCoupleNm=buoyancyTransfer?.equivalentPitchCoupleNm||0;
  if(!Number.isFinite(pitchCoupleNm))throw new Error("Invalid equivalent hydrostatic pitch couple");
  const netBeamMomentNm=netFirstMomentXN+pitchCoupleNm;
  if(supportModel==="floating-equilibrium"){
    if(!baselineStations&&Math.abs(loading.hullCG[0]-(a+b)/2)>span*1e-6)
      throw new Error("Uniform beam hull weight requires baseline hull CG at mid-span for floating-equilibrium mode; supply a verified longitudinal hull weight distribution instead");
    const forceTol=Math.max(.01,Math.abs(qBuoyancy)*.001);
    const momentTol=Math.max(.01,Math.abs(qBuoyancy)*span*.001);
    if(Math.abs(netForceN)>forceTol||Math.abs(netBeamMomentNm)>momentTol)
      throw new Error("Floating reference blocked: nonzero vertical force or longitudinal moment; solve hydro loading/draft and check LCG before using reaction-free floating equilibrium");
  }
  for(const [index,p] of loading.pointWeights.entries()){
    if(p.x<a-tol||p.x>b+tol)
      throw new Error("Point weight "+(index+1)+" is outside the beam span");
  }
  for(const [index,area] of loading.areaLoads.entries()){
    if(area.x0<a-tol||area.x1>b+tol)
      throw new Error("Area load "+(index+1)+" extends outside the beam span");
  }
  const coords=[a,b,...Array.from({length:n-1},(_,i)=>a+(i+1)*span/n),
    ...loading.areaLoads.flatMap(area=>[area.x0,area.x1]),
    ...loading.pointWeights.map(weight=>weight.x),
    ...buoyancyLines.flatMap(entry=>[entry.from,entry.to]),
    ...correctionForces.map(entry=>entry.x),
    ...(EIStations||[]).flatMap(entry=>[entry.x0,entry.x1]),
    ...(baselineStations||[]).flatMap(entry=>[entry.x0,entry.x1])];
  coords.sort((x,y)=>x-y);
  const xs=coords.filter((x,i)=>i===0||x-coords[i-1]>tol);
  const nodes=xs.map((x,i)=>({id:"h"+i,x,y:0}));
  const elements=xs.slice(0,-1).map((x,i)=>{
    const midpoint=(x+xs[i+1])/2;
    const stiff=girderProfileAt(EIStations,midpoint);
    return {
      id:"girder-"+i,n1:nodes[i].id,n2:nodes[i+1].id,
      E:stiff?.E??young,I:stiff?.I??inertia,A:1
    };
  });
  const lineLoads=[];
  const distributedLoads=elements.map((element,i)=>{
    const mid=(xs[i]+xs[i+1])/2;
    const areal=loading.areaLoads.filter(w=>mid>=w.x0-tol&&mid<=w.x1+tol);
    const hullQ=-girderProfileAt(baselineAudit.stations,mid).tonnesPerM*1000*G;
    const gravityQ=hullQ-areal.reduce((q,w)=>q+w.densityTonnesPerM2*(w.y1-w.y0)*1000*G,0);
    const buoyancyQ=buoyancyLines.filter(entry=>mid>=entry.from-tol&&mid<=entry.to+tol)
      .reduce((q,entry)=>q+entry.qy,0);
    const qy=gravityQ+buoyancyQ;
    lineLoads.push({from:xs[i],to:xs[i+1],qy,gravityQ,buoyancyQ});
    return {element:element.id,qy};
  });
  // Split elements at every force application coordinate. This makes shear
  // jumps and extrema exact instead of smoothing point forces inside an element.
  const pointLoads=loading.pointWeights.map(w=>{
    const node=nodes.find((node)=>Math.abs(node.x-w.x)<=tol);
    if(!node)throw new Error("Point load could not be matched to a FEM node");
    return {node:node.id,fy:-w.massTonnes*1000*G};
  });
  const equivalentBuoyancyLoads=correctionForces.map(entry=>{
    const node=nodes.find(n=>Math.abs(n.x-entry.x)<=tol);
    if(!node)throw new Error("Buoyancy correction failed to map to an FEM node");
    return {node:node.id,fy:entry.fy};
  });
  const pitchMomentLoads=Math.abs(pitchCoupleNm)>1e-9?[{
    // Applied near the beam midpoint as an equivalent 2D bending couple.
    // This preserves the global pressure pitch moment, not its local 3D
    // horizontal-pressure stress distribution.
    node:nodes.reduce((best,n)=>Math.abs(n.x-(a+b)/2)<Math.abs(best.x-(a+b)/2)?n:best,nodes[0]).id,
    mz:pitchCoupleNm
  }]:[];
  const frame={name:buoyancyTransfer?"Hull-girder coupled pressure/mass model":"Global hull-girder fixture",nodes,elements,
    supports:[{node:nodes[0].id,ux:true,uy:true},{node:nodes.at(-1).id,uy:true}],
    loads:[...pointLoads,...equivalentBuoyancyLoads,...pitchMomentLoads],distributedLoads};
  const analysis=solveFrame2D(frame);
  const moments=[],shears=[],fem=analysis.elements;
  const sampleResults=[],deflectionCandidates=[];
  for(let i=0;i<fem.length;i++){
    const actions=fem[i].localEndForces,L=xs[i+1]-xs[i],q=distributedLoads[i].qy;
    const moment=s=>-actions[2]+actions[1]*s+q*s*s/2;
    const candidates=[0,L];
    if(Math.abs(q)>1e-12){
      const critical=-actions[1]/q;
      if(critical>0&&critical<L)candidates.push(critical);
    }
    const section=girderProfileAt(sectionModel?.sections,(xs[i]+xs[i+1])/2);
    const stressAt=M=>section?
      stressFromSectionMoment(section,M):
      {stressPa:M*c/elements[i].I,memberIndex:null,z:null};
    for(const d of candidates){
      const value=moment(d),fiber=stressAt(value);
      moments.push({x:xs[i]+d,value,stressPa:fiber.stressPa,
        memberIndex:fiber.memberIndex,z:fiber.z,elementId:elements[i].id});
    }
    shears.push({x:xs[i],value:actions[1]},{x:xs[i+1],value:actions[1]+q*L});
    const [v1,t1,,v2,t2]=[
      fem[i].localDisplacements[1],fem[i].localDisplacements[2],0,
      fem[i].localDisplacements[4],fem[i].localDisplacements[5]
    ];
    deflectionCandidates.push(...hermiteDeflectionExtrema({
      x0:xs[i],length:L,v1,theta1:t1,v2,theta2:t2
    }));
    // Cubic Hermite interpolation for the FE deflection field.
    for(let j=0;j<=16;j++){
      const tau=j/16,t2x=tau*tau,t3x=t2x*tau;
      const w=(1-3*t2x+2*t3x)*v1
        +L*(tau-2*t2x+t3x)*t1
        +(3*t2x-2*t3x)*v2
        +L*(-t2x+t3x)*t2;
      const localX=tau*L,M=moment(localX);
      sampleResults.push({x:xs[i]+localX,deflectionM:w,momentNm:M,
        stressPa:stressAt(M).stressPa,shearN:actions[1]+q*localX});
    }
  }
  const peak= moments.reduce((top,entry)=>
    !top||Math.abs(entry.value)>Math.abs(top.value)?entry:top,null);
  const peakStress=moments.reduce((top,entry)=>
    !top||Math.abs(entry.stressPa)>Math.abs(top.stressPa)?entry:top,null);
  const peakDeflection=analysis.nodes.reduce((top,node)=>
    !top||Math.abs(node.uy)>Math.abs(top.uy)?node:top,null);
  const peakDeflectionExact=deflectionCandidates.reduce((top,entry)=>
    !top||Math.abs(entry.deflectionM)>Math.abs(top.deflectionM)?entry:top,null);
  const reactions=analysis.nodes.map((node,i)=>({x:xs[i],verticalN:node.ry}))
    .filter(r=>Math.abs(r.verticalN)>1e-5);
  const verticalLoadN=netForceN;
  const reactionN=reactions.reduce((sum,r)=>sum+r.verticalN,0);
  const equilibriumAudit=auditGirderReactions({
    externalForceN:netForceN,externalMomentNm:netBeamMomentNm,
    reactions,referenceX:a,spanM:span
  });
  if(!equilibriumAudit.passed)
    throw new Error("Beam FEM equilibrium failed: force error "+
      equilibriumAudit.forceResidualN.toExponential(3)+" N; pitch moment error "+
      equilibriumAudit.momentResidualNm.toExponential(3)+" N·m");
  if(supportModel==="floating-equilibrium"&&Math.abs(reactionN)>
    Math.max(.01,Math.abs(qBuoyancy)*.001))
    throw new Error("Floating equilibrium failed: residual artificial support reactions exceed tolerance");
  return {method:buoyancyTransfer?"Euler-Bernoulli beam with integrated hydrostatic station forces":"Euler-Bernoulli simply-supported hull girder (global beam proxy)",
    loading,frame,analysis,reactions,lineLoads,moments,shears,field:sampleResults,
    equilibriumAudit,
    baselineAudit,stiffnessStations:EIStations,sectionModel,
    buoyancyTransfer,supportModel,gravityForceN:gravityN,buoyancyForceN:qBuoyancy+nodeBuoyancy,
    netFirstMomentXN,netBeamMomentNm,pitchCoupleNm,projectedForceErrorN:buoyancyTransfer?
      qBuoyancy+nodeBuoyancy-buoyancyTransfer.totalForceN:null,
    maxMomentNm:Math.abs(peak.value),
    momentAtMax:peak.x,
    maxStressPa:Math.abs(peakStress.stressPa),
    maxStressX:peakStress.x,
    peakStressElement:peakStress.elementId,
    peakStressMember:peakStress.memberIndex,
    peakStressZ:peakStress.z,
    maxDeflectionM:Math.abs(peakDeflectionExact.deflectionM),
    peakDeflectionX:peakDeflectionExact.x,
    peakDeflectionSignedM:peakDeflectionExact.deflectionM,
    peakDeflectionNode:peakDeflection.id,
    verticalLoadN,reactionN,
    equilibriumResidualN:reactionN+verticalLoadN,
    disclaimer:buoyancyTransfer?
      "Integrated wetted pressure mapped by exact X strips, force-conserving nodal corrections and an equivalent pitch couple. The couple is placed at midspan as a modeling choice. End pin/roller restraints eliminate rigid-body modes; any nonzero reaction represents a nonfloating fixture load. Bending stress is a beam proxy, never shell stress or validated hull strength.":
      "Not shell/plate stress FEM. End supports are a test fixture, not distributed buoyancy. Geometry does not determine E, I, plate thickness or structural boundary conditions."
  };
}
