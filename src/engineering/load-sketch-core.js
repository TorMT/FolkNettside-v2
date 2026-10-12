import {normaliseAreaLoad} from "../hydro/hull-loading.js?v=143ce2ba2c492aff2d441de71e89a31c1409e580";

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

/** Keep comments, blank lines, their order and CRLF/LF separators untouched. */
export function sketchDataRowIndices(text){
  return String(text??"").split(/\r?\n/).flatMap((line,index)=>
    line.trim()&&!line.trim().startsWith("#")?[index]:[]);
}

export function updateSketchDataRow(text,index,replacement=null){
  const source=String(text??"");
  const lines=source.split(/\r?\n/);
  const locations=sketchDataRowIndices(source);
  if(!Number.isSafeInteger(index)||index<0||index>=locations.length)
    throw new Error("Selected load row no longer exists; reselect the load");
  if(replacement!==null&&(typeof replacement!=="string"||!replacement.trim()||
     /[\r\n]/.test(replacement)))
    throw new Error("Edited load must be exactly one valid data row");
  const line=locations[index];
  if(replacement===null)lines.splice(line,1);
  else lines[line]=replacement;
  const newline=source.includes("\r\n")?"\r\n":"\n";
  return lines.join(newline);
}

/** Translate a mass rectangle, preserving its density, area, elevation and mass. */
export function moveSketchAreaLoad(load,start,end,bounds,size={width:600,height:300}){
  const original=normaliseAreaLoad(load);
  const envelope=planBounds(bounds);
  const dx=planPixelToMeters(end.x,end.y,bounds,size).x-
           planPixelToMeters(start.x,start.y,bounds,size).x;
  const dy=planPixelToMeters(end.x,end.y,bounds,size).y-
           planPixelToMeters(start.x,start.y,bounds,size).y;
  const width=original.x1-original.x0,height=original.y1-original.y0;
  if(width>envelope.x1-envelope.x0||height>envelope.y1-envelope.y0)
    throw new Error("Selected area is larger than the available hull plan");
  const x0=clamp(original.x0+dx,envelope.x0,envelope.x1-width);
  const y0=clamp(original.y0+dy,envelope.y0,envelope.y1-height);
  return normaliseAreaLoad({...original,x0,x1:x0+width,y0,y1:y0+height});
}

/** Relocate a point mass without changing its signed mass or vertical moment arm. */
export function moveSketchPointMass(load,at,bounds,size={width:600,height:300}){
  if(!load||![load.massTonnes,load.x,load.y,load.z].every(Number.isFinite)||
    load.massTonnes===0)
    throw new Error("Selected point mass is invalid");
  return {...load,...planPixelToMeters(at.x,at.y,bounds,size)};
}

export function editSketchAreaProperties(load,density,z){
  return normaliseAreaLoad({...load,densityTonnesPerM2:density,z});
}
export function editSketchPointProperties(load,massTonnes,z){
  if(massTonnes===null||massTonnes===undefined||String(massTonnes).trim()===""||
    z===null||z===undefined||String(z).trim()==="")
    throw new Error("Point mass and Z are required");
  const mass=Number(massTonnes),height=Number(z);
  if(!Number.isFinite(mass)||mass===0||!Number.isFinite(height))
    throw new Error("Point mass must be finite and nonzero; Z must be finite");
  return {...load,massTonnes:mass,z:height};
}
