import {fitDistanceForBox} from "../model/cad-camera-fit.js?v=0ccf53c6d4bc7c6d509311a1580b08f01ac569c9";

/** Conservative perspective framing for schematic Z012 gears in millimetres.
 * Internal rings are centered on the ring, with the pinion inside the hole.
 */
export function gearPairFraming(pair,{aspect=1.4,fovDeg=40}={}){
 if(!pair||!pair.a||!pair.b)throw Error("Gear pair is missing");
 const m=pair.b.normalModule;
 const r1=pair.a.pitchRadius+2*m,r2=pair.b.pitchRadius+4*m;
 const x1=pair.internal?pair.centerDistance:-pair.b.pitchRadius;
 const x2=pair.internal?0:pair.a.pitchRadius;
 const minX=Math.min(x1-r1,x2-r2),maxX=Math.max(x1+r1,x2+r2);
 const maxR=Math.max(r1,r2);
 const faceWidth=Math.max(pair.shaft1Width,pair.shaft2Width);
 const center=[(minX+maxX)/2,0,faceWidth/2];
 const size=[maxX-minX,maxR*2,faceWidth+2*m];
 const direction=[1.4,-1.9,1.2];
 const distance=fitDistanceForBox(size,direction,{aspect,fovDeg,padding:1.28});
 const far=Math.max(200,distance*6,maxR*18);
 return {center,size,distance,direction,near:Math.max(.001,distance/20000),far};
}
