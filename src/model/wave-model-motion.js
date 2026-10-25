import {waveElevation} from "./wave-core.js?v=2dd92f45b41433755fece77d39899c6632e50f66";

const NO_MOTION=Object.freeze({heaveM:0,rollRad:0,pitchRad:0,slopeX:0,slopeY:0});

/**
 * Exploratory, instantaneous slope-following visual only. A real vessel's
 * six-DOF response depends on mass, inertia, hydrodynamics, damping and RAOs.
 * Coordinate convention: x forward, y transverse, z upward.
 * Positive roll around x raises +y; positive pitch around y lowers +x.
 * The mode follows the tangent plane of the specified Airy wave, not a
 * seakeeping solution.
 */
export function waveModelPose(wave,timeS=0,mode="anchored",x=0,y=0,{maxTiltDeg=12}={}){
 if(!wave||mode==="anchored")return {...NO_MOTION};
 if(mode!=="follow"&&mode!=="follow-slope")throw Error("Unknown wave-model movement mode");
 const heaveM=waveElevation(wave,x,y,timeS);
 if(!Number.isFinite(heaveM))throw Error("Invalid wave elevation");
 if(mode==="follow")return {...NO_MOTION,heaveM};
 if(!Number.isFinite(maxTiltDeg)||maxTiltDeg<0||maxTiltDeg>30)
   throw Error("Illustrative wave tilt limit must be 0–30°");
 const heading=wave.headingDeg*Math.PI/180;
 const phase=wave.waveNumber*(x*Math.cos(heading)+y*Math.sin(heading))-
   wave.omega*timeS+wave.phaseDeg*Math.PI/180;
 const slope=-wave.amplitudeM*wave.waveNumber*Math.sin(phase);
 const slopeX=slope*Math.cos(heading),slopeY=slope*Math.sin(heading);
 const limit=maxTiltDeg*Math.PI/180;
 const clamp=v=>Math.max(-limit,Math.min(limit,v));
 return {
   heaveM,
   rollRad:clamp(Math.atan(slopeY)),
   pitchRad:clamp(-Math.atan(slopeX)),
   slopeX,slopeY
 };
}

/** Backward-compatible vertical-only projection of the displayed pose. */
export function waveModelHeave(wave,timeS=0,mode="anchored",x=0,y=0){
 return waveModelPose(wave,timeS,mode,x,y).heaveM;
}
