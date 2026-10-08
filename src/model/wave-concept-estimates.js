// Legacy HydroLab concept estimates. Results are NOT seakeeping/RAO,
// diffraction, CFD, or approved wave-load calculations.
const G=9.80665;
function requireNumber(value,label,{min=-Infinity,strict=false}={}){
  if(value===null||value===undefined||value==="")throw new Error(label+" is required");
  const number=Number(value);
  if(!Number.isFinite(number)||(strict?number<=min:number<min))
    throw new Error(label+" is outside its physical input range");
  return number;
}
export function legacyAddedWaveResistance({
  lwlM,bwlM,shipSpeedMs,waveHeightM,waveHeadingDeg=180,
  cAdded=.12,waterDensityKgM3=1025
}={}){
  const L=requireNumber(lwlM,"LWL",{min:0,strict:true});
  const B=requireNumber(bwlM,"BWL",{min:0,strict:true});
  const U=requireNumber(shipSpeedMs,"Speed",{min:0});
  const H=requireNumber(waveHeightM,"Wave height",{min:0});
  const hdg=requireNumber(waveHeadingDeg,"Heading");
  const c=requireNumber(cAdded,"Empirical coefficient",{min:0});
  const rho=requireNumber(waterDensityKgM3,"Density",{min:0,strict:true});
  const froude=U/Math.sqrt(G*L);
  const headingGain=Math.max(0,-Math.cos(hdg*Math.PI/180))**2;
  const speedGain=.6+1.4*Math.min(1.2,Math.max(0,froude));
  return {
    addedResistanceN:c*.5*rho*U*U*(B*H/2)*headingGain*speedGain,
    headingGain,froude,speedGain,
    provenance:"Legacy simplified concept estimate, not a validated model of added ship resistance"
  };
}
export function legacyMorisonWaveForce({
  waveHeightM,wavePeriodS,headingDeg=180,projectedAreaM2,volumeM3,
  dragCoefficient=.8,inertiaCoefficient=1.8,waterDensityKgM3=1025
}={}){
  const H=requireNumber(waveHeightM,"Wave height",{min:0});
  const T=requireNumber(wavePeriodS,"Period",{min:0,strict:true});
  const heading=requireNumber(headingDeg,"Heading");
  const A=requireNumber(projectedAreaM2,"Projected area",{min:0,strict:true});
  const V=requireNumber(volumeM3,"Submerged volume",{min:0,strict:true});
  const Cd=requireNumber(dragCoefficient,"Drag coefficient",{min:0});
  const Cm=requireNumber(inertiaCoefficient,"Inertia coefficient",{min:0});
  const rho=requireNumber(waterDensityKgM3,"Density",{min:0,strict:true});
  const omega=2*Math.PI/T,uMax=H/2*omega,duMax=H/2*omega**2;
  const dir=Math.abs(Math.cos(heading*Math.PI/180));
  const dragN=.5*rho*Cd*A*uMax**2*dir;
  const inertiaN=rho*Cm*V*duMax*dir;
  return {dragN,inertiaN,forcePeakN:dragN+inertiaN,uMax,duMax,
    provenance:"Legacy simplified Morison estimate; NOT valid for arbitrary vessel diffraction/radiation"};
}
