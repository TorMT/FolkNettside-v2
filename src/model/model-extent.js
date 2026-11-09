/** Overall size of a model's mesh geometry in metres (unit scale applied).
 * STL/OBJ files carry no unit, so the extent is the quickest way to notice a
 * millimetre file read as metres (a "ship" 10 km long) or the reverse. */
const IDENTITY=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];

export function modelExtentMeters(modelDocument,{include=()=>true}={}){
  const scale=modelDocument?.unitScaleToMeters??1;
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const component of modelDocument?.components||[]){
    const p=component?.geometry?.positions;
    if(!p?.length||!include(component))continue;
    const m=component.transform||IDENTITY;
    for(let i=0;i+2<p.length;i+=3){
      const x=p[i],y=p[i+1],z=p[i+2];
      const q=[m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]];
      for(let d=0;d<3;d++){
        const v=q[d]*scale;
        if(v<min[d])min[d]=v;
        if(v>max[d])max[d]=v;
      }
    }
  }
  if(!min.every(Number.isFinite))return null;
  const size=min.map((v,i)=>max[i]-v);
  return {min,max,size,longest:Math.max(...size)};
}

/** Human text for a length in metres, e.g. "12.4 m", "38 cm", "2.5 mm". */
export function formatMeters(value){
  const v=Math.abs(Number(value));
  if(!Number.isFinite(v))return "—";
  const digits=n=>n>=100?n.toFixed(0):n>=10?n.toFixed(1):n.toFixed(2);
  if(v>=1000)return (v/1000).toFixed(v>=10000?0:1)+" km";
  if(v>=1)return digits(v)+" m";
  if(v>=0.01)return digits(v*100)+" cm";
  return digits(v*1000)+" mm";
}

// Vessels from model scale to ULCC fall well inside these limits.
const IMPLAUSIBLY_LARGE_M=600,IMPLAUSIBLY_SMALL_M=0.02;

/** Advisory (never blocking) when the overall size looks like a unit mistake. */
export function unitPlausibilityAdvisory(extent,unit="meter"){
  if(!extent||!(extent.longest>0))return null;
  const size=formatMeters(extent.longest);
  if(extent.longest>IMPLAUSIBLY_LARGE_M)
    return `Longest dimension reads as ${size} with units set to ${unit}. If this file is in millimetres, import it again with millimetres selected; hydrostatics scale with the cube of length.`;
  if(extent.longest<IMPLAUSIBLY_SMALL_M)
    return `Longest dimension reads as only ${size} with units set to ${unit}. If this file is in metres or centimetres, import it again with the correct unit.`;
  return null;
}
