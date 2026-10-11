/**
 * Exact integration of linear hydrostatic gauge pressure over clipped, planar
 * outward-facing hull triangles at an upright still-water surface.
 *
 * p = rho*g*(waterline-z), F = -integral(p*n_out dA).
 * The triangle force and r×F are integrated analytically (no area samples).
 * Waterline cap pressure is zero, so no artificial cap faces are necessary.
 *
 * Only use on models that passed validateHydroModel preflight. The result is
 * a pressure resultant, NOT a structural FEM or a certified external hull.
 */
import {analyzePreparedHydro,prepareHydroModel} from "./hydrostatics.js";
const G=9.80665,EPS=1e-12;
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const subtract=(a,b)=>a.map((x,i)=>x-b[i]);
const addTo=(out,src)=>{for(let i=0;i<3;i++)out[i]+=src[i]};
const finite=x=>typeof x==="number"&&Number.isFinite(x);
const near=(a,b,t)=>Math.abs(a-b)<=t;
const interp=(a,b,t)=>a.map((x,i)=>x+t*(b[i]-x));

export function clipPressureTriangle(triangle,waterline){
  if(!Array.isArray(triangle)||triangle.length!==3||!triangle.every(p=>p.length===3&&p.every(finite))||
     !finite(waterline))throw new Error("Pressure triangle and waterline must be finite");
  const clipped=[];
  for(let i=0;i<3;i++){
    const a=triangle[i],b=triangle[(i+1)%3];
    const insideA=a[2]<=waterline,insideB=b[2]<=waterline;
    if(insideA&&insideB)clipped.push(b);
    else if(insideA&&!insideB)clipped.push(interp(a,b,(waterline-a[2])/(b[2]-a[2])));
    else if(!insideA&&insideB){
      clipped.push(interp(a,b,(waterline-a[2])/(b[2]-a[2])));
      clipped.push(b);
    }
  }
  return clipped;
}

/** Force/moment about world origin for one fully submerged triangular facet. */
export function pressureOnTriangle(triangle,{waterline,densityKgM3=1025}={}){
  if(!Array.isArray(triangle)||triangle.length!==3||!triangle.every(p=>p.length===3&&p.every(finite))||
    !finite(waterline)||!finite(densityKgM3)||densityKgM3<=0)
    throw new Error("Invalid pressure triangle or water density");
  const depth=triangle.map(p=>waterline-p[2]);
  if(depth.some(d=>d< -1e-8))throw new Error("Pressure facet lies above waterline; clip first");
  const d=depth.map(x=>Math.max(0,x));
  const v=subtract(triangle[1],triangle[0]),w=subtract(triangle[2],triangle[0]);
  const face=cross(v,w).map(x=>x*.5); // signed outward area vector
  const surfaceArea=Math.hypot(...face);
  if(!(surfaceArea>EPS))return {forceN:[0,0,0],momentNm:[0,0,0],
    areaM2:0,pressureDepthM:0,centerOfPressure:null,maxPressurePa:0};
  const depthMean=(d[0]+d[1]+d[2])/3;
  const scalar=densityKgM3*G;
  const forceN=face.map(x=>-scalar*x*depthMean);
  // E_area[ r*h ] = ((Σr)(Σh)+Σ(ri*hi))/12 for linear shape functions.
  const sumR=[0,0,0],weighted=[0,0,0];
  for(let i=0;i<3;i++){
    addTo(sumR,triangle[i]);
    addTo(weighted,triangle[i].map(value=>value*d[i]));
  }
  const meanRH=sumR.map((v,i)=>(v*(d[0]+d[1]+d[2])+weighted[i])/12);
  const momentNm=cross(meanRH,face).map(v=>-scalar*v);
  const centerOfPressure=depthMean>EPS?meanRH.map(x=>x/depthMean):null;
  if(![...forceN,...momentNm].every(finite))throw new Error("Pressure result overflow");
  return {forceN,momentNm,areaM2:surfaceArea,pressureDepthM:depthMean,
    centerOfPressure,maxPressurePa:Math.max(...d)*scalar};
}

