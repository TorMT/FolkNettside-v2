import {createHydroInclude} from "../hydro/hydro-selection.js?v=38e5521b493efa1ecb00d8234c2c73404d780039";
import {inspectMeshIntersections,inspectDisconnectedMeshShells} from "./mesh-intersections.js?v=38e5521b493efa1ecb00d8234c2c73404d780039";

const IDENTITY=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const finite=n=>typeof n==="number"&&Number.isFinite(n);
const key=(a,b)=>a<b?a+":"+b:b+":"+a;
const format=n=>Number(n).toLocaleString("en-US");

export function validateHydroGeometry(geometry,{transform=null,scale=1,tolerance=1e-7}={}){
  const errors=[];
  const warnings=[];
  const p=geometry?.positions;
  const rawIndex=geometry?.indices;
  if(!p||typeof p.length!=="number"||p.length<9||p.length%3!==0)errors.push("Vertex coordinates must contain complete XYZ triangles");
  if(!finite(scale)||scale<=0)errors.push("Unit conversion scale must be finite and positive");
  if(!finite(tolerance)||tolerance<=0)errors.push("Vertex welding tolerance must be finite and positive");
  if(transform&&(transform.length!==16||Array.from(transform).some(v=>!finite(v))))errors.push("Invalid 4x4 world transform");
  if(p&&Array.from(p).some(v=>!finite(v)))errors.push("Non-finite vertex coordinates");
  if(rawIndex&&rawIndex.length&&rawIndex.length%3!==0)errors.push("Triangle indices are incomplete");
  if(rawIndex&&Array.from(rawIndex).some(v=>!Number.isSafeInteger(v)||v<0||!p||v>=p.length/3))errors.push("Triangle index is outside the vertex buffer");
  if(errors.length)return {passed:false,errors,warnings,metrics:null};
  const count=p.length/3;
  const m=transform||IDENTITY;
  const vertices=new Array(count);
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<count;i++){
    const [x,y,z]=[p[3*i],p[3*i+1],p[3*i+2]];
    const q=[(m[0]*x+m[4]*y+m[8]*z+m[12])*scale,
      (m[1]*x+m[5]*y+m[9]*z+m[13])*scale,
      (m[2]*x+m[6]*y+m[10]*z+m[14])*scale];
    if(q.some(v=>!finite(v)))return {passed:false,errors:["World transform produces non-finite coordinates"],warnings,metrics:null};
    vertices[i]=q;
    for(let d=0;d<3;d++){min[d]=Math.min(min[d],q[d]);max[d]=Math.max(max[d],q[d]);}
  }
  const size=min.map((v,i)=>max[i]-v);
  const maxDim=Math.max(...size);
  if(!(maxDim>tolerance))errors.push("Geometry has no measurable extent");
  const ids=new Array(count),welded=new Map();
  for(let i=0;i<count;i++){
    // Shift before quantization to retain precision at large world coordinates.
    const k=vertices[i].map((v,j)=>Math.round((v-min[j])/tolerance)).join(",");
    if(!welded.has(k))welded.set(k,welded.size);
    ids[i]=welded.get(k);
  }
  const idx=rawIndex?.length?rawIndex:Array.from({length:count},(_,i)=>i);
  if(idx.length%3!==0)return {passed:false,errors:["Incomplete triangle index buffer"],warnings,metrics:null};
  const edgeMap=new Map();
  let signedVolume=0,degenerateTriangles=0,triangleCount=0;
  const areaThreshold=Math.max(1e-20,tolerance*tolerance);
  for(let t=0;t<idx.length;t+=3){
    const [a,b,c]=[idx[t],idx[t+1],idx[t+2]];
    const u=vertices[a].map((v,i)=>v-min[i]);
    const v=vertices[b].map((x,i)=>x-min[i]);
    const w=vertices[c].map((x,i)=>x-min[i]);
    const ab=v.map((x,i)=>x-u[i]),ac=w.map((x,i)=>x-u[i]);
    const cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
    if(new Set([ids[a],ids[b],ids[c]]).size<3||Math.hypot(...cross)<=areaThreshold){
      degenerateTriangles++;continue;
    }
    triangleCount++;
    signedVolume+=(u[0]*cross[0]+u[1]*cross[1]+u[2]*cross[2])/6;
    for(const [x,y] of [[ids[a],ids[b]],[ids[b],ids[c]],[ids[c],ids[a]]]){
      const k=key(x,y),record=edgeMap.get(k)||{count:0,balance:0};
      record.count++;record.balance+=x<y?1:-1;edgeMap.set(k,record);
    }
  }
  let boundaryEdges=0,nonManifoldEdges=0,windingConflicts=0;
  for(const e of edgeMap.values()){
    if(e.count===1)boundaryEdges++;
    else if(e.count!==2)nonManifoldEdges++;
    else if(e.balance!==0)windingConflicts++;
  }
  if(degenerateTriangles)errors.push(format(degenerateTriangles)+" degenerate triangles");
  if(!triangleCount)errors.push("No usable surface triangles");
  if(boundaryEdges)errors.push(format(boundaryEdges)+" open boundary edges");
  if(nonManifoldEdges)errors.push(format(nonManifoldEdges)+" non-manifold edges");
  if(windingConflicts)errors.push(format(windingConflicts)+" inconsistently oriented edges");
  if(!(signedVolume>Math.max(1e-12,size[0]*size[1]*size[2]*1e-10)))
    errors.push("Outward signed volume must be positive and non-zero");
  // Bounding-volume hierarchy screens triangles without O(n^2) all-pairs.
  // If the budget is exceeded, block instead of asserting a false pass.
  const surfaceIntersectionScan=errors.length?null:
    inspectMeshIntersections(vertices,idx,ids,{tolerance});
  if(surfaceIntersectionScan?.hits.length)
    errors.push(surfaceIntersectionScan.hits.length+
      (surfaceIntersectionScan.hitLimitReached?"+":"")+
      " intersecting non-adjacent triangle pairs (first face indices: "+
      surfaceIntersectionScan.hits[0].join(" / ")+")");
  if(surfaceIntersectionScan&&!surfaceIntersectionScan.exhaustive)
    errors.push("Self-intersection scan exceeded safe comparison limit");
  const disconnectedShellScan=errors.length?null:
    inspectDisconnectedMeshShells(vertices,idx,ids,{tolerance});
  if(disconnectedShellScan?.overlapPairs.length)
    errors.push(disconnectedShellScan.overlapPairs.length+
      " overlapping or nested disconnected shell pairs inside one component; "+
      "select only the external displacement surface");
  if(disconnectedShellScan&&!disconnectedShellScan.exhaustive)
    errors.push("Disconnected-shell overlap scan exceeded safe comparison limit");
  // Triangle pairs sharing welded vertices are intentionally skipped:
  // distinguish true penetrating contacts at shared vertices independently.
  // Topological closure alone does not prove the source is the external hull.
  warnings.push("Vertex-sharing face contacts, enclosed voids, external hull isolation, units/axes and vessel baseline still require independent verification.");
  return {passed:errors.length===0,errors,warnings,
    metrics:{sourceVertices:count,weldedVertices:welded.size,triangleCount,
      degenerateTriangles,boundaryEdges,nonManifoldEdges,windingConflicts,
      signedVolume,bounds:{min,max,size},tolerance,
      selfIntersections:surfaceIntersectionScan?.hits.length??null,
      intersectionCandidatePairs:surfaceIntersectionScan?.candidatePairs??null,
      intersectionScanExhaustive:surfaceIntersectionScan?.exhaustive??false,
      edgeConnectedShells:disconnectedShellScan?.shellCount??null,
      ambiguousShellPairs:disconnectedShellScan?.overlapPairs.length??null}};
}

