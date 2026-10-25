import {UNIT_SCALE_TO_METERS} from "./model-document.js?v=9381df14d503bbbe82d8b77c2584a1d5d5f823ba";

// Split a triangle-soup STL into edge-connected surface bodies. Objects which
// merely overlap in 3D are not merged. Shared edge endpoints are welded within
// source-coordinate tolerance for classification; the original triangles remain.
export function splitSurfaceBodies(geometry,{tolerance=null,maxTriangles=350000}={}){
  const p=geometry?.positions,raw=geometry?.indices;
  if(!p||p.length<9||p.length%3!==0||Array.from(p).some(x=>!Number.isFinite(x)))
    throw new Error("Invalid source mesh vertices");
  const idx=raw?.length?raw:Array.from({length:p.length/3},(_,i)=>i);
  if(idx.length%3!==0||idx.some(i=>!Number.isSafeInteger(i)||i<0||i>=p.length/3))
    throw new Error("Invalid source mesh triangle indices");
  const n=idx.length/3;
  if(!n||n>maxTriangles)throw new Error("Mesh is empty or exceeds safe splitting limit");
  let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<p.length;i+=3)for(let axis=0;axis<3;axis++){
    min[axis]=Math.min(min[axis],p[i+axis]);max[axis]=Math.max(max[axis],p[i+axis]);
  }
  const size=Math.max(...max.map((v,i)=>v-min[i]));
  const tol=tolerance??Math.max(size*1e-8,1e-9);
  if(!(Number.isFinite(tol)&&tol>0))throw new Error("Invalid welding tolerance");
  const keys=Array.from({length:p.length/3},(_,i)=>
    [0,1,2].map(axis=>Math.round((p[3*i+axis]-min[axis])/tol)).join(","));
  const parents=Array.from({length:n},(_,i)=>i);
  const find=x=>{while(parents[x]!==x){parents[x]=parents[parents[x]];x=parents[x]}return x};
  const merge=(a,b)=>{a=find(a);b=find(b);if(a!==b)parents[b]=a};
  const edges=new Map();
  for(let t=0;t<n;t++){
    const ids=[idx[3*t],idx[3*t+1],idx[3*t+2]];
    for(const [i,j] of [[0,1],[1,2],[2,0]]){
      const a=keys[ids[i]],b=keys[ids[j]];
      const edge=a<b?a+"|"+b:b+"|"+a;
      const previous=edges.get(edge);
      if(previous===undefined)edges.set(edge,t);else merge(previous,t);
    }
  }
  const groups=new Map();
  for(let t=0;t<n;t++){
    const root=find(t);
    if(!groups.has(root))groups.set(root,[]);
    groups.get(root).push(t);
  }
  const surfaces=[...groups.values()].sort((a,b)=>b.length-a.length);
  return surfaces.map((triangles,i)=>{
    const positions=[],indices=[],map=new Map();
    for(const t of triangles){
      for(let j=0;j<3;j++){
        const v=idx[3*t+j];
        if(!map.has(v)){
          map.set(v,positions.length/3);
          positions.push(p[3*v],p[3*v+1],p[3*v+2]);
        }
        indices.push(map.get(v));
      }
    }
    return {name:"Surface "+(i+1),geometry:{positions,indices},triangleCount:triangles.length};
  });
}

const AXIS_TRANSFORMS={
  "z-up":[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
  "y-up":[1,0,0,0,0,0,1,0,0,-1,0,0,0,0,0,1],
  "x-up":[0,0,1,0,0,1,0,0,-1,0,0,0,0,1]
};
function multiplyTransform(a,b){
  const m=new Array(16).fill(0);
  for(let column=0;column<4;column++)for(let row=0;row<4;row++)
    for(let k=0;k<4;k++)m[column*4+row]+=a[k*4+row]*b[column*4+k];
  return m;
}
export function prepareGenericHydroImport(original,{unit=null,splitSTL=true,upAxis="z-up"}={}){
  if(!original||!Array.isArray(original.components)||!original.components.some(c=>c.geometry))
    throw new Error("No model surface geometry is available");
  if(unit&&!Object.hasOwn(UNIT_SCALE_TO_METERS,unit))throw new Error("Unsupported import unit");
  if(unit&&original.format!=="STL"&&unit!==original.unit)
    throw new Error("3MF source units are embedded; unit override is only allowed for STL");
  let components=original.components.map(c=>({...c,metadata:{...c.metadata,hydro:false}}));
  if(original.format==="STL"&&splitSTL){
    const split=[];
    for(const component of components){
      if(!component.geometry){split.push(component);continue}
      const parts=splitSurfaceBodies(component.geometry);
      for(let i=0;i<parts.length;i++)split.push({
        ...component,
        id:component.id+"-surface-"+(i+1),
        name:parts.length===1?component.name:parts[i].name,
        geometry:parts[i].geometry,
        metadata:{...component.metadata,triangleCount:parts[i].triangleCount,hydro:false}
      });
    }
    components=split;
  }
  if(!Object.hasOwn(AXIS_TRANSFORMS,upAxis))throw new Error("Unsupported source up axis");
  if(upAxis!=="z-up"){
    const rotation=AXIS_TRANSFORMS[upAxis];
    components=components.map(component=>({
      ...component,
      transform:multiplyTransform(rotation,component.transform||
        AXIS_TRANSFORMS["z-up"])
    }));
  }
  const actualUnit=unit||original.unit;
  return {
    ...original,
    unit:actualUnit,
    unitScaleToMeters:UNIT_SCALE_TO_METERS[actualUnit],
    components,
    importUpAxis:upAxis,
    sourceType:"local-import",
    geometryReviewRequired:true
  };
}
export function withHydroSurfaceSelection(documentModel,selectedIds=[]){
  const ids=new Set(selectedIds);
  const geometryIds=new Set(documentModel.components.filter(c=>c.geometry).map(c=>c.id));
  if([...ids].some(id=>!geometryIds.has(id)))throw new Error("Unknown surface selected");
  return {...documentModel,components:documentModel.components.map(c=>({
    ...c,metadata:{...c.metadata,hydro:Boolean(c.geometry&&ids.has(c.id))}
  }))};
}
export function selectedHydroSurfaceIds(documentModel){
  return (documentModel?.components||[]).filter(c=>c.geometry&&c.metadata?.hydro===true).map(c=>c.id);
}
