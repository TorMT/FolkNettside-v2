// Conservative 3D collision screen for triangle-mesh hydro preflight.
// Uses a world-coordinate AABB hierarchy to avoid the quadratic all-pairs
// scan. An overlap is a hard error; an exceeded comparison budget also blocks.
// A triangle pair sharing a welded vertex is omitted to avoid treating
// legitimate manifold vertex contacts as self intersections. Consequently
// this is screening, not formal proof that the external wetted hull is valid.
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const diff=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const proj=(axis,points)=>{let lo=Infinity,hi=-Infinity;for(const p of points){
  const v=dot(axis,p);lo=Math.min(lo,v);hi=Math.max(hi,v)}return [lo,hi]};
function aabbIntersects(a,b,tol){
  return a.min[0]<=b.max[0]+tol&&a.max[0]>=b.min[0]-tol
    &&a.min[1]<=b.max[1]+tol&&a.max[1]>=b.min[1]-tol
    &&a.min[2]<=b.max[2]+tol&&a.max[2]>=b.min[2]-tol;
}
function triangle2dOverlap(a,b,tol){
  const axes=[];
  for(const tri of [a,b])for(let i=0;i<3;i++){
    const p=tri[i],q=tri[(i+1)%3];
    axes.push([-(q[1]-p[1]),q[0]-p[0]]);
  }
  for(const axis of axes){
    const len=Math.hypot(...axis);if(len<1e-14)continue;
    const range=tri=>{let lo=Infinity,hi=-Infinity;for(const p of tri){
      const v=p[0]*axis[0]+p[1]*axis[1];lo=Math.min(lo,v);hi=Math.max(hi,v);
    }return [lo,hi]};
    const [amin,amax]=range(a),[bmin,bmax]=range(b);
    if(amax<bmin-tol*len||bmax<amin-tol*len)return false;
  }
  return true;
}
export function trianglesIntersect3D(a,b,tolerance=1e-7){
  const ae=[diff(a[1],a[0]),diff(a[2],a[1]),diff(a[0],a[2])];
  const be=[diff(b[1],b[0]),diff(b[2],b[1]),diff(b[0],b[2])];
  const na=cross(ae[0],ae[1]),nb=cross(be[0],be[1]);
  const la=Math.hypot(...na),lb=Math.hypot(...nb);
  if(la<1e-20||lb<1e-20)return false; // rejected independently by topology
  const planeDistances=b.map(p=>dot(na,diff(p,a[0]))/la);
  const coplanar=planeDistances.every(d=>Math.abs(d)<=tolerance)
    && Math.hypot(...cross(na,nb))<la*lb*1e-8;
  if(coplanar){
    const axis=Math.abs(na[0])>=Math.abs(na[1])&&Math.abs(na[0])>=Math.abs(na[2])?0:
      Math.abs(na[1])>=Math.abs(na[2])?1:2;
    const project=p=>axis===0?[p[1],p[2]]:axis===1?[p[0],p[2]]:[p[0],p[1]];
    return triangle2dOverlap(a.map(project),b.map(project),tolerance);
  }
  const axes=[na,nb];
  for(const edgeA of ae)for(const edgeB of be)axes.push(cross(edgeA,edgeB));
  for(const axis of axes){
    const len=Math.hypot(...axis);
    if(len<1e-15)continue;
    const [amin,amax]=proj(axis,a),[bmin,bmax]=proj(axis,b);
    if(amax<bmin-tolerance*len||bmax<amin-tolerance*len)return false;
  }
  return true;
}

function buildHierarchy(items,bounds,centroids,leafLimit=8){
  const node={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity],size:items.length};
  const centMin=[Infinity,Infinity,Infinity],centMax=[-Infinity,-Infinity,-Infinity];
  for(const t of items)for(let axis=0;axis<3;axis++){
    node.min[axis]=Math.min(node.min[axis],bounds[6*t+axis]);
    node.max[axis]=Math.max(node.max[axis],bounds[6*t+axis+3]);
    centMin[axis]=Math.min(centMin[axis],centroids[3*t+axis]);
    centMax[axis]=Math.max(centMax[axis],centroids[3*t+axis]);
  }
  if(items.length<=leafLimit){node.triangles=items;return node}
  const extents=centMax.map((max,i)=>max-centMin[i]);
  const axis=extents.indexOf(Math.max(...extents));
  items.sort((a,b)=>centroids[3*a+axis]-centroids[3*b+axis]);
  const mid=Math.floor(items.length/2);
  node.left=buildHierarchy(items.slice(0,mid),bounds,centroids,leafLimit);
  node.right=buildHierarchy(items.slice(mid),bounds,centroids,leafLimit);
  return node;
}

