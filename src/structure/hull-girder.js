import {solveFrame2D} from "./frame2d.js";
import {combineHullLoading} from "../hydro/hull-loading.js";

const G=9.80665;
const number=(value,name)=>{
  const n=Number(value);
  if(!Number.isFinite(n))throw new Error(name+" must be finite");
  return n;
};
/**
 * Global Euler–Bernoulli HULL-GIRDER IDEALISATION (NOT 3D plate/shell FEM).
 *
 * Treat the hull as one longitudinal straight beam with constant E, I and
 * distance c to the extreme fibre. Pinned/roller support at its ends is a
 * structural TEST FIXTURE, not hydrostatic buoyancy for a floating vessel.
 * Gravity of own hull weight is taken uniformly in X; deck area-load mass
 * becomes a piecewise uniform line load from its projected Y width.
 */
export function solveHullGirder({
  xMin=0,xMax, hullMassTonnes,hullCG=[0,0,0],
  pointWeights=[],areaLoads=[],
  E, I, extremeFiberM,segments=20
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
  for(const [index,p] of loading.pointWeights.entries()){
    if(p.x<a-tol||p.x>b+tol)
      throw new Error("Point weight "+(index+1)+" is outside the beam span");
  }
  for(const [index,area] of loading.areaLoads.entries()){
    if(area.x0<a-tol||area.x1>b+tol)
      throw new Error("Area load "+(index+1)+" extends outside the beam span");
  }
  const coords=[a,b,...Array.from({length:n-1},(_,i)=>a+(i+1)*span/n),
    ...loading.areaLoads.flatMap(area=>[area.x0,area.x1])];
  coords.sort((x,y)=>x-y);
  const xs=coords.filter((x,i)=>i===0||x-coords[i-1]>tol);
  const nodes=xs.map((x,i)=>({id:"h"+i,x,y:0}));
  const elements=xs.slice(0,-1).map((x,i)=>({
    id:"girder-"+i,n1:nodes[i].id,n2:nodes[i+1].id,E:young,I:inertia,A:1
  }));
  const uniformHull=-loading.hullMassTonnes*1000*G/span;
  const lineLoads=[];
  const distributedLoads=elements.map((element,i)=>{
    const mid=(xs[i]+xs[i+1])/2;
    const areal=loading.areaLoads.filter(w=>mid>=w.x0-tol&&mid<=w.x1+tol);
    const qy=uniformHull-areal.reduce((q,w)=>q+w.densityTonnesPerM2*(w.y1-w.y0)*1000*G,0);
    lineLoads.push({from:xs[i],to:xs[i+1],qy});
    return {element:element.id,qy};
  });
  const interior=loading.pointWeights.map(w=>{
    const i=Math.min(elements.length-1,Math.max(0,
      xs.findIndex((x,j)=>j<xs.length-1&&w.x<=xs[j+1]+tol)));
    return {element:elements[i].id,position:Math.max(0,Math.min(xs[i+1]-xs[i],w.x-xs[i])),
      fx:0,fy:-w.massTonnes*1000*G};
  });
  const frame={name:"Global hull-girder fixture",nodes,elements,
    supports:[{node:nodes[0].id,ux:true,uy:true},{node:nodes.at(-1).id,uy:true}],
    pointLoads:interior,distributedLoads};
  const analysis=solveFrame2D(frame);
  const moments=[],shears=[],fem=analysis.elements;
  for(let i=0;i<fem.length;i++){
    const actions=fem[i].localEndForces,L=xs[i+1]-xs[i],q=distributedLoads[i].qy;
    const moment=s=>-actions[2]+actions[1]*s+q*s*s/2;
    const candidates=[0,L];
    if(Math.abs(q)>1e-12){
      const critical=-actions[1]/q;
      if(critical>0&&critical<L)candidates.push(critical);
    }
    for(const d of candidates)moments.push({x:xs[i]+d,value:moment(d)});
    shears.push({x:xs[i],value:actions[1]},{x:xs[i+1],value:actions[1]+q*L});
  }
  const peak= moments.reduce((top,entry)=>
    !top||Math.abs(entry.value)>Math.abs(top.value)?entry:top,null);
  const peakDeflection=analysis.nodes.reduce((top,node)=>
    !top||Math.abs(node.uy)>Math.abs(top.uy)?node:top,null);
  const reactions=analysis.nodes.map((node,i)=>({x:xs[i],verticalN:node.ry}))
    .filter(r=>Math.abs(r.verticalN)>1e-5);
  const verticalLoadN=-loading.totalMassTonnes*1000*G;
  const reactionN=reactions.reduce((sum,r)=>sum+r.verticalN,0);
  return {method:"Euler-Bernoulli simply-supported hull girder (global beam proxy)",
    loading,frame,analysis,reactions,lineLoads,moments,shears,
    maxMomentNm:Math.abs(peak.value),
    momentAtMax:peak.x,
    maxStressPa:Math.abs(peak.value)*c/inertia,
    maxDeflectionM:Math.abs(peakDeflection.uy),
    peakDeflectionNode:peakDeflection.id,
    verticalLoadN,reactionN,
    equilibriumResidualN:reactionN+verticalLoadN,
    disclaimer:"Not shell/plate stress FEM. End supports are a test fixture, not distributed buoyancy. Geometry does not determine E, I, plate thickness or structural boundary conditions."
  };
}
