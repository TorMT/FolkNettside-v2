/**
 * Global hull-girder PREVIEW field: a beam bending stress approximation
 * evaluated at actual hull-surface world coordinates. Not shell-element stress.
 *
 * Sigma_x(x,z) = M_y(x) (z-zNeutral) / I_yy
 * Positive/negative indicate opposite bending fibres, depending on sign.
 */
export function interpolateGirderAt(field,x){
  if(!Array.isArray(field)||field.length===0)throw new Error("No beam results");
  const value=Number(x);
  if(!Number.isFinite(value))throw new Error("Invalid beam x coordinate");
  if(value<=field[0].x)return {...field[0]};
  if(value>=field.at(-1).x)return {...field.at(-1)};
  let lo=0,hi=field.length-1;
  while(hi-lo>1){
    const m=(lo+hi)>>1;
    if(field[m].x<=value)lo=m;else hi=m;
  }
  const a=field[lo],b=field[hi];
  const t=Math.min(1,Math.max(0,(value-a.x)/Math.max(1e-12,b.x-a.x)));
  return {x:value,
    momentNm:a.momentNm+(b.momentNm-a.momentNm)*t,
    deflectionM:a.deflectionM+(b.deflectionM-a.deflectionM)*t,
    shearN:a.shearN+(b.shearN-a.shearN)*t};
}
export function stressAtHullPoint(girder,x,z,{neutralZ=0}={}){
  const I=Number(girder?.frame?.elements?.[0]?.I);
  if(!(I>0))throw new Error("FEM section inertia not available");
  const {momentNm}=interpolateGirderAt(girder.field,x);
  return momentNm*(z-neutralZ)/I;
}
// Fusion-like diverging blue → cyan → light → orange → red contour stops.
// Magnitudes are only normalized for display, not made-up material strengths.
const colorStops=[
  [0,[.09,.28,.78]],[.25,[.19,.67,.91]],[.5,[.87,.93,.88]],
  [.75,[.97,.62,.21]],[1,[.77,.14,.13]]
];
export function stressRGB(value,range){
  if(!Number.isFinite(value)||!Number.isFinite(range)||range<=0)
    throw new Error("Stress and color scale must be finite; range must be positive");
  const t=Math.max(0,Math.min(1,.5+.5*value/range));
  for(let i=1;i<colorStops.length;i++){
    if(t<=colorStops[i][0]){
      const [ta,ca]=colorStops[i-1],[tb,cb]=colorStops[i],w=(t-ta)/(tb-ta);
      return ca.map((v,j)=>v+(cb[j]-v)*w);
    }
  }
  return colorStops.at(-1)[1];
}
export function stressLegend(rangePa){
  const r=Number(rangePa);
  if(!(r>0&&Number.isFinite(r)))throw new Error("Invalid stress legend");
  return {minMPa:-r/1e6,zeroMPa:0,maxMPa:r/1e6,
    label:"Signed global longitudinal bending stress, MPa · beam approximation"};
}
