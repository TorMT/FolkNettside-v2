import {crystalPreset,crystalType,distance3} from "./crystal-structures-core.js?v=46bddceaaf4ff12ec3dcab93f4def90ebf58e582";

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
    // Pick actual FCC lattice-bearing {111} members, not the mid-layer
    // x+y+z=1.5 plane that passes between adjacent close-packed layers.
    return [
      {label:"{111} A",normal:[1,1,1],point:[.5,.5,0]},
      {label:"{111} B",normal:[1,1,-1],point:[.5,.5,0]},
      {label:"{111} C",normal:[1,-1,1],point:[.5,0,.5]},
      {label:"{111} D",normal:[-1,1,1],point:[0,.5,.5]}
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
    return [
      {label:"Basal (0001) A",normal:[0,0,1],point:[0,0,0]},
      {label:"Basal (0001) B",normal:[0,0,1],point:[0,0,.5]}
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
    description:structure?.description||"",
    identification:identifyCrystal({structureId,sites:edited.sites,edits})
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


const COMMON_CRYSTALS=[
  {key:"fcc",name:"FCC (Face-Centered Cubic)",cn:12,speciesCounts:[1]},
  {key:"bcc",name:"BCC (Body-Centered Cubic)",cn:8,speciesCounts:[1]},
  {key:"sc",name:"SC (Simple Cubic)",cn:6,speciesCounts:[1]},
  {key:"diamond",name:"Diamond / tetrahedral",cn:4,speciesCounts:[1,2]},
  {key:"nacl",name:"NaCl (Rock Salt)",cn:6,speciesCounts:[2],ratio:[1,1]},
  {key:"cscl",name:"CsCl",cn:8,speciesCounts:[2],ratio:[1,1]},
  {key:"zns",name:"ZnS (Zinc Blende)",cn:4,speciesCounts:[2],ratio:[1,1]},
  {key:"caf2",name:"CaF2 (Fluorite)",cn:8,speciesCounts:[2],ratio:[1,2]},
  {key:"spinel",name:"Spinel-type",cn:null,speciesCounts:[3,4]}
];

export function firstShellCutoff(sortedDistances){
  const values=sortedDistances.filter(value=>Number(value)>1e-8).map(Number).sort((a,b)=>a-b);
  if(!values.length)return 0;
  let cutoff=values[0]*1.28;
  for(let i=1;i<values.length;i++){
    if(values[i]/values[i-1]>1.20){
      cutoff=values[i-1]*1.05;
      break;
    }
  }
  return cutoff;
}

export function coordinationStats(sites){
  const active=(sites||[]).filter(site=>site.active!==false&&Array.isArray(site.pos));
  if(!active.length)return {values:[],distribution:{},average:0,mode:0};
  const values=active.map((site,index)=>{
    const distances=active
      .map((other,j)=>j===index?0:distance3(site.pos,other.pos))
      .filter(value=>value>1e-8)
      .sort((a,b)=>a-b);
    const cutoff=firstShellCutoff(distances);
    return distances.filter(distance=>distance<=cutoff+1e-10).length;
  });
  const distribution={};
  for(const value of values)distribution[value]=(distribution[value]||0)+1;
  const mode=Number(Object.entries(distribution).sort((a,b)=>b[1]-a[1]||Number(b[0])-Number(a[0]))[0]?.[0]||0);
  return {
    values,
    distribution,
    average:values.reduce((sum,value)=>sum+value,0)/values.length,
    mode
  };
}

function reducedRatio(counts){
  const values=Object.values(counts).filter(value=>value>0).sort((a,b)=>a-b);
  if(values.length<2)return values;
  const gcd=(a,b)=>b===0?a:gcd(b,a%b);
  const divisor=values.reduce(gcd);
  return values.map(value=>value/divisor);
}

function ratioClose(actual,target,tolerance=.18){
  if(actual.length!==target.length)return false;
  const a=[...actual].sort((x,y)=>x-y);
  const b=[...target].sort((x,y)=>x-y);
  const scale=a[0]/b[0];
  return a.every((value,index)=>Math.abs(value-scale*b[index])<=Math.max(.2,Math.abs(value)*tolerance));
}

export function identifyCrystal({structureId=null,sites=[],edits=[]}={}){
  const active=sites.filter(site=>site.active!==false);
  const counts=composition(active);
  const species=Object.keys(counts);
  const ratio=reducedRatio(counts);
  const stats=coordinationStats(active);
  const result={type:"Unknown",confidence:0,details:[],warnings:[],coordination:stats,composition:counts};

  const known=COMMON_CRYSTALS.find(item=>item.key===structureId);
  if(known){
    result.type=known.name;
    result.confidence=90;
    if(known.cn!==null){
      result.details.push("Expected coordination: "+known.cn);
      if(stats.mode&&Math.abs(stats.mode-known.cn)<=2)result.confidence=Math.min(98,result.confidence+5);
    }
    if(known.ratio&&ratioClose(ratio,known.ratio))result.confidence=Math.min(98,result.confidence+3);
  }else{
    const candidates=COMMON_CRYSTALS.filter(item=>
      item.speciesCounts.includes(species.length)
      &&(item.cn===null||Math.abs(stats.mode-item.cn)<=2)
      &&(!item.ratio||ratioClose(ratio,item.ratio))
    );
    if(candidates.length){
      result.type=candidates[0].name;
      result.confidence=70+(candidates[0].cn!==null?15:0);
    }
  }

  const total=Object.values(counts).reduce((sum,value)=>sum+value,0);
  const fe=counts.Fe||0,cCount=counts.C||0,cr=counts.Cr||0,ni=counts.Ni||0;
  if(fe>0&&cCount>0&&total>0){
    const carbonPercent=100*cCount/(fe+cCount);
    const ratioFeC=fe/cCount;
    if(fe+cCount>=4&&Math.abs(ratioFeC-3)<=.35){
      result.type="Iron carbide / cementite-like Fe3C";
      result.confidence=Math.max(result.confidence,90);
      result.details.push("Fe:C approximately 3:1");
    }else if(carbonPercent<.1){
      result.type="Nearly pure iron";
      result.confidence=Math.max(result.confidence,82);
    }else if(carbonPercent<2.1){
      result.type="Carbon steel-like Fe-C";
      result.confidence=Math.max(result.confidence,86);
      result.details.push(carbonPercent.toFixed(2)+"% C in displayed atom set");
    }else{
      result.type="High-carbon / cast-iron-like Fe-C";
      result.confidence=Math.max(result.confidence,80);
      result.details.push(carbonPercent.toFixed(2)+"% C in displayed atom set");
    }
  }
  if(fe>0&&cr>0){
    const crPercent=100*cr/(fe+cr);
    if(crPercent>10){
      result.type=ni>0?"Stainless-steel-like Fe-Cr-Ni":"Stainless-steel-like Fe-Cr";
      result.confidence=Math.max(result.confidence,86);
      result.details.push(crPercent.toFixed(1)+"% Cr in displayed Fe-Cr set");
    }
  }

  const defectCounts={};
  for(const edit of edits||[])defectCounts[edit.type]=(defectCounts[edit.type]||0)+1;
  const defectTotal=Object.values(defectCounts).reduce((sum,value)=>sum+value,0);
  if(defectTotal){
    result.details.push("Defects: "+Object.entries(defectCounts).map(([key,value])=>key+":"+value).join(", "));
    result.confidence=Math.max(45,result.confidence-Math.min(10,defectTotal));
  }

  return result;
}


export function nearestSitesToPoint(sites,point,count,{activeOnly=true}={}){
  const target=point.map(Number);
  return (sites||[])
    .map((site,index)=>({site,index,distance:distance3(site.pos,target)}))
    .filter(item=>!activeOnly||item.site.active!==false)
    .sort((a,b)=>a.distance-b.distance||a.index-b.index)
    .slice(0,Math.max(0,Math.floor(count)||0));
}

export function periodicImageSites(sites,latticeVectors,{range=1,tolerance=1e-8}={}){
  const vectors=(latticeVectors||[])
    .map(vector=>vector.map(Number))
    .filter(vector=>vector.length===3&&Math.hypot(...vector)>tolerance);
  if(!vectors.length)return (sites||[]).map((site,index)=>({...site,pos:[...site.pos],sourceIndex:index,imageShift:[0,0,0]}));

  const shifts=[[0,0,0]];
  for(const vector of vectors){
    const prior=[...shifts];
    shifts.length=0;
    for(const base of prior){
      for(let n=-Math.max(0,Math.floor(range));n<=Math.max(0,Math.floor(range));n++){
        shifts.push([
          base[0]+n*vector[0],
          base[1]+n*vector[1],
          base[2]+n*vector[2]
        ]);
      }
    }
  }

  const output=[];
  const seen=new Set();
  const scale=1/Math.max(tolerance,1e-12);
  for(const [sourceIndex,site] of (sites||[]).entries()){
    if(!Array.isArray(site?.pos))continue;
    for(const shift of shifts){
      const pos=[
        Number(site.pos[0])+shift[0],
        Number(site.pos[1])+shift[1],
        Number(site.pos[2])+shift[2]
      ];
      const key=pos.map(value=>Math.round(value*scale)).join(",");
      if(seen.has(key))continue;
      seen.add(key);
      output.push({...site,pos,sourceIndex,imageShift:shift});
    }
  }
  return output;
}

function triangleNormal(a,b,c){
  const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];
  const ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
  return [
    ab[1]*ac[2]-ab[2]*ac[1],
    ab[2]*ac[0]-ab[0]*ac[2],
    ab[0]*ac[1]-ab[1]*ac[0]
  ];
}

function dot3(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}

export function convexHullTriangles(points,tolerance=1e-9){
  const pts=(points||[]).map(point=>point.map(Number));
  const faces=[];
  const seen=new Set();
  for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++)for(let k=j+1;k<pts.length;k++){
    const normal=triangleNormal(pts[i],pts[j],pts[k]);
    const length=Math.hypot(...normal);
    if(length<=tolerance)continue;
    const unit=normal.map(v=>v/length);
    const d=dot3(unit,pts[i]);
    let positive=false,negative=false;
    for(let p=0;p<pts.length;p++){
      if(p===i||p===j||p===k)continue;
      const side=dot3(unit,pts[p])-d;
      if(side>tolerance)positive=true;
      if(side<-tolerance)negative=true;
    }
    if(positive&&negative)continue;
    const key=[i,j,k].sort((a,b)=>a-b).join("-");
    if(seen.has(key))continue;
    seen.add(key);
    faces.push(positive?[i,k,j]:[i,j,k]);
  }
  return faces;
}