export function validateHydroModel(modelDocument,{include=createHydroInclude(modelDocument),tolerance=1e-7}={}){
  const components=[],errors=[],warnings=[];
  const scale=modelDocument?.unitScaleToMeters??1;
  for(const component of modelDocument?.components||[]){
    if(!component?.geometry||!include(component))continue;
    const result=validateHydroGeometry(component.geometry,{transform:component.transform,scale,tolerance});
    components.push({componentId:component.id,name:component.name||component.id,...result});
    for(const item of result.errors)errors.push((component.name||component.id)+": "+item);
  }
  if(!components.length)errors.push("No hydrostatic geometry selected. Select an external hull before analysis.");
  if(modelDocument?.sourceType==="local-import"&&components.length>1){
    for(let i=0;i<components.length;i++)for(let j=i+1;j<components.length;j++){
      const a=components[i],b=components[j];
      if(!a.metrics||!b.metrics)continue;
      const aBounds=a.metrics.bounds,bBounds=b.metrics.bounds;
      const overlap=[0,1,2].map(axis=>Math.min(aBounds.max[axis],bBounds.max[axis])-
        Math.max(aBounds.min[axis],bBounds.min[axis]));
      if(overlap.every(extent=>extent>tolerance)){
        errors.push((a.name||a.componentId)+" / "+(b.name||b.componentId)+
          ": selected hull surfaces have overlapping bounding volumes. "+
          "Possible intersecting or nested shells; isolate the external surface before hydro.");
      }
    }
  }
  warnings.push("Geometry preflight is not vessel certification or permission to enable an unvalidated source model.");
  const output={passed:errors.length===0,components,errors,warnings,requiresIndependentReview:true};
  return output;
}
