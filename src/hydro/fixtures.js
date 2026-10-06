function quad(a,b,c,d,positions,indices){
  const base=positions.length/3;
  positions.push(...a,...b,...c,...d);
  indices.push(base,base+1,base+2,base,base+2,base+3);
}

export function boxMesh({L=10,B=3,H=2,origin=[0,0,0]}={}){
  const [ox,oy,oz]=origin,x0=ox-L/2,x1=ox+L/2,y0=oy-B/2,y1=oy+B/2,z0=oz,z1=oz+H;
  const p=[],i=[];
  quad([x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[x1,y0,z0],p,i);
  quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],p,i);
  quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],p,i);
  quad([x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1],p,i);
  quad([x1,y1,z0],[x0,y1,z0],[x0,y1,z1],[x1,y1,z1],p,i);
  quad([x0,y1,z0],[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],p,i);
  return {positions:p,indices:i};
}

export function reverseWinding(mesh){
  const indices=mesh.indices.slice();
  for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  return {positions:mesh.positions.slice(),indices};
}

export function wedgePrismMesh({L=8,B=2,H0=.5,H1=2}={}){
  const p=[
    -L/2,-B/2,0,  L/2,-B/2,0,  L/2,B/2,0, -L/2,B/2,0,
    -L/2,-B/2,H0, L/2,-B/2,H1, L/2,B/2,H1,-L/2,B/2,H0
  ];
  const q=(a,b,c,d)=>[a,b,c,a,c,d];
  return {positions:p,indices:[
    ...q(0,3,2,1),...q(4,5,6,7),
    ...q(0,1,5,4),...q(1,2,6,5),...q(2,3,7,6),...q(3,0,4,7)
  ]};
}