export function coordinationPolyhedron(sites,center,count,{distanceTolerance=.06}={}){
  const target=center.map(Number);
  const active=(sites||[])
    .map((site,index)=>({site,index,distance:distance3(site.pos,target)}))
    .filter(item=>item.site?.active!==false&&Number.isFinite(item.distance))
    .sort((a,b)=>a.distance-b.distance||a.index-b.index);
  const expected=Math.max(1,Math.floor(Number(count)||1));
  const nearest=active.slice(0,expected);
  const firstDistance=active[0]?.distance??Infinity;
  const shellLimit=firstDistance*(1+Math.max(0,Number(distanceTolerance)||0))+1e-10;
  const shellSize=active.filter(item=>item.distance<=shellLimit).length;
  const distances=nearest.map(item=>item.distance);
  const spread=distances.length?Math.max(...distances)-Math.min(...distances):Infinity;
  const allowedSpread=Number.isFinite(firstDistance)
    ?Math.max(1e-8,firstDistance*Math.max(0,Number(distanceTolerance)||0))
    :0;
  const points=nearest.map(item=>item.site.pos);
  const faces=convexHullTriangles(points);
  const valid=nearest.length===expected&&shellSize===expected&&spread<=allowedSpread&&faces.length>0;
  return {
    center:[...target],
    siteIndices:nearest.map(item=>item.index),
    sourceIndices:nearest.map(item=>item.site.sourceIndex??item.index),
    distances,
    shellSize,
    shellSpread:spread,
    valid,
    points,
    faces
  };
}

