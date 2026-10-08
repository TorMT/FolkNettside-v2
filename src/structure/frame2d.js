const EPS=1e-12;

function zeros(rows,cols){return Array.from({length:rows},()=>Array(cols).fill(0))}
function transpose(a){return a[0].map((_,j)=>a.map(row=>row[j]))}
function matMul(a,b){
  const out=zeros(a.length,b[0].length);
  for(let i=0;i<a.length;i++)for(let k=0;k<b.length;k++){
    const aik=a[i][k];
    if(Math.abs(aik)<EPS)continue;
    for(let j=0;j<b[0].length;j++)out[i][j]+=aik*b[k][j];
  }
  return out;
}
function matVec(a,x){return a.map(row=>row.reduce((sum,value,j)=>sum+value*x[j],0))}

function solveLinear(a,b){
  const n=b.length;
  const m=a.map((row,i)=>[...row,b[i]]);
  for(let col=0;col<n;col++){
    let pivot=col;
    for(let row=col+1;row<n;row++)if(Math.abs(m[row][col])>Math.abs(m[pivot][col]))pivot=row;
    if(Math.abs(m[pivot][col])<EPS)throw new Error("Frame stiffness matrix is singular; check supports and connectivity");
    [m[col],m[pivot]]=[m[pivot],m[col]];
    const diag=m[col][col];
    for(let j=col;j<=n;j++)m[col][j]/=diag;
    for(let row=0;row<n;row++){
      if(row===col)continue;
      const factor=m[row][col];
      if(Math.abs(factor)<EPS)continue;
      for(let j=col;j<=n;j++)m[row][j]-=factor*m[col][j];
    }
  }
  return m.map(row=>row[n]);
}

export function frameElementMatrices(nodeA,nodeB,{E,A,I}){
  const dx=nodeB.x-nodeA.x,dy=nodeB.y-nodeA.y;
  const L=Math.hypot(dx,dy);
  if(!(L>EPS))throw new Error("Frame element length must be positive");
  if(!(E>0&&A>0&&I>0))throw new Error("Frame element E, A and I must be positive");
  const c=dx/L,s=dy/L;
  const ea=E*A/L,ei=E*I,L2=L*L,L3=L2*L;
  const k=[
    [ ea,0,0,-ea,0,0],
    [0,12*ei/L3, 6*ei/L2,0,-12*ei/L3, 6*ei/L2],
    [0, 6*ei/L2, 4*ei/L,0, -6*ei/L2, 2*ei/L],
    [-ea,0,0, ea,0,0],
    [0,-12*ei/L3,-6*ei/L2,0,12*ei/L3,-6*ei/L2],
    [0, 6*ei/L2, 2*ei/L,0, -6*ei/L2, 4*ei/L]
  ];
  const T=[
    [ c, s,0,0,0,0],
    [-s, c,0,0,0,0],
    [ 0, 0,1,0,0,0],
    [ 0, 0,0,c,s,0],
    [ 0, 0,0,-s,c,0],
    [ 0, 0,0,0,0,1]
  ];
  const kg=matMul(transpose(T),matMul(k,T));
  return {length:L,c,s,localStiffness:k,transform:T,globalStiffness:kg};
}

