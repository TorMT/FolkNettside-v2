const CRYSTAL={
  H:"molecular",He:"hcp",C:"hexagonal",N:"molecular",O:"molecular",
  Na:"bcc",Mg:"hcp",Al:"fcc",Si:"cubic",Cl:"orthorhombic",
  Fe:"bcc",Cu:"fcc"
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

export function enrichElement(element){
  const category=String(element.category||"unknown").toLowerCase();
  const crystal=element.crystal_structure||CRYSTAL[element.symbol]||
    (String(element.phase||"").toLowerCase()==="gas"?"molecular":"unknown");
  const material=category.includes("metalloid")?"metalloid":category.includes("metal")?"metal":"nonmetal";
  const searchable=[
    element.name,element.symbol,element.number,category,element.phase,
    element.electron_configuration,crystal,material
  ].filter(Boolean).join(" ").toLowerCase();
  return {...element,category,crystal_structure:crystal,material_tag:material,searchable};
}

export function filterElements(elements,{
  search="",
  category="all",
  phase="all",
  crystal="all",
  material="all"
}={}){
  const q=String(search).trim().toLowerCase();
  return elements.filter(element=>{
    const e=element.searchable?element:enrichElement(element);
    return (!q||e.searchable.includes(q))
      &&(category==="all"||e.category===category)
      &&(phase==="all"||String(e.phase||"unknown").toLowerCase()===phase)
      &&(crystal==="all"||e.crystal_structure===crystal)
      &&(material==="all"||e.material_tag===material);
  });
}

export function propertyValue(element,key){
  if(key==="first_ionization")return element.ionization_energies?.[0]??null;
  return element[key]??null;
}

export function categories(elements){
  return [...new Set(elements.map(element=>(element.category||"unknown").toLowerCase()))].sort();
}
