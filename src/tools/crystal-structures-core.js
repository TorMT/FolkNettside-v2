const SQRT3=Math.sqrt(3);

const cubeCorners=[
  [0,0,0],[1,0,0],[0,1,0],[0,0,1],
  [1,1,0],[1,0,1],[0,1,1],[1,1,1]
];
const fccFaces=[
  [.5,.5,0],[.5,.5,1],[.5,0,.5],[.5,1,.5],[0,.5,.5],[1,.5,.5]
];

function sites(points,species="A"){
  return points.map(pos=>({pos,species}));
}

export const CRYSTAL_TYPES={
  sc:{
    id:"sc",name:"Simple cubic",short:"SC",cell:"cubic",
    equivalentAtoms:1,coordinationNumber:6,
    description:"Simple cubic conventional cell, matching the legacy teaching viewer.",
    sites:sites(cubeCorners)
  },
  bcc:{
    id:"bcc",name:"Body-centred cubic",short:"BCC",cell:"cubic",
    equivalentAtoms:2,coordinationNumber:8,
    description:"Eight corner sites plus one body-centre site.",
    sites:[...sites(cubeCorners),{pos:[.5,.5,.5],species:"A"}]
  },
  fcc:{
    id:"fcc",name:"Face-centred cubic",short:"FCC",cell:"cubic",
    equivalentAtoms:4,coordinationNumber:12,
    description:"Eight corner sites plus six face-centre sites.",
    sites:[...sites(cubeCorners),...sites(fccFaces)]
  },
  diamond:{
    id:"diamond",name:"Diamond cubic",short:"Diamond",cell:"cubic",
    equivalentAtoms:8,coordinationNumber:4,
    description:"FCC framework with the tetrahedral basis used by the legacy viewer.",
    sites:[
      ...sites(cubeCorners),...sites(fccFaces),
      ...sites([[.25,.25,.25],[.25,.75,.75],[.75,.25,.75],[.75,.75,.25]])
    ]
  },
  hcp:{
    id:"hcp",name:"Hexagonal close-packed",short:"HCP",cell:"hexagonal",
    equivalentAtoms:6,coordinationNumber:12,idealCA:Math.sqrt(8/3),
    description:"Representative conventional HCP prism with ideal c/a by default.",
    sites:sites([
      [1,0,0],[.5,.8660254,0],[-.5,.8660254,0],[-1,0,0],[-.5,-.8660254,0],[.5,-.8660254,0],
      [1,0,1],[.5,.8660254,1],[-.5,.8660254,1],[-1,0,1],[-.5,-.8660254,1],[.5,-.8660254,1],
      [0,0,0],[0,0,1],
      [.5,.2886751,.5],[-.5,.2886751,.5],[0,-.5773503,.5]
    ])
  },
  nacl:{
    id:"nacl",name:"Rock salt",short:"NaCl",cell:"cubic",
    equivalentAtoms:8,coordinationNumber:6,
    description:"Two interpenetrating FCC-type sublattices using the legacy basis.",
    sites:[
      ...sites([[0,0,0],[.5,.5,0],[.5,0,.5],[0,.5,.5]],"A"),
      ...sites([[.5,0,0],[0,.5,0],[0,0,.5],[.5,.5,.5]],"B")
    ]
  },
  cscl:{
    id:"cscl",name:"Cesium chloride",short:"CsCl",cell:"cubic",
    equivalentAtoms:2,coordinationNumber:8,
    description:"Simple-cubic A lattice with B at the body centre.",
    sites:[{pos:[0,0,0],species:"A"},{pos:[.5,.5,.5],species:"B"}]
  },
  zns:{
    id:"zns",name:"Zinc blende",short:"ZnS",cell:"cubic",
    equivalentAtoms:8,coordinationNumber:4,
    description:"FCC A sublattice with tetrahedral B basis used by the legacy viewer.",
    sites:[
      ...sites([[0,0,0],[.5,.5,0],[.5,0,.5],[0,.5,.5]],"A"),
      ...sites([[.25,.25,.25],[.75,.75,.25],[.75,.25,.75],[.25,.75,.75]],"B")
    ]
  },
  caf2:{
    id:"caf2",name:"Fluorite",short:"CaF₂",cell:"cubic",
    equivalentAtoms:12,coordinationNumber:8,
    description:"FCC A sublattice with eight tetrahedral B sites.",
    sites:[
      ...sites([[0,0,0],[.5,.5,0],[.5,0,.5],[0,.5,.5]],"A"),
      ...sites([
        [.25,.25,.25],[.75,.75,.25],[.75,.25,.75],[.25,.75,.75],
        [.75,.75,.75],[.25,.25,.75],[.25,.75,.25],[.75,.25,.25]
      ],"B")
    ]
  },
  spinel:{
    id:"spinel",name:"Spinel (simplified)",short:"Spinel",cell:"cubic",
    equivalentAtoms:null,coordinationNumber:null,
    description:"Simplified pedagogical spinel retained from the legacy viewer; not a full crystallographic spinel cell.",
    sites:[
      ...sites([...cubeCorners,...fccFaces],"O"),
      ...sites([[.125,.125,.125],[.125,.625,.625],[.625,.125,.625],[.625,.625,.125]],"A"),
      {pos:[.5,.5,.5],species:"B"}
    ]
  }
};