export function integratePreparedHullPressure(prepared,{
  waterline,densityKgM3=1025,sections=24,maxTriangles=160000,
  referenceResult=null
}={}){
  if(!finite(waterline)||!finite(densityKgM3)||densityKgM3<=0||
    !Number.isSafeInteger(sections)||sections<2||sections>120||
    !Number.isSafeInteger(maxTriangles)||maxTriangles<1)
    throw new Error("Invalid pressure integration settings");
  const components=prepared?.components||[];
  if(!components.length)throw new Error("No selected displaced hull surface");
  const count=components.reduce((sum,c)=>sum+(c.geometry.indices?.length?
    c.geometry.indices.length/3:c.geometry.positions.length/9),0);
  if(count>maxTriangles)throw new Error("Pressure mesh exceeds "+maxTriangles+" triangle budget");
  let xmin=Infinity,xmax=-Infinity;
  for(const component of components){
    const p=component.geometry?.positions||[];
    for(let i=0;i<p.length;i+=3){xmin=Math.min(xmin,p[i]);xmax=Math.max(xmax,p[i])}
  }
  if(!finite(xmin)||!finite(xmax))throw new Error("Missing or invalid hull geometry");
  const interval=Math.max(xmax-xmin,EPS);
  const strips=Array.from({length:sections},(_,i)=>({
    x0:xmin+i*(xmax-xmin)/sections,
    x1:xmin+(i+1)*(xmax-xmin)/sections,
    forceZKN:0,momentYNm:0,faces:0
  }));
  const totalForceN=[0,0,0],totalMomentNm=[0,0,0],perComponent=[];
  let wetAreaM2=0,wetTriangles=0,peakGaugePressurePa=0;
  for(const component of components){
    const pos=component.geometry?.positions,idx=component.geometry?.indices;
    if(!pos?.length||pos.length%3!==0)throw new Error("Invalid prepared hull vertex buffer");
    const index=idx?.length?idx:null,faces=index?index.length/3:pos.length/9;
    const forceN=[0,0,0],momentNm=[0,0,0];
    let componentWetArea=0,componentWetTriangles=0;
    for(let t=0;t<faces;t++){
      const vertex=(index?index.slice(t*3,t*3+3):[t*3,t*3+1,t*3+2])
        .map(j=>[pos[j*3],pos[j*3+1],pos[j*3+2]]);
      if(vertex.some(p=>p.some(v=>!finite(v))))throw new Error("Invalid hull pressure vertex");
      const poly=clipPressureTriangle(vertex,waterline);
      if(poly.length<3)continue;
      for(let i=1;i+1<poly.length;i++){
        const surface=pressureOnTriangle([poly[0],poly[i],poly[i+1]],{waterline,densityKgM3});
        if(!surface.areaM2)continue;
        componentWetTriangles++;wetTriangles++;
        componentWetArea+=surface.areaM2;wetAreaM2+=surface.areaM2;
        peakGaugePressurePa=Math.max(peakGaugePressurePa,surface.maxPressurePa);
        addTo(forceN,surface.forceN);addTo(momentNm,surface.momentNm);
        // Each force is exactly integrated on its triangle; this station
        // histogram bins by force centroid and does not split triangles.
        const x=surface.centerOfPressure?.[0]??
          (poly[0][0]+poly[i][0]+poly[i+1][0])/3;
        const slot=Math.min(sections-1,Math.max(0,Math.floor((x-xmin)/interval*sections)));
        strips[slot].forceZKN+=surface.forceN[2]/1000;
        strips[slot].momentYNm+=surface.momentNm[1];
        strips[slot].faces++;
      }
    }
    addTo(totalForceN,forceN);addTo(totalMomentNm,momentNm);
    perComponent.push({componentId:component.componentId,
      name:String(component.name??component.componentId),
      forceN,momentNm,wetAreaM2:componentWetArea,wetTriangles:componentWetTriangles});
  }
  const hydro=referenceResult??analyzePreparedHydro(prepared,waterline);
  const targetForceN=[0,0,hydro.volume*densityKgM3*G];
  const cb=hydro.centerOfBuoyancy;
  const targetMomentNm=cross(cb,targetForceN);
  const forceErrorN=subtract(totalForceN,targetForceN);
  const momentErrorNm=subtract(totalMomentNm,targetMomentNm);
  const length=Math.max(1,Math.abs(xmax-xmin),...cb.map(Math.abs));
  const forceTol=Math.max(.01,Math.abs(targetForceN[2])*1e-6);
  const momentTol=Math.max(.01,Math.abs(targetForceN[2])*length*1e-6);
  const passed=forceErrorN.every(x=>Math.abs(x)<=forceTol)&&
    momentErrorNm.every(x=>Math.abs(x)<=momentTol);
  return {schemaVersion:1,waterline,densityKgM3,gravityMps2:G,
    sourceTriangleCount:count,wetTriangles,wetAreaM2,peakGaugePressurePa,
    forceN:totalForceN,momentNm:totalMomentNm,
    reference:{volumeM3:hydro.volume,centerOfBuoyancy:cb,
      forceN:targetForceN,momentNm:targetMomentNm},
    crossCheck:{passed,forceErrorN,momentErrorNm,forceToleranceN:forceTol,
      momentToleranceNm:momentTol},
    strips,components:perComponent,
    notes:["Pressure facets integrate p=ρg(waterline-z) on outward wetted triangles",
      "X-strip contributions are binned by pressure centroid, not clipped at station boundaries",
      "Requires an independently verified external shell and preflight-compliant winding",
      "Does not compute longitudinal beam bending, panel stress or free-surface dynamics"]
  };
}
export function integrateModelHullPressure(modelDocument,{
  waterline,densityKgM3=1025,include=()=>true,sections=24,maxTriangles=160000
}={}){
  const prepared=prepareHydroModel(modelDocument,{include});
  return integratePreparedHullPressure(prepared,{waterline,densityKgM3,sections,maxTriangles});
}
