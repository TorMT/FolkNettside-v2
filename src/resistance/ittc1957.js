export const KNOT_TO_MPS=0.514444;

export function ittc1957({
  length,
  wettedSurface,
  speed,
  density=1025,
  kinematicViscosity=1.19e-6,
  gravity=9.80665
}){
  const L=Number(length),S=Number(wettedSurface),V=Number(speed),rho=Number(density),nu=Number(kinematicViscosity),g=Number(gravity);
  if(!(L>0))throw new Error("length must be positive");
  if(!(S>0))throw new Error("wettedSurface must be positive");
  if(!(V>=0))throw new Error("speed must be non-negative");
  if(!(rho>0&&nu>0&&g>0))throw new Error("fluid properties must be positive");
  if(V===0)return {reynolds:0,froude:0,cf:0,frictionResistance:0,effectivePower:0};

  const reynolds=V*L/nu;
  if(reynolds<=100)throw new Error("Reynolds number is too low for the ITTC-1957 correlation");
  const cf=0.075/(Math.log10(reynolds)-2)**2;
  const frictionResistance=0.5*rho*V*V*S*cf;
  const effectivePower=frictionResistance*V;
  const froude=V/Math.sqrt(g*L);

  return {reynolds,froude,cf,frictionResistance,effectivePower};
}

export function resistanceCurve(input,{minSpeed=0,maxSpeed,samples=11}={}){
  const count=Math.max(2,Math.floor(samples));
  const high=Number(maxSpeed);
  if(!(high>=minSpeed))throw new Error("maxSpeed must be greater than or equal to minSpeed");
  return Array.from({length:count},(_,index)=>{
    const t=index/(count-1);
    const speed=minSpeed+(high-minSpeed)*t;
    return {speed,...ittc1957({...input,speed})};
  });
}

export function knots(value){return Number(value)*KNOT_TO_MPS}
