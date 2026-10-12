import {integrateWaterplaneContours} from "./waterplane-contours.js?v=07ad7ee69f26668494a3f8ce7b736057b52f7363";

const EPS=1e-10;

function sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function add(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]}
function mul(a,s){return [a[0]*s,a[1]*s,a[2]*s]}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}

function lerpPlane(a,b,waterline){
  const da=a[2]-waterline,db=b[2]-waterline;
  const t=da/(da-db);
  return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,waterline];
}

function clipTriangleBelowPlane(vertices,waterline){
  let output=vertices;
  const input=output;
  output=[];
  for(let i=0;i<input.length;i++){
    const current=input[i],next=input[(i+1)%input.length];
    const currentInside=current[2]<=waterline+EPS;
    const nextInside=next[2]<=waterline+EPS;
    if(currentInside&&nextInside)output.push(next);
    else if(currentInside&&!nextInside)output.push(lerpPlane(current,next,waterline));
    else if(!currentInside&&nextInside){output.push(lerpPlane(current,next,waterline));output.push(next)}
  }
  return output;
}

export function trianglePlaneSegment(vertices,waterline){
  const distances=vertices.map(v=>v[2]-waterline);
  const on=distances.map((d,i)=>Math.abs(d)<=EPS?i:-1).filter(i=>i>=0);
  // Half-open convention for a face exactly tangent at an edge:
  // count the edge once from the submerged side, not from an above-water
  // face or a coplanar top/bottom face.
  if(on.length===3)return null;
  if(on.length===2){
    const other=[0,1,2].find(i=>!on.includes(i));
    return distances[other]<-EPS?
      on.map(i=>[vertices[i][0],vertices[i][1]]):null;
  }
  const points=[];
  if(on.length===1)points.push([vertices[on[0]][0],vertices[on[0]][1]]);
  for(let i=0;i<3;i++){
    const j=(i+1)%3,da=distances[i],db=distances[j];
    if(da*db<0){
      const p=lerpPlane(vertices[i],vertices[j],waterline);
      points.push([p[0],p[1]]);
    }
  }
  const unique=[];
  for(const p of points){
    if(!unique.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<1e-8))unique.push(p);
  }
  return unique.length===2?unique:null;
}

function triangleSurfaceIntegrals(a,b,c,waterline){
  const aa=[a[0],a[1],a[2]-waterline],bb=[b[0],b[1],b[2]-waterline],cc=[c[0],c[1],c[2]-waterline];
  const areaVector=mul(cross(sub(bb,aa),sub(cc,aa)),0.5);
  const centroid=mul(add(add(aa,bb),cc),1/3);
  const volumeContribution=dot(centroid,areaVector)/3;

  function secondMean(i){
    const x=aa[i],y=bb[i],z=cc[i];
    return (x*x+y*y+z*z+x*y+y*z+z*x)/6;
  }

  return {
    volume:volumeContribution,
    mx:0.5*areaVector[0]*secondMean(0),
    my:0.5*areaVector[1]*secondMean(1),
    mz:0.5*areaVector[2]*secondMean(2)
  };
}

function waterplaneProperties(segments){return integrateWaterplaneContours(segments);}

export function triangleZBounds({positions,indices}){
  if(!positions?.length)return [];
  const idx=indices?.length?indices:Array.from({length:positions.length/3},(_,i)=>i);
  const bounds=new Array(Math.floor(idx.length/3)*2);
  for(let t=0,triangle=0;t+2<idx.length;t+=3,triangle++){
    const za=positions[idx[t]*3+2],zb=positions[idx[t+1]*3+2],zc=positions[idx[t+2]*3+2];
    bounds[triangle*2]=Math.min(za,zb,zc);
    bounds[triangle*2+1]=Math.max(za,zb,zc);
  }
  return bounds;
}

