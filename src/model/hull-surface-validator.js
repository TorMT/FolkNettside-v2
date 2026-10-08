import {analyzeGeometryDiagnostics} from "./mesh-diagnostics.js";

// Conservative geometric preflight. This does NOT certify vessel hull provenance,
// absence of intersections, correct hull isolation, or hydrostatic validity.
export function validateHullSurface(geometry, options={}){
  const {transform=null,scale=1,tolerance=1e-7,expectedSize=null}=options;
  const errors=[],warnings=[];
  const positions=geometry?.positions||[];
  const indices=geometry?.indices?.length?geometry.indices:Array.from({length:positions.length/3},(_,i)=>i);
  if(!Number.isFinite(scale)||scale<=0)errors.push("Invalid positive unit scale");
  if(!Number.isFinite(tolerance)||tolerance<=0)errors.push("Invalid welding tolerance");
  if(positions.length%3!==0||indices.length%3!==0)errors.push("Incomplete coordinates or triangles");
  if(!Array.from(positions).every(Number.isFinite))errors.push("Non-finite vertex coordinate");
  if(!Array.from(indices).every(v=>Number.isSafeInteger(v)&&v>=0&&v<positions.length/3))errors.push("Invalid triangle index");
  if(transform&&(!Array.isArray(transform)&&!ArrayBuffer.isView(transform)||transform.length!==16||!Array.from(transform).every(Number.isFinite)))errors.push("Invalid transform");
  if(errors.length)return {passed:false,errors,warnings,metrics:null,reviewRequired:true};
  const diag=analyzeGeometryDiagnostics(geometry,{transform,scale,tolerance});
  if(!diag.triangleCount)errors.push("No triangles");
  if(diag.boundaryEdges)errors.push(diag.boundaryEdges+" open boundary edges");
  if(diag.nonManifoldEdges)errors.push(diag.nonManifoldEdges+" non-manifold edges");
  if(diag.degenerateTriangles)errors.push(diag.degenerateTriangles+" degenerate triangles");
  if(diag.invalidTriangles)errors.push(diag.invalidTriangles+" invalid triangles");
  const m=transform||[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  const welded=new Map(),edges=new Map();
  const vertices=Array.from({length:positions.length/3},(_,i)=>{
    const x=positions[i*3],y=positions[i*3+1],z=positions[i*3+2];
    return [(m[0]*x+m[4]*y+m[8]*z+m[12])*scale,(m[1]*x+m[5]*y+m[9]*z+m[13])*scale,(m[2]*x+m[6]*y+m[10]*z+m[14])*scale];
  });
  const ids=vertices.map(p=>{
    const key=p.map(v=>Math.round(v/tolerance)).join(",");
    if(!welded.has(key))welded.set(key,welded.size);
    return welded.get(key);
  });
  let signedVolume=0,orientationConflicts=0;
  const origin=diag.bounds.min;
  for(let i=0;i+2<indices.length;i+=3){
    const [a,b,c]=[indices[i],indices[i+1],indices[i+2]];
    const [p,q,r]=[vertices[a],vertices[b],vertices[c]].map(v=>v.map((x,k)=>x-origin[k]));
    const cross=[q[1]*r[2]-q[2]*r[1],q[2]*r[0]-q[0]*r[2],q[0]*r[1]-q[1]*r[0]];
    signedVolume+=(p[0]*cross[0]+p[1]*cross[1]+p[2]*cross[2])/6;
    for(const [u,v] of [[ids[a],ids[b]],[ids[b],ids[c]],[ids[c],ids[a]]]){
      const key=Math.min(u,v)+":"+Math.max(u,v);
      const direction=u<v?1:-1;
      const state=edges.get(key)||[];state.push(direction);edges.set(key,state);
    }
  }
  for(const directions of edges.values())if(directions.length===2&&directions[0]===directions[1])orientationConflicts++;
  if(orientationConflicts)errors.push(orientationConflicts+" inconsistent winding edges");
  const size=diag.bounds.size;
  const magnitude=size[0]*size[1]*size[2];
  if(!(signedVolume>Math.max(1e-12,magnitude*1e-10)))errors.push("Non-positive or near-zero outward-oriented volume");
  if(expectedSize){
    for(let axis=0;axis<3;axis++){
      const expected=expectedSize[axis];
      if(!Number.isFinite(expected)||expected<=0){errors.push("Invalid reference dimensions");break}
      if(Math.abs(size[axis]-expected)/expected>(options.dimensionTolerance??0.05))
        errors.push(["Length","Beam","Depth"][axis]+" differs from sourced dimensions");
    }
  }else warnings.push("No independently sourced principal dimensions supplied");
  warnings.push("Self-intersections, hull-only isolation, source axes, datum and loading condition require independent checks");
  return {passed:errors.length===0,errors,warnings,reviewRequired:true,
    metrics:{...diag,signedVolume,orientationConflicts}};
}
