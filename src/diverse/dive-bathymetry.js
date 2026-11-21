import {diveFeaturePoint} from "./dive-core.js";

// EMODnet's avg is seabed ELEVATION relative to its vertical datum.
// A negative value corresponds to water depth; a positive value may be land.
// Do not substitute this for local soundings, entry-depth or safe-dive limits.
export function diveBathymetryUrl(feature){
  const pt=diveFeaturePoint(feature);
  if(!pt||pt.lat<30||pt.lat>73||pt.lon< -32||pt.lon>45)return null;
  return `https://rest.emodnet-bathymetry.eu/depth_sample?geom=POINT(${pt.lon}%20${pt.lat})`;
}
export function assessDiveBathymetry(data){
  const mean=data?.avg;
  if(typeof mean!=="number"||!Number.isFinite(mean))
    return {status:"unavailable",depth:null};
  if(mean>=0)return {status:"land-or-dry",depth:null};
  const depth=Math.round(-mean*10)/10;
  if(depth<0.5)return {status:"shoreline",depth:null};
  const spread=typeof data.min==="number"&&typeof data.max==="number"?
    Math.round(Math.abs(data.max-data.min)*10)/10:null;
  return {status:"model",depth,spread,source:"EMODnet Bathymetry DTM",reference:data.reference?.identifier||null};
}
export async function fetchDiveBathymetry(feature,fetchImpl=fetch){
  const url=diveBathymetryUrl(feature);
  if(!url)return {status:"outside-coverage",depth:null};
  const response=await fetchImpl(url,{cache:"default"});
  if(!response.ok)throw new Error(`EMODnet HTTP ${response.status}`);
  const data=await response.json();
  return {...assessDiveBathymetry(data),url};
}
