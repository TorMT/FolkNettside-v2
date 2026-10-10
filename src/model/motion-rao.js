/**
 * Import externally computed *complex* linear motion RAOs; this is not an
 * RAO solver. V1 format is deliberately strict to prevent silently changing
 * phase conventions, unit bases, reference points or headings.
 *
 * CSV: heading_deg,omega_rad_s,dof,amplitude,phase_deg
 * One row for each of surge,sway,heave,roll,pitch,yaw at every (heading,omega).
 * Translation RAOs: m/m; angular RAOs: rad/m. Amplitude is per metre of
 * incident wave AMPLITUDE (not wave height). Positive phase leads the wave.
 * Time convention: Re{a H exp[i(k·r - omega*t + phase_wave)]}.
 * Heading: direction of wave PROPAGATION, 0° means +X, 90° means +Y.
 * Coordinates: X forward, Y port, Z up; rotations in right-handed radians.
 * RAOs must refer to the vessel's selected visual pivot/reference point.
 */
export const RAO_DOFS=Object.freeze(["surge","sway","heave","roll","pitch","yaw"]);
const DEG=Math.PI/180;
const MAX_ROWS=12000;
const required="heading_deg,omega_rad_s,dof,amplitude,phase_deg";

const finite=(value,label)=>{
  if(value===null||value===undefined||String(value).trim()==="")
    throw Error("Missing RAO "+label);
  const n=Number(value);
  if(!Number.isFinite(n))throw Error("Invalid RAO "+label);
  return n;
};
export function parseMotionRAOCSV(input,{name="Imported RAO CSV"}={}){
 if(typeof input!=="string"||input.length>1600000)throw Error("RAO CSV exceeds 1.6 MB");
 const lines=input.replace(/^\uFEFF/,"").split(/\r?\n/)
   .map(line=>line.trim()).filter(line=>line&&!line.startsWith("#"));
 if(lines.length<2||lines.length>MAX_ROWS+1)throw Error("RAO CSV needs a header and <=12000 data rows");
 const headers=lines.shift().split(",").map(x=>x.trim().toLowerCase());
 if(headers.join(",")!==required)
   throw Error("RAO CSV columns must be: "+required);
 const lookup=new Map();
 for(const [i,line] of lines.entries()){
   const cells=line.split(",").map(x=>x.trim());
   if(cells.length!==5)throw Error("RAO line "+(i+2)+" must have five columns");
   const [headingText,omegaText,dofRaw,amplitudeText,phaseText]=cells;
   const heading=finite(headingText,"heading"),omega=finite(omegaText,"omega");
   const amplitude=finite(amplitudeText,"amplitude"),phase=finite(phaseText,"phase");
   const dof=dofRaw.toLowerCase();
   if(!RAO_DOFS.includes(dof))throw Error("Unknown RAO DOF: "+dofRaw);
   if(heading<0||heading>=360)throw Error("RAO heading must be 0–<360°");
   if(omega<=0||omega>20)throw Error("RAO omega must be (0,20] rad/s");
   if(amplitude<0||amplitude>10000)throw Error("RAO amplitude must be 0–10000 per metre");
   if(Math.abs(phase)>36000)throw Error("RAO phase exceeds allowed range");
   const key=heading+"|"+omega;
   if(!lookup.has(key))lookup.set(key,{headingDeg:heading,omegaRadS:omega,components:{}});
   const sample=lookup.get(key);
   if(sample.components[dof])throw Error("Duplicate RAO "+dof+" at heading "+heading+", omega "+omega);
   const angle=phase*DEG;
   sample.components[dof]={
     re:amplitude*Math.cos(angle),im:amplitude*Math.sin(angle)
   };
 }
 const rows=[...lookup.values()].sort((a,b)=>a.headingDeg-b.headingDeg||a.omegaRadS-b.omegaRadS);
 for(const row of rows){
   const missing=RAO_DOFS.filter(dof=>!row.components[dof]);
   if(missing.length)throw Error("Incomplete RAO at heading "+row.headingDeg+
     "°, omega "+row.omegaRadS+": missing "+missing.join(", "));
 }
 if(!rows.length)throw Error("RAO table is empty");
 const headings=[...new Set(rows.map(row=>row.headingDeg))].sort((a,b)=>a-b);
 return {
   kind:"imported-linear-motion-rao",name:String(name).slice(0,120),
   conventions:"propagation-heading; x-forward y-port z-up; translational m/m; rotational rad/m; positive phase lead; exp(-i omega t); relative to local incident wave at visual pivot",
   rows,headings
 };
}
export function interpolateMotionRAO(table,omegaRadS,headingDeg){
 if(table?.kind!=="imported-linear-motion-rao"||!Array.isArray(table.rows))
   throw Error("Import a complete RAO table first");
 const omega=finite(omegaRadS,"requested frequency");
 const rawHeading=finite(headingDeg,"requested heading");
 const heading=((rawHeading%360)+360)%360;
 // No cross-heading interpolation without an explicitly verified phase frame.
 const subset=table.rows.filter(row=>Math.abs(row.headingDeg-heading)<1e-8)
   .sort((a,b)=>a.omegaRadS-b.omegaRadS);
 if(!subset.length)throw Error("No RAO data for wave heading "+heading+
   "°. Available: "+table.headings.join(", ")+"°; choose an imported heading");
 const lo=subset[0],hi=subset[subset.length-1];
 const eps=1e-9*Math.max(1,omega);
 if(omega<lo.omegaRadS-eps||omega>hi.omegaRadS+eps)
   throw Error("Wave frequency "+omega.toFixed(4)+" rad/s outside RAO data ["+
     lo.omegaRadS+", "+hi.omegaRadS+"] rad/s; extrapolation is disabled");
 const upper=subset.findIndex(row=>row.omegaRadS>=omega-eps);
 const right=subset[Math.max(0,upper)],left=subset[Math.max(0,upper-1)];
 const span=right.omegaRadS-left.omegaRadS;
 const weight=span>0?Math.max(0,Math.min(1,(omega-left.omegaRadS)/span)):0;
 const components={};
 for(const dof of RAO_DOFS){
   const a=left.components[dof],b=right.components[dof];
   components[dof]={re:a.re+(b.re-a.re)*weight,im:a.im+(b.im-a.im)*weight};
 }
 return {kind:"interpolated-linear-motion-rao",headingDeg:heading,omegaRadS:omega,
   components,sourceName:table.name,sourceRows:[left.omegaRadS,right.omegaRadS]};
}
/**
 * Time-domain rigid-body motion in world X/Y/Z, right-hand-positive angles.
 * RAOs use the actual wave's amplitude a=H/2. Never apply arbitrary scaling,
 * damping, or motion caps (they would destroy RAO provenance).
 */
export function motionFromRAO(interpolated,wave,timeS,x=0,y=0){
 if(interpolated?.kind!=="interpolated-linear-motion-rao"||!wave)
   throw Error("Validated RAO interpolation and wave are required");
 if(Math.abs(interpolated.omegaRadS-wave.omega)>1e-7||
    Math.abs(interpolated.headingDeg-(((wave.headingDeg%360)+360)%360))>1e-7)
   throw Error("Wave and RAO frequency/heading mismatch");
 const finiteValue=finite(timeS,"time");
 const deg=Math.PI/180;
 const phase=wave.waveNumber*(x*Math.cos(wave.headingDeg*deg)+y*Math.sin(wave.headingDeg*deg))-
   wave.omega*finiteValue+wave.phaseDeg*deg;
 const cos=Math.cos(phase),sin=Math.sin(phase);
 const displacement=dof=>{
   const {re,im}=interpolated.components[dof];
   return wave.amplitudeM*(re*cos-im*sin);
 };
 return {
   surgeM:displacement("surge"),swayM:displacement("sway"),
   heaveM:displacement("heave"),
   rollRad:displacement("roll"),pitchRad:displacement("pitch"),
   yawRad:displacement("yaw")
 };
}
