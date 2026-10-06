export const CRYSTAL_STRUCTURES={
  Li:"bcc",Na:"bcc",K:"bcc",Rb:"bcc",Cs:"bcc",Fr:"bcc",
  Be:"hcp",Mg:"hcp",Ca:"fcc",Sr:"fcc",Ba:"bcc",Ra:"bcc",
  Sc:"hcp",Ti:"hcp",V:"bcc",Cr:"bcc",Mn:"bcc",Fe:"bcc",Co:"hcp",Ni:"fcc",
  Cu:"fcc",Zn:"hcp",Y:"hcp",Zr:"hcp",Nb:"bcc",Mo:"bcc",Tc:"hcp",Ru:"hcp",
  Rh:"fcc",Pd:"fcc",Ag:"fcc",Cd:"hcp",Hf:"hcp",Ta:"bcc",W:"bcc",Re:"hcp",
  Os:"hcp",Ir:"fcc",Pt:"fcc",Au:"fcc",Hg:"rhombohedral",Rf:"hcp",
  Al:"fcc",Ga:"orthorhombic",In:"tetragonal",Sn:"tetragonal",Tl:"hcp",Pb:"fcc",
  Si:"cubic",Ge:"cubic",C:"hexagonal",B:"rhombohedral",P:"molecular",S:"orthorhombic",
  Se:"hexagonal",Te:"hexagonal",As:"rhombohedral",Sb:"rhombohedral",Bi:"rhombohedral",
  H:"molecular",N:"molecular",O:"molecular",F:"molecular",Cl:"orthorhombic",
  Br:"orthorhombic",I:"orthorhombic",He:"hcp",Ne:"fcc",Ar:"fcc",Kr:"fcc",Xe:"fcc",Rn:"fcc"
};

export const PROPERTY_DEFINITIONS={
  atomic_mass:{label:"Atomic mass",unit:"u",digits:3},
  density:{label:"Density",unit:"g/cm³",digits:3},
  melt:{label:"Melting point",unit:"K",digits:1},
  boil:{label:"Boiling point",unit:"K",digits:1},
  electronegativity_pauling:{label:"Electronegativity",unit:"Pauling",digits:2},
  atomic_radius:{label:"Atomic radius",unit:"pm",digits:0},
  first_ionization:{label:"1st ionization energy",unit:"eV",digits:2},
  electron_affinity:{label:"Electron affinity",unit:"eV",digits:2}
};

export function stateAtTemperature(element,temperatureK){
  const t=Number(temperatureK);
  if(!Number.isFinite(t))return "unknown";
  const melt=Number(element.melt),boil=Number(element.boil);
  const hasMelt=Number.isFinite(melt),hasBoil=Number.isFinite(boil);
  if(!hasMelt)return "unknown";
  if(t<melt)return "solid";
  if(hasBoil&&t>=boil)return "gas";
  return hasBoil?"liquid":"unknown";
}

function inferCrystal(element){
  if(CRYSTAL_STRUCTURES[element.symbol])return CRYSTAL_STRUCTURES[element.symbol];
  const phase=String(element.phase||"").toLowerCase();
  const category=String(element.category||"").toLowerCase();
  if(phase==="gas")return "molecular";
  if(category.includes("noble gas"))return "fcc";
  if(category.includes("alkali metal"))return "bcc";
  if(category.includes("alkaline earth"))return "hcp";
  return "unknown";
}

export function enrichElement(element){
  const category=String(element.category||"unknown").toLowerCase();
  const crystal=element.crystal_structure||inferCrystal(element);
  const material=category.includes("metalloid")
    ?"metalloid"
    :category.includes("metal")
      ?"metal"
      :"nonmetal";
  const searchable=[
    element.name,element.symbol,element.number,category,element.phase,
    element.period,element.group,element.electron_configuration,
    crystal,material
  ].filter(value=>value!==null&&value!==undefined).join(" ").toLowerCase();
  return {...element,category,crystal_structure:crystal,material_tag:material,searchable};
}

export function filterElements(elements,{
  search="",
  category="all",
  phase="all",
  crystal="all",
  material="all",
  period="all",
  group="all",
  quick=""
}={}){
  const q=String(search).trim().toLowerCase();
  return elements.filter(element=>{
    const e=element.searchable?element:enrichElement(element);
    return (!q||e.searchable.includes(q))
      &&(category==="all"||e.category===category)
      &&(phase==="all"||String(e.phase||"unknown").toLowerCase()===phase)
      &&(crystal==="all"||e.crystal_structure===crystal)
      &&(material==="all"||e.material_tag===material)
      &&(period==="all"||String(e.period||"")===String(period))
      &&(group==="all"||String(e.group||"")===String(group))
      &&matchesQuickFilter(e,quick);
  });
}

export function propertyValue(element,key){
  if(key==="first_ionization")return element.ionization_energies?.[0]??null;
  if(key==="atomic_radius"){
    return element.atomic_radius
      ?? element.atomic_radii?.empirical?.[0]
      ?? element.atomic_radii?.calculated?.[0]
      ?? null;
  }
  return element[key]??null;
}

export function matchesQuickFilter(element,quick){
  if(!quick)return true;
  const e=element.searchable?element:enrichElement(element);
  if(quick==="metal")return e.material_tag==="metal";
  if(quick==="nonmetal")return e.material_tag==="nonmetal";
  if(quick==="stp-gas")return String(e.phase||"").toLowerCase()==="gas";
  if(quick==="bcc")return e.crystal_structure==="bcc";
  if(quick==="fcc")return e.crystal_structure==="fcc";
  if(quick==="radioactive")return Number(e.number)>=84;
  return true;
}

export function formattedProperty(element,key){
  const definition=PROPERTY_DEFINITIONS[key];
  if(!definition)return "—";
  const raw=propertyValue(element,key);
  const number=Number(raw);
  if(raw===null||raw===undefined||!Number.isFinite(number))return "—";
  return `${number.toFixed(definition.digits)}${definition.unit?` ${definition.unit}`:""}`;
}

export function uniqueValues(elements,key,{numeric=false}={}){
  const values=[...new Set(elements
    .map(element=>element[key])
    .filter(value=>value!==null&&value!==undefined&&value!==""))];
  return values.sort(numeric?(a,b)=>Number(a)-Number(b):(a,b)=>String(a).localeCompare(String(b)));
}

export function categories(elements){
  return uniqueValues(elements,"category");
}
