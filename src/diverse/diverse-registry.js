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
    sync:"site-google-session"
  },
  {
    id:"brewing",
    title:"Brygging",
    short:"BREW",
    route:"/diverse/brewing",
    status:"native",
    access:"optional",
    category:"Data",
    summary:"Native v2 Brewing UI for hydrometerdata, bryggelogger, oppskrifter og gjæringsanalyse. Google Drive reuses the site-level account session.",
    legacyUrl:"https://tormt.folk.ntnu.no/diverse/Brygging/",
    storage:"local+google-drive",
    sync:"site-google-session"
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
    route:"/diverse/sandalen",
    status:"migration",
    access:"optional",
    category:"Operations",
    summary:"Native v2-hub for Sandalen-lenkene med SandalenTools bevart in-view til selve verktøyet har full v2-paritet.",
    legacyUrl:"https://tormt.folk.ntnu.no/diverse/SandalenG%C3%A5rd/",
    storage:"local",
    sync:"optional-account"
  },
  {
    id:"matpris",
    title:"Matprissøk",
    short:"PRICE",
    route:"/diverse/matpris",
    status:"migration",
    access:"public",
    category:"Utility",
    summary:"Rekonstruert native v2-klient for Kassalapp-søk, EAN-basert butikkprissammenligning og lokal handleliste; API-nøkkelen ligger kun i serverproxyen.",
    legacyUrl:null,
    storage:"local+server-proxy",
    sync:"none"
  },
  {
    id:"leseravnen",
    title:"LeseRavnen demo",
    short:"READ",
    route:null,
    status:"preserved",
    access:"public",
    category:"Prototype",
    summary:"Fullskjerm testdemo for leseglede, fokus og progresjon. Demoen skal forbli stabil og datainnsamlingen urørt mens videre utvikling skjer separat.",
    legacyUrl:"https://tormt.folk.ntnu.no/diverse/LeseRavnen-v0.9.0-demo/",
    storage:"legacy-app",
    sync:"separate-demo"
  },
  {
    id:"medisin",
    title:"MedisinTimer",
    short:"TIME",
    route:"/diverse/medisin",
    status:"migration",
    access:"optional",
    category:"Utility",
    summary:"Native v2-timere, dosehistorikk og nivåkurver med lokal + Google Drive-synk. Legacy kalkulatorer og delingskoder er bevart separat til paritet er bekreftet.",
    legacyUrl:"https://tormt.folk.ntnu.no/diverse/MedisinTimer/",
    storage:"local+google-drive",
    sync:"site-google-session"
  },
  {
    id:"laos",
    title:"LAOS",
    short:"LAOS",
    route:"/diverse/laos",
    status:"migration",
    access:"public",
    category:"Archive",
    summary:"Eksisterende øvingsvisning er tilgjengelig gjennom v2 mens filinnholdet kartlegges til felles Courses-modell.",
    legacyUrl:"https://tormt.folk.ntnu.no/diverse/LAOS/",
    storage:"local",
    sync:"none"
  },
  {
    id:"andrekok",
    title:"AndreKokSider",
    short:"KOK",
    route:"/diverse/andrekok",
    status:"migration",
    access:"public",
    category:"Study",
    summary:"Eksisterende koksider, sortering og filtre er bevart gjennom v2 mens katalogen flyttes mot felles studieflate.",
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
