import {validateHydroGeometry,validateHydroModel} from "./hull-surface-validator.js?v=f3e9d7477bd1be20579a3bfdbde776e975209335";
import {inspectMeshIntersections} from "./mesh-intersections.js?v=f3e9d7477bd1be20579a3bfdbde776e975209335";

// Conservative, reversible repair: flip only diagonals of adjacent triangles.
// Never move vertices, alter source transforms, or relax the hydro safety gate.
const diff=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const norm=v=>Math.hypot(...v);
const key=(a,b)=>a<b?a+"|"+b:b+"|"+a;
const IDENTITY=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];

function worldVertices(geometry,transform,scale){
  const m=transform||IDENTITY,p=geometry.positions,vertices=[];
  for(let i=0;i<p.length;i+=3){
    const [x,y,z]=[p[i],p[i+1],p[i+2]];
    vertices.push([(m[0]*x+m[4]*y+m[8]*z+m[12])*scale,
      (m[1]*x+m[5]*y+m[9]*z+m[13])*scale,
      (m[2]*x+m[6]*y+m[10]*z+m[14])*scale]);
  }
  return vertices;
}
function weldIds(vertices,tolerance){
  const min=[Infinity,Infinity,Infinity];
  for(const p of vertices)for(let k=0;k<3;k++)min[k]=Math.min(min[k],p[k]);
  const ids=[],seen=new Map();
  for(const p of vertices){
    const k=p.map((v,i)=>Math.round((v-min[i])/tolerance)).join(",");
    if(!seen.has(k))seen.set(k,seen.size);
    ids.push(seen.get(k));
  }
  return ids;
}
function faceNormal(vertices,face){
  const [a,b,c]=face.map(i=>vertices[i]);
  return cross(diff(b,a),diff(c,a));
}
function edgeCandidates(indices,weldedIds,interesting,hitFaces){
  const edgeMap=new Map(),n=indices.length/3;
  for(let f=0;f<n;f++)for(let j=0;j<3;j++){
    const a=indices[3*f+j],b=indices[3*f+(j+1)%3],c=indices[3*f+(j+2)%3];
    const k=key(weldedIds[a],weldedIds[b]);
    if(!edgeMap.has(k))edgeMap.set(k,[]);
    edgeMap.get(k).push({f,a,b,c});
  }
  const candidates=[];
  for(const adjacent of edgeMap.values()){
    if(adjacent.length!==2)continue;
    const [p,q]=adjacent;
    if(weldedIds[p.a]!==weldedIds[q.b]||weldedIds[p.b]!==weldedIds[q.a])continue;
    // A new diagonal may not be an existing edge (otherwise non-manifold).
    if(weldedIds[p.c]===weldedIds[q.c]||edgeMap.has(key(weldedIds[p.c],weldedIds[q.c])))continue;
    if(!interesting.has(p.f)&&!interesting.has(q.f))continue;
    candidates.push({faces:[p.f,q.f],
      priority:Number(hitFaces.has(p.f))+Number(hitFaces.has(q.f)),
      replacement:[[p.c,p.a,q.c],[p.c,q.c,p.b]]});
  }
  return candidates.sort((a,b)=>b.priority-a.priority);
}
function goodFlip(vertices,indices,faces,replacement){
  const old=faces.map(f=>Array.from(indices.slice(3*f,3*f+3)));
  const normals=old.map(f=>faceNormal(vertices,f));
  const nextNormals=replacement.map(f=>faceNormal(vertices,f));
  const areas=normals.map(norm),newAreas=nextNormals.map(norm);
  if(Math.min(...areas,...newAreas)<1e-18)return false;
  const reference=normals[0].map((v,i)=>v+normals[1][i]);
  const referenceNorm=norm(reference);
  if(referenceNorm<1e-18)return false;
  if(nextNormals.some(n=>dot(n,reference)/(norm(n)*referenceNorm)<.55))return false;
  const oldArea=areas[0]+areas[1],newArea=newAreas[0]+newAreas[1];
  return Math.abs(newArea-oldArea)<=oldArea*.06;
}
const scan=(vertices,indices,ids,maxHits=64)=>inspectMeshIntersections(
  vertices,indices,ids,{maxHits,maxCandidatePairs:1500000});