export function polyhedronEdges(faces){
  const edges=new Map();
  for(const face of faces||[]){
    for(let i=0;i<face.length;i++){
      const a=Number(face[i]),b=Number(face[(i+1)%face.length]);
      const key=a<b?`${a}:${b}`:`${b}:${a}`;
      if(!edges.has(key))edges.set(key,[Math.min(a,b),Math.max(a,b)]);
    }
  }
  return [...edges.values()];
}

export function interstitialVoidPolyhedron(polyhedron,{tolerance=1e-10}={}){
  if(!polyhedron?.valid||!Array.isArray(polyhedron.points)||polyhedron.points.length<4){
    return {valid:false,center:polyhedron?.center?[...polyhedron.center]:[0,0,0],points:[],faces:[],hostRadius:null,holeRadius:null};
  }
  const center=polyhedron.center.map(Number);
  const points=polyhedron.points.map(point=>point.map(Number));
  let nearestPair=Infinity;
  for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
    const d=distance3(points[i],points[j]);
    if(d>tolerance)nearestPair=Math.min(nearestPair,d);
  }
  const centerDistance=Math.min(...points.map(point=>distance3(point,center)));
  if(!Number.isFinite(nearestPair)||!Number.isFinite(centerDistance)){
    return {valid:false,center:[...center],points:[],faces:[],hostRadius:null,holeRadius:null};
  }

  // In a close-packed coordination shell the nearest host-host distance is
  // twice the touching host radius. The remaining radial gap is the
  // interstitial-hole radius (tetra: ~0.225 R, octa: ~0.414 R).
  const hostRadius=nearestPair/2;
  const holeRadius=centerDistance-hostRadius;
  if(!(holeRadius>tolerance)){
    return {valid:false,center:[...center],points:[],faces:[],hostRadius,holeRadius};
  }

  const voidPoints=points.map(point=>{
    const direction=[point[0]-center[0],point[1]-center[1],point[2]-center[2]];
    const length=Math.hypot(...direction);
    return [
      center[0]+direction[0]/length*holeRadius,
      center[1]+direction[1]/length*holeRadius,
      center[2]+direction[2]/length*holeRadius
    ];
  });
  const faces=convexHullTriangles(voidPoints);
  return {
    valid:faces.length>0,
    center:[...center],
    points:voidPoints,
    faces,
    hostRadius,
    holeRadius,
    radiusRatio:holeRadius/hostRadius
  };
}

