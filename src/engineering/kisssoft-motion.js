/** Ideal simple planetary train speeds normalized to a driving shaft of +1.
 * Willis: z_s*(omega_s-omega_c)+z_r*(omega_r-omega_c)=0.
 * Planet relative spin comes from the sun/planet external mesh.
 * Assumes all three gears share the same transverse module and pitch axis.
 */
export function planetaryRates(zSun,zPlanet,zRing,{mode="ring-fixed"}={}){
 for(const value of [zSun,zPlanet,zRing])
   if(!Number.isSafeInteger(value)||value<=0)throw Error("Positive tooth counts are required");
 if(zSun+2*zPlanet!==zRing)throw Error("Planetary pitch geometry is inconsistent");
 let sun,ring,carrier;
 if(mode==="ring-fixed"){
   sun=1;ring=0;carrier=zSun/(zSun+zRing);
 }else if(mode==="sun-fixed"){
   sun=0;ring=1;carrier=zRing/(zSun+zRing);
 }else if(mode==="carrier-fixed"){
   sun=1;carrier=0;ring=-zSun/zRing;
 }else throw Error("Unsupported ideal planetary boundary condition");
 const planetRelativeCarrier=-(zSun/zPlanet)*(sun-carrier);
 const planet=carrier+planetRelativeCarrier;
 const closureResidual=zSun*(sun-carrier)+zRing*(ring-carrier);
 return {mode,sun,ring,carrier,planet,planetRelativeCarrier,closureResidual};
}
export function fixedRingPlanetaryRates(zSun,zPlanet,zRing){
 return planetaryRates(zSun,zPlanet,zRing,{mode:"ring-fixed"});
}
