/**
 * Compute total mass and CG after adding/removing discrete point weights.
 * This is a static MASS loading condition, not an applied force in newtons.
 * The baseline is the vessel's pre-load displacement at an explicitly selected
 * reference draft, so it must NOT already include the added weights.
 *
 * Coordinates x=longitudinal, y=transverse, z=above datum, all in metres.
 * Mass is tonnes; changing displacement is solved separately by Hydro.
 */
const present=value=>value!==null&&value!==undefined&&
  !(typeof value==="string"&&!value.trim());
export function combinePointWeights({baselineMassTonnes,baselineCG,pointWeights=[]}={}){
  const base=Number(baselineMassTonnes);
  if(!(Number.isFinite(base)&&base>0))throw new Error("Baseline mass must be positive tonnes");
  if(!Array.isArray(baselineCG)||baselineCG.length!==3||
     !baselineCG.every(x=>present(x)&&Number.isFinite(Number(x))))
    throw new Error("Baseline CG must have 3 finite coordinates");
  if(!Array.isArray(pointWeights)||pointWeights.length>100)
    throw new Error("Maximum 100 point weights allowed");
  const sums=baselineCG.map(x=>base*Number(x));
  let total=base;
  const items=pointWeights.map((load,index)=>{
    const mass=Number(load.massTonnes),x=Number(load.x),y=Number(load.y),z=Number(load.z);
    if(![load.massTonnes,load.x,load.y,load.z].every(present)||
       ![mass,x,y,z].every(Number.isFinite)||mass===0)
      throw new Error("Point weight "+(index+1)+" requires finite nonzero mass and x/y/z");
    total+=mass;
    for(const [i,coord] of [x,y,z].entries())sums[i]+=mass*coord;
    return {massTonnes:mass,x,y,z,label:String(load.label||"Point weight "+(index+1))};
  });
  if(!(total>0)||!Number.isFinite(total)||!sums.every(Number.isFinite))
    throw new Error("Net displacement and gravity moments must be finite and positive");
  return {
    baselineMassTonnes:base,addedMassTonnes:total-base,totalMassTonnes:total,
    centerOfGravity:sums.map(value=>value/total),
    pointWeights:items
  };
}
export function pointWeightsFromLines(text){
  return String(text||"").split(/\r?\n/).map((line,index)=>({line,index})).
    filter(item=>item.line.trim()&&!item.line.trim().startsWith("#")).map(({line,index})=>{
      const values=line.split(/[,;\t ]+/).filter(Boolean);
      if(values.length!==4)throw new Error("Point weight line "+(index+1)+
        ": enter mass(t), x(m), y(m), z(m)");
      const [massTonnes,x,y,z]=values.map(Number);
      if(![massTonnes,x,y,z].every(Number.isFinite))
        throw new Error("Point weight line "+(index+1)+": all values must be numbers");
      return {massTonnes,x,y,z,label:"Point weight line "+(index+1)};
    });
}