export function contactTriangles(network){
  const contacts=network?.contacts||[];
  const adjacency=new Map();
  for(const {a,b} of contacts){
    if(!adjacency.has(a))adjacency.set(a,new Set());
    if(!adjacency.has(b))adjacency.set(b,new Set());
    adjacency.get(a).add(b);
    adjacency.get(b).add(a);
  }
  const triangles=[];
  const seen=new Set();
  for(const [a,neighbors] of adjacency){
    for(const b of neighbors){
      if(b<=a)continue;
      const bNeighbors=adjacency.get(b);
      if(!bNeighbors)continue;
      for(const c of neighbors){
        if(c<=b||!bNeighbors.has(c))continue;
        const key=`${a}:${b}:${c}`;
        if(!seen.has(key)){seen.add(key);triangles.push([a,b,c])}
      }
    }
  }
  return triangles;
}

export function pointPlaneDistance(point,normal,planePoint=[0,0,0]){
  const n=normal.map(Number);
  const length=Math.hypot(...n);
  if(length<=1e-12)throw new Error("Plane normal cannot be zero");
  const delta=[
    Number(point[0])-Number(planePoint[0]),
    Number(point[1])-Number(planePoint[1]),
    Number(point[2])-Number(planePoint[2])
  ];
  return Math.abs((delta[0]*n[0]+delta[1]*n[1]+delta[2]*n[2])/length);
}

export function sitesNearPlane(sites,plane,tolerance=.08){
  const limit=Math.max(0,Number(tolerance)||0);
  return (sites||[])
    .map((site,index)=>({
      index,site,
      distance:pointPlaneDistance(site.pos,plane.normal,plane.point)
    }))
    .filter(item=>item.site?.active!==false&&item.distance<=limit)
    .sort((a,b)=>a.distance-b.distance||a.index-b.index);
}