export function inspectMeshIntersections(vertices,indices,weldedIds,{
  tolerance=1e-7,maxCandidatePairs=1500000,maxHits=5
}={}){
  const n=indices.length/3;
  if(!Number.isSafeInteger(n)||n<1)return {hits:[],candidatePairs:0,exhaustive:true,triangleCount:0};
  const bounds=new Float64Array(n*6),centroids=new Float64Array(n*3);
  for(let i=0;i<n;i++){
    const a=vertices[indices[i*3]],b=vertices[indices[i*3+1]],c=vertices[indices[i*3+2]];
    for(let axis=0;axis<3;axis++){
      bounds[6*i+axis]=Math.min(a[axis],b[axis],c[axis]);
      bounds[6*i+axis+3]=Math.max(a[axis],b[axis],c[axis]);
      centroids[3*i+axis]=(a[axis]+b[axis]+c[axis])/3;
    }
  }
  const ids=Array.from({length:n},(_,i)=>i);
  const root=buildHierarchy(ids,bounds,centroids);
  const todo=[{a:root,b:root,same:true}],hits=[];
  let candidatePairs=0,exhaustive=true;
  function test(a,b){
    if(a===b)return;
    for(let k=0;k<3;k++){
      const va=weldedIds[indices[a*3+k]];
      for(let j=0;j<3;j++)if(va===weldedIds[indices[b*3+j]])return;
    }
    const boundsA={min:[bounds[a*6],bounds[a*6+1],bounds[a*6+2]],
      max:[bounds[a*6+3],bounds[a*6+4],bounds[a*6+5]]};
    const boundsB={min:[bounds[b*6],bounds[b*6+1],bounds[b*6+2]],
      max:[bounds[b*6+3],bounds[b*6+4],bounds[b*6+5]]};
    if(!aabbIntersects(boundsA,boundsB,tolerance))return;
    if(++candidatePairs>maxCandidatePairs){exhaustive=false;return}
    const verticesA=[0,1,2].map(i=>vertices[indices[3*a+i]]);
    const verticesB=[0,1,2].map(i=>vertices[indices[3*b+i]]);
    if(trianglesIntersect3D(verticesA,verticesB,tolerance))hits.push([a,b]);
  }
  while(todo.length&&exhaustive&&hits.length<maxHits){
    const {a,b,same}=todo.pop();
    if(!aabbIntersects(a,b,tolerance))continue;
    if(same){
      if(a.triangles){
        for(let i=0;i<a.triangles.length;i++)for(let j=i+1;j<a.triangles.length;j++){
          test(a.triangles[i],a.triangles[j]);
          if(!exhaustive||hits.length>=maxHits)break;
        }
      }else{
        todo.push({a:a.left,b:a.left,same:true},{a:a.left,b:a.right,same:false},
          {a:a.right,b:a.right,same:true});
      }
    }else if(a.triangles&&b.triangles){
      for(const ta of a.triangles){
        for(const tb of b.triangles){
          test(ta,tb);
          if(!exhaustive||hits.length>=maxHits)break;
        }
        if(!exhaustive||hits.length>=maxHits)break;
      }
    }else if(!a.triangles&&(b.triangles||a.size>=b.size)){
      todo.push({a:a.left,b,same:false},{a:a.right,b,same:false});
    }else{
      todo.push({a,b:b.left,same:false},{a,b:b.right,same:false});
    }
  }
  return {hits,candidatePairs,exhaustive:exhaustive&&todo.length===0||exhaustive&&hits.length>=maxHits,
    triangleCount:n,hitLimitReached:hits.length>=maxHits};
}
