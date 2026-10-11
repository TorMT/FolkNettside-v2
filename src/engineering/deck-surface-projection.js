/**
 * Geometric X/Y projection of upward-facing near-planar mesh triangles.
 * "Candidate" means geometry only, NOT a verified structural deck.
 * All coordinates are transformed to world metres like the Hydro solver.
 */
const IDENTITY=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const cross=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
const finite=n=>typeof n==="number"&&Number.isFinite(n);
export function worldDeckVertex(positions,index,transform=IDENTITY,scale=1){
  const p=index*3, x=positions[p],y=positions[p+1],z=positions[p+2];
  return [(transform[0]*x+transform[4]*y+transform[8]*z+transform[12])*scale,
    (transform[1]*x+transform[5]*y+transform[9]*z+transform[13])*scale,
    (transform[2]*x+transform[6]*y+transform[10]*z+transform[14])*scale];
}
export function triangleCoversXY(triangle,x,y,tol=1e-9){
  if(![x,y].every(finite))return false;
  const [a,b,c]=triangle, den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
  if(Math.abs(den)<1e-14)return false;
  const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den;
  const v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den;
  return u>=-tol&&v>=-tol&&u+v<=1+tol;
}
const described=component=>{
  const semantic=component.metadata?.semantic||{};
  const labels=[semantic.role,semantic.subtype,...(semantic.tags||[]),component.type,component.name]
    .filter(Boolean).join(" ").toLowerCase();
  return /\b(deck|floor|platform|dekk|gulv)\b/.test(labels);
};
export function extractDeckSurfaceCandidates(documentModel,{
  minNormalZ=.94,maxTriangles=18000,verticalToleranceM=.035
}={}){
  const scale=Number(documentModel?.unitScaleToMeters??1);
  if(!(Number.isFinite(scale)&&scale>0))return [];
  const result=[],grouped=new Map();
  let scanned=0;
  for(const component of documentModel?.components||[]){
    const positions=component.geometry?.positions,raw=component.geometry?.indices;
    if(!positions?.length||positions.length%3!==0)continue;
    const matrix=component.transform||IDENTITY;
    if(matrix.length!==16||!Array.from(matrix).every(finite))continue;
    const indexed=Boolean(raw?.length),count=indexed?raw.length:positions.length/3;
    if(count%3!==0)continue;
    for(let i=0;i<count;i+=3){
      if(++scanned>maxTriangles)return [];
      const ia=indexed?raw[i]:i,ib=indexed?raw[i+1]:i+1,ic=indexed?raw[i+2]:i+2;
      if(![ia,ib,ic].every(v=>Number.isSafeInteger(v)&&v>=0&&v<positions.length/3))continue;
      const t=[ia,ib,ic].map(v=>worldDeckVertex(positions,v,matrix,scale));
      if(!t.every(p=>p.every(finite)))continue;
      const u=t[1].map((v,j)=>v-t[0][j]),v=t[2].map((w,j)=>w-t[0][j]);
      const normal=cross(u,v),norm=Math.hypot(...normal);
      // Winding in raw visual meshes isn't guaranteed; still use planar geometry,
      // but never call its orientation verified.
      if(norm<=1e-12||Math.abs(normal[2])/norm<minNormalZ)continue;
      const low=Math.min(...t.map(p=>p[2])),high=Math.max(...t.map(p=>p[2]));
      if(high-low>verticalToleranceM)continue;
      const altitude=t.reduce((sum,p)=>sum+p[2],0)/3;
      // Group coplanar faces by component and quantized height, never combine
      // independent decks just because they share one XY projection.
      const layer=Math.round(altitude/verticalToleranceM),key=String(component.id)+"|"+layer;
      let group=grouped.get(key);
      if(!group){
        group={id:key,componentId:component.id,name:String(component.name||"Mesh surface"),
          declaredDeck:described(component),z:altitude,triangles:[],areaM2:0};
        grouped.set(key,group);result.push(group);
      }
      group.triangles.push(t);
      group.areaM2+=Math.abs(normal[2])/2;
    }
  }
  return result.filter(g=>g.areaM2>.005).sort((a,b)=>
    Number(b.declaredDeck)-Number(a.declaredDeck)||b.areaM2-a.areaM2||b.z-a.z);
}
export function deckSurfaceAt(surface,x,y){
  if(!surface||![x,y].every(finite))return false;
  return surface.triangles.some(t=>triangleCoversXY(t,x,y));
}
/**
 * A sampled footprint check, NOT mathematical certification of full coverage.
 * Including a dense grid and rectangle edges avoids the most obvious gaps.
 */
export function sampledDeckFootprint(surface,area,{steps=14}={}){
  if(!surface)return {accepted:false,coverage:0,checked:0};
  if(!(area?.x1>area?.x0&&area?.y1>area?.y0))return {accepted:false,coverage:0,checked:0};
  const count=Math.max(4,Math.min(30,Math.floor(steps)));
  let checked=0,covered=0;
  for(let i=0;i<=count;i++)for(let j=0;j<=count;j++){
    checked++;
    const x=area.x0+(area.x1-area.x0)*i/count,
      y=area.y0+(area.y1-area.y0)*j/count;
    if(deckSurfaceAt(surface,x,y))covered++;
  }
  return {accepted:covered===checked,coverage:covered/checked,checked};
}