export function planeContactNetwork(sites,plane,tolerance=.08,{distanceTolerance=.10,duplicateTolerance=1e-8}={}){
  const near=sitesNearPlane(sites,plane,tolerance);
  const layer=[];
  for(const item of near){
    if(layer.some(existing=>distance3(existing.site.pos,item.site.pos)<=duplicateTolerance))continue;
    layer.push(item);
  }
  if(layer.length<2)return {siteIndices:layer.map(item=>item.index),contacts:[],nearestDistance:null};

  let nearestDistance=Infinity;
  const pairs=[];
  for(let i=0;i<layer.length;i++){
    for(let j=i+1;j<layer.length;j++){
      const distance=distance3(layer[i].site.pos,layer[j].site.pos);
      if(distance<=duplicateTolerance)continue;
      nearestDistance=Math.min(nearestDistance,distance);
      pairs.push({a:layer[i].index,b:layer[j].index,distance});
    }
  }
  if(!Number.isFinite(nearestDistance)){
    return {siteIndices:layer.map(item=>item.index),contacts:[],nearestDistance:null};
  }
  const maxDistance=nearestDistance*(1+Math.max(0,Number(distanceTolerance)||0));
  return {
    siteIndices:layer.map(item=>item.index),
    contacts:pairs.filter(pair=>pair.distance<=maxDistance+1e-12),
    nearestDistance
  };
}

function boxEdges(bounds){
  const min=bounds.min,max=bounds.max;
  const p=[
    [min[0],min[1],min[2]],[max[0],min[1],min[2]],[min[0],max[1],min[2]],[max[0],max[1],min[2]],
    [min[0],min[1],max[2]],[max[0],min[1],max[2]],[min[0],max[1],max[2]],[max[0],max[1],max[2]]
  ];
  const pairs=[[0,1],[0,2],[1,3],[2,3],[4,5],[4,6],[5,7],[6,7],[0,4],[1,5],[2,6],[3,7]];
  return pairs.map(([a,b])=>[p[a],p[b]]);
}

function uniquePoint(points,point,tolerance=1e-8){
  if(!points.some(existing=>distance3(existing,point)<=tolerance))points.push(point);
}

export function planeBoxPolygon(normal,point,bounds,tolerance=1e-9){
  const n=normal.map(Number),p0=point.map(Number);
  const length=Math.hypot(...n);
  if(length<=tolerance)throw new Error("Plane normal cannot be zero");
  const unit=n.map(v=>v/length);
  const d=dot3(unit,p0);
  const intersections=[];
  for(const [a,b] of boxEdges(bounds)){
    const da=dot3(unit,a)-d,db=dot3(unit,b)-d;
    if(Math.abs(da)<=tolerance)uniquePoint(intersections,a);
    if(Math.abs(db)<=tolerance)uniquePoint(intersections,b);
    if(da*db<0){
      const t=da/(da-db);
      uniquePoint(intersections,[
        a[0]+(b[0]-a[0])*t,
        a[1]+(b[1]-a[1])*t,
        a[2]+(b[2]-a[2])*t
      ]);
    }
  }
  if(intersections.length<3)return[];

  const center=intersections.reduce((sum,p)=>[sum[0]+p[0],sum[1]+p[1],sum[2]+p[2]],[0,0,0]).map(v=>v/intersections.length);
  const reference=Math.abs(unit[2])<.9?[0,0,1]:[0,1,0];
  let u=triangleNormal([0,0,0],unit,reference);
  const uLength=Math.hypot(...u);
  u=u.map(v=>v/uLength);
  const v=[
    unit[1]*u[2]-unit[2]*u[1],
    unit[2]*u[0]-unit[0]*u[2],
    unit[0]*u[1]-unit[1]*u[0]
  ];
  return intersections.sort((a,b)=>{
    const ar=[a[0]-center[0],a[1]-center[1],a[2]-center[2]];
    const br=[b[0]-center[0],b[1]-center[1],b[2]-center[2]];
    return Math.atan2(dot3(ar,v),dot3(ar,u))-Math.atan2(dot3(br,v),dot3(br,u));
  });
}
