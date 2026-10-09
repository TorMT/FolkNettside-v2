/**
 * Ideal simple planetary gear kinematics, expressed relative to sun angular speed.
 * Fixed ring: omega_ring=0. These are NOT measured KISSsoft shaft RPMs.
 */
export function fixedRingPlanetaryRates(zSun,zPlanet,zRing){
  for(const value of [zSun,zPlanet,zRing]){
    if(!Number.isSafeInteger(value)||value<=0)throw new Error("Positive tooth counts are required");
  }
  if(zSun+2*zPlanet!==zRing)throw new Error("Planetary pitch geometry is inconsistent");
  const sun=1,ring=0;
  const carrier=zSun/(zSun+zRing);
  const planetRelativeCarrier=-(zSun/zPlanet)*(sun-carrier);
  const planet=carrier+planetRelativeCarrier;
  return {sun,ring,carrier,planet,planetRelativeCarrier};
}
