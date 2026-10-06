import {crystalPreset,crystalType,distance3} from "./crystal-structures-core.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6";

export const MANUAL_ATOMS={
  fe:{label:"Fe",species:"Fe",radius:.14,color:"#9aa6ad"},
  c:{label:"C",species:"C",radius:.11,color:"#3e4850"},
  cr:{label:"Cr",species:"Cr",radius:.14,color:"#8097a5"},
  ni:{label:"Ni",species:"Ni",radius:.14,color:"#8ca0ad"},
  cu:{label:"Cu",species:"Cu",radius:.14,color:"#c67d42"},
  al:{label:"Al",species:"Al",radius:.15,color:"#b9c6cc"},
  o:{label:"O",species:"O",radius:.10,color:"#d95c5c"},
  custom:{label:"Custom",species:"X",radius:.12,color:"#b3157a"}
};

export function bondPairs(sites,threshold=1.15){
  const limit=Number(threshold);
  if(!(limit>0))return[];
  const active=sites.map((site,index)=>({site,index})).filter(item=>item.site.active!==false);
  const pairs=[];
  for(let a=0;a<active.length;a++){
    for(let b=a+1;b<active.length;b++){
      const left=active[a],right=active[b];
      const distance=distance3(left.site.pos,right.site.pos);
      if(distance<=limit)pairs.push({a:left.index,b:right.index,distance});
    }
  }
  return pairs;
}

export function millerPlane(h,k,l){
  const raw=[Number(h)||0,Number(k)||0,Number(l)||0];
  const length=Math.hypot(...raw);
  if(length<1e-12)throw new Error("Miller indices cannot all be zero");
  const normal=raw.map(value=>value/length);
  const point=raw.map(value=>value===0?.5:Math.min(1,Math.max(0,1/value)));
  return {label:`(${raw.join(" ")})`,indices:raw,normal,point};
}

export function closePackedPlaneSpecs(type){
  const center=[.5,.5,.5];
  if(["fcc","diamond","nacl","zns","caf2","spinel"].includes(type)){
    return [
      {label:"{111} A",normal:[1,1,1],point:center},
      {label:"{111} B",normal:[1,1,-1],point:center},
      {label:"{111} C",normal:[1,-1,1],point:center},
      {label:"{111} D",normal:[-1,1,1],point:center}
    ];
  }
  if(type==="bcc"){
    return [
      {label:"{110} A",normal:[1,1,0],point:center},
      {label:"{110} B",normal:[1,-1,0],point:center},
      {label:"{110} C",normal:[1,0,1],point:center},
      {label:"{110} D",normal:[1,0,-1],point:center},
      {label:"{110} E",normal:[0,1,1],point:center},
      {label:"{110} F",normal:[0,1,-1],point:center}
    ];
  }
  if(type==="hcp"){
    const c=1.633;
    return [
      {label:"Basal plane A",normal:[0,1,0],point:[0,0,0]},
      {label:"Basal plane B",normal:[0,1,0],point:[0,c/2,0]}
    ];
  }
  if(type==="sc"||type==="cscl"){
    return [
      {label:"{100}",normal:[1,0,0],point:center},
      {label:"{010}",normal:[0,1,0],point:center},
      {label:"{001}",normal:[0,0,1],point:center}
    ];
  }
  return [];
}

export function nearestSiteIndex(sites,pos,maxDistance=Infinity){
  let best=-1,bestDistance=Infinity;
  sites.forEach((site,index)=>{
    if(site.active===false)return;
    const distance=distance3(site.pos,pos);
    if(distance<bestDistance){best=index;bestDistance=distance}
  });
  return bestDistance<=maxDistance?best:-1;
}

export function applyCrystalEdits(baseSites,edits=[]){
  const sites=baseSites.map((site,index)=>({
    ...site,
    pos:[...site.pos],
    source:"base",
    baseIndex:index,
    active:site.active!==false
  }));
  const markers=[];
  const applied=[];

  for(const [editIndex,edit] of edits.entries()){
    const type=edit?.type;
    if(type==="vacancy"||type==="dopant"){
      const index=Number.isInteger(edit.baseIndex)
        ?edit.baseIndex
        :nearestSiteIndex(sites,edit.target||[0,0,0],Number(edit.maxDistance)||.35);
      const site=sites[index];
      if(!site||site.active===false)continue;
      if(type==="vacancy")site.active=false;
      else site.species=String(edit.species||"X");
      site.editIndex=editIndex;
      applied.push({...edit,resolvedBaseIndex:index});
      continue;
    }

    if(type==="interstitial"||type==="manual"){
      const props=MANUAL_ATOMS[edit.atomType]||MANUAL_ATOMS.custom;
      const species=String(edit.species||props.species);
      sites.push({
        pos:[...(edit.pos||edit.target||[0,0,0])],
        species,
        radius:Number(edit.radius)||props.radius,
        color:edit.color||props.color,
        source:type,
        editIndex,
        active:true
      });
      applied.push(edit);
      continue;
    }

    if(type==="electron"||type==="hole"){
      markers.push({
        type,
        pos:[...(edit.pos||edit.target||[0,0,0])],
        color:edit.color|| (type==="electron"?"#4b88c6":"#d36b59"),
        editIndex
      });
      applied.push(edit);
    }
  }

  return {sites,markers,applied};
}

function composition(sites){
  const counts=new Map();
  for(const site of sites){
    if(site.active===false)continue;
    counts.set(site.species,(counts.get(site.species)||0)+1);
  }
  return Object.fromEntries([...counts.entries()].sort((a,b)=>a[0].localeCompare(b[0])));
}

export function analyzeCrystal({structureId,preset=null,baseSites=[],edits=[]}){
  const structure=crystalType(structureId);
  const presetData=preset?crystalPreset(preset):null;
  const edited=applyCrystalEdits(baseSites,edits);
  const defectCounts={vacancy:0,dopant:0,interstitial:0,manual:0,electron:0,hole:0};
  for(const edit of edited.applied)if(edit.type in defectCounts)defectCounts[edit.type]++;

  return {
    structureId,
    structureName:structure?.name||structureId,
    coordinationNumber:structure?.coordinationNumber??null,
    equivalentAtoms:structure?.equivalentAtoms??null,
    preset:presetData?.label||null,
    composition:composition(edited.sites),
    activeAtoms:edited.sites.filter(site=>site.active!==false).length,
    markers:edited.markers.length,
    defects:defectCounts,
    description:structure?.description||""
  };
}


export function segmentPlaneIntersection(a,b,normal,point){
  const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];
  const denom=normal[0]*ab[0]+normal[1]*ab[1]+normal[2]*ab[2];
  if(Math.abs(denom)<1e-12)return null;
  const delta=[point[0]-a[0],point[1]-a[1],point[2]-a[2]];
  const t=(normal[0]*delta[0]+normal[1]*delta[1]+normal[2]*delta[2])/denom;
  if(t<0||t>1)return null;
  return [a[0]+ab[0]*t,a[1]+ab[1]*t,a[2]+ab[2]*t];
}

export function bondPlaneCuts(sites,bonds,planes){
  const cuts=[];
  for(const bond of bonds){
    const a=sites[bond.a]?.pos,b=sites[bond.b]?.pos;
    if(!a||!b)continue;
    for(const plane of planes){
      const point=segmentPlaneIntersection(a,b,plane.normal,plane.point);
      if(point)cuts.push({point,bond,planeLabel:plane.label});
    }
  }
  return cuts;
}
