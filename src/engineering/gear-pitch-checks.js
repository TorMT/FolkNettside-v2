/**
 * Lightweight pitch-circle checks for conceptual KISSsoft previews.
 * The original source is authoritative for strength/contact; these checks
 * neither solve tooth profiles nor certify meshing/manufacturability.
 */
export function gearPitchGeometry({module,normalModule,beta=0,teeth}){
 const mn=Number(module??normalModule),b=Number(beta),z=Number(teeth);
 if(!(mn>0&&Number.isFinite(mn)))throw Error("Positive normal module required");
 if(!Number.isFinite(b)||Math.abs(b)>=75)throw Error("Helix angle outside the preview range (-75°, 75°)");
 if(!Number.isInteger(z)||z<=2||z>2000)throw Error("Gear tooth count must be an integer between 3 and 2000");
 const mt=mn/Math.cos(b*Math.PI/180),pitchDiameter=mt*z;
 return {normalModule:mn,transverseModule:mt,helixAngleDeg:b,teeth:z,
   pitchDiameter,pitchRadius:pitchDiameter/2,
   helixLead:Math.abs(b)<1e-9?Infinity:Math.PI*pitchDiameter/Math.tan(b*Math.PI/180)};
}
export function externalGearPair(model){
 const z1=model?.gears?.[0]?.teeth,z2=model?.gears?.[1]?.teeth;
 if(!Number.isInteger(z1)||!Number.isInteger(z2)||z1<=2||z2<=2||model?.planetary)return null;
 let a,b;
 try{
   a=gearPitchGeometry({module:model.module,beta:model.beta??0,teeth:z1});
   b=gearPitchGeometry({module:model.module,beta:model.beta??0,teeth:z2});
 }catch{return null}
 const centerDistance=a.pitchRadius+b.pitchRadius;
 const velocityRatio=-z1/z2;
 const tangencyResidual=a.pitchRadius+velocityRatio*b.pitchRadius;
 return {kind:"external-pair",a,b,centerDistance,velocityRatio,tangencyResidual,
   shaft1Width:Number(model.gears[0].width)>0?Number(model.gears[0].width):20,
   shaft2Width:Number(model.gears[1].width)>0?Number(model.gears[1].width):20};
}
export function checkPlanetaryPitch(model){
 if(!model?.planetary)return null;
 const sun=gearPitchGeometry({module:model.module,beta:model.beta??0,teeth:model.gears[0].teeth});
 const planet=gearPitchGeometry({module:model.module,beta:model.beta??0,teeth:model.gears[1].teeth});
 const ring=gearPitchGeometry({module:model.module,beta:model.beta??0,teeth:Math.abs(model.gears[2].teeth)});
 return {sun,planet,ring,
  sunPlanetCenterDistance:sun.pitchRadius+planet.pitchRadius,
  ringPlanetCenterDistance:ring.pitchRadius-planet.pitchRadius,
  residual:sun.pitchRadius+2*planet.pitchRadius-ring.pitchRadius};
}
