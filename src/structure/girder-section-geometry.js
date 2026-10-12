/**
 * Conservative 2D Y/Z footprint collision checks for declared structural
 * plates and rectangular stiffeners at overlapping longitudinal stations.
 *
 * A finite-overlap intersection is a modeling error: separate gross-section
 * components would otherwise double-count area, mass and EI. Shared edges
 * and zero-area touches are allowed. No automatic metal subtraction.
 */
const finite=Number.isFinite;
function footprint(member){
  if(member.kind==="plate"){
    const dy=member.y1-member.y0,dz=member.z1-member.z0;
    const length=Math.hypot(dy,dz);
    if(!finite(length)||length<=0||!finite(member.t)||member.t<=0)
      throw Error("Invalid plate thickness or Y/Z segment");
    const ny=-dz/length*member.t/2,nz=dy/length*member.t/2;
    return [[member.y0+ny,member.z0+nz],[member.y1+ny,member.z1+nz],
      [member.y1-ny,member.z1-nz],[member.y0-ny,member.z0-nz]];
  }
  if(member.kind==="stiffener"){
    const {y,z,width,height}=member;
    if(![y,z,width,height].every(finite)||width<=0||height<=0)
      throw Error("Invalid stiffener rectangle");
    return [[y-width/2,z-height/2],[y+width/2,z-height/2],
      [y+width/2,z+height/2],[y-width/2,z+height/2]];
  }
  throw Error("Invalid structural section component type");
}
function signedArea(polygon){
  let area=0;
  for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length];
    area+=a[0]*b[1]-b[0]*a[1];
  }
  return area/2;
}
function clippedPolygon(subject,clip){
  const vertices=signedArea(clip)<0?[...clip].reverse():clip;
  let poly=subject;
  for(let j=0;j<vertices.length;j++){
    const a=vertices[j],b=vertices[(j+1)%vertices.length];
    const value=p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
    const output=[];
    for(let i=0;i<poly.length;i++){
      const p=poly[i],q=poly[(i+1)%poly.length];
      const vp=value(p),vq=value(q),insideP=vp>=-1e-12,insideQ=vq>=-1e-12;
      if(insideP!==insideQ){
        const t=vp/(vp-vq);
        output.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);
      }
      if(insideQ)output.push(q);
    }
    poly=output;
    if(!poly.length)break;
  }
  return poly;
}
export function memberFootprint(member){return footprint(member)}
export function membersOverlapAreaM2(a,b){
  const pa=footprint(a),pb=footprint(b);
  const intersection=clippedPolygon(pa,pb);
  return intersection.length>=3?Math.abs(signedArea(intersection)):0;
}
export function structuralOverlapAudit(members,{maxChecks=32000}={}){
  if(!Array.isArray(members))throw Error("Expected structural member list");
  const warnings=[];
  const footprints=members.map(footprint);
  const areas=footprints.map(p=>Math.abs(signedArea(p)));
  let checks=0,totalOverlapM2=0;
  for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++){
    if(++checks>maxChecks)throw Error("Too many cross-section intersection checks");
    const a=members[i],b=members[j];
    // No overlap of longitudinal slabs -> no double counting.
    if(a.x1<=b.x0+1e-9||b.x1<=a.x0+1e-9)continue;
    const intersection=clippedPolygon(footprints[i],footprints[j]);
    const area=intersection.length>=3?Math.abs(signedArea(intersection)):0;
    const threshold=Math.max(1e-10,Math.min(areas[i],areas[j])*1e-6);
    if(area>threshold){
      totalOverlapM2+=area;
      warnings.push({first:i,second:j,overlapAreaM2:area,
        x0:Math.max(a.x0,b.x0),x1:Math.min(a.x1,b.x1),
        description:"Cross-section members "+(i+1)+" and "+(j+1)+
          " overlap by "+area.toPrecision(4)+" m² in the Y/Z plane. "+
          "Trim member footprints to avoid duplicate mass and stiffness."});
    }
  }
  return {passed:warnings.length===0,warnings,totalOverlapM2,checks};
}
