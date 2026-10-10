/**
 * Evidence gate for fermentation end estimates, independent of UI and style.
 * Zero slope is not a prediction of finishing *now*: either a plateau
 * consistent with attenuation, or a potentially stalled fermentation.
 * Values are specific gravity, times are telemetry timestamps.
 */
const sg=value=>{
  const n=Number(value);
  if(!Number.isFinite(n)||n<=0)return NaN;
  return n>=10?n/1000:n;
};
function elapsedHours(a,b){return (b-a)/3_600_000}
export function evaluateFermentationPlateau(rows,{fgRange=null,minHours=36,maxSpanSG=.0015,minimumReadings=3}={}){
  const samples=(Array.isArray(rows)?rows:[]).map(r=>({
    ts:Date.parse(r?.createdOn),gravity:sg(r?.gravity)
  })).filter(r=>Number.isFinite(r.ts)&&Number.isFinite(r.gravity)&&r.gravity>.85&&r.gravity<1.3)
    .sort((a,b)=>a.ts-b.ts);
  const unique=[];
  for(const item of samples){
    if(unique.at(-1)?.ts===item.ts)unique[unique.length-1]=item;
    else unique.push(item);
  }
  if(unique.length<minimumReadings)
    return {state:"insufficient",reason:"Færre enn tre gyldige tetthetsmålinger."};
  const last=unique.at(-1),earliest=last.ts-minHours*3_600_000;
  const window=unique.filter(r=>r.ts>=earliest);
  if(window.length<minimumReadings||elapsedHours(window[0].ts,last.ts)<minHours*.92){
    return {state:"insufficient",reason:"Mangler målinger som dekker minst omtrent "+minHours+" timer."};
  }
  const lo=Math.min(...window.map(x=>x.gravity)),hi=Math.max(...window.map(x=>x.gravity));
  const span=hi-lo,spanHours=elapsedHours(window[0].ts,last.ts);
  // Least-squares with irregular sampling. Unlike point count, hours have
  // physical meaning; measurement jitter cannot be treated as fermentation.
  const meanTime=window.reduce((a,r)=>a+elapsedHours(window[0].ts,r.ts),0)/window.length;
  const meanGravity=window.reduce((a,r)=>a+r.gravity,0)/window.length;
  const covariance=window.reduce((a,r)=>a+(elapsedHours(window[0].ts,r.ts)-meanTime)*(r.gravity-meanGravity),0);
  const variance=window.reduce((a,r)=>a+(elapsedHours(window[0].ts,r.ts)-meanTime)**2,0);
  const slopeSGPerHour=variance>0?covariance/variance:NaN;
  const plateau=span<=maxSpanSG&&Math.abs(slopeSGPerHour)*24<=maxSpanSG*24/minHours;
  const first=unique[0].gravity;
  const attenuation=first>1&&first>last.gravity
    ?(first-last.gravity)/(first-1):NaN;
  const validTarget=Array.isArray(fgRange)&&fgRange.length===2&&fgRange.every(Number.isFinite)&&fgRange[1]>=fgRange[0];
  const nearTarget=validTarget&&last.gravity<=fgRange[1]+.002&&last.gravity>=fgRange[0]-.01;
  const hasAttenuation=Number.isFinite(attenuation)&&attenuation>=.70;
  const base={hoursObserved:spanHours,readingCount:window.length,
    gravity:last.gravity,rangeSG:span,slopeSGPerHour,attenuation,nearTarget,plateau};
  if(!plateau)return {state:"active-or-changing",...base};
  if(nearTarget||hasAttenuation)return {
    state:"stable-possible-finish",...base,
    reason:"Tettheten har vært praktisk stabil over målte timer, men sluttpunktet må bekreftes ved ny måling."
  };
  return {state:"stable-possible-stall",...base,
    reason:"Tettheten er stabil uten sikker dokumentasjon på ferdig gjæring; den kan ha stoppet for tidlig."};
}
export function plateauForecastMessage(result){
  if(result?.state==="stable-possible-finish")
    return "Gjæringen kan være nær slutt: gravity har vært praktisk stabil i omtrent "+
      Math.round(result.hoursObserved)+" timer. Dette er en observert platåperiode, ikke et estimat om at gjæringen ble ferdig i dag. Bekreft med en ny uavhengig gravitymåling og forventet sluttområde før batchen behandles som ferdig.";
  if(result?.state==="stable-possible-stall")
    return "Gravity har flatet ut i omtrent "+Math.round(result.hoursObserved)+
      " timer, men ligger ikke sikkert nær forventet sluttpunkt. Dette kan være en treg eller stoppet gjæring. Det er ikke faglig grunnlag for å oppgi en sluttdato ut fra null endringshastighet; kontroller måling, temperatur og gjæringsforhold.";
  return null;
}
