/**
 * Explicit, engineering-entered longitudinal profiles.
 *
 * Section rows:  x0_m,x1_m,E_GPa,I_m4
 * Baseline mass: x0_m,x1_m,tonnes_per_m
 *
 * Full-span piecewise CONSTANT sections only. No inferred shell stiffness,
 * no mesh skin thickness, no automatic displacement -> structural mass.
 * Station boundaries are included as exact FEM nodes.
 */
const finite=v=>typeof v==="number"&&Number.isFinite(v);
const numeric=(value,name)=>{
  if(value===null||value===undefined||String(value).trim()==="")
    throw new Error(name+" is required");
  const n=Number(value);
  if(!finite(n))throw new Error(name+" must be a finite number");
  return n;
};
export function parseGirderStations(text,{kind}={}){
  if(!["stiffness","mass"].includes(kind))throw new Error("Unknown longitudinal profile type");
  const rows=String(text??"").split(/\r?\n/),data=[];
  for(const [index,line] of rows.entries()){
    const body=line.split("#")[0].trim();
    if(!body)continue;
    const parts=body.split(",").map(x=>x.trim());
    const required=kind==="stiffness"?4:3;
    if(parts.length!==required)throw new Error(
      kind+" row "+(index+1)+" requires "+required+" comma-separated numbers");
    const [x0,x1]=parts.slice(0,2).map((v,i)=>
      numeric(v,kind+" row "+(index+1)+" X"+i));
    if(!(x1>x0))throw new Error(kind+" row "+(index+1)+" needs x1 > x0");
    if(kind==="stiffness"){
      const E_GPa=numeric(parts[2],"E in row "+(index+1));
      const I_m4=numeric(parts[3],"I in row "+(index+1));
      if(!(E_GPa>0&&I_m4>0))throw new Error(
        "Stiffness E and I must be positive in row "+(index+1));
      data.push({x0,x1,E:E_GPa*1e9,I:I_m4});
    }else{
      const tonnesPerM=numeric(parts[2],"mass density in row "+(index+1));
      if(tonnesPerM<0)throw new Error(
        "Baseline mass density cannot be negative in row "+(index+1));
      data.push({x0,x1,tonnesPerM});
    }
  }
  if(data.length>60)throw new Error("Longitudinal profile exceeds 60 stations");
  return data;
}
export function validateGirderProfile(stations,{xMin,xMax,kind}={}){
  if(!["stiffness","mass"].includes(kind))throw new Error("Unknown longitudinal profile type");
  if(!finite(xMin)||!finite(xMax)||!(xMax>xMin))
    throw new Error("Valid girder X extent is required");
  if(!Array.isArray(stations)||!stations.length)return null;
  if(stations.length>60)throw new Error("Longitudinal profile exceeds 60 stations");
  const tol=Math.max(1e-9,Math.abs(xMax-xMin)*1e-8);
  const result=[];
  let edge=xMin;
  for(const [i,s] of stations.entries()){
    if(!s||![s.x0,s.x1].every(finite)||!(s.x1>s.x0)||
       Math.abs(s.x0-edge)>tol)
      throw new Error(kind+" stations must cover X continuously in ascending order; check row "+(i+1));
    const upper=(i===stations.length-1)?xMax:s.x1;
    if(upper> xMax+tol||!(upper>edge+tol))
      throw new Error(kind+" station "+(i+1)+" lies beyond girder span or has zero length");
    if(kind==="stiffness"){
      if(!finite(s.E)||!finite(s.I)||!(s.E>0&&s.I>0))
        throw new Error("Structural stiffness stations need positive E and I");
    }else if(!finite(s.tonnesPerM)||s.tonnesPerM<0)
      throw new Error("Baseline mass station needs a nonnegative t/m");
    result.push({...s,x0:edge,x1:upper});
    edge=upper;
  }
  if(Math.abs(edge-xMax)>tol)throw new Error(kind+" stations must span the entire beam X range");
  return result;
}
export function girderProfileAt(stations,x){
  if(!stations?.length||!finite(x))return null;
  return stations.find(s=>x>=s.x0&&x<=s.x1)??null;
}
export function baselineMassAudit(stations,{hullMassTonnes,hullCGx,xMin,xMax}={}){
  const given=numeric(hullMassTonnes,"Hull baseline mass");
  if(!(given>0))throw new Error("Hull baseline mass must be positive");
  const span=xMax-xMin;
  const used=stations?.length?stations:[{x0:xMin,x1:xMax,tonnesPerM:given/span}];
  const total=used.reduce((sum,s)=>sum+(s.x1-s.x0)*s.tonnesPerM,0);
  const moment=used.reduce((sum,s)=>
    sum+(s.x1-s.x0)*s.tonnesPerM*(s.x0+s.x1)/2,0);
  const centerX=total?moment/total:null;
  const massTolerance=Math.max(.000001,given*1e-4);
  const cgTolerance=Math.max(.0001,span*1e-4);
  if(stations?.length){
    if(Math.abs(total-given)>massTolerance)
      throw new Error("Baseline mass profile integrates to "+total.toFixed(4)+
        " t, but hull baseline mass is "+given.toFixed(4)+
        " t. Match the totals; mass is never renormalized.");
    if(!finite(hullCGx)||Math.abs(centerX-hullCGx)>cgTolerance)
      throw new Error("Baseline mass profile LCG is "+centerX.toFixed(4)+
        " m, but entered hull CG X is "+String(hullCGx)+
        " m. Match them before structural analysis.");
  }
  return {stations:used,totalMassTonnes:total,firstMomentTonnesM:moment,
    centerX,enteredCenterX:hullCGx,massErrorTonnes:total-given,
    centerErrorM:finite(hullCGx)?centerX-hullCGx:null,
    isExplicit:Boolean(stations?.length)};
}