export const CRYSTAL_PRESETS={
  Na:{label:"Na",structure:"sc",species:{A:"Na"}},
  Fe:{label:"Fe",structure:"bcc",species:{A:"Fe"}},
  Cu:{label:"Cu",structure:"fcc",species:{A:"Cu"}},
  Al:{label:"Al",structure:"fcc",species:{A:"Al"}},
  Ni:{label:"Ni",structure:"fcc",species:{A:"Ni"}},
  Si:{label:"Si",structure:"diamond",species:{A:"Si"}},
  C:{label:"C",structure:"diamond",species:{A:"C"}},
  MgAl2O4:{label:"MgAl₂O₄",structure:"spinel",species:{A:"Mg",B:"Al",O:"O"}},
  Fe3O4:{label:"Fe₃O₄",structure:"spinel",species:{A:"Fe",B:"Fe",O:"O"}}
};

export function crystalType(id){
  return CRYSTAL_TYPES[id]||null;
}

export function crystalPreset(id){
  return CRYSTAL_PRESETS[id]||null;
}

export function listCrystalTypes(){
  return Object.values(CRYSTAL_TYPES);
}

export function listCrystalPresets(){
  return Object.entries(CRYSTAL_PRESETS).map(([id,value])=>({id,...value}));
}

export function cellEdges(id){
  const crystal=crystalType(id);
  if(!crystal)return [];
  if(crystal.cell==="cubic"){
    const p=cubeCorners;
    const pairs=[[0,1],[0,2],[1,4],[2,4],[3,5],[3,6],[5,7],[6,7],[0,3],[1,5],[2,6],[4,7]];
    return pairs.map(([a,b])=>[p[a],p[b]]);
  }
  const base=[
    [1,0,0],[.5,SQRT3/2,0],[-.5,SQRT3/2,0],[-1,0,0],[-.5,-SQRT3/2,0],[.5,-SQRT3/2,0]
  ];
  const top=base.map(([x,y])=>[x,y,1]);
  const edges=[];
  for(let i=0;i<6;i++){
    edges.push([base[i],base[(i+1)%6]]);
    edges.push([top[i],top[(i+1)%6]]);
    edges.push([base[i],top[i]]);
  }
  return edges;
}

function key(site,tolerance=1e-7){
  const p=site.pos.map(value=>Math.round(value/tolerance));
  return site.species+"|"+p.join(",");
}

export function replicateCrystal(id,{nx=1,ny=1,nz=1,a=1,c=null,preset=null}={}){
  const crystal=crystalType(id);
  if(!crystal)throw new Error(`Unknown crystal structure: ${id}`);
  nx=Math.max(1,Math.floor(Number(nx)||1));
  ny=Math.max(1,Math.floor(Number(ny)||1));
  nz=Math.max(1,Math.floor(Number(nz)||1));
  const presetData=preset?crystalPreset(preset):null;
  const speciesMap=presetData?.species||{};
  const output=[];
  const seen=new Set();

  if(crystal.cell==="hexagonal"){
    const cz=c??a*(crystal.idealCA||1);
    for(let ix=0;ix<nx;ix++)for(let iy=0;iy<ny;iy++)for(let iz=0;iz<nz;iz++){
      const offset=[ix*1.5*a,iz*SQRT3*a+(ix%2)*(SQRT3*a/2),iy*cz];
      for(const site of crystal.sites){
        const pos=[site.pos[0]*a+offset[0],site.pos[1]*a+offset[1],site.pos[2]*cz+offset[2]];
        const item={pos,species:speciesMap[site.species]||site.species};
        const k=key(item);
        if(!seen.has(k)){seen.add(k);output.push(item)}
      }
    }
    return output;
  }

  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++)for(let k=0;k<nz;k++){
    for(const site of crystal.sites){
      const item={
        pos:[(i+site.pos[0])*a,(j+site.pos[1])*a,(k+site.pos[2])*a],
        species:speciesMap[site.species]||site.species
      };
      const idKey=key(item);
      if(!seen.has(idKey)){seen.add(idKey);output.push(item)}
    }
  }
  return output;
}

export function scaledPoints(id,options={}){
  return replicateCrystal(id,{...options,nx:1,ny:1,nz:1}).map(site=>site.pos);
}

export function idealHoleCenters(id){
  if(["fcc","diamond","nacl","zns","caf2","spinel"].includes(id)){
    return {
      tetra:[
        [.25,.25,.25],[.25,.25,.75],[.25,.75,.25],[.25,.75,.75],
        [.75,.25,.25],[.75,.25,.75],[.75,.75,.25],[.75,.75,.75]
      ],
      octa:[
        [.5,.5,.5],[.5,0,0],[.5,1,0],[.5,0,1],[.5,1,1],
        [0,.5,0],[1,.5,0],[0,.5,1],[1,.5,1],
        [0,0,.5],[1,0,.5],[0,1,.5],[1,1,.5]
      ]
    };
  }
  if(id==="sc")return {tetra:[],octa:[[.5,.5,.5]]};
  if(id==="bcc")return {
    tetra:[
      [.5,.25,0],[.5,.75,0],[.25,.5,0],[.75,.5,0],
      [.5,.25,1],[.5,.75,1],[.25,.5,1],[.75,.5,1],
      [0,.5,.25],[0,.5,.75],[1,.5,.25],[1,.5,.75]
    ],
    octa:[]
  };
  if(id==="hcp"){
    return {
      tetra:[
        [.5,Math.sqrt(3)/3,.25],
        [.5,2*Math.sqrt(3)/3,.75]
      ],
      octa:[[.5,Math.sqrt(3)/2,.5]]
    };
  }
  return {tetra:[],octa:[]};
}

export function distance3(a,b){
  return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
}