export function analyzeHydrostatics({positions,indices},waterline=0,triangleBounds=null){
  if(!positions?.length)throw new Error("Hydrostatics requires vertex positions");
  const idx=indices?.length?indices:Array.from({length:positions.length/3},(_,i)=>i);
  const bounds=triangleBounds?.length===Math.floor(idx.length/3)*2?triangleBounds:null;
  let volume=0,mx=0,my=0,mz=0;
  const segments=[];

  const vertex=i=>[positions[i*3],positions[i*3+1],positions[i*3+2]];

  for(let t=0,triangleIndex=0;t+2<idx.length;t+=3,triangleIndex++){
    const minZ=bounds?bounds[triangleIndex*2]:null;
    const maxZ=bounds?bounds[triangleIndex*2+1]:null;
    if(bounds&&minZ>waterline+EPS)continue;

    const tri=[vertex(idx[t]),vertex(idx[t+1]),vertex(idx[t+2])];
    if(bounds&&maxZ<waterline-EPS){
      const integ=triangleSurfaceIntegrals(tri[0],tri[1],tri[2],waterline);
      volume+=integ.volume;mx+=integ.mx;my+=integ.my;mz+=integ.mz;
      continue;
    }

    const segment=trianglePlaneSegment(tri,waterline);
    if(segment)segments.push(segment);
    const clipped=clipTriangleBelowPlane(tri,waterline);
    if(clipped.length<3)continue;
    for(let i=1;i+1<clipped.length;i++){
      const integ=triangleSurfaceIntegrals(clipped[0],clipped[i],clipped[i+1],waterline);
      volume+=integ.volume;mx+=integ.mx;my+=integ.my;mz+=integ.mz;
    }
  }

  if(Math.abs(volume)<EPS){
    return {volume:0,centerOfBuoyancy:[0,0,waterline],waterplane:waterplaneProperties(segments)};
  }

  const cb=[mx/volume,my/volume,mz/volume+waterline];
  return {
    volume:Math.abs(volume),
    signedVolume:volume,
    centerOfBuoyancy:cb,
    waterplane:waterplaneProperties(segments)
  };
}

