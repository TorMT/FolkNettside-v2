export function initialStability(hydroResult,{kg=null}={}){
  const volume=Number(hydroResult?.volume);
  if(!(volume>0))return {
    valid:false,
    reason:"Positive displacement volume is required"
  };

  const cb=hydroResult.centerOfBuoyancy||[0,0,0];
  const waterplane=hydroResult.waterplane||{};
  const kb=Number(cb[2])||0;
  const bmTransverse=Number(waterplane.ixx||0)/volume;
  const bmLongitudinal=Number(waterplane.iyy||0)/volume;
  const kmTransverse=kb+bmTransverse;
  const kmLongitudinal=kb+bmLongitudinal;
  const kgValue=kg===""||kg===null||kg===undefined?null:Number(kg);

  return {
    valid:true,
    kb,
    bmTransverse,
    bmLongitudinal,
    kmTransverse,
    kmLongitudinal,
    kg:Number.isFinite(kgValue)?kgValue:null,
    gmTransverse:Number.isFinite(kgValue)?kmTransverse-kgValue:null,
    gmLongitudinal:Number.isFinite(kgValue)?kmLongitudinal-kgValue:null
  };
}

export function rectangularBargeStability({L,B,T,kg=null}){
  const l=Number(L),b=Number(B),t=Number(T);
  if(!(l>0&&b>0&&t>0))throw new Error("L, B and T must be positive");
  const kb=t/2;
  const bmTransverse=b*b/(12*t);
  const bmLongitudinal=l*l/(12*t);
  const kgValue=kg===null||kg===undefined?null:Number(kg);
  return {
    kb,
    bmTransverse,
    bmLongitudinal,
    kmTransverse:kb+bmTransverse,
    kmLongitudinal:kb+bmLongitudinal,
    kg:Number.isFinite(kgValue)?kgValue:null,
    gmTransverse:Number.isFinite(kgValue)?kb+bmTransverse-kgValue:null,
    gmLongitudinal:Number.isFinite(kgValue)?kb+bmLongitudinal-kgValue:null
  };
}


export function waterplanePrincipalAxes(waterplane={}){
  const ixx=Number(waterplane.ixx)||0;
  const iyy=Number(waterplane.iyy)||0;
  const ixy=Number(waterplane.ixy)||0;
  const mean=(ixx+iyy)/2;
  const radius=Math.hypot((ixx-iyy)/2,ixy);
  const major=mean+radius;
  const minor=mean-radius;
  const angleRad=.5*Math.atan2(2*ixy,iyy-ixx);
  return {
    major,
    minor:Math.max(0,minor),
    angleRad,
    angleDeg:angleRad*180/Math.PI,
    ixx,
    iyy,
    ixy
  };
}

export function hydrostaticParticulars(hydroResult,{density=1025,kg=null}={}){
  const volume=Number(hydroResult?.volume);
  const waterplane=hydroResult?.waterplane||{};
  const cb=hydroResult?.centerOfBuoyancy||[0,0,0];
  const area=Number(waterplane.area)||0;
  const centroid=Array.isArray(waterplane.centroid)?waterplane.centroid:[0,0];
  const rho=Number(density)||1025;
  const stability=initialStability(hydroResult,{kg});
  const principal=waterplanePrincipalAxes(waterplane);

  return {
    valid:volume>0,
    volume:Number.isFinite(volume)?volume:0,
    displacementTonnes:volume>0?volume*rho/1000:0,
    kb:Number(cb[2])||0,
    lcb:Number(cb[0])||0,
    tcb:Number(cb[1])||0,
    waterplaneArea:area,
    lcf:Number(centroid[0])||0,
    tcf:Number(centroid[1])||0,
    tonnesPerCm:area>0?rho*area*0.01/1000:0,
    ixx:Number(waterplane.ixx)||0,
    iyy:Number(waterplane.iyy)||0,
    ixy:Number(waterplane.ixy)||0,
    principalMomentMajor:principal.major,
    principalMomentMinor:principal.minor,
    principalAxisDeg:principal.angleDeg,
    principalBmMajor:volume>0?principal.major/volume:0,
    principalBmMinor:volume>0?principal.minor/volume:0,
    ...stability
  };
}

export function hydrostaticCurveRows(curve,{density=1025,kg=null}={}){
  return (curve||[]).map(point=>{
    const particulars=hydrostaticParticulars(point,{density,kg});
    return {
      draft:Number(point.waterline)||0,
      ...particulars
    };
  });
}
