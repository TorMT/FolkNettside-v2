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
