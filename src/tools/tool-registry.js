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
    summary:"Local periodic-table data with search, filtering, crystal metadata and temperature-dependent phase.",
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
    summary:"Reference-grade thermophysical properties using the local CoolProp WASM engine.",
    keywords:["coolprop","thermodynamics","fluid","properties","process","batch","diagram"]
  },
  {
    id:"crystal",
    title:"Crystal structures",
    short:"3D",
    route:"/tools/crystal",
    status:"prototype",
    parity:"partial",
    legacyUrl:"https://tormt.folk.ntnu.no/Tools/KrystallStrukturer/krystall-viewer.html",
    category:"Chemistry",
    summary:"Shared Three.js crystal viewer. Advanced legacy structure editing and analysis remain available during migration.",
    keywords:["crystal","bcc","fcc","hcp","diamond","nacl","measurement","polyhedra","dopant","vacancy"]
  },
  {
    id:"chemdraw",
    title:"Chemical structure editor",
    short:"CH",
    route:null,
    status:"legacy",
    parity:"partial",
    legacyUrl:"https://tormt.folk.ntnu.no/Tools/ChemDraw.html",
    category:"Chemistry",
    summary:"Legacy chemical editor retained until New/Import/MOL/SMILES/Undo/Redo/Clean 2D parity exists in v2.",
    keywords:["chemistry","molecule","mol","smiles","structure","editor"]
  },
  {
    id:"stl-advanced",
    title:"Advanced STL engineering viewer",
    short:"STL",
    route:null,
    status:"legacy",
    parity:"partial",
    legacyUrl:"https://tormt.folk.ntnu.no/Tools/stlview1.html",
    category:"Engineering",
    summary:"Legacy advanced STL/hydro viewer retained while v2 Model/Engineering absorbs its measurement, alignment, CG/CB, hydro and export tools.",
    keywords:["stl","3d","hydro","measure","cg","cb","waterline","trim","heel","alignment"]
  },
  {
    id:"theme-creator",
    title:"Theme creator",
    short:"TH",
    route:null,
    status:"legacy",
    parity:"partial",
    legacyUrl:"https://tormt.folk.ntnu.no/Tools/theme-creator.html",
    category:"Developer",
    summary:"Legacy theme CSS/JS generator retained until equivalent Settings/developer tooling exists.",
    keywords:["theme","css","colors","settings","developer"]
  },
  {
    id:"image-theme",
    title:"Image to theme",
    short:"IMG",
    route:null,
    status:"legacy",
    parity:"partial",
    legacyUrl:"https://tormt.folk.ntnu.no/Tools/image-to-theme.html",
    category:"Developer",
    summary:"Legacy image palette extraction, auto-assignment, preview and JSON/CSS/JS export retained.",
    keywords:["image","theme","palette","colors","json","css","export"]
  }
];

export function activeTools(){
  return TOOL_REGISTRY.filter(tool=>tool.route&&tool.status!=="planned");
}

export function visibleTools(){
  return TOOL_REGISTRY.filter(tool=>tool.route||tool.legacyUrl);
}

export function toolById(id){
  return TOOL_REGISTRY.find(tool=>tool.id===id)||null;
}

export function toolParityComplete(tool){
  return Boolean(tool)&&tool.parity==="full";
}

export function toolsNeedingParityReview(){
  return TOOL_REGISTRY.filter(tool=>tool.parity!=="full");
}