/** Return a preview only if a final, fully validated repair is possible. */
export function previewComponentMeshRepair(geometry,{transform=null,scale=1,tolerance=1e-7,
  maxFlips=16,maxCandidatesPerStep=90,maxTriangles=90000,maxVolumeRelativeChange=1e-5}={}){
  const before=validateHydroGeometry(geometry,{transform,scale,tolerance});
  if(before.passed)return {status:"already-valid",geometry,flips:0,before,after:before};
  if(!before.metrics||before.metrics.triangleCount>maxTriangles||
    before.metrics.boundaryEdges||before.metrics.nonManifoldEdges||
    before.metrics.windingConflicts||before.metrics.degenerateTriangles||
    !(before.metrics.signedVolume>0)||!before.metrics.selfIntersections||
    before.errors.some(s=>!s.includes("intersecting non-adjacent triangle")))
    return {status:"unsupported",reason:"Only closed, correctly oriented meshes with isolated triangle intersections can be retriangulated safely.",before};
  const vertices=worldVertices(geometry,transform,scale);
  const weldedIds=weldIds(vertices,tolerance);
  const source=geometry.indices?.length?Array.from(geometry.indices):
    Array.from({length:vertices.length},(_,i)=>i);
  let indices=source.slice(),current=scan(vertices,indices,weldedIds);
  if(!current.exhaustive||current.hitLimitReached)
    return {status:"unsupported",reason:"Too many intersections or incomplete collision scan.",before};
  let flips=0;
  for(;flips<maxFlips&&current.hits.length;flips++){
    const hitFaces=new Set(current.hits.flat());
    const frequency=new Map();
    for(const pair of current.hits)for(const f of pair)
      frequency.set(f,(frequency.get(f)||0)+1);
    const interesting=new Set(hitFaces),edgeToFaces=new Map();
    for(let f=0;f<indices.length/3;f++)for(let j=0;j<3;j++){
      const k=key(weldedIds[indices[3*f+j]],weldedIds[indices[3*f+(j+1)%3]]);
      if(!edgeToFaces.has(k))edgeToFaces.set(k,[]);
      edgeToFaces.get(k).push(f);
    }
    for(const f of [...interesting])for(let j=0;j<3;j++){
      const k=key(weldedIds[indices[3*f+j]],weldedIds[indices[3*f+(j+1)%3]]);
      for(const adjacent of edgeToFaces.get(k)||[])interesting.add(adjacent);
    }
    const candidates=edgeCandidates(indices,weldedIds,interesting,hitFaces)
      .sort((a,b)=>Math.max(...b.faces.map(f=>frequency.get(f)||0))-
        Math.max(...a.faces.map(f=>frequency.get(f)||0)))
      .slice(0,maxCandidatesPerStep);
    let best=null;
    for(const candidate of candidates){
      if(!goodFlip(vertices,indices,candidate.faces,candidate.replacement))continue;
      const trial=indices.slice();
      candidate.faces.forEach((f,i)=>trial.splice(3*f,3,...candidate.replacement[i]));
      const probe=scan(vertices,trial,weldedIds,current.hits.length);
      if(!probe.exhaustive)continue;
      const priority=Math.max(...candidate.faces.map(f=>frequency.get(f)||0));
      if(probe.hits.length<current.hits.length&&
          (!best||probe.hits.length<best.result.hits.length||
          (probe.hits.length===best.result.hits.length&&priority>best.priority)))
        best={indices:trial,result:probe,priority};
      if(best?.result.hits.length===0)break;
    }
    if(!best)break;
    indices=best.indices;current=best.result;
  }
  if(current.hits.length)
    return {status:"unsupported",reason:"No sufficiently local diagonal repair passed the collision and shape checks.",before};
  const updated={...geometry,indices};
  const after=validateHydroGeometry(updated,{transform,scale,tolerance});
  const relativeDelta=before.metrics.signedVolume>0?
    Math.abs(after.metrics?.signedVolume-before.metrics.signedVolume)/before.metrics.signedVolume:Infinity;
  if(!after.passed||relativeDelta>maxVolumeRelativeChange)
    return {status:"unsupported",reason:"Repair failed full validation or changed enclosed volume too much.",before,after};
  return {status:"repaired",geometry:updated,flips,before,after,relativeDelta};
}

/** Works on a copy: original imported geometry remains untouched. */
export function previewHydroMeshRepair(modelDocument,{selectedIds=[],maxFlips=16}={}){
  const selected=new Set(selectedIds),changes=[];
  if(!selected.size)return {status:"unsupported",reason:"Select a hull surface first."};
  const components=modelDocument.components.map(component=>{
    if(!selected.has(component.id)||!component.geometry)return component;
    const attempt=previewComponentMeshRepair(component.geometry,{
      transform:component.transform,scale:modelDocument.unitScaleToMeters??1,maxFlips});
    const {geometry:_ignored,...summary}=attempt;
    changes.push({id:component.id,name:component.name,...summary});
    return attempt.status==="repaired"?{...component,geometry:attempt.geometry,
      metadata:{...component.metadata,meshRepair:{method:"local-edge-flips",flips:attempt.flips}}}:component;
  });
  if(changes.some(c=>c.status==="unsupported")||!changes.some(c=>c.status==="repaired"))
    return {status:"unsupported",reason:changes.find(c=>c.status==="unsupported")?.reason||
      "The selected surfaces are already valid or unsuitable for local repair.",changes};
  const repaired={...modelDocument,components};
  const validation=validateHydroModel(repaired);
  if(!validation.passed)
    return {status:"unsupported",reason:"Combined selected hulls still fail validation.",changes};
  return {status:"ready",model:repaired,changes,validation};
}

/** ASCII STL uses world-space metres; it does not preserve original 3MF metadata. */
export function repairedHullSTL(modelDocument,selectedIds=[]){
  const selected=new Set(selectedIds),scale=modelDocument.unitScaleToMeters??1;
  const lines=["solid repaired_hull_meters"];
  for(const component of modelDocument.components){
    if(!selected.has(component.id)||!component.geometry)continue;
    const vertices=worldVertices(component.geometry,component.transform,scale);
    const idx=component.geometry.indices?.length?component.geometry.indices:
      Array.from({length:vertices.length},(_,i)=>i);
    for(let i=0;i<idx.length;i+=3){
      const tri=[vertices[idx[i]],vertices[idx[i+1]],vertices[idx[i+2]]];
      const n=faceNormal(vertices,[idx[i],idx[i+1],idx[i+2]]),length=norm(n);
      if(!length)continue;
      lines.push("facet normal "+n.map(x=>x/length).join(" "),"outer loop");
      for(const p of tri)lines.push("vertex "+p.join(" "));
      lines.push("endloop","endfacet");
    }
  }
  lines.push("endsolid repaired_hull_meters");
  return lines.join("\n");
}
