export const CRYSTAL_TYPES={
  bcc:{
    id:"bcc",name:"Body-centred cubic",short:"BCC",
    equivalentAtoms:2,coordinationNumber:8,
    description:"Eight corner sites plus one body-centre site in the conventional cubic cell.",
    points:[
      [0,0,0],[1,0,0],[0,1,0],[1,1,0],
      [0,0,1],[1,0,1],[0,1,1],[1,1,1],
      [.5,.5,.5]
    ],
    cell:"cubic"
  },
  fcc:{
    id:"fcc",name:"Face-centred cubic",short:"FCC",
    equivalentAtoms:4,coordinationNumber:12,
    description:"Eight corner sites plus one site at the centre of each cube face.",
    points:[
      [0,0,0],[1,0,0],[0,1,0],[1,1,0],
      [0,0,1],[1,0,1],[0,1,1],[1,1,1],
      [.5,.5,0],[.5,.5,1],[.5,0,.5],[.5,1,.5],[0,.5,.5],[1,.5,.5]
    ],
    cell:"cubic"
  },
  hcp:{
    id:"hcp",name:"Hexagonal close-packed",short:"HCP",
    equivalentAtoms:6,coordinationNumber:12,
    description:"Representative conventional HCP prism with AB stacking.",
    points:[
      [1,0,0],[.5,.8660254,0],[-.5,.8660254,0],[-1,0,0],[-.5,-.8660254,0],[.5,-.8660254,0],
      [1,0,1],[.5,.8660254,1],[-.5,.8660254,1],[-1,0,1],[-.5,-.8660254,1],[.5,-.8660254,1],
      [0,0,0],[0,0,1],
      [.5,.2886751,.5],[-.5,.2886751,.5],[0,-.5773503,.5]
    ],
    cell:"hexagonal",
    idealCA:Math.sqrt(8/3)
  }
};

export function crystalType(id){
  return CRYSTAL_TYPES[id]||null;
}

export function listCrystalTypes(){
  return Object.values(CRYSTAL_TYPES);
}

export function cellEdges(id){
  const crystal=crystalType(id);
  if(!crystal)return [];
  if(crystal.cell==="cubic"){
    const p=[[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]];
    const pairs=[[0,1],[0,2],[1,3],[2,3],[4,5],[4,6],[5,7],[6,7],[0,4],[1,5],[2,6],[3,7]];
    return pairs.map(([a,b])=>[p[a],p[b]]);
  }
  const bottom=CRYSTAL_TYPES.hcp.points.slice(0,6);
  const top=CRYSTAL_TYPES.hcp.points.slice(6,12);
  const edges=[];
  for(let i=0;i<6;i++){
    edges.push([bottom[i],bottom[(i+1)%6]]);
    edges.push([top[i],top[(i+1)%6]]);
    edges.push([bottom[i],top[i]]);
  }
  return edges;
}

export function scaledPoints(id,{a=1,c=null}={}){
  const crystal=crystalType(id);
  if(!crystal)throw new Error(`Unknown crystal structure: ${id}`);
  const cz=crystal.cell==="hexagonal"?(c??a*(crystal.idealCA||1)):a;
  return crystal.points.map(([x,y,z])=>[x*a,y*a,z*cz]);
}
