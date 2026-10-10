/**
 * Static weight accounting for Hydro, with a separately specified hull mass.
 *
 * All masses are tonnes, all coordinates metres, x longitudinal,
 * y transverse, z positive up. A deck area load is a horizontal rectangle
 * with uniform mass per projected square metre (t/m²), located at elevation z.
 * This is a MASS model for displacement/CG, not a structural stress solver.
 */
const finite=(value,name)=>{
  if(value===null||value===undefined||(typeof value==="string"&&!value.trim()))
    throw new Error(name+" is required");
  const n=Number(value);
  if(!Number.isFinite(n))throw new Error(name+" must be finite");
  return n;
};
export function areaLoadsFromLines(text){
  return String(text||"").split(/\r?\n/).flatMap((line,index)=>{
    if(!line.trim()||line.trim().startsWith("#"))return [];
    const data=line.trim().split(/[,;\t ]+/).filter(Boolean);
    if(data.length!==6)throw new Error("Area load line "+(index+1)+
      ": enter t/m², x0, x1, y0, y1, z");
    const [densityTonnesPerM2,x0,x1,y0,y1,z]=data.map((s,i)=>
      finite(s,"Area line "+(index+1)+" column "+(i+1)));
    return [{densityTonnesPerM2,x0,x1,y0,y1,z,label:"Area "+(index+1)}];
  });
}
export function normaliseAreaLoad(area,index=0){
  const rho=finite(area.densityTonnesPerM2,"Area "+(index+1)+" density");
  const x0=finite(area.x0,"Area start x"),x1=finite(area.x1,"Area end x");
  const y0=finite(area.y0,"Area start y"),y1=finite(area.y1,"Area end y");
  const z=finite(area.z,"Area z");
  if(!(rho>0)||!(x1>x0)||!(y1>y0))
    throw new Error("Area "+(index+1)+": density, x width and y width must be positive");
  const areaM2=(x1-x0)*(y1-y0),massTonnes=rho*areaM2;
  const x=x0+(x1-x0)/2,y=y0+(y1-y0)/2;
  if(![areaM2,massTonnes,x,y].every(Number.isFinite))
    throw new Error("Area "+(index+1)+": area, mass or centroid exceeds numeric limits");
  return {label:String(area.label||"Area "+(index+1)),densityTonnesPerM2:rho,
    x0,x1,y0,y1,z,areaM2,massTonnes,x,y};
}
export function combineHullLoading({
  hullMassTonnes, hullCG, pointWeights=[],areaLoads=[]
}={}){
  const mass=finite(hullMassTonnes,"Hull mass");
  if(!(mass>0))throw new Error("Hull mass must be positive");
  if(!Array.isArray(hullCG)||hullCG.length!==3)
    throw new Error("Hull centre of gravity needs x, y and z");
  const cg=hullCG.map((v,i)=>finite(v,"Hull CG "+i));
  if(!Array.isArray(pointWeights)||pointWeights.length>100||
     !Array.isArray(areaLoads)||areaLoads.length>100)
    throw new Error("Maximum 100 point and 100 area loads");
  const points=pointWeights.map((p,i)=>{
    const m=finite(p.massTonnes,"Point mass "+(i+1));
    const x=finite(p.x,"Point x"),y=finite(p.y,"Point y"),z=finite(p.z,"Point z");
    if(m===0)throw new Error("Point mass must be non-zero");
    return {massTonnes:m,x,y,z,label:String(p.label||"Point "+(i+1))};
  });
  const areas=areaLoads.map(normaliseAreaLoad);
  let total=mass;
  const moments=cg.map(v=>v*mass);
  for(const item of [...points,...areas]){
    total+=item.massTonnes;
    moments[0]+=item.massTonnes*item.x;
    moments[1]+=item.massTonnes*item.y;
    moments[2]+=item.massTonnes*item.z;
  }
  if(!(total>0)||!Number.isFinite(total)||!moments.every(Number.isFinite))
    throw new Error("Total mass and gravity moments must be finite and positive");
  if(!moments.map(v=>v/total).every(Number.isFinite))
    throw new Error("Hull centre of gravity could not be represented");
  return {
    hullMassTonnes:mass,hullCG:cg,
    baselineMassTonnes:mass,addedMassTonnes:total-mass,
    totalMassTonnes:total,centerOfGravity:moments.map(v=>v/total),
    pointWeights:points,areaLoads:areas,
    pointMassTonnes:points.reduce((a,p)=>a+p.massTonnes,0),
    areaMassTonnes:areas.reduce((a,p)=>a+p.massTonnes,0)
  };
}
