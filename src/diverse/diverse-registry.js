export const DIVERSE_MODULES=[
  {
    id:"diving",
    title:"Dykkekart",
    short:"DIVE",
    route:"/diverse/diving",
    status:"native",
    access:"public",
    category:"Outdoor",
    summary:"Kart, dykkesteder, vrak, dybde, fauna, adkomst, farer og kildeproveniens.",
    legacyUrl:null,
    storage:"local",
    sync:"optional-account"
  },
  {
    id:"brewing",
    title:"Brygging",
    short:"BREW",
    route:null,
    status:"migration",
    access:"optional",
    category:"Data",
    summary:"Hydrometerdata, bryggelogger, oppskrifter og gjæringsanalyse bygges om til shared v2 UI.",
    legacyUrl:"https://tormt.folk.ntnu.no/diverse/Brygging/",
    storage:"local",
    sync:"optional-account"
  },
  {
    id:"njord",
    title:"Njord",
    short:"CAD",
    route:"/engineering",
    status:"superseded",
    access:"public",
    category:"Engineering",
    summary:"CAD- og hydrostatikkfunksjoner flyttes inn i Engineering Workspace i stedet for å leve som egen mini-app.",
    legacyUrl:"https://tormt.folk.ntnu.no/diverse/Njord/",
    storage:"local",
    sync:"optional-account"
  },
  {
    id:"sandalen",
    title:"Sandalen Gård",
    short:"SG",
    route:null,
    status:"migration",
    access:"optional",
    category:"Operations",
    summary:"Bygges om til native v2-modul slik at theme, dataflyt og eventuell konto deles med resten av siden.",
    legacyUrl:"https://tormt.folk.ntnu.no/diverse/SandalenG%C3%A5rd/",
    storage:"local",
    sync:"optional-account"
  },
  {
    id:"medisin",
    title:"MedisinTimer",
    short:"TIME",
    route:null,
    status:"migration",
    access:"optional",
    category:"Utility",
    summary:"Timer- og historikkfunksjoner migreres til felles v2-komponenter og sentral lagring/session-grense.",
    legacyUrl:"https://tormt.folk.ntnu.no/diverse/MedisinTimer/",
    storage:"local",
    sync:"optional-account"
  },
  {
    id:"laos",
    title:"LAOS",
    short:"LAOS",
    route:null,
    status:"review",
    access:"public",
    category:"Archive",
    summary:"Legacy-funksjonene gjennomgås før vi avgjør om de skal migreres, slås sammen med en annen modul eller pensjoneres.",
    legacyUrl:"https://tormt.folk.ntnu.no/diverse/LAOS/",
    storage:"local",
    sync:"none"
  },
  {
    id:"andrekok",
    title:"AndreKokSider",
    short:"KOK",
    route:null,
    status:"review",
    access:"public",
    category:"Study",
    summary:"Gjennomgås mot v2-regelen om at Kok/studieinnhold skal høre hjemme under Courses fremfor Diverse.",
    legacyUrl:"https://tormt.folk.ntnu.no/diverse/AndreKokSider/",
    storage:"local",
    sync:"none"
  }
];

export function diverseModule(id){
  return DIVERSE_MODULES.find(module=>module.id===id)||null;
}

export function nativeDiverseModules(){
  return DIVERSE_MODULES.filter(module=>module.route);
}
