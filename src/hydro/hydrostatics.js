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

function trianglePlaneSegment(vertices,waterline){
  const points=[];
  for(let i=0;i<3;i++){
    const a=vertices[i],b=vertices[(i+1)%3];
    const da=a[2]-waterline,db=b[2]-waterline;
    if(Math.abs(da)<=EPS)points.push([a[0],a[1]]);
    if(da*db<0){
      const p=lerpPlane(a,b,waterline);
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

function key2(p,tol=1e-7){return `${Math.round(p[0]/tol)},${Math.round(p[1]/tol)}`}

function stitchLoops(segments){
  const remaining=segments.map(([a,b])=>[a,b]);
  const loops=[];
  while(remaining.length){
    const [a,b]=remaining.pop();
    const loop=[a,b];
    let current=b;
    while(true){
      const targetKey=key2(current);
      const index=remaining.findIndex(([p,q])=>key2(p)===targetKey||key2(q)===targetKey);
      if(index<0)break;
      const [p,q]=remaining.splice(index,1)[0];
      current=key2(p)===targetKey?q:p;
      if(key2(current)===key2(loop[0]))break;
      loop.push(current);
      if(loop.length>100000)throw new Error("Waterplane loop stitching exceeded safety limit");
    }
    if(loop.length>=3&&key2(current)===key2(loop[0]))loops.push(loop);
  }
  return loops;
}

function polygonProps(points){
  let twiceArea=0,cx6=0,cy6=0,ix12=0,iy12=0,ixy24=0;
  for(let i=0;i<points.length;i++){
    const [x0,y0]=points[i],[x1,y1]=points[(i+1)%points.length];
    const cr=x0*y1-x1*y0;
    twiceArea+=cr;
    cx6+=(x0+x1)*cr;
    cy6+=(y0+y1)*cr;
    ix12+=(y0*y0+y0*y1+y1*y1)*cr;
    iy12+=(x0*x0+x0*x1+x1*x1)*cr;
    ixy24+=(2*x0*y0+x0*y1+x1*y0+2*x1*y1)*cr;
  }
  const signedArea=twiceArea/2;
  if(Math.abs(signedArea)<EPS)return null;
  const sign=Math.sign(signedArea);
  const area=Math.abs(signedArea);
  const cx=cx6/(6*signedArea),cy=cy6/(6*signedArea);
  return {
    area,cx,cy,
    ixOrigin:sign*ix12/12,
    iyOrigin:sign*iy12/12,
    ixyOrigin:sign*ixy24/24
  };
}

function waterplaneProperties(segments){
  const loops=stitchLoops(segments);
  const props=loops.map(polygonProps).filter(Boolean);
  const area=props.reduce((s,p)=>s+p.area,0);
  if(area<EPS)return {area:0,centroid:[0,0],ixx:0,iyy:0,ixy:0,loops:[]};
  const cx=props.reduce((s,p)=>s+p.area*p.cx,0)/area;
  const cy=props.reduce((s,p)=>s+p.area*p.cy,0)/area;
  const ixOrigin=props.reduce((s,p)=>s+p.ixOrigin,0);
  const iyOrigin=props.reduce((s,p)=>s+p.iyOrigin,0);
  const ixyOrigin=props.reduce((s,p)=>s+p.ixyOrigin,0);
  return {
    area,centroid:[cx,cy],
    ixx:ixOrigin-area*cy*cy,
    iyy:iyOrigin-area*cx*cx,
    ixy:ixyOrigin-area*cx*cy,
    loops
  };
}

export function analyzeHydrostatics({positions,indices},waterline=0){
  if(!positions?.length)throw new Error("Hydrostatics requires vertex positions");
  const idx=indices?.length?indices:Array.from({length:positions.length/3},(_,i)=>i);
  let volume=0,mx=0,my=0,mz=0;
  const segments=[];

  const vertex=i=>[positions[i*3],positions[i*3+1],positions[i*3+2]];

  for(let t=0;t+2<idx.length;t+=3){
    const tri=[vertex(idx[t]),vertex(idx[t+1]),vertex(idx[t+2])];
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

export function analyzeModelDocument(modelDocument,waterline=0,{include=()=>true}={}){
  let totalVolume=0;
  let first=[0,0,0];
  const perComponent=[];
  for(const component of modelDocument.components||[]){
    if(!component.geometry||!include(component))continue;
    const result=analyzeHydrostatics(component.geometry,waterline);
    perComponent.push({componentId:component.id,name:component.name,...result});
    totalVolume+=result.volume;
    first[0]+=result.volume*result.centerOfBuoyancy[0];
    first[1]+=result.volume*result.centerOfBuoyancy[1];
    first[2]+=result.volume*result.centerOfBuoyancy[2];
  }
  return {
    volume:totalVolume,
    centerOfBuoyancy:totalVolume>EPS?first.map(v=>v/totalVolume):[0,0,waterline],
    components:perComponent
  };
}
