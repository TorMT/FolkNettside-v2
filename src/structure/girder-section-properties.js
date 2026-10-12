/**
 * Explicit marine longitudinal structural cross-sections.
 * Coordinates: longitudinal x, transverse y, vertical z, all in metres.
 *
 * Plate: plate,x0,x1,y0,z0,y1,z1,thickness_m,E_GPa,density_kg_m3
 * Rectangular longitudinal stiffener:
 *        stiffener,x0,x1,y_center,z_center,width_y,height_z,E_GPa,density_kg_m3
 *
 * The member is assumed continuous within one specified X station. Exact
 * rectangle cross-section integrals (thin plate rectangle orientation
 * and rectangular stiffener), using an elastic neutral axis for mixed E.
 * No inference from visual hull triangles, corrosion, effective breadth,
 * shear lag, cutouts, welds, torsion, buckling, or overlap subtraction.
 */
import {validateGirderProfile} from "./girder-profiles.js?v=795e5702f951a9c3ed3228548828ba9698badba1";
import {structuralOverlapAudit} from "./girder-section-geometry.js?v=795e5702f951a9c3ed3228548828ba9698badba1";
const finite=Number.isFinite;
function number(raw,name){
  if(raw===undefined||raw===null||String(raw).trim()==="")
    throw new Error(name+" is required");
  const value=Number(raw);
  if(!finite(value))throw new Error(name+" must be finite");
  return value;
}
function positive(raw,name){
  const value=number(raw,name);
  if(!(value>0))throw new Error(name+" must be positive");
  return value;
}
export function parseStructuralMembers(text){
  const result=[];
  const lines=String(text??"").split(/\r?\n/);
  for(const [idx,line] of lines.entries()){
    const data=line.split("#",1)[0].trim();
    if(!data)continue;
    if(result.length>=250)throw new Error("Maximum 250 cross-section members");
    const parts=data.split(",").map(x=>x.trim());
    const kind=parts[0]?.toLowerCase();
    if(kind!=="plate"&&kind!=="stiffener")
      throw new Error("Section row "+(idx+1)+" must start with plate or stiffener");
    if(parts.length!==(kind==="plate"?10:9))
      throw new Error("Section row "+(idx+1)+" has incorrect column count for "+kind);
    const fields=parts.slice(1).map((raw,j)=>number(raw,"Section row "+(idx+1)+" column "+(j+2)));
    const [x0,x1]=fields;
    if(!(x1>x0))throw new Error("Section row "+(idx+1)+" needs x1 > x0");
    if(kind==="plate"){
      const [y0,z0,y1,z1,t,E_GPa,rho]=fields.slice(2);
      if(!(t>0&&E_GPa>0&&rho>0))throw new Error("Section plate thickness, E and density must be positive");
      if(!(Math.hypot(y1-y0,z1-z0)>0))throw new Error("Section plate needs distinct Y/Z endpoints");
      result.push({kind,x0,x1,y0,z0,y1,z1,t,E:E_GPa*1e9,rho});
    }else{
      const [y,z,width,height,E_GPa,rho]=fields.slice(2);
      if(!(width>0&&height>0&&E_GPa>0&&rho>0))
        throw new Error("Stiffener width, height, E and density must be positive");
      result.push({kind,x0,x1,y,z,width,height,E:E_GPa*1e9,rho});
    }
  }
  return result;
}
function memberProperties(member){
  const {E,rho}=member;
  if(member.kind==="plate"){
    const {y0,z0,y1,z1,t}=member;
    const dy=y1-y0,dz=z1-z0,L=Math.hypot(dy,dz);
    const area=L*t;
    // Exact second moment of a rotated rectangle about its centroid's Y axis.
    const ownI=area*(dz*dz+t*t*(dy/L)**2)/12;
    const verticalHalfWidth=t*Math.abs(dy)/(2*L);
    return {
      ...member,area,centroidY:(y0+y1)/2,centroidZ:(z0+z1)/2,ownI,
      zMin:Math.min(z0,z1)-verticalHalfWidth,
      zMax:Math.max(z0,z1)+verticalHalfWidth
    };
  }
  if(member.kind==="stiffener"){
    const area=member.width*member.height;
    return {...member,area,centroidY:member.y,centroidZ:member.z,
      ownI:member.width*member.height**3/12,
      zMin:member.z-member.height/2,zMax:member.z+member.height/2};
  }
  throw new Error("Unknown cross-section member");
}
export function sectionProperties(members,{referenceE=210e9}={}){
  if(!Array.isArray(members)||!members.length||members.length>250)
    throw new Error("A structural cross-section requires 1–250 members");
  if(!finite(referenceE)||referenceE<=0)throw new Error("Reference E must be positive");
  const parts=members.map(memberProperties);
  if(parts.some(p=>![p.area,p.ownI,p.E,p.rho,p.centroidY,p.centroidZ,p.zMin,p.zMax].every(finite)||
      !(p.area>0&&p.E>0&&p.rho>0)))
    throw new Error("Cross-section area, density or material is invalid");
  const weighted=parts.reduce((a,p)=>a+p.E*p.area,0);
  const zNeutral=parts.reduce((a,p)=>a+p.E*p.area*p.centroidZ,0)/weighted;
  const yNeutral=parts.reduce((a,p)=>a+p.E*p.area*p.centroidY,0)/weighted;
  const EI=parts.reduce((a,p)=>a+p.E*(p.ownI+p.area*(p.centroidZ-zNeutral)**2),0);
  const geometricalI=parts.reduce((a,p)=>a+p.ownI+p.area*(p.centroidZ-zNeutral)**2,0);
  const area=parts.reduce((a,p)=>a+p.area,0);
  const tonnesPerM=parts.reduce((a,p)=>a+p.rho*p.area/1000,0);
  if(![weighted,zNeutral,yNeutral,EI,geometricalI,area,tonnesPerM].every(finite)||
    !(EI>0&&area>0))
    throw new Error("Cross-section derived stiffness/weight is not finite");
  const zMin=Math.min(...parts.map(p=>p.zMin)),zMax=Math.max(...parts.map(p=>p.zMax));
  const stressFibers=parts.flatMap((p,i)=>[
    {memberIndex:i,kind:p.kind,z:p.zMin,E:p.E},
    {memberIndex:i,kind:p.kind,z:p.zMax,E:p.E}
  ]);
  return {referenceE,E:referenceE,I:EI/referenceE,EI,geometricalI,
    areaM2:area,tonnesPerM,zNeutral,yNeutral,zMin,zMax,
    extremeFiberM:Math.max(zMax-zNeutral,zNeutral-zMin),
    parts,stressFibers,assumption:"Gross rectangular components; no overlap removal, holes, effective breadth or buckling"};
}
export function stressFromSectionMoment(section,momentNm){
  if(!section||!Array.isArray(section.stressFibers)||!finite(momentNm)||
    !(section.EI>0))throw new Error("Structural stress needs a valid section and moment");
  const fibers=section.stressFibers.map(fiber=>({
    ...fiber,stressPa:fiber.E*momentNm*(fiber.z-section.zNeutral)/section.EI
  }));
  return fibers.reduce((top,fiber)=>
    !top||Math.abs(fiber.stressPa)>Math.abs(top.stressPa)?fiber:top,null);
}
export function deriveLongitudinalSections(members,{xMin,xMax,referenceE=210e9}={}){
  if(!Array.isArray(members)||!members.length)return null;
  const overlapAudit=structuralOverlapAudit(members);
  if(!overlapAudit.passed)
    throw new Error(overlapAudit.warnings[0].description+
      " Overlaps must be resolved before section properties are used.");
  const grouped=[],tol=Math.max(1e-9,Math.abs(xMax-xMin)*1e-8);
  for(const member of members){
    const last=grouped.at(-1);
    if(last&&Math.abs(last.x0-member.x0)<=tol&&Math.abs(last.x1-member.x1)<=tol)
      last.members.push(member);
    else grouped.push({x0:member.x0,x1:member.x1,members:[member]});
  }
  if(grouped.length>60)throw new Error("Maximum 60 cross-section stations");
  const profile=grouped.map(group=>({
    x0:group.x0,x1:group.x1,...sectionProperties(group.members,{referenceE})
  }));
  const stations=validateGirderProfile(profile,{xMin,xMax,kind:"stiffness"});
  const massStations=stations.map(s=>({x0:s.x0,x1:s.x1,tonnesPerM:s.tonnesPerM}));
  const totalStructuralMassTonnes=massStations.reduce((sum,s)=>
    sum+(s.x1-s.x0)*s.tonnesPerM,0);
  const firstMomentTonnesM=massStations.reduce((sum,s)=>
    sum+(s.x1-s.x0)*s.tonnesPerM*(s.x0+s.x1)/2,0);
  return {
    sections:stations,massStations,totalStructuralMassTonnes,
    firstMomentTonnesM,
    structuralLCG:totalStructuralMassTonnes?firstMomentTonnesM/totalStructuralMassTonnes:null,
    memberCount:members.length,overlapAudit,
    warning:"Structural plate/stiffener gross weight is not automatically the vessel's complete baseline hull weight"
  };
}
