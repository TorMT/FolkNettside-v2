// Closed planar contour integration for arbitrary watertight hull waterlines.
// Even-odd nesting distinguishes flooded holes/moonpools from waterplane islands.
// Unlike oriented triangle winding, nesting remains stable if segment directions
// arrive unordered from triangle clipping.
const DEFAULT_TOLERANCE=1e-7;
const finitePoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
const quant=(p,tol)=>Math.round(p[0]/tol)+","+Math.round(p[1]/tol);
const uniqueEdges=(a,b)=>a<b?a+"|"+b:b+"|"+a;

export function stitchWaterplaneContours(segments,{tolerance=DEFAULT_TOLERANCE}={}){
  if(!(tolerance>0&&Number.isFinite(tolerance)))throw new Error("Invalid waterplane contour tolerance");
  if(!Array.isArray(segments))throw new Error("Waterplane contour segments are required");
  const nodes=new Map(),edges=[],existing=new Set();
  function node(point){
    const key=quant(point,tolerance);
    let n=nodes.get(key);
    if(!n){n={key,point:[point[0],point[1]],edges:[]};nodes.set(key,n)}
    return n;
  }
  for(const segment of segments){
    if(!Array.isArray(segment)||segment.length!==2||!segment.every(finitePoint))
      throw new Error("Invalid waterplane intersection segment");
    const a=node(segment[0]),b=node(segment[1]);
    if(a.key===b.key)continue; // collapsed numerical corner
    const key=uniqueEdges(a.key,b.key);
    if(existing.has(key))throw new Error("Waterplane contour has duplicate/coincident segments; check coplanar faces");
    existing.add(key);
    const id=edges.length;edges.push({a,b});
    a.edges.push(id);b.edges.push(id);
  }
  if(!edges.length)return [];
  let open=0,branch=0;
  for(const n of nodes.values()){
    if(n.edges.length===1)open++;
    else if(n.edges.length!==2)branch++;
  }
  if(open||branch)throw new Error("Waterplane contours not closed: "+
    open+" open endpoints, "+branch+" branched intersections; check mesh and waterline.");
  const seen=new Uint8Array(edges.length),loops=[];
  for(let start=0;start<edges.length;start++){
    if(seen[start])continue;
    const first=edges[start].a;
    let current=first,edgeIndex=start;
    const points=[];
    do{
      if(seen[edgeIndex])throw new Error("Waterplane contour contains a reused edge");
      seen[edgeIndex]=1;
      points.push(current.point);
      const edge=edges[edgeIndex];
      current=edge.a===current?edge.b:edge.a;
      if(current===first)break;
      const next=current.edges.find(id=>!seen[id]);
      if(next===undefined)throw new Error("Waterplane contour is interrupted");
      edgeIndex=next;
      if(points.length>edges.length+1)throw new Error("Waterplane contour safety limit exceeded");
    }while(true);
    if(points.length<3)throw new Error("Waterplane contour has fewer than three vertices");
    loops.push(points);
  }
  return loops;
}

function containsPoint(point,polygon){
  // For independent nonintersecting loops their first vertices cannot be on
  // another contour boundary. Even-odd parity supports islands within holes.
  let inside=false;
  const [x,y]=point;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])
      inside=!inside;
  }
  return inside;
}
function polygonMoments(points,origin){
  let area2=0,cx6=0,cy6=0,ix12=0,iy12=0,ixy24=0;
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length];
    const x0=a[0]-origin[0],y0=a[1]-origin[1];
    const x1=b[0]-origin[0],y1=b[1]-origin[1];
    const cr=x0*y1-x1*y0;
    area2+=cr;cx6+=(x0+x1)*cr;cy6+=(y0+y1)*cr;
    ix12+=(y0*y0+y0*y1+y1*y1)*cr;
    iy12+=(x0*x0+x0*x1+x1*x1)*cr;
    ixy24+=(2*x0*y0+x0*y1+x1*y0+2*x1*y1)*cr;
  }
  const signed=area2/2;
  if(Math.abs(signed)<1e-12)throw new Error("Degenerate zero-area waterplane contour");
  const direction=Math.sign(signed);
  return {area:Math.abs(signed),cx:cx6/(6*signed),cy:cy6/(6*signed),
    ixx:direction*ix12/12,iyy:direction*iy12/12,ixy:direction*ixy24/24};
}

export function integrateWaterplaneContours(segments,options={}){
  const loops=stitchWaterplaneContours(segments,options);
  if(!loops.length)return {area:0,centroid:[0,0],ixx:0,iyy:0,ixy:0,
    loops:[],outerContours:0,holeContours:0};
  const origin=loops[0][0],moments=loops.map(loop=>polygonMoments(loop,origin));
  let area=0,mx=0,my=0,ixxOrigin=0,iyyOrigin=0,ixyOrigin=0;
  let outerContours=0,holeContours=0;
  for(let i=0;i<loops.length;i++){
    const depth=loops.reduce((count,other,j)=>i!==j&&containsPoint(loops[i][0],other)?count+1:count,0);
    const sign=depth%2===0?1:-1;
    if(sign===1)outerContours++;else holeContours++;
    const p=moments[i];
    area+=sign*p.area;mx+=sign*p.area*p.cx;my+=sign*p.area*p.cy;
    ixxOrigin+=sign*p.ixx;iyyOrigin+=sign*p.iyy;ixyOrigin+=sign*p.ixy;
  }
  if(!(area>1e-12))throw new Error("Waterplane has non-positive net area after flooded-hole subtraction");
  const cx=mx/area,cy=my/area;
  return {area,centroid:[origin[0]+cx,origin[1]+cy],
    ixx:ixxOrigin-area*cy*cy,iyy:iyyOrigin-area*cx*cx,
    ixy:ixyOrigin-area*cx*cy,loops,outerContours,holeContours};
}
