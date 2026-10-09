import {waveElevation} from "./wave-core.js?v=b2469ea3ea62fe23f80a6609903a1d6eb27adbcd";

/** Visualization-only heave under a prescribed regular linear wave.
 *  Anchored means the model remains at its original translation.
 *  Follow means that its origin tracks the wave elevation at the selected
 *  reference XY position. This is NOT a response-amplitude operator or a
 *  vessel motion equation; no pitch, roll or drift are inferred.
 */
export function waveModelHeave(wave,timeS=0,mode="anchored",x=0,y=0){
 if(mode==="anchored"||!wave)return 0;
 if(mode!=="follow")throw new Error("Unknown wave-model movement mode");
 const displacement=waveElevation(wave,x,y,timeS);
 if(!Number.isFinite(displacement))throw new Error("Invalid wave elevation");
 return displacement;
}
