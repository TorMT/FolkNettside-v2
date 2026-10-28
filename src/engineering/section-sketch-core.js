/**
 * Editable structural-section CSV helpers. Human-authored comments, unrelated
 * data rows and newline convention are never rewritten by sketch operations.
 */
import {parseStructuralMembers} from "../structure/girder-section-properties.js?v=12f46a197391dc034f9aa7438b7fbd238188581f";
const finite=Number.isFinite;
const num=v=>{
  if(!finite(v))throw Error("Cross-section coordinates and properties must be finite");
  return Number(v.toPrecision(12)).toString();
};
export function sectionRowIndex(text){
  const lines=String(text??"").split(/\r?\n/);
  return lines.flatMap((line,lineIndex)=>{
    const content=line.split("#")[0].trim();
    return content?[{lineIndex,raw:content}]:[];
  });
}
export function formatSectionMember(m){
  if(!m||!(m.x1>m.x0))throw Error("Section X interval requires x1 > x0");
  if(m.kind==="plate"){
    const values=[m.x0,m.x1,m.y0,m.z0,m.y1,m.z1,m.t,m.E/1e9,m.rho];
    if(!(m.t>0&&m.E>0&&m.rho>0)&&m.kind==="plate")
      throw Error("Plate thickness/material must be positive");
    return ["plate",...values.map(num)].join(",");
  }
  if(m.kind==="stiffener"){
    const values=[m.x0,m.x1,m.y,m.z,m.width,m.height,m.E/1e9,m.rho];
    if(!(m.width>0&&m.height>0&&m.E>0&&m.rho>0))
      throw Error("Stiffener dimensions and material must be positive");
    return ["stiffener",...values.map(num)].join(",");
  }
  throw Error("Unsupported structural member type");
}
export function updateSectionRow(text,index,replacement=null){
  const source=String(text??""),newline=source.includes("\r\n")?"\r\n":"\n";
  const lines=source.split(/\r?\n/),positions=sectionRowIndex(source);
  if(!Number.isSafeInteger(index)||index<0||index>=positions.length)
    throw Error("Selected section member no longer exists");
  const {lineIndex}=positions[index];
  if(replacement===null)lines.splice(lineIndex,1);
  else{
    const formatted=typeof replacement==="string"?replacement:formatSectionMember(replacement);
    if(/[\r\n#]/.test(formatted)||!formatted.trim())
      throw Error("One valid section row is required");
    const commentAt=lines[lineIndex].indexOf("#");
    const comment=commentAt>=0?lines[lineIndex].slice(commentAt):"";
    lines[lineIndex]=formatted+(comment?" "+comment:"");
  }
  const output=lines.join(newline);
  parseStructuralMembers(output);
  return output;
}
export function insertSectionMember(text,member){
  const source=String(text??""),line=formatSectionMember(member);
  const newline=source.includes("\r\n")?"\r\n":"\n";
  const existing=parseStructuralMembers(source),positions=sectionRowIndex(source);
  const lines=source.split(/\r?\n/);
  let position=lines.length;
  // Keep repeated structural station intervals adjacent and ordered.
  for(let i=0;i<existing.length;i++){
    const p=existing[i],same=Math.abs(p.x0-member.x0)<=1e-9&&
      Math.abs(p.x1-member.x1)<=1e-9;
    if(same)position=positions[i].lineIndex+1;
    else if(position===lines.length&&p.x0>member.x0+1e-9)
      position=positions[i].lineIndex;
  }
  if(source.trim()==="")return line;
  if(position===lines.length&&lines.at(-1)==="")position--;
  lines.splice(position,0,line);
  const output=lines.join(newline);
  parseStructuralMembers(output);
  return output;
}
export function translateSectionMember(member,dy,dz){
  if(!member||![dy,dz].every(finite))throw Error("Invalid cross-section translation");
  if(member.kind==="plate")
    return {...member,y0:member.y0+dy,y1:member.y1+dy,
      z0:member.z0+dz,z1:member.z1+dz};
  if(member.kind==="stiffener")
    return {...member,y:member.y+dy,z:member.z+dz};
  throw Error("Unsupported section member");
}
export function sectionDrawBounds(members=[],modelBounds=null){
  const points=[];
  for(const m of members){
    if(m.kind==="plate")points.push([m.y0,m.z0],[m.y1,m.z1]);
    else if(m.kind==="stiffener")points.push([m.y-m.width/2,m.z-m.height/2],
      [m.y+m.width/2,m.z+m.height/2]);
  }
  if(!points.length&&modelBounds?.min?.length===3&&modelBounds?.max?.length===3)
    points.push([modelBounds.min[1],modelBounds.min[2]],
      [modelBounds.max[1],modelBounds.max[2]]);
  if(!points.length)points.push([-2,-2],[2,2]);
  const coords=points.flat();
  if(!coords.every(finite))throw Error("Cross-section bounds require finite coordinates");
  const ys=points.map(p=>p[0]),zs=points.map(p=>p[1]);
  const y0=Math.min(...ys),y1=Math.max(...ys),z0=Math.min(...zs),z1=Math.max(...zs);
  const span=Math.max(.4,y1-y0,z1-z0),pad=span*.18;
  return {y0:(y0+y1)/2-span/2-pad,y1:(y0+y1)/2+span/2+pad,
    z0:(z0+z1)/2-span/2-pad,z1:(z0+z1)/2+span/2+pad};
}
export function sectionPixelToMeters(p,bounds,size={width:640,height:340}){
  return {y:bounds.y0+p.x/size.width*(bounds.y1-bounds.y0),
    z:bounds.z1-p.y/size.height*(bounds.z1-bounds.z0)};
}
export function sectionMetersToPixel(y,z,bounds,size={width:640,height:340}){
  return {x:(y-bounds.y0)/(bounds.y1-bounds.y0)*size.width,
    y:(bounds.z1-z)/(bounds.z1-bounds.z0)*size.height};
}
