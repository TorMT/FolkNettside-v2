export const TOOL_REGISTRY=[
  {
    id:"python-workbench",
    title:"Python workbench",
    short:"PY",
    route:"/tools/python",
    status:"prototype",
    parity:"partial",
    legacyUrl:"https://tormt.folk.ntnu.no/includes/kodeLesere/pyview.html",
    category:"Developer",
    summary:"Edit and run Python in an isolated Worker, with printed output, plots, Stop, Reset and script export.",
    keywords:["python","pyodide","notebook","code","run","editor","plot"]
  },
  {
    id:"fluid",
    title:"Fluid properties",
    short:"FL",
    route:"/tools/fluid",
    status:"full",
    parity:"full",
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
    status:"full",
    parity:"full",
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
    status:"full",
    parity:"full",
    legacyUrl:"https://tormt.folk.ntnu.no/Tools/Coolprop/CoolPropForbedretKanksje2.html",
    category:"Engineering",
    summary:"Reference-grade thermophysical properties with local CoolProp WASM, fluid-specific course tables, Air/Ammonia reference handling, process tools and verified thermodynamic diagrams.",
    keywords:["coolprop","thermodynamics","fluid","properties","process","batch","diagram"]
  },
  {
    id:"crystal",
    title:"Crystal structures",
    short:"3D",
    route:"/tools/crystal",
    status:"full",
    parity:"full",
    legacyUrl:"https://tormt.folk.ntnu.no/Tools/KrystallStrukturer/krystall-viewer.html",
    category:"Chemistry",
    summary:"Shared Three.js crystal editor with browser-verified legacy parity plus coordination polyhedra, planes and analysis.",
    keywords:["crystal","bcc","fcc","hcp","diamond","nacl","measurement","polyhedra","dopant","vacancy"]
  },
  {
    id:"chemdraw",
    title:"Chemical structure editor",
    short:"CH",
    route:"/tools/chemistry-editor",
    status:"full",
    parity:"full",
    legacyUrl:"https://tormt.folk.ntnu.no/Tools/ChemDraw.html",
    category:"Chemistry",
    summary:"Lazy Kekule molecule editor with New/Import, MOL/SMILES export, Undo/Redo, Clean 2D and Copy SMILES.",
    keywords:["chemistry","molecule","mol","smiles","structure","editor"]
  },
  {
    id:"stl-advanced",
    title:"Advanced model inspector",
    short:"STL",
    route:"/tools/model-inspector",
    status:"full",
    parity:"full",
    legacyUrl:"https://tormt.folk.ntnu.no/Tools/stlview1.html",
    category:"Engineering",
    summary:"Shared STL/3MF inspector with camera, alignment, measurement, CG/CB, waterline hydro checks and PNG export.",
    keywords:["stl","3d","hydro","measure","cg","cb","waterline","trim","heel","alignment"]
  },
  {
    id:"theme-creator",
    title:"Theme creator",
    short:"TH",
    route:"/settings/theme-studio/manual",
    status:"full",
    parity:"full",
    legacyUrl:"https://tormt.folk.ntnu.no/Tools/theme-creator.html",
    category:"Developer",
    summary:"Manual theme authoring migrated into Settings-owned Theme Studio with CSS/JS export and live preview.",
    keywords:["theme","css","colors","settings","developer"]
  },
  {
    id:"image-theme",
    title:"Image to theme",
    short:"IMG",
    route:"/settings/theme-studio/image",
    status:"full",
    parity:"full",
    legacyUrl:"https://tormt.folk.ntnu.no/Tools/image-to-theme.html",
    category:"Developer",
    summary:"Browser-verified image palette extraction, role assignment, auto-assign, live preview and JSON/CSS/JS export in Theme Studio.",
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
