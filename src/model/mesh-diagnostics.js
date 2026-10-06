const DEFAULT_TOLERANCE=1e-7;

function transformPoint(x,y,z,m,scale){
  const matrix=m||[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  return [
    (matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12])*scale,
    (matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13])*scale,
    (matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14])*scale
  ];
}

function vertexKey(point,tolerance){
  return point.map(value=>Math.round(value/tolerance)).join(",");
}

function edgeKey(a,b){
  return a<b?`${a}|${b}`:`${b}|${a}`;
}

function triangleArea2(a,b,c){
  const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];
  const ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
  const cross=[
    ab[1]*ac[2]-ab[2]*ac[1],
    ab[2]*ac[0]-ab[0]*ac[2],
    ab[0]*ac[1]-ab[1]*ac[0]
  ];
  return Math.hypot(...cross);
}

export function analyzeGeometryDiagnostics(geometry,{
  transform=null,
  scale=1,
  tolerance=DEFAULT_TOLERANCE
}={}){
  const positions=geometry?.positions||[];
  const indices=geometry?.indices?.length
    ? geometry.indices
    : Array.from({length:positions.length/3},(_,i)=>i);

  const bounds={
    min:[Infinity,Infinity,Infinity],
    max:[-Infinity,-Infinity,-Infinity]
  };
  const pointsByIndex=new Array(positions.length/3);
  const weldedKeyByIndex=new Array(positions.length/3);

  for(let i=0;i<positions.length;i+=3){
    const point=transformPoint(positions[i],positions[i+1],positions[i+2],transform,scale);
    const vi=i/3;
    pointsByIndex[vi]=point;
    weldedKeyByIndex[vi]=vertexKey(point,tolerance);
    for(let axis=0;axis<3;axis++){
      bounds.min[axis]=Math.min(bounds.min[axis],point[axis]);
      bounds.max[axis]=Math.max(bounds.max[axis],point[axis]);
    }
  }

  if(!positions.length){
    bounds.min=[0,0,0];bounds.max=[0,0,0];
  }

  const edges=new Map();
  let degenerateTriangles=0;
  let invalidTriangles=0;
  let triangleCount=0;

  for(let i=0;i+2<indices.length;i+=3){
    const ia=indices[i],ib=indices[i+1],ic=indices[i+2];
    const a=pointsByIndex[ia],b=pointsByIndex[ib],c=pointsByIndex[ic];
    if(!a||!b||!c){invalidTriangles++;continue}
    triangleCount++;
    if(triangleArea2(a,b,c)<=tolerance*tolerance)degenerateTriangles++;

    const keys=[weldedKeyByIndex[ia],weldedKeyByIndex[ib],weldedKeyByIndex[ic]];
    for(const [u,v] of [[0,1],[1,2],[2,0]]){
      const key=edgeKey(keys[u],keys[v]);
      edges.set(key,(edges.get(key)||0)+1);
    }
  }

  let boundaryEdges=0,nonManifoldEdges=0;
  for(const count of edges.values()){
    if(count===1)boundaryEdges++;
    else if(count!==2)nonManifoldEdges++;
  }

  const size=bounds.max.map((value,index)=>value-bounds.min[index]);
  const weldedVertices=new Set(weldedKeyByIndex.filter(Boolean)).size;

  return {
    sourceVertices:positions.length/3,
    weldedVertices,
    triangleCount,
    degenerateTriangles,
    invalidTriangles,
    boundaryEdges,
    nonManifoldEdges,
    watertight:triangleCount>0&&boundaryEdges===0&&nonManifoldEdges===0&&invalidTriangles===0,
    bounds:{...bounds,size}
  };
}

const cache=new WeakMap();

export function analyzeModelDiagnostics(modelDocument,{tolerance=DEFAULT_TOLERANCE}={}){
  if(cache.has(modelDocument))return cache.get(modelDocument);
  const scale=Number(modelDocument?.unitScaleToMeters)||1;
  const components=(modelDocument?.components||[])
    .filter(component=>component.geometry)
    .map(component=>({
      componentId:component.id,
      name:component.name,
      type:component.type,
      ...analyzeGeometryDiagnostics(component.geometry,{
        transform:component.transform,
        scale,
        tolerance
      })
    }));

  const modelBounds={
    min:[Infinity,Infinity,Infinity],
    max:[-Infinity,-Infinity,-Infinity]
  };
  for(const item of components){
    for(let axis=0;axis<3;axis++){
      modelBounds.min[axis]=Math.min(modelBounds.min[axis],item.bounds.min[axis]);
      modelBounds.max[axis]=Math.max(modelBounds.max[axis],item.bounds.max[axis]);
    }
  }
  if(!components.length){modelBounds.min=[0,0,0];modelBounds.max=[0,0,0]}
  modelBounds.size=modelBounds.max.map((value,index)=>value-modelBounds.min[index]);

  const result={
    components,
    geometryComponents:components.length,
    triangles:components.reduce((sum,item)=>sum+item.triangleCount,0),
    boundaryEdges:components.reduce((sum,item)=>sum+item.boundaryEdges,0),
    nonManifoldEdges:components.reduce((sum,item)=>sum+item.nonManifoldEdges,0),
    degenerateTriangles:components.reduce((sum,item)=>sum+item.degenerateTriangles,0),
    watertight:components.length>0&&components.every(item=>item.watertight),
    bounds:modelBounds
  };
  cache.set(modelDocument,result);
  return result;
}
