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
    summary:"Ekstern fullskjerm-demo for leseglede, fokus og progresjon. Åpnes direkte på GitHub Pages; testdata og apputvikling holdes helt adskilt fra FolkNettside v2.",
    legacyUrl:null,
    externalUrl:"https://tormt.github.io/LeseRavnen/",
    storage:"separate-external-demo",
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
    status:"native",
    access:"public",
    category:"Archive",
    summary:"Alle tre originale LAOS-PDF-ene er overført til v2, med filintegritetstest og Courses-ressurser i samme oversikt.",
    legacyUrl:null,
    storage:"repository-files",
    sync:"none"
  },
  {
    id:"andrekok",
    title:"AndreKokSider",
    short:"KOK",
    route:"/diverse/andrekok",
    status:"native",
    access:"public",
    category:"Study",
    summary:"29 studentnettsider fra originalkatalogen med studie, spesialisering, årskull, rating, søk og sortering.",
    legacyUrl:null,
    storage:"versioned-catalog",
    sync:"none"
  }
];

export function diverseModule(id){
  return DIVERSE_MODULES.find(module=>module.id===id)||null;
}

export function nativeDiverseModules(){
  return DIVERSE_MODULES.filter(module=>module.route);
}
