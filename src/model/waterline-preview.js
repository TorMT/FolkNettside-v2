import {trianglePlaneSegment} from "../hydro/hydrostatics.js";
import {stitchWaterplaneContours} from "../hydro/waterplane-contours.js";

// Same triangle/plane intersection and contour stitcher as Hydro. Never infer
// a waterline using a horizontal line drawn over the camera viewport.
export function modelWaterlineContours(geometries,z,{
  maxTriangles=350000,tolerance=1e-7
}={}){
  if(!Number.isFinite(z))throw new Error("Waterline Z must be finite");
  if(!Array.isArray(geometries))throw new Error("Waterline geometries must be an array");
  const totalTriangles=geometries.reduce((n,g)=>n+
    Math.floor((g.indices?.length||g.positions?.length/3||0)/3),0);
  if(totalTriangles>maxTriangles)return {
    status:"too-large",loops:[],segments:0,triangles:totalTriangles,
    reason:"Waterline contour preview limited to "+maxTriangles+" triangles; the Hydro Worker can still calculate analysis."
  };
  const segments=[];
  for(const geometry of geometries){
    const p=geometry.positions||[];
    const indices=geometry.indices?.length?geometry.indices:null;
    if(p.length%3)throw new Error("Waterline geometry has invalid coordinate count");
    const size=indices?.length||p.length/3;
    if(size%3)throw new Error("Waterline geometry has invalid triangle count");
    const vertex=i=>[p[i*3],p[i*3+1],p[i*3+2]];
    for(let k=0;k<size;k+=3){
      const ids=indices?[indices[k],indices[k+1],indices[k+2]]:[k,k+1,k+2];
      const a=vertex(ids[0]),b=vertex(ids[1]),c=vertex(ids[2]);
      const low=Math.min(a[2],b[2],c[2]),high=Math.max(a[2],b[2],c[2]);
      if(z<low-tolerance||z>high+tolerance)continue;
      const segment=trianglePlaneSegment([a,b,c],z);
      if(segment)segments.push(segment);
    }
  }
  const loops=stitchWaterplaneContours(segments,{tolerance});
  return {status:"ok",loops,segments:segments.length,triangles:totalTriangles,
    reason:loops.length?"Closed hull-waterline contour extracted from mesh faces":
      "No hull intersection at this waterline"};
}
