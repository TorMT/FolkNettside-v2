/**
 * Lightweight pitch-circle checks for conceptual KISSsoft previews.
 * The original source is authoritative for strength/contact; these checks
 * neither solve tooth profiles nor certify meshing/manufacturability.
 */
export function gearPitchGeometry({module,normalModule,beta=0,teeth,normalPressureAngleDeg=null}){
 const mn=Number(module??normalModule),b=Number(beta),z=Number(teeth);
 if(!(mn>0&&Number.isFinite(mn)))throw Error("Positive normal module required");
 if(!Number.isFinite(b)||Math.abs(b)>=75)throw Error("Helix angle outside the preview range (-75°, 75°)");
 if(!Number.isInteger(z)||z<=2||z>2000)throw Error("Gear tooth count must be an integer between 3 and 2000");
 const mt=mn/Math.cos(b*Math.PI/180),pitchDiameter=mt*z;
 const pitchRadius=pitchDiameter/2,pressure=normalPressureAngleDeg;
 const pressureAngleTransverseDeg=pressure===null||pressure===undefined?null:
    Math.atan(Math.tan(Number(pressure)*Math.PI/180)/Math.cos(b*Math.PI/180))*180/Math.PI;
 if(pressureAngleTransverseDeg!==null &&
    (!Number.isFinite(pressureAngleTransverseDeg)||pressureAngleTransverseDeg<=0||pressureAngleTransverseDeg>=50))
   throw Error("Invalid normal pressure angle for gear preview");
 return {normalModule:mn,transverseModule:mt,helixAngleDeg:b,teeth:z,
   pitchDiameter,pitchRadius,normalPressureAngleDeg:pressure,
   pressureAngleTransverseDeg,
   baseRadius:pressureAngleTransverseDeg===null?null:pitchRadius*Math.cos(pressureAngleTransverseDeg*Math.PI/180),
   helixLead:Math.abs(b)<1e-9?Infinity:Math.PI*pitchDiameter/Math.tan(b*Math.PI/180)};
}
/** Normal external-external mesh or external pinion/internal ring.
 * Signed ring teeth are conventional in KISSsoft Z012/Z012-family modules.
 * Kinematic assumptions are nominal, no backlash, tooth modification or load.
 */
export function externalGearPair(model){
 const z1=model?.gears?.[0]?.teeth,z2=model?.gears?.[1]?.teeth;
 if(!Number.isInteger(z1)||!Number.isInteger(z2)||Math.abs(z1)<=2||Math.abs(z2)<=2||
    model?.planetary||/^Z0?14(?:RS)?$/i.test(String(model?.moduleCode||"")))return null;
 const internal=(z1<0)!==(z2<0);
 if(!internal&&(z1<0||z2<0))return null;
 // Normalize the internal pair for geometry: a is always the external pinion
 // and b is the internal ring, regardless of source gear order.
 const pinionIndex=internal?(z1>0?0:1):0;
 const ringIndex=internal?1-pinionIndex:1;
 const za=Math.abs(model.gears[pinionIndex].teeth);
 const zb=Math.abs(model.gears[ringIndex].teeth);
 if(internal&&zb<=za)return null;
 let a,b;
 try{
   a=gearPitchGeometry({module:model.module,beta:model.beta??0,teeth:za,normalPressureAngleDeg:model.pressureAngleNormalDeg});
   b=gearPitchGeometry({module:model.module,beta:model.beta??0,teeth:zb,normalPressureAngleDeg:model.pressureAngleNormalDeg});
 }catch{return null}
 const centerDistance=internal?b.pitchRadius-a.pitchRadius:a.pitchRadius+b.pitchRadius;
 const velocityRatio=internal?za/zb:-za/zb;
 const tangencyResidual=internal?a.pitchRadius-velocityRatio*b.pitchRadius:
   a.pitchRadius+velocityRatio*b.pitchRadius;
 return {kind:internal?"internal-pair":"external-pair",internal,a,b,
   pinionIndex,ringIndex,centerDistance,velocityRatio,tangencyResidual,
   shaft1Width:Number(model.gears[pinionIndex].width)>0?Number(model.gears[pinionIndex].width):20,
   shaft2Width:Number(model.gears[ringIndex].width)>0?Number(model.gears[ringIndex].width):20};
}
export function checkPlanetaryPitch(model){
 if(!model?.planetary)return null;
 const sun=gearPitchGeometry({module:model.module,beta:model.beta??0,teeth:model.gears[0].teeth,normalPressureAngleDeg:model.pressureAngleNormalDeg});
 const planet=gearPitchGeometry({module:model.module,beta:model.beta??0,teeth:model.gears[1].teeth,normalPressureAngleDeg:model.pressureAngleNormalDeg});
 const ring=gearPitchGeometry({module:model.module,beta:model.beta??0,teeth:Math.abs(model.gears[2].teeth),normalPressureAngleDeg:model.pressureAngleNormalDeg});
 return {sun,planet,ring,
  sunPlanetCenterDistance:sun.pitchRadius+planet.pitchRadius,
  ringPlanetCenterDistance:ring.pitchRadius-planet.pitchRadius,
  residual:sun.pitchRadius+2*planet.pitchRadius-ring.pitchRadius};
}
