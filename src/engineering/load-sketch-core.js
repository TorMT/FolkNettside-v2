import {normaliseAreaLoad} from "../hydro/hull-loading.js";

/** Longitudinal X is rightwards; transverse Y is upwards in plan view. */
export function planBounds(bounds){
  const min=bounds?.min,max=bounds?.max;
  if(!Array.isArray(min)||!Array.isArray(max)||
    ![min[0],min[1],max[0],max[1]].every(Number.isFinite)||
    !(max[0]>min[0])||!(max[1]>min[1]))
    throw new Error("A model with positive X and Y dimensions is required for drawing loads");
  return {x0:min[0],x1:max[0],y0:min[1],y1:max[1]};
}

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function planPixelToMeters(px,py,bounds,{width=600,height=300}={}){
  const b=planBounds(bounds);
  if(![px,py,width,height].every(Number.isFinite)||width<=0||height<=0)
    throw new Error("Invalid load sketch dimensions");
  return {
    x:b.x0+clamp(px/width,0,1)*(b.x1-b.x0),
    y:b.y1-clamp(py/height,0,1)*(b.y1-b.y0)
  };
}

export function planMetersToPixel(x,y,bounds,{width=600,height=300}={}){
  const b=planBounds(bounds);
  return {
    x:(x-b.x0)/(b.x1-b.x0)*width,
    y:(b.y1-y)/(b.y1-b.y0)*height
  };
}

export function sketchAreaLoad(start,end,bounds,densityTonnesPerM2,z,
  size={width:600,height:300}){
  const a=planPixelToMeters(start.x,start.y,bounds,size);
  const b=planPixelToMeters(end.x,end.y,bounds,size);
  const result=normaliseAreaLoad({
    densityTonnesPerM2,x0:Math.min(a.x,b.x),x1:Math.max(a.x,b.x),
    y0:Math.min(a.y,b.y),y1:Math.max(a.y,b.y),z
  });
  const dimensions=planBounds(bounds);
  if(result.x1-result.x0<(dimensions.x1-dimensions.x0)*.005||
    result.y1-result.y0<(dimensions.y1-dimensions.y0)*.005)
    throw new Error("Draw a larger load rectangle (at least 0.5% of each hull dimension)");
  return result;
}

export function sketchPointMass(at,bounds,massTonnes,z,size={width:600,height:300}){
  if(z===""||z===null||z===undefined||!Number.isFinite(Number(z)))
    throw new Error("Point-load height Z is required");
  if(massTonnes===""||massTonnes===null||massTonnes===undefined||
    !Number.isFinite(Number(massTonnes))||Number(massTonnes)===0)
    throw new Error("Point mass must be a finite nonzero number of tonnes");
  return {massTonnes:Number(massTonnes),...planPixelToMeters(at.x,at.y,bounds,size),z:Number(z)};
}
const printed=value=>Number(value.toPrecision(10)).toString();
export function areaLoadLine(load){
  const checked=normaliseAreaLoad(load);
  return [checked.densityTonnesPerM2,checked.x0,checked.x1,checked.y0,checked.y1,checked.z]
    .map(printed).join(", ");
}
export function pointMassLine(load){
  if(![load.massTonnes,load.x,load.y,load.z].every(Number.isFinite)||!load.massTonnes)
    throw Error("Point mass and coordinates must be valid");
  return [load.massTonnes,load.x,load.y,load.z].map(printed).join(", ");
}
export function appendSketchLine(current,line){
  const value=String(current||"");
  return value+(value&&!value.endsWith("\n")?"\n":"")+line;
}
