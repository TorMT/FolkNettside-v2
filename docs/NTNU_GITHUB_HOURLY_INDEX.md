# GitHub Pages som V2, NTNU som fillager — automatisk indeks

**Status:** Utviklingsfunksjon, 13.10.2026. V1 og NTNUs index.html er uendret.

## Arkitektur

NTNUs offentlige fagemapper har Apache directory listing. I stedet for å
kjøre et script på montert webedit, bruker vi GitHub Actions:

1. Hver time (cron 17 * * * *) leser crawleren bare offentlige
   semesterindekser og kataloglistinger under eksplisitt godkjente fag.
2. Den oppdager nye filnavn i filer/ og quiz/, inkludert nestede mapper,
   uten å laste ned filenes innhold.
3. GitHub Actions lagrer bare URL-referanser i
   data/ntnu-autocatalog.json og lager commit kun hvis noe har endret seg.
4. Workflowen utløser eksplisitt Pages-publisering. Et commit fra
   GITHUB_TOKEN starter ikke en vanlig push-workflow automatisk.
5. GitHub Pages leser den nye katalogen, mens NTNU fortsatt lagrer alt.

Kilder til kontroll: config/ntnu-public-courses.json er en gjennomgått
liste over 24 offentlig deklarerte fag, inkludert tre opprinnelig tomme\nsemester 5-fag. **Alle 32 eksisterende offentlige `filer/`- og `quiz/`-mapper\ner nå inkludert.** Hver kjøring kontrollerer på nytt
at fag er markert beskyttet:false. Den følger ingen private mapper,
symbolske lenker eller tredjepartsdomener og nekter å erstatte katalogen
ved utilgjengelige mapper eller uforklarlige større filreduksjoner.

**Ved nye filer i et godkjent offentlig fag:** Bare legg filen i
filer/ eller quiz/. Ingen manuell indeksredigering er nødvendig.
**Ved nytt fag:** Legg det til i den gjennomgåtte tillatelseslisten
etter at fagets publisering er godkjent.

Kjøringen kan startes manuelt fra GitHub Actions →
hourly-ntnu-public-course-index → Run workflow. GitHub Actions cron
er omtrent hver time, ikke garantert på eksakt klokkeslett.

## Håndtering av tomme og utilgjengelige mapper (14.10.2026)

Kjøringene 13.–14. oktober feilet ved kontroll av Apache-listing.
Direkte kontroll viser at
`/semestre/5/marin-maskineri/filer/` svarer 404, mens fagets
offentlige katalogreferanse er beholdt. Faget har ingen indekserte
filer i sist fungerende V2-katalog.

En enkelt, eksplisitt gjennomgått tom seksjon kan merkes med
`allowMissingEmptySections` i `config/ntnu-public-courses.json`.
Dette er **ikke** generell ignorering av feil. Crawleren krever:
- At semesterets offentlige `index.json` fortsatt angir
  `beskyttet: false` for faget.
- At forrige publiserte katalog inneholder dette faget **uten**
  registrerte filer i seksjonen.
- At feilen gjelder **seksjonens rotmappe**, ikke en undermappe.
- At svaret er en reell 404/410 eller mangler forventet
  Apache-listing. 401/403, redirects og nettverksfeil er fortsatt feil.

Ved annen feil stopper vakten med den godkjente offentlige mappestien
i feilmeldingen. Det gjør neste feil diagnostiserbar uten å logge
responsinnhold, passord eller private mapper.

## Egne index.html-sider inne i offentlige mapper

En reell kjøring 14.10.2026 identifiserte en annen feil enn den
manglende tomme mappen: `semester 1 / itgk / filer / Øving4`
viser en egendefinert HTML-side i stedet for Apache AutoIndex.
Direkte kontroll bekreftet tilsvarende sider i Øving5 og Øving7.

Ved en slik side er det **ikke trygt å anta** at alle lenker i HTML
er en komplett offentlig filfortegnelse. Crawleren:
- fortsetter å kreve at selve faget er offentlig i semesterindeksen;
- gjenbruker kun tidligere indekserte URL-er som matcher riktig
  semester, fag, undermappe, tillatte filtyper og NTNU-origin;
- rapporterer en GitHub Actions-advarsel om mappen;
- tar ikke inn nye lenker fra HTML-siden, sletter ingen gamle filer,
  og åpner ikke andre mapper basert på sidens lenker;
- stanser fortsatt ved HTTP 404/410, private mapper, ugyldig tidligere
  katalog eller ukjente mapper uten tidligere godkjente referanser.

**Begrensning:** Nye filer i en mappe med egendefinert
`index.html` blir ikke automatisk oppdaget uten en autorisert,
maskinlesbar indeks eller en gjenopprettet Apache DirectoryIndex.
De øvrige mappene indekseres normalt.

