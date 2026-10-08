// Regular linear Airy wave visualisation. Exploratory scene display only:
// it does NOT alter hydrostatics, establish a RAO or compute wave loads.
const G=9.80665;
const finite=(x,name)=>{const value=Number(x);if(!Number.isFinite(value))throw new Error(name+" must be finite");return value};
export function waveNumber(periodS,depthM=Infinity){
  const period=finite(periodS,"Period");
  if(period<=0)throw new Error("Wave period must be positive");
  const depth=depthM===Infinity?Infinity:finite(depthM,"Depth");
  if(depth!==Infinity&&depth<=0)throw new Error("Water depth must be positive");
  const omega=2*Math.PI/period,deep=omega*omega/G;
  if(depth===Infinity||deep*depth>18)return deep;
  let lower=deep,upper=deep;
  // Deep-water k is the lower bound for finite depth.
  while(G*upper*Math.tanh(upper*depth)<omega*omega)upper*=2;
  for(let i=0;i<75;i++){
    const middle=(lower+upper)/2;
    if(G*middle*Math.tanh(middle*depth)<omega*omega)lower=middle;else upper=middle;
  }
  return (lower+upper)/2;
}
export function normaliseWaveCase(options={}){
  const heightM=finite(options.heightM??1,"Wave height");
  const periodS=finite(options.periodS??6,"Wave period");
  const headingDeg=finite(options.headingDeg??0,"Wave heading");
  const phaseDeg=finite(options.phaseDeg??0,"Wave phase");
  const depth=options.waterDepthM??Infinity;
  const waterDepthM=depth===Infinity||depth==="deep"?Infinity:finite(depth,"Water depth");
  if(heightM<0||heightM>100)throw new Error("Wave height must be between 0 and 100 metres");
  if(periodS<=0||periodS>1000)throw new Error("Wave period must be positive and <= 1000 seconds");
  const k=waveNumber(periodS,waterDepthM);
  return {heightM,periodS,headingDeg,phaseDeg,waterDepthM,
    amplitudeM:heightM/2,waveNumber:k,omega:2*Math.PI/periodS,
    wavelengthM:2*Math.PI/k,phaseSpeedMs:2*Math.PI/(k*periodS),
    kind:"regular-linear",source:"illustrative",validatedForLoads:false};
}
export function waveElevation(wave,x=0,y=0,timeS=0){
  const deg=Math.PI/180;
  const along=finite(x,"x")*Math.cos(wave.headingDeg*deg)+finite(y,"y")*Math.sin(wave.headingDeg*deg);
  return wave.amplitudeM*Math.cos(wave.waveNumber*along-wave.omega*finite(timeS,"Time")+wave.phaseDeg*deg);
}
export function sampleWave(wave,{durationS=wave.periodS*3,stepS=wave.periodS/30,x=0,y=0}={}){
  const duration=finite(durationS,"Duration"),step=finite(stepS,"Sampling interval");
  if(duration<0||!(step>0)||duration/step>10000)throw new Error("Wave sampling requires positive step and <=10001 observations");
  return Array.from({length:Math.floor(duration/step)+1},(_,i)=>({
    timeS:i*step,elevationM:waveElevation(wave,x,y,i*step)
  }));
}
export function normalizeWaveObservations(rows){
  if(!Array.isArray(rows)||rows.length<2)throw new Error("Wave time-series requires a header and observations");
  const head=rows[0].map(x=>String(x).trim().toLowerCase());
  const at=names=>head.findIndex(h=>names.includes(h));
  const t=at(["t","time","time_s","times","seconds","tid","tid_s"]);
  const eta=at(["eta","eta_m","elevation","elevation_m","surface","z","vannstand"]);
  if(t<0||eta<0)throw new Error("Expected time and eta/elevation columns");
  const result=[];
  for(const row of rows.slice(1)){
    if(!row.some(x=>String(x).trim()))continue;
    const timeS=Number(row[t]),elevationM=Number(row[eta]);
    if(!Number.isFinite(timeS)||!Number.isFinite(elevationM))
      throw new Error("Wave time-series contains invalid numbers");
    if(result.length&&timeS<=result[result.length-1].timeS)
      throw new Error("Time values must increase strictly");
    result.push({timeS,elevationM});
    if(result.length>100000)throw new Error("Wave time-series exceeds 100000 points");
  }
  if(!result.length)throw new Error("No wave samples provided");
  return result;
}
export function waveObservationsCSV(rows){
  if(!Array.isArray(rows))throw new Error("Wave samples required");
  return "time_s,eta_m\n"+rows.map(p=>Number(p.timeS)+","+Number(p.elevationM)).join("\n")+"\n";
}
