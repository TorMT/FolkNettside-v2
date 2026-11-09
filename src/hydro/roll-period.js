/**
 * Preliminary undamped SMALL-ANGLE roll period about longitudinal X.
 *
 * T = 2 pi sqrt(Ixx,weight / (m g GMt)).
 * The hull baseline kxx is an EXPLICIT user assumption. Point masses and
 * uniform rectangular deck masses update Ixx about the COMBINED CG.
 * Fluid added inertia, damping, free-surface effects and nonlinear GZ are
 * deliberately omitted. Mass units are tonnes, lengths metres.
 */
const G=9.80665;
const numeric=(value,label)=>{
  if(value===null||value===undefined||(typeof value==="string"&&!value.trim()))
    throw new Error(label+" is required");
  const n=Number(value);
  if(!Number.isFinite(n))throw new Error(label+" must be finite");
  return n;
};
const coords=(value,label)=>{
  if(!Array.isArray(value)||value.length!==3)
    throw new Error(label+" must be an [x, y, z] position in metres");
  return value.map((v,i)=>numeric(v,label+" coordinate "+i));
};

export function estimateSmallAngleRollPeriod({
  gmTransverse,
  hullRollRadiusM,
  baselineMassTonnes,
  baselineCG,
  loading=null
}={}){
  const gm=numeric(gmTransverse,"Transverse GM");
  const radius=numeric(hullRollRadiusM,"Baseline hull roll radius of gyration");
  if(!(radius>0))throw new Error("Baseline hull roll radius must be positive");

  const hullMass=numeric(loading?.hullMassTonnes??baselineMassTonnes,"Baseline hull mass");
  if(!(hullMass>0))throw new Error("Baseline hull mass must be positive");
  const hullCG=coords(loading?.hullCG??baselineCG,"Baseline hull CG");
  const combinedCG=coords(loading?.centerOfGravity??hullCG,"Combined CG");
  const mass=numeric(loading?.totalMassTonnes??hullMass,"Combined mass");
  if(!(mass>0))throw new Error("Combined mass must be positive");

  const offset=(y,z)=>(y-combinedCG[1])**2+(z-combinedCG[2])**2;
  let inertia=hullMass*(radius*radius+offset(hullCG[1],hullCG[2]));
  for(const [i,item] of (loading?.pointWeights||[]).entries()){
    const m=numeric(item.massTonnes,"Point mass "+(i+1));
    inertia+=m*offset(numeric(item.y,"Point Y"),numeric(item.z,"Point Z"));
  }
  for(const [i,item] of (loading?.areaLoads||[]).entries()){
    const m=numeric(item.massTonnes,"Area mass "+(i+1));
    const width=numeric(item.y1,"Area Y1")-numeric(item.y0,"Area Y0");
    if(!(width>0))throw new Error("Area transverse width must be positive");
    const y=(numeric(item.y0,"Area Y0")+numeric(item.y1,"Area Y1"))/2;
    const z=numeric(item.z,"Area Z");
    // Parallel-axis theorem + exact uniform-rectangle transverse spread.
    inertia+=m*(offset(y,z)+width*width/12);
  }
  if(!(inertia>0)||!Number.isFinite(inertia))
    throw new Error("Combined roll inertia is non-positive; check removed masses and baseline kxx");
  const rollRadius=Math.sqrt(inertia/mass);
  if(!Number.isFinite(rollRadius))throw new Error("Combined roll radius is not finite");
  return {
    stable:gm>0,
    periodSeconds:gm>0?2*Math.PI*Math.sqrt(inertia/(mass*G*gm)):null,
    gmTransverse:gm,
    baselineRollRadiusM:radius,
    effectiveRollRadiusM:rollRadius,
    massTonnes:mass,
    rollInertiaTonnesM2:inertia,
    gravityMPerS2:G,
    assumptions:["undamped linear small-angle roll","dry rigid-body mass inertia","no hydrodynamic added inertia or free-surface correction"]
  };
}
