import {trianglePlaneSegment} from "./hydrostatics.js?v=20c62fd1f2072e677ffaeec8435ff766e7624aed";
import {integrateWaterplaneContours} from "./waterplane-contours.js?v=20c62fd1f2072e677ffaeec8435ff766e7624aed";

// Sectional Area Curve (SAC), exploratory geometry from already transformed
// selected hull triangles. Like Hydro, must be gated by mesh validation first.
function clipBelowDraft(points,draft){
 const output=[];
 for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length];
   const aInside=a[1]<=draft,bInside=b[1]<=draft;
   if(aInside)output.push(a);
   if(aInside!==bInside){
     const t=(draft-a[1])/(b[1]-a[1]);
     output.push([a[0]+t*(b[0]-a[0]),draft]);
   }
 }
 return output;
}
function polygonArea(points){
 if(points.length<3)return 0;
 let twice=0;
 for(let i=0;i<points.length;i++){
   const p=points[i],q=points[(i+1)%points.length];
   twice+=p[0]*q[1]-q[0]*p[1];
 }
 return Math.abs(twice)/2;
}
function contains(point,poly){
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
   const a=poly[i],b=poly[j];
   if((a[1]>point[1])!==(b[1]>point[1])&&
      point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
export function sectionalAreaAtStation(geometries,x,draft,{maxTriangles=60000}={}){
 if(!Number.isFinite(x)||!Number.isFinite(draft))throw Error("SAC station and draft must be finite");
 if(!Array.isArray(geometries)||!geometries.length)throw Error("SAC needs hull geometry");
 const segments=[];
 let triangles=0;
 for(const geo of geometries){
   const p=geo.positions,indices=geo.indices?.length?geo.indices:null;
   if(!p||p.length%3||(!indices&&p.length%9))throw Error("SAC geometry requires triangular coordinates");
   const size=indices?.length||p.length/3;
   if(size%3)throw Error("Invalid triangular hull data");
   triangles+=size/3;
   if(triangles>maxTriangles)throw Error("SAC preview exceeds "+maxTriangles+" triangle budget; reduce the mesh");
   for(let k=0;k<size;k+=3){
     const vertex=n=>{
       const idx=indices?indices[k+n]:k+n;
       return [p[idx*3+1],p[idx*3+2],p[idx*3]];
     };
     const tri=[vertex(0),vertex(1),vertex(2)];
     if(x<Math.min(tri[0][2],tri[1][2],tri[2][2])||x>Math.max(tri[0][2],tri[1][2],tri[2][2]))continue;
     const segment=trianglePlaneSegment(tri,x);
     if(segment)segments.push(segment);
   }
 }
 if(!segments.length)return {x,area:0,loops:0};
 // Preflight reuses the same closed-contour/overlap checks as waterplanes.
 const {loops}=integrateWaterplaneContours(segments);
 let area=0;
 for(let i=0;i<loops.length;i++){
   const depth=loops.reduce((n,other,j)=>i!==j&&contains(loops[i][0],other)?n+1:n,0);
   const sign=depth%2===0?1:-1;
   area+=sign*polygonArea(clipBelowDraft(loops[i],draft));
 }
 if(area<-1e-7)throw Error("SAC subsection has negative net area after void subtraction");
 return {x,area:Math.max(0,area),loops:loops.length};
}
export function sectionalAreaCurve(prepared,{draft,stations=31,maxTriangles=60000}={}){
 if(!prepared?.components?.length)throw Error("No selected hull geometry for SAC");
 if(!Number.isInteger(stations)||stations<3||stations>101)throw Error("SAC stations must be from 3 to 101");
 if(!Number.isFinite(draft))throw Error("SAC draft must be finite");
 const geometries=prepared.components.map(c=>c.geometry);
 let min=Infinity,max=-Infinity;
 for(const geo of geometries){
   const values=geo.positions||[];
   for(let i=0;i<values.length;i+=3){
     min=Math.min(min,values[i]);
     max=Math.max(max,values[i]);
   }
 }
 if(!Number.isFinite(min)||!Number.isFinite(max))throw Error("No station coordinates");
 const length=max-min;
 if(!(length>0))throw Error("Hull must extend in longitudinal X");
 const epsilon=length*1e-6;
 const samples=Array.from({length:stations},(_,i)=>{
   const x=min+length*i/(stations-1);
   const sampleX=Math.max(min+epsilon,Math.min(max-epsilon,x));
   return {...sectionalAreaAtStation(geometries,sampleX,draft,{maxTriangles}),x};
 });
 let approxVolume=0;
 for(let i=1;i<samples.length;i++)
   approxVolume+=(samples[i-1].area+samples[i].area)/2*(samples[i].x-samples[i-1].x);
 return {draft,stations:samples,estimatedVolume:approxVolume,
   maximumSectionArea:Math.max(...samples.map(s=>s.area)),
   note:"Trapezoidal station integration of selected hull sections; approximation, not independently validated vessel particulars"};
}
export function sacCSV(sac){
 return "station_x_m,underwater_section_area_m2\n"+
   sac.stations.map(s=>s.x+","+s.area).join("\n")+"\n";
}