export function solveFrame2D(model){
  const nodes=Array.isArray(model.nodes)?model.nodes:[];
  const elements=Array.isArray(model.elements)?model.elements:[];
  if(nodes.length<2)throw new Error("Frame model needs at least two nodes");
  if(!elements.length)throw new Error("Frame model needs at least one element");

  const nodeIndex=new Map(nodes.map((node,index)=>[String(node.id),index]));
  if(nodeIndex.size!==nodes.length)throw new Error("Frame node IDs must be unique");
  const ndof=nodes.length*3,K=zeros(ndof,ndof),F=Array(ndof).fill(0);
  const elementCache=[];

  const dofsFor=nodeId=>{
    const index=nodeIndex.get(String(nodeId));
    if(index===undefined)throw new Error(`Unknown node ID: ${nodeId}`);
    return [index*3,index*3+1,index*3+2];
  };

  for(const element of elements){
    const ia=nodeIndex.get(String(element.n1)),ib=nodeIndex.get(String(element.n2));
    if(ia===undefined||ib===undefined)throw new Error(`Element ${element.id??""} references unknown node`);
    const matrices=frameElementMatrices(nodes[ia],nodes[ib],element);
    const dofs=[...dofsFor(element.n1),...dofsFor(element.n2)];
    for(let i=0;i<6;i++)for(let j=0;j<6;j++)K[dofs[i]][dofs[j]]+=matrices.globalStiffness[i][j];
    elementCache.push({element,matrices,dofs});
  }

  // Uniform element loads, local coordinates: qx axial, qy transverse N/m.
  // Euler-Bernoulli consistent force vector, exactly integrated (not nodal
  // lumping). Same local correction enters the recovered end actions.
  for(const load of model.distributedLoads||[]){
    const cache=elementCache.find(item=>String(item.element.id)===String(load.element));
    if(!cache)throw new Error("Unknown distributed-load element: "+String(load.element));
    const L=cache.matrices.length;
    const qx=Number(load.qx??0),qy=Number(load.qy??0);
    if(!Number.isFinite(qx)||!Number.isFinite(qy))
      throw new Error("Distributed loads require finite qx and qy in N/m");
    const local=[qx*L/2,qy*L/2,qy*L*L/12,
      qx*L/2,qy*L/2,-qy*L*L/12];
    if(!cache.consistentPointForces)cache.consistentPointForces=Array(6).fill(0);
    for(let i=0;i<6;i++)cache.consistentPointForces[i]+=local[i];
    const global=matVec(transpose(cache.matrices.transform),local);
    cache.dofs.forEach((dof,i)=>F[dof]+=global[i]);
  }

  // Arbitrary interior point forces/moments use exact Hermite consistent
  // nodal loads, not a nearest-node approximation. fx/fy are GLOBAL N,
  // mz is a moment about +Z (N*m); position is metres from element.n1.
  for(const load of model.pointLoads||[]){
    const cache=elementCache.find(item=>String(item.element.id)===String(load.element));
    if(!cache)throw new Error("Unknown point-load element: "+String(load.element));
    const {length:L,c,s,transform:T}=cache.matrices;
    const a=Number(load.position),fx=Number(load.fx??0),fy=Number(load.fy??0),mz=Number(load.mz??0);
    if(![a,fx,fy,mz].every(Number.isFinite)||a<0||a>L)
      throw new Error("Point load requires position in [0, element length] and finite fx/fy/mz");
    const t=a/L,t2=t*t,t3=t2*t;
    const localFx=c*fx+s*fy,localFy=-s*fx+c*fy;
    const shape=[1-3*t2+2*t3,L*(t-2*t2+t3),3*t2-2*t3,L*(-t2+t3)];
    const slope=[(-6*t+6*t2)/L,1-4*t+3*t2,
      (6*t-6*t2)/L,-2*t+3*t2];
    const local=[
      localFx*(1-t),
      localFy*shape[0]+mz*slope[0],
      localFy*shape[1]+mz*slope[1],
      localFx*t,
      localFy*shape[2]+mz*slope[2],
      localFy*shape[3]+mz*slope[3]
    ];
    if(!cache.consistentPointForces)cache.consistentPointForces=Array(6).fill(0);
    for(let i=0;i<6;i++)cache.consistentPointForces[i]+=local[i];
    const global=matVec(transpose(T),local);
    cache.dofs.forEach((dof,i)=>F[dof]+=global[i]);
  }

  for(const load of model.loads||[]){
    const [ux,uy,rz]=dofsFor(load.node);
    F[ux]+=Number(load.fx)||0;
    F[uy]+=Number(load.fy)||0;
    F[rz]+=Number(load.mz)||0;
  }

  const fixed=new Set();
  for(const support of model.supports||[]){
    const dofs=dofsFor(support.node);
    if(support.ux)fixed.add(dofs[0]);
    if(support.uy)fixed.add(dofs[1]);
    if(support.rz)fixed.add(dofs[2]);
  }
  if(!fixed.size)throw new Error("Frame model has no constrained DOFs");

  const free=Array.from({length:ndof},(_,i)=>i).filter(i=>!fixed.has(i));
  const Kff=free.map(i=>free.map(j=>K[i][j]));
  const Ff=free.map(i=>F[i]);
  const uf=free.length?solveLinear(Kff,Ff):[];
  const U=Array(ndof).fill(0);
  free.forEach((dof,i)=>U[dof]=uf[i]);

  const KU=matVec(K,U);
  const R=KU.map((value,i)=>value-F[i]);

  const nodeResults=nodes.map((node,index)=>({
    id:node.id,
    ux:U[index*3],
    uy:U[index*3+1],
    rz:U[index*3+2],
    rx:R[index*3],
    ry:R[index*3+1],
    rm:R[index*3+2]
  }));

  const elementResults=elementCache.map(({element,matrices,dofs,consistentPointForces})=>{
    const globalDisplacements=dofs.map(dof=>U[dof]);
    const localDisplacements=matVec(matrices.transform,globalDisplacements);
    const localElasticForces=matVec(matrices.localStiffness,localDisplacements);
    const localEndForces=localElasticForces.map((v,i)=>
      v-(consistentPointForces?.[i]||0));
    return {
      id:element.id,
      n1:element.n1,
      n2:element.n2,
      length:matrices.length,
      localDisplacements,
      localEndForces
    };
  });

  return {displacements:U,reactions:R,nodes:nodeResults,elements:elementResults};
}
