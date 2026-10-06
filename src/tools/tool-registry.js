export const TOOL_REGISTRY=[
  {
    id:"fluid",
    title:"Fluid properties",
    short:"FL",
    route:"/tools/fluid",
    status:"prototype",
    parity:"review",
    legacyUrl:"https://tormt.folk.ntnu.no/Tools/FluidKalkulator.html",
    category:"Engineering",
    summary:"Legacy polynomial estimates with density, viscosity, heat capacity, conductivity and derived properties.",
    keywords:["fluid","properties","density","viscosity","Prandtl","thermal","air","water"]
  },
  {
    id:"periodic",
    title:"Periodic table",
    short:"PT",
    route:"/tools/periodic",
    status:"prototype",
    parity:"review",
    legacyUrl:"https://tormt.folk.ntnu.no/Tools/PeriodicTable/periodic-table.html",
    category:"Chemistry",
    summary:"Searchable local periodic-table dataset with filtering, crystal structures and temperature-dependent phase.",
    keywords:["periodic","elements","chemistry","crystal","atomic","material"]
  },
  {
    id:"coolprop",
    title:"CoolProp",
    short:"CP",
    route:"/tools/coolprop",
    status:"prototype",
    parity:"partial",
    legacyUrl:"https://tormt.folk.ntnu.no/Tools/Coolprop/CoolPropForbedretKanksje2.html",
    category:"Engineering",
    summary:"Reference-grade thermophysical properties.",
    keywords:["coolprop","thermodynamics","fluid","properties"]
  },
  {
    id:"crystal",
    title:"Crystal structures",
    short:"3D",
    route:"/tools/crystal",
    status:"prototype",
    parity:"review",
    legacyUrl:null,
    category:"Chemistry",
    summary:"Reusable 3D crystallography viewer built on the shared model renderer.",
    keywords:["crystal","bcc","fcc","hcp","lattice","3d"]
  }
];

export function activeTools(){
  return TOOL_REGISTRY.filter(tool=>tool.route&&tool.status!=="planned");
}

export function toolById(id){
  return TOOL_REGISTRY.find(tool=>tool.id===id)||null;
}


export function toolParityComplete(tool){
  return Boolean(tool)&&tool.parity==="full";
}

export function toolsNeedingParityReview(){
  return TOOL_REGISTRY.filter(tool=>tool.route&&tool.parity!=="full");
}