function transformGeometryToWorld(geometry,transform,scale=1){
  const m=transform||[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  const out=new Array(geometry.positions.length);
  for(let i=0;i<geometry.positions.length;i+=3){
    const x=geometry.positions[i],y=geometry.positions[i+1],z=geometry.positions[i+2];
    out[i]=(m[0]*x+m[4]*y+m[8]*z+m[12])*scale;
    out[i+1]=(m[1]*x+m[5]*y+m[9]*z+m[13])*scale;
    out[i+2]=(m[2]*x+m[6]*y+m[10]*z+m[14])*scale;
  }
  return {positions:out,indices:geometry.indices};
}

function combineWaterplanes(items){
  const area=items.reduce((sum,item)=>sum+item.area,0);
  if(area<EPS)return {area:0,centroid:[0,0],ixx:0,iyy:0,ixy:0,loops:[],outerContours:0,holeContours:0};
  const cx=items.reduce((sum,item)=>sum+item.area*item.centroid[0],0)/area;
  const cy=items.reduce((sum,item)=>sum+item.area*item.centroid[1],0)/area;
  let ixOrigin=0,iyOrigin=0,ixyOrigin=0;
  for(const item of items){
    const [x,y]=item.centroid;
    ixOrigin+=item.ixx+item.area*y*y;
    iyOrigin+=item.iyy+item.area*x*x;
    ixyOrigin+=item.ixy+item.area*x*y;
  }
  return {
    area,centroid:[cx,cy],
    ixx:ixOrigin-area*cy*cy,
    iyy:iyOrigin-area*cx*cx,
    ixy:ixyOrigin-area*cx*cy,
    loops:items.flatMap(item=>item.loops||[]),
    outerContours:items.reduce((sum,item)=>sum+(item.outerContours||0),0),
    holeContours:items.reduce((sum,item)=>sum+(item.holeContours||0),0)
  };
}

export function prepareHydroModel(modelDocument,{include=()=>true}={}){
  const scale=Number(modelDocument?.unitScaleToMeters)||1;
  const components=[];
  for(const component of modelDocument?.components||[]){
    if(!component.geometry||!include(component))continue;
    const geometry=transformGeometryToWorld(component.geometry,component.transform,scale);
    components.push({
      componentId:component.id,
      name:component.name,
      geometry,
      triangleZBounds:triangleZBounds(geometry)
    });
  }
  return {schemaVersion:1,components};
}

export function analyzePreparedHydro(prepared,waterline=0){
  let totalVolume=0;
  const first=[0,0,0];
  const perComponent=[];
  const waterplanes=[];

  for(const component of prepared?.components||[]){
    const result=analyzeHydrostatics(component.geometry,waterline,component.triangleZBounds);
    perComponent.push({componentId:component.componentId,name:component.name,...result});
    totalVolume+=result.volume;
    first[0]+=result.volume*result.centerOfBuoyancy[0];
    first[1]+=result.volume*result.centerOfBuoyancy[1];
    first[2]+=result.volume*result.centerOfBuoyancy[2];
    if(result.waterplane.area>EPS)waterplanes.push(result.waterplane);
  }

  return {
    volume:totalVolume,
    centerOfBuoyancy:totalVolume>EPS?first.map(value=>value/totalVolume):[0,0,waterline],
    waterplane:combineWaterplanes(waterplanes),
    components:perComponent
  };
}

export function analyzeModelDocument(modelDocument,waterline=0,{include=()=>true}={}){
  return analyzePreparedHydro(prepareHydroModel(modelDocument,{include}),waterline);
}


export function hydroCurve(modelDocument,{
  minWaterline=0,
  maxWaterline=1,
  samples=11,
  include=()=>true
}={}){
  const prepared=prepareHydroModel(modelDocument,{include});
  const count=Math.max(2,Math.floor(samples));
  const span=maxWaterline-minWaterline;
  return Array.from({length:count},(_,index)=>{
    const t=index/(count-1);
    const waterline=minWaterline+span*t;
    const result=analyzePreparedHydro(prepared,waterline);
    return {waterline,...result};
  });
}

export function solvePreparedWaterlineForVolume(prepared,targetVolume,{
  minWaterline=0,
  maxWaterline=1,
  tolerance=1e-6,
  maxIterations=60
}={}){
  const target=Number(targetVolume);
  if(!Number.isFinite(target)||target<0)throw new Error("targetVolume must be a finite non-negative number");
  if(!(Number.isFinite(tolerance)&&tolerance>0))
    throw new Error("Draft solver tolerance must be finite and positive");
  if(!Number.isSafeInteger(maxIterations)||maxIterations<1||maxIterations>500)
    throw new Error("Draft solver maxIterations must be an integer between 1 and 500");
  let low=Number(minWaterline),high=Number(maxWaterline);
  if(!Number.isFinite(low)||!Number.isFinite(high)||!(high>low))
    throw new Error("maxWaterline must be finite and greater than minWaterline");

  let lowResult=analyzePreparedHydro(prepared,low);
  let highResult=analyzePreparedHydro(prepared,high);
  if(highResult.volume<lowResult.volume-tolerance){
    throw new Error("Hydro draft solver bracket has decreasing displaced volume; inspect source mesh");
  }
  if(target<lowResult.volume-tolerance||target>highResult.volume+tolerance){
    throw new Error(`Target volume ${target} m^3 is outside the bracket [${lowResult.volume}, ${highResult.volume}]`);
  }
  if(Math.abs(lowResult.volume-target)<=tolerance)return {waterline:low,result:lowResult,iterations:0,volumeResidual:lowResult.volume-target,converged:true};
  if(Math.abs(highResult.volume-target)<=tolerance)return {waterline:high,result:highResult,iterations:0,volumeResidual:highResult.volume-target,converged:true};

  let mid=(low+high)/2,midResult;
  for(let iteration=1;iteration<=maxIterations;iteration++){
    midResult=analyzePreparedHydro(prepared,mid);
    const error=midResult.volume-target;
    if(Math.abs(error)<=tolerance){
      const solved={waterline:mid,result:midResult,iterations:iteration};
      return {...solved,volumeResidual:error,converged:true};
    }

    if(error<0){low=mid;lowResult=midResult}
    else{high=mid;highResult=midResult}

    // dV/dz equals the instantaneous waterplane area. Use that derivative
    // for a Newton step, but only while it stays safely inside the current
    // monotonic bracket. Otherwise retain guaranteed bisection convergence.
    const area=Number(midResult.waterplane?.area)||0;
    const newton=area>EPS?mid-error/area:NaN;
    const span=high-low;
    const guard=span*.05;
    mid=Number.isFinite(newton)&&newton>low+guard&&newton<high-guard
      ?newton
      :(low+high)/2;
  }
  const error=new Error("Hydro draft solver did not converge to requested volume within "+
    maxIterations+" iterations; residual "+(midResult?.volume-target)+" m^3 exceeds "+
    tolerance+" m^3 tolerance");
  error.code="HYDRO_DRAFT_NOT_CONVERGED";
  error.targetVolume=target;
  error.volumeResidual=midResult?.volume-target;
  error.tolerance=tolerance;
  throw error;
}

export function solveWaterlineForVolume(modelDocument,targetVolume,{
  minWaterline=0,
  maxWaterline=1,
  tolerance=1e-6,
  maxIterations=60,
  include=()=>true
}={}){
  const prepared=prepareHydroModel(modelDocument,{include});
  return solvePreparedWaterlineForVolume(prepared,targetVolume,{
    minWaterline,maxWaterline,tolerance,maxIterations
  });
}