## Verifisert maskinlesbar reserveindeks for ITGK (24.10.2026)

ITGK har både en offentlig semesterindeks
`/semestre/1/index.json` (fagets `files[]`) og en offentlig
fagindeks `/semestre/1/itgk/index.json` (seksjonen `filer.files[]`).
Disse ble kontrollert mot faktisk NTNU-data 24. oktober 2026.
Dette gir et sikrere alternativ enn å tolke vilkårlige lenker i
egendefinerte `index.html`-sider.

For eksplisitt godkjente fag med `publicIndexFallback:true` i
`config/ntnu-public-courses.json` gjør indeksereren derfor følgende:
- Når en mappeside er egendefinert HTML og ikke Apache DirectoryIndex,
  leses **kun** de to offentlige `index.json`-oversiktene.
- Et nytt filnavn inkluderes **bare dersom begge indeksene eksplisitt
  registrerer samme sti** innenfor riktig offentlig `filer/`-seksjon.
- Fagets `filer`-seksjon må være markert `beskyttet:false`.
- Private, skjulte, ukjente filtyper, feilaktige stier og HTML-lenker
  ignoreres. Filer kopieres ikke til GitHub.
- Tidligere gjennomgåtte filreferanser beholdes hvis den nye indeksen
  er ufullstendig. Ved feil i begge kilder beholdes eksisterende
  feilbeskyttelse, og vakten stanser ved uavklart katalog.

**Konsekvens:** En ny ITGK-fil bak `Øving4/index.html` kan nå
oppdages når NTNUs egne `index.json`-filer også er oppdatert.
En ny fil som kun ligger på disk, men *ikke* finnes i indeksene,
blir ikke tryllet frem. Da må ordinær NTNU SiteUpdater regenerere
indeksene. Funksjonen er foreløpig kun aktivert for ITGK, fordi
dette er kilden som er kontrollert. Andre fag må vurderes før
tilsvarende tilgang slås på.

## Støttede formater fra kataloglisting (24.10.2026)

NTNU trenger **ikke** en egen `index.json` per ny fil når Apache DirectoryIndex
viser innholdet i en godkjent offentlig fagmappe. Skanneren oppdager
filreferansen ved neste kjøring. Nå er også KISSsoft-varianter
(`.Z12`, `.Z14`, `.Z012`, `.Z014`, `.KSYS`), CAD
(`.gltf`, `.brep`, `.dxf`, `.dwg`), lyd/video og strukturerte
tekstformater justert mot V2s filvisere. Et format med
konverteringsadapter blir tilgjengelig for nedlasting, ikke automatisk
fullverdig 3D-forhåndsvisning. Ingen originalfil lastes ned eller legges til
GitHub.

Beskyttede, skjulte og ikke-tillatte stier forblir avvist.
Eksisterende `index.html`-sider som skjuler kataloglistingen er fortsatt
et separat problem og behandles konservativt som beskrevet over.

## CORS — kontroll før root-redirect

GitHub Pages på tormt.github.io og NTNU på tormt.folk.ntnu.no er
ulike origins. En crawl fra GitHub Actions beviser at HTML-listingen er
offentlig, men **ikke** at JavaScript på Pages har lov til å hente
Python, notebook, quiz, Office og CAD-filer i nettleseren.

- Direkte lenker og nedlasting virker uten CORS.
- PDF-iframe og nettleserens egen medieavspilling kan fungere uten
  at JS leser filene.
- Interaktive visere som bruker fetch trenger en gyldig
  Access-Control-Allow-Origin-tillatelse på offentlige NTNU-responser.
- Vi må teste CORS i ekte browser og eventuelt sette opp en
  avgrenset Apache .htaccess-regel for offentlige filer på NTNU,
  **uten** Credentials og **aldri** på private fag.
- Hvis CORS ikke tillates, er alternativet V2-app på NTNU (samme
  origin) kombinert med GitHub Actions som indekserer eksternt.

En redirect fra NTNUs index.html løser ikke CORS. Klargjort
redirect-utkast kan legges under deployment/ i repo, men får ikke
erstatte V1 før fullstendig tilgangs-, lenke- og viewer-test,
backup og egen godkjenning. Eksisterende direkte semester-URL-er
skal fortsette å fungere.

## Feilhåndtering

Uklar offentlig/private-status, manglede directory listing,
HTTP-redirect, ukjent domene, dårlige JSON-data eller større
uforklart tap av filer skal stoppe oppdateringen og beholde sist
fungerende katalog. Ingen filinnhold eller sensitive felter lastes
opp til GitHub. Supabase fortsetter separat med Folk-kontoer og
progresjon; ingen ChatGPT-oppgave trenger å gjøre Git-commits.
