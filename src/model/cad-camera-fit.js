/**
 * Fit a world-axis-aligned bounding box in a perspective CAD viewport.
 * Uses projected width/height and the box's depth rather than an arbitrary
 * bounding sphere multiplier (particularly poor for long/thin assemblies).
 */
const dotAbs=(v,size)=>(Math.abs(v[0])*size[0]+Math.abs(v[1])*size[1]+Math.abs(v[2])*size[2])*.5;
const normalise=v=>{
 const n=Math.hypot(...v);
 if(!Number.isFinite(n)||n<1e-12)throw Error("Invalid CAD camera direction");
 return v.map(x=>x/n);
};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function fitDistanceForBox(size,direction,{aspect=1,fovDeg=45,padding=1.18}={}){
 if(!Array.isArray(size)||size.length!==3||size.some(x=>!Number.isFinite(x)||x<0)||
    !Number.isFinite(aspect)||aspect<=0||!Number.isFinite(fovDeg)||fovDeg<=1||fovDeg>=170||
    !Number.isFinite(padding)||padding<1)
   throw Error("Invalid CAD camera fit inputs");
 const dir=normalise(direction);
 const worldUp=Math.abs(dir[2])>.985?[0,1,0]:[0,0,1];
 const right=normalise(cross(worldUp,dir));
 const up=normalise(cross(dir,right));
 const width=dotAbs(right,size),height=dotAbs(up,size),depth=dotAbs(dir,size);
 const tan=Math.tan(fovDeg*Math.PI/360);
 const fit=Math.max(width/(tan*aspect),height/tan);
 return Math.max(.02,(depth+fit)*padding);
}
