export function actuatorDisk({
  thrust,
  diameter,
  inflowSpeed=0,
  density=1025
}){
  const T=Number(thrust),D=Number(diameter),V0=Number(inflowSpeed),rho=Number(density);
  if(!(T>=0))throw new Error("thrust must be non-negative");
  if(!(D>0))throw new Error("diameter must be positive");
  if(!(V0>=0))throw new Error("inflowSpeed must be non-negative");
  if(!(rho>0))throw new Error("density must be positive");

  const area=Math.PI*D*D/4;
  if(T===0){
    return {
      area,diskLoading:0,inducedVelocity:0,diskVelocity:V0,
      farWakeVelocity:V0,idealPower:0,idealEfficiency:V0>0?1:null
    };
  }

  const inducedVelocity=(-V0+Math.sqrt(V0*V0+2*T/(rho*area)))/2;
  const diskVelocity=V0+inducedVelocity;
  const farWakeVelocity=V0+2*inducedVelocity;
  const idealPower=T*diskVelocity;
  const idealEfficiency=V0>0?V0/diskVelocity:null;
  const diskLoading=T/area;

  return {
    area,diskLoading,inducedVelocity,diskVelocity,
    farWakeVelocity,idealPower,idealEfficiency
  };
}

export function actuatorDiskCurve(input,{minThrust=0,maxThrust,samples=11}={}){
  const count=Math.max(2,Math.floor(samples));
  const high=Number(maxThrust);
  if(!(high>=minThrust))throw new Error("maxThrust must be >= minThrust");
  return Array.from({length:count},(_,index)=>{
    const t=index/(count-1);
    const thrust=minThrust+(high-minThrust)*t;
    return {thrust,...actuatorDisk({...input,thrust})};
  });
}
